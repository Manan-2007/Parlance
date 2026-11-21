"""Fine-tune a pretrained R3D-18 video block on a signer-separated ISL pilot.

Frozen stem/layers 1-3 are cached for three fixed training views, one evaluation
view. Selection uses validation only. Test evaluation is an explicit second run.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import random
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'
sys.path.insert(0,str(CACHE/'python'))
sys.path.insert(0,str(ROOT))
os.environ.setdefault('PYTORCH_ENABLE_MPS_FALLBACK','1')

import numpy as np
import torch
from torch import nn
from torchvision.models.video import r3d_18, R3D_18_Weights
from training.prepare_isl500_rgb import atomic_json, SCHEMA

OUTPUT = CACHE/'isl500-rgb'
MODEL_DIR = OUTPUT/'model'
FEATURE_SCHEMA = 'r3d18-kinetics400-layer3-16x112-v1'
MEAN = torch.tensor([.43216,.394666,.37645])[:,None,None,None]
STD = torch.tensor([.22803,.22145,.216989])[:,None,None,None]


def video_view(frames, seed=None):
    if frames.shape != (32,128,171,3) or frames.dtype != np.uint8:
        raise ValueError('Unexpected source frame cache')
    random = np.random.default_rng(seed)
    first,last,top,left,brightness,contrast=0,31,8,29,1.,1.
    if seed is not None:
        first=int(random.integers(0,3));last=int(random.integers(29,32))
        top=int(random.integers(4,13));left=int(random.integers(21,38))
        brightness=float(random.uniform(.9,1.1));contrast=float(random.uniform(.9,1.1))
    indices=np.linspace(first,last,16).round().astype(int)
    values=torch.from_numpy(frames[indices,top:top+112,left:left+112].copy()).permute(3,0,1,2).float()/255
    values=((values-.5)*contrast+.5)*brightness
    return (values.clamp(0,1)-MEAN)/STD


def make_models(classes,device):
    torch.hub.set_dir(str(CACHE/'torch'))
    backbone=r3d_18(weights=R3D_18_Weights.KINETICS400_V1)
    for parameter in backbone.parameters():parameter.requires_grad=False
    trunk=nn.Sequential(backbone.stem,backbone.layer1,backbone.layer2,backbone.layer3).to(device).eval()
    head=nn.Sequential(backbone.layer4,backbone.avgpool,nn.Flatten(1),nn.Dropout(.3),nn.Linear(512,classes)).to(device)
    for parameter in head.parameters():parameter.requires_grad=True
    return trunk,head


def prepare_features(manifest,trunk,device,wait):
    directory=OUTPUT/'video-features';directory.mkdir(exist_ok=True)
    pending=list(manifest['records']);ready=[];started=time.monotonic()
    while pending:
        completed=[]
        for record in pending:
            target=directory/f'{record["id"]}.npz'
            if target.exists():
                with np.load(target) as cache:
                    if str(cache['schema'])!=FEATURE_SCHEMA or str(cache['sourceSha256'])!=record['sha256']:
                        raise ValueError('Stale frozen-feature cache')
                completed.append(record);continue
            if not Path(record['frameFile']).exists():continue
            with np.load(record['frameFile']) as source:
                if str(source['schema'])!=SCHEMA or str(source['sourceSha256'])!=record['sha256']:
                    raise ValueError('Incompatible raw-frame cache')
                frames=source['frames']
            views=[video_view(frames)]
            if record['split']=='train':
                views += [video_view(frames,int(record['id'][:8],16)+offset) for offset in (1,2)]
            with torch.inference_mode():features=trunk(torch.stack(views).to(device)).cpu().numpy().astype(np.float16)
            if features.shape!=(len(views),256,4,14,14) or not np.isfinite(features).all():
                raise ValueError('Invalid frozen video features')
            temporary=target.with_suffix('.partial')
            with temporary.open('wb') as file:
                np.savez_compressed(file,features=features,schema=FEATURE_SCHEMA,sourceSha256=record['sha256'])
            temporary.replace(target);completed.append(record)
        ready+=completed
        complete_ids={r['id'] for r in completed}
        pending=[r for r in pending if r['id'] not in complete_ids]
        progress={'stage':'preparing_frozen_video_features','ready':len(ready),'total':len(manifest['records']),
            'elapsedSeconds':round(time.monotonic()-started),'trainingStarted':False}
        atomic_json(OUTPUT/'training-progress.json',progress)
        if completed:print('RGB_FEATURE_PROGRESS '+json.dumps(progress),flush=True)
        if pending and not completed:
            if not wait:raise RuntimeError('Raw RGB preparation is incomplete; use --wait-for-data')
            raw=OUTPUT/'progress.json'
            if raw.exists():
                state=json.loads(raw.read_text())
                if state.get('failed') and state.get('ready',0)+len(state['failed'])>=state.get('total',1):
                    raise RuntimeError('Raw preparation finished with unresolved failures')
            time.sleep(3)
    features={}
    for record in manifest['records']:
        with np.load(directory/f'{record["id"]}.npz') as data:
            features[record['id']]=torch.from_numpy(data['features'].copy())
    return features


def evaluate(head,records,features,labels,device):
    head.eval();predictions=[]
    with torch.inference_mode():
        for start in range(0,len(records),8):
            group=records[start:start+8]
            values=torch.stack([features[r['id']][0] for r in group]).to(device,dtype=torch.float32)
            logits=head(values).cpu()
            probabilities=logits.softmax(-1)
            for record,score,logit in zip(group,probabilities,logits):
                index=int(score.argmax())
                predictions.append({'id':record['id'],'signer':record['signer'],'expected':record['label'],
                    'kind':record['kind'],'prediction':labels[index],'score':float(score[index]),'logits':logit.tolist()})
    known=[r for r in predictions if r['kind']=='known']
    accuracy=sum(r['expected']==r['prediction'] for r in known)/len(known) if known else None
    return {'knownClips':len(known),'correctKnown':sum(r['expected']==r['prediction'] for r in known),
        'accuracy':accuracy,'predictions':predictions}


def calibrate(validation):
    rows=validation['predictions'];best=(-1,1.01)
    thresholds=sorted({r['score'] for r in rows})+[1.01]
    for threshold in thresholds:
        tp=sum(r['kind']=='known' and r['prediction']==r['expected'] and r['score']>=threshold for r in rows)
        accepted=sum(r['score']>=threshold for r in rows)
        fn=validation['knownClips']-tp
        f1=2*tp/max(2*tp+accepted-tp+fn,1)
        if f1>best[0]:best=(f1,threshold)
    return {'threshold':best[1],'developmentF1':best[0],
        'scope':'Selected on validation only; softmax scores are not calibrated probabilities'}


def train(args,manifest,features,head,device):
    labels=manifest['vocabulary'];lookup={word:i for i,word in enumerate(labels)}
    training=[r for r in manifest['records'] if r['split']=='train']
    validation=[r for r in manifest['records'] if r['split']=='validation']
    optimizer=torch.optim.AdamW([{'params':head[0].parameters(),'lr':2e-4},
        {'params':head[4].parameters(),'lr':1e-3}],weight_decay=.01)
    scheduler=torch.optim.lr_scheduler.CosineAnnealingLR(optimizer,args.epochs)
    best=-1.;best_epoch=0;history=[];started=time.monotonic();first_epoch=1
    resume_mode=None
    if getattr(args,'resume',False):
        path=MODEL_DIR/('last.pt' if (MODEL_DIR/'last.pt').exists() else 'best.pt')
        checkpoint=torch.load(path,map_location=device,weights_only=True)
        if (checkpoint['labels']!=labels or checkpoint['datasetRevision']!=manifest['revision']
                or checkpoint['featureSchema']!=FEATURE_SCHEMA or checkpoint['splitPolicy']!=manifest['splitPolicy']):
            raise ValueError('Resume checkpoint does not match the frozen experiment')
        head.load_state_dict(checkpoint['headState'],strict=True)
        first_epoch=checkpoint['epoch']+1
        best_checkpoint=torch.load(MODEL_DIR/'best.pt',map_location='cpu',weights_only=True)
        best=best_checkpoint['validation']['accuracy'];best_epoch=best_checkpoint['epoch']
        history=checkpoint.get('history')
        if history is None:
            history=json.loads((MODEL_DIR/'history.json').read_text())
            history=[item for item in history if item['epoch']<first_epoch]
        if 'optimizerState' in checkpoint:
            if checkpoint.get('plannedEpochs')!=args.epochs:
                raise ValueError('Exact resume requires the original epoch budget')
            optimizer.load_state_dict(checkpoint['optimizerState'])
            scheduler.load_state_dict(checkpoint['schedulerState'])
            torch.set_rng_state(checkpoint['torchRngState'].cpu())
            if device.type=='mps' and checkpoint.get('mpsRngState') is not None:
                torch.mps.set_rng_state(checkpoint['mpsRngState'].cpu())
            resume_mode='full_training_state'
        else:
            # Legacy checkpoints retained model weights only. Rebuild the LR
            # position without gradients or weight updates; Adam moments restart.
            for _ in range(first_epoch-1):optimizer.step();scheduler.step()
            resume_mode='saved_weights_with_restarted_optimizer'
        del checkpoint,best_checkpoint
    print('RGB_TRAINING_STARTED '+json.dumps({'device':str(device),'classes':len(labels),'trainingClips':len(training),
        'validationKnown':sum(r['kind']=='known' for r in validation),'epochs':args.epochs,'batchSize':args.batch_size,
        'firstEpoch':first_epoch,'resumeMode':resume_mode}),flush=True)
    for epoch in range(first_epoch,args.epochs+1):
        head.train()
        # Small signer batches must not overwrite pretrained BN statistics.
        for module in head.modules():
            if isinstance(module,nn.BatchNorm3d):module.eval()
        for parameter in head[0].parameters():parameter.requires_grad=epoch>2
        epoch_random=random.Random(17+epoch)
        order=list(training);epoch_random.shuffle(order)
        loss_total=0.;correct=0
        for start in range(0,len(order),args.batch_size):
            group=order[start:start+args.batch_size]
            values=torch.stack([features[r['id']][epoch_random.randrange(3)] for r in group]).to(device,dtype=torch.float32)
            targets=torch.tensor([lookup[r['label']] for r in group],device=device)
            optimizer.zero_grad(set_to_none=True)
            logits=head(values);loss=nn.functional.cross_entropy(logits,targets,label_smoothing=.05)
            loss.backward();nn.utils.clip_grad_norm_(head.parameters(),5);optimizer.step()
            loss_total+=float(loss.detach())*len(group);correct+=int((logits.argmax(-1)==targets).sum())
        scheduler.step()
        result=evaluate(head,validation,features,labels,device)
        item={'epoch':epoch,'trainLoss':loss_total/len(training),'trainAccuracy':correct/len(training),
            'validationAccuracy':result['accuracy'],'elapsedSeconds':round(time.monotonic()-started)}
        history.append(item)
        if result['accuracy']>best:
            best=result['accuracy'];best_epoch=epoch
            temporary=MODEL_DIR/'best.partial'
            torch.save({'headState':head.state_dict(),'labels':labels,'epoch':epoch,'validation':result,
                'featureSchema':FEATURE_SCHEMA,'pretrained':'torchvision R3D_18 KINETICS400_V1',
                'datasetRevision':manifest['revision'],'splitPolicy':manifest['splitPolicy']},temporary)
            temporary.replace(MODEL_DIR/'best.pt')
            atomic_json(MODEL_DIR/'validation.json',result)
        temporary=MODEL_DIR/'last.partial'
        torch.save({'headState':head.state_dict(),'labels':labels,'epoch':epoch,
            'datasetRevision':manifest['revision'],'splitPolicy':manifest['splitPolicy'],
            'featureSchema':FEATURE_SCHEMA,'history':history,'plannedEpochs':args.epochs,
            'optimizerState':optimizer.state_dict(),'schedulerState':scheduler.state_dict(),
            'torchRngState':torch.get_rng_state(),
            'mpsRngState':torch.mps.get_rng_state() if device.type=='mps' else None},temporary)
        temporary.replace(MODEL_DIR/'last.pt')
        atomic_json(MODEL_DIR/'history.json',history)
        atomic_json(OUTPUT/'training-progress.json',{'stage':'training','trainingStarted':True,**item})
        print('RGB_EPOCH '+json.dumps(item),flush=True)
        if epoch-best_epoch>=7:break
    checkpoint=torch.load(MODEL_DIR/'best.pt',map_location=device,weights_only=True)
    atomic_json(MODEL_DIR/'rejection-config.json',calibrate(checkpoint['validation']))
    atomic_json(OUTPUT/'training-progress.json',{'stage':'training_complete','trainingStarted':True,
        'bestEpoch':best_epoch,'bestValidationAccuracy':best,'testEvaluated':False,'epochs':len(history)})
    print('RGB_TRAINING_COMPLETE '+json.dumps({'bestEpoch':best_epoch,'bestValidationAccuracy':best}),flush=True)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--wait-for-data',action='store_true')
    parser.add_argument('--evaluate-test',action='store_true')
    parser.add_argument('--resume',action='store_true')
    parser.add_argument('--epochs',type=int,default=20)
    parser.add_argument('--batch-size',type=int,default=8)
    args=parser.parse_args()
    MODEL_DIR.mkdir(parents=True,exist_ok=True)
    random.seed(17);np.random.seed(17);torch.manual_seed(17);torch.set_num_threads(4)
    device=torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    manifest=json.loads((OUTPUT/'plan.json').read_text())
    atomic_json(OUTPUT/'training-progress.json',{'stage':'loading_pretrained_video_weights',
        'trainingStarted':False,'device':str(device)})
    trunk,head=make_models(len(manifest['vocabulary']),device)
    print('RGB_PRETRAINED_MODEL_READY device='+str(device),flush=True)
    features=prepare_features(manifest,trunk,device,args.wait_for_data)
    del trunk
    if device.type=='mps':torch.mps.empty_cache()
    if args.evaluate_test:
        checkpoint=torch.load(MODEL_DIR/'best.pt',map_location=device,weights_only=True)
        head.load_state_dict(checkpoint['headState'],strict=True)
        result=evaluate(head,[r for r in manifest['records'] if r['split']=='test'],features,manifest['vocabulary'],device)
        rejection=json.loads((MODEL_DIR/'rejection-config.json').read_text())
        rows=result['predictions'];accepted=[r for r in rows if r['score']>=rejection['threshold']]
        unknown=[r for r in rows if r['kind']=='unknown']
        result.update({'checkpointEpoch':checkpoint['epoch'],'signers':manifest['splitPolicy']['test'],
            'rejectionThreshold':rejection['threshold'],'acceptedCount':len(accepted),
            'acceptedPrecision':sum(r['kind']=='known' and r['expected']==r['prediction'] for r in accepted)/len(accepted) if accepted else None,
            'unknownRejected':sum(r['score']<rejection['threshold'] for r in unknown),'unknownClips':len(unknown),
            'limitations':['Isolated 40-word recognition, not continuous sentence translation.',
                'Publisher signer IDs are separated; labels and signer identity have not been independently reviewed.',
                'Full-clip metrics do not establish webcam latency or new-camera accuracy.']})
        atomic_json(MODEL_DIR/'test-results.json',result)
        print('RGB_TEST_COMPLETE '+json.dumps({k:v for k,v in result.items() if k!='predictions'}),flush=True)
    else:train(args,manifest,features,head,device)


if __name__=='__main__':main()
