"""Complementary hand-motion baseline using the ISL500 video's publisher tracks.

Shares the RGB experiment's signer/word plan. Hand-only motion cannot replace
body/face/RGB recognition, but provides a compact branch and a measured baseline.
"""
from concurrent.futures import ThreadPoolExecutor,as_completed
import argparse
import json
import os
from pathlib import Path
import random
import sys

ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'.research-cache'
sys.path.insert(0,str(CACHE/'python'));sys.path.insert(0,str(ROOT))
os.environ.setdefault('PYTORCH_ENABLE_MPS_FALLBACK','1')
import h5py
import numpy as np
import torch
from torch import nn
from huggingface_hub import hf_hub_download
from backend.model import frame_features
from training.network import TemporalEncoder
from training.prepare_isl500_rgb import atomic_json,REVISION
from training.train_isl500_rgb import calibrate

OUT=CACHE/'isl500-hands'


class HandMotionModel(nn.Module):
    def __init__(self,classes):
        super().__init__();self.encoder=TemporalEncoder(features=135)
        self.classifier=nn.Sequential(nn.Dropout(.3),nn.Linear(256,classes))
    def forward(self,values):
        hidden=self.encoder(values)
        return self.classifier(torch.cat((hidden.mean(1),hidden.max(1).values),dim=1))


def hand_features(points):
    points=np.asarray(points,dtype=np.float32)
    if points.ndim!=4 or points.shape[1:]!=(2,21,3) or not np.isfinite(points).all():
        raise ValueError('Unexpected publisher hand track')
    present=np.any(points!=0,axis=(1,2,3));valid=np.flatnonzero(present)
    if len(valid)<5:return np.zeros((64,135),np.float32),False
    points=points[valid[0]:valid[-1]+1]
    values=[]
    for hands in points:
        vector=np.zeros(141);vector[:126]=hands.reshape(-1)
        values.append(frame_features(vector))
    values=np.asarray(values,dtype=np.float32)
    indices=np.linspace(0,len(values)-1,64)
    low,high=np.floor(indices).astype(int),np.ceil(indices).astype(int)
    mix=(indices-low)[:,None]
    result=values[low]*(1-mix)+values[high]*mix
    result[:,126:128]=values[np.round(indices).astype(int),126:128]
    return result.astype(np.float32),True


def prepare():
    OUT.mkdir(exist_ok=True)
    manifest=json.loads((CACHE/'isl500-rgb/plan.json').read_text())
    available={f['name']:f for f in json.loads((CACHE/'ISL500-files.json').read_text())['files']}
    def one(record):
        target=OUT/f'{record["id"]}.npz'
        name='Landmarks/MediaPipe/ISL_DATA_'+record['signer'].upper()+'/'+Path(record['publisherPath']).with_suffix('.h5').name
        if name not in available:
            if record['split']!='train':raise ValueError('Missing held-out hand file')
            return {**record,'valid':False,'exclusion':'Publisher hand file missing'}
        if not target.exists():
            path=Path(hf_hub_download('ISL500/ISL-DATA',name,repo_type='dataset',revision=REVISION,cache_dir=str(CACHE/'huggingface')))
            if path.stat().st_size!=available[name]['size']:raise ValueError('Publisher hand file size mismatch')
            with h5py.File(path,'r') as file:values,valid=hand_features(file['intermediate'][()])
            with target.with_suffix('.partial').open('wb') as file:np.savez_compressed(file,features=values,valid=valid)
            target.with_suffix('.partial').replace(target)
        with np.load(target) as data:valid=bool(data['valid'])
        return {**record,'valid':valid,'handFile':str(target),
            'exclusion':None if valid else 'Fewer than five hand-present frames'}
    records=[]
    with ThreadPoolExecutor(max_workers=6) as pool:
        for future in as_completed([pool.submit(one,r) for r in manifest['records']]):
            records.append(future.result())
            if len(records)%25==0:print(f'HAND_PREPARATION {len(records)}/{len(manifest["records"])}',flush=True)
            atomic_json(OUT/'progress.json',{'stage':'preparing_publisher_hand_tracks','ready':len(records),'total':len(manifest['records'])})
    records.sort(key=lambda r:r['id'])
    manifest={**manifest,'records':records,'representation':'135 normalized hand shape/location features, 64 uniform temporal samples',
        'timingScope':'Publisher hand frames uniformly resampled; no measured live-speed claim',
        'trainingExclusions':[{'id':r['id'],'label':r['label'],'reason':r['exclusion']} for r in records if r['split']=='train' and not r['valid']]}
    atomic_json(OUT/'manifest.json',manifest)
    return manifest


