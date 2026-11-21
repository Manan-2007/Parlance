"""Score a browser_replay.mjs run against the backend capture (largest file in the folder).

  python3 training/e2e/score.py <out.json> [capture dir, default .research-cache/live-captures]
"""
import json, sys, glob, os
folder = sys.argv[2] if len(sys.argv) > 2 else '.research-cache/live-captures'
cap = max(glob.glob(os.path.join(folder, '*.jsonl')), key=os.path.getsize)
res = json.load(open(sys.argv[1]))
rows = [json.loads(l) for l in open(cap)]
lm = [r for r in rows if isinstance(r['in'], dict) and 'landmarks' in r['in']]
print('capture', os.path.basename(cap), 'landmark msgs', len(lm))
right = sugg = 0
for c in res['log']:
    word = c['file'].split('_')[1].split('__')[0].lower()
    s, e = c['start'] / 1000, c['end'] / 1000 + 2.0
    inside = [r for r in lm if s <= r['at'] <= e]
    hands = [r for r in inside if any(r['in']['landmarks'][:126])]
    two = [r for r in hands if any(r['in']['landmarks'][:63]) and any(r['in']['landmarks'][63:126])]
    words = [r['out']['word'] for r in inside if r['out'].get('word')]
    sugs = [s_['word'] for r in inside for s_ in (r['out'].get('suggestions') or [])]
    fin = [(r['out'].get('candidate'), round(r['out'].get('confidence', 0), 2)) for r in inside if r['out'].get('final')]
    ok = word in words; okS = word in sugs
    right += ok; sugg += (ok or okS)
    dur = c['end'] / 1000 - s
    print(f"{c['file'][:32]:32} msgs/s {len(inside)/max(dur+2,1):4.1f} hands {len(hands):3} two {len(two):3} written {words} sugg {sorted(set(sugs))[:3]} final {fin[:2]}")
print('written correct', right, 'usable', sugg, 'of', len(res['log']))
