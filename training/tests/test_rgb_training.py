import contextlib
import hashlib
import io
import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import numpy as np
import torch
from torch import nn
from training.prepare_isl500_rgb import plan,WORDS,UNKNOWN,REVISION,sample_video
from training import train_isl500_rgb as rgb
from training.train_isl500_hands import hand_features


class RGBTrainingTests(unittest.TestCase):
    def publisher(self):
        files=[]
        for signer in range(1,16):
            for word in WORDS+UNKNOWN:
                suffix='session10__clip003' if signer<7 else '000001__uuid-extra'
                name=f'Videos/User{signer:03}/{word}__{suffix}.mp4'
                files.append({'name':name,'size':1000,'lfsSha256':hashlib.sha256(name.encode()).hexdigest()})
        return {'commit':REVISION,'files':files}

    def test_signers_and_unknown_classes_are_kept_out_of_training(self):
        manifest=plan(self.publisher())
        records=manifest['records']
        self.assertEqual(len(records),625)
        sets={split:{r['signer'] for r in records if r['split']==split} for split in ['train','validation','test']}
        self.assertFalse(sets['train']&sets['validation'] or sets['train']&sets['test'] or sets['validation']&sets['test'])
        self.assertEqual(sum(r['split']=='train' for r in records),400)
        self.assertFalse(any(r['kind']=='unknown' and r['split']=='train' for r in records))

    def test_missing_coverage_and_duplicate_video_hashes_abort_preparation(self):
        publisher=self.publisher();publisher['files'].pop(0)
        with self.assertRaises(ValueError):plan(publisher)
        publisher=self.publisher();publisher['files'][1]['lfsSha256']=publisher['files'][0]['lfsSha256']
        with self.assertRaises(ValueError):plan(publisher)

    def test_video_views_preserve_rgb_and_time_axes(self):
        frames=np.broadcast_to(np.linspace(0,255,32).round().astype(np.uint8)[:,None,None,None],(32,128,171,3)).copy()
        view=rgb.video_view(frames)
        self.assertEqual(tuple(view.shape),(3,16,112,112))
        restored=view*rgb.STD+rgb.MEAN
        self.assertAlmostEqual(float(restored[:,0].mean()),0,places=6)
        self.assertAlmostEqual(float(restored[:,-1].mean()),1,places=6)
        self.assertTrue(bool(torch.all(torch.diff(restored.mean((0,2,3)))>0)))
        torch.testing.assert_close(rgb.video_view(frames,17),rgb.video_view(frames,17))

    def test_short_video_is_resampled_without_inventing_source_duration(self):
        import cv2
        with tempfile.TemporaryDirectory() as temporary:
            path=Path(temporary)/'short.avi'
            writer=cv2.VideoWriter(str(path),cv2.VideoWriter_fourcc(*'MJPG'),30,(64,64))
            if not writer.isOpened():self.skipTest('MJPG encoder unavailable')
            for frame in range(10):writer.write(np.full((64,64,3),frame*20,np.uint8))
            writer.release()
            frames,timestamps,fps,count=sample_video(path)
            self.assertEqual(count,10);self.assertEqual(frames.shape,(32,128,171,3))
            self.assertLess(timestamps[-1]-timestamps[0],400)
            self.assertTrue(np.all(np.diff(timestamps)>=0))

    def test_publisher_hand_adapter_keeps_missing_hands_and_wrist_location_explicit(self):
        raw=np.zeros((12,2,21,3),np.float32)
        for joint in range(21):raw[:,0,joint]=(.4+joint*.004,.5-joint*.006,joint*.001)
        values,valid=hand_features(raw)
        self.assertTrue(valid);self.assertEqual(values.shape,(64,135))
        np.testing.assert_array_equal(values[:,126:128],np.tile([1,0],(64,1)))
        shifted=raw.copy();shifted[:,0,:,0]+=.1
        changed,_=hand_features(shifted)
        np.testing.assert_allclose(values[:,:126],changed[:,:126],atol=2e-6)
        np.testing.assert_allclose(changed[:,128]-values[:,128],.1,atol=2e-6)
        empty,valid=hand_features(np.zeros_like(raw))
        self.assertFalse(valid);self.assertFalse(empty.any())

    def test_training_updates_weights_and_saves_validation_selected_checkpoint_without_test(self):
        torch.manual_seed(17)
        head=nn.Sequential(nn.Linear(4,4),nn.Identity(),nn.Flatten(1),nn.Dropout(.1),nn.Linear(4,2))
        before=head[4].weight.detach().clone()
        records=[{'id':str(i),'label':['A','B'][i%2],'kind':'known',
                  'split':'train' if i<4 else 'validation','signer':str(i)} for i in range(6)]
        manifest={'vocabulary':['A','B'],'revision':'fixture','splitPolicy':{},'records':records}
        features={r['id']:torch.randn(3,4).half() for r in records}
        with tempfile.TemporaryDirectory() as temporary:
            output=Path(temporary);model=output/'model';model.mkdir()
            with patch.object(rgb,'OUTPUT',output),patch.object(rgb,'MODEL_DIR',model),contextlib.redirect_stdout(io.StringIO()):
                rgb.train(SimpleNamespace(epochs=3,batch_size=2),manifest,features,head,torch.device('cpu'))
            saved=torch.load(model/'best.pt',weights_only=True)
            self.assertEqual(saved['labels'],['A','B'])
            self.assertFalse(torch.equal(saved['headState']['4.weight'],before))
            progress=json.loads((output/'training-progress.json').read_text())
            self.assertEqual(progress['stage'],'training_complete')
            self.assertFalse(progress['testEvaluated'])
            self.assertFalse((model/'test-results.json').exists())


if __name__=='__main__':unittest.main()