def predict(model,records,features,labels,device):
    model.eval();rows=[]
    with torch.inference_mode():
        for offset in range(0,len(records),32):
            group=records[offset:offset+32]
            scores=model(torch.stack([features[r['id']] for r in group]).to(device)).cpu().softmax(-1)
            for record,score in zip(group,scores):
                i=int(score.argmax())
                rows.append({'id':record['id'],'signer':record['signer'],'kind':record['kind'],
                    'expected':record['label'],'prediction':labels[i] if record['valid'] else 'UNKNOWN',
                    'score':float(score[i]) if record['valid'] else 0.,'validTracking':record['valid']})
    known=[r for r in rows if r['kind']=='known'];correct=sum(r['prediction']==r['expected'] for r in known)
    return {'knownClips':len(known),'correctKnown':correct,'accuracy':correct/len(known),'predictions':rows}


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--evaluate-test',action='store_true')
    args=parser.parse_args();torch.set_num_threads(4);torch.manual_seed(17);np.random.seed(17);random.seed(17)
    manifest=prepare() if not (OUT/'manifest.json').exists() else json.loads((OUT/'manifest.json').read_text())
    features={}
    for r in manifest['records']:
        if r.get('handFile'):
            with np.load(r['handFile']) as data:features[r['id']]=torch.from_numpy(data['features'])
        else:features[r['id']]=torch.zeros(64,135)
    labels=manifest['vocabulary'];lookup={word:i for i,word in enumerate(labels)}
    device=torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    model=HandMotionModel(len(labels)).to(device)
    if args.evaluate_test:
        checkpoint=torch.load(OUT/'best.pt',map_location=device,weights_only=True)
        model.load_state_dict(checkpoint['state_dict'],strict=True)
        result=predict(model,[r for r in manifest['records'] if r['split']=='test'],features,labels,device)
        reject=json.loads((OUT/'rejection-config.json').read_text());threshold=reject['threshold']
        rows=result['predictions'];accepted=[r for r in rows if r['score']>=threshold];unknown=[r for r in rows if r['kind']=='unknown']
        result.update({'epoch':checkpoint['epoch'],'rejectionThreshold':threshold,'acceptedCount':len(accepted),
            'acceptedPrecision':sum(r['kind']=='known' and r['prediction']==r['expected'] for r in accepted)/len(accepted) if accepted else None,
            'unknownRejected':sum(r['score']<threshold for r in unknown),'unknownClips':len(unknown),
            'scope':'Hand-motion-only isolated 40-word model; no sentence, webcam, or avatar accuracy claim'})
        atomic_json(OUT/'test-results.json',result)
        print('HAND_TEST_COMPLETE '+json.dumps({k:v for k,v in result.items() if k!='predictions'}),flush=True)
        return
    training=[r for r in manifest['records'] if r['split']=='train' and r['valid']]
    validation=[r for r in manifest['records'] if r['split']=='validation']
    if any(sum(r['label']==label for r in training)<5 for label in labels):raise ValueError('Insufficient usable class coverage')
    optimizer=torch.optim.AdamW(model.parameters(),lr=5e-4,weight_decay=.02)
    scheduler=torch.optim.lr_scheduler.CosineAnnealingLR(optimizer,80)
    best=-1.;best_epoch=0;history=[]
    print('HAND_TRAINING_STARTED '+json.dumps({'trainingClips':len(training),'classes':len(labels),'device':str(device)}),flush=True)
    for epoch in range(1,81):
        model.train();order=list(training);random.Random(17+epoch).shuffle(order);loss_total=0.;correct=0
        for offset in range(0,len(order),32):
            group=order[offset:offset+32];values=torch.stack([features[r['id']] for r in group]).to(device)
            targets=torch.tensor([lookup[r['label']] for r in group],device=device)
            optimizer.zero_grad(set_to_none=True);logits=model(values)
            loss=nn.functional.cross_entropy(logits,targets,label_smoothing=.05)
            loss.backward();nn.utils.clip_grad_norm_(model.parameters(),5);optimizer.step()
            loss_total+=float(loss.detach())*len(group);correct+=int((logits.argmax(-1)==targets).sum())
        scheduler.step();validation_result=predict(model,validation,features,labels,device)
        record={'epoch':epoch,'trainingLoss':loss_total/len(training),'trainingAccuracy':correct/len(training),
            'validationAccuracy':validation_result['accuracy']}
        history.append(record);atomic_json(OUT/'history.json',history)
        atomic_json(OUT/'progress.json',{'stage':'training',**record});print('HAND_EPOCH '+json.dumps(record),flush=True)
        if validation_result['accuracy']>best:
            best=validation_result['accuracy'];best_epoch=epoch
            torch.save({'state_dict':model.state_dict(),'labels':labels,'epoch':epoch,
                'datasetRevision':manifest['revision'],'validation':validation_result},OUT/'best.pt')
            atomic_json(OUT/'validation.json',validation_result)
        if epoch-best_epoch>=15:break
    checkpoint=torch.load(OUT/'best.pt',map_location='cpu',weights_only=True)
    atomic_json(OUT/'rejection-config.json',calibrate(checkpoint['validation']))
    atomic_json(OUT/'progress.json',{'stage':'training_complete','bestEpoch':best_epoch,'validationAccuracy':best,'testEvaluated':False})
    print('HAND_TRAINING_COMPLETE '+json.dumps({'bestEpoch':best_epoch,'validationAccuracy':best}),flush=True)


if __name__=='__main__':main()
