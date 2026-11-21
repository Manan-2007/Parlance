# Avatar & Sign Animation System

> Historical teammate-branch snapshot. For the integrated setup and current behavior, read [README](../../README.md) and [CLAUDE.md](../../CLAUDE.md). The integrated app uses the bundled FastAPI backend, the Ch22 avatar, raw hand-only recognition vectors, and separate opt-in body anchors for Learn. Earlier external-VOX, Remy, test-count and recognition-quality statements below may be outdated.

## What it is

A **three.js** signer ("Remy", a Mixamo character) driven by **procedural keyframe tables**: each sign is a JS function that pushes frames of `[boneName, "rotation", axis, targetRadians, "+"|"-"]` instructions. The player interpolates between frames with a quintic Hermite curve. There are **no animation clips, no mocap, no IK, no morph targets / facial animation**.

Classification of what it produces:
- **Word signs** — authored approximations of ISL signs (~164 base tokens; 285 exports incl. inflection aliases like `WENT`→`GO`). Linguistic accuracy is **unreviewed** (README: "still need linguistic review on Remy"; `islVocabulary.js` marks every entry `review: 'needs-ISL-review'`).
- **Fingerspelling** — A–Z tables (22 of 26 letters drive left-hand bones too, i.e. two-handed ISL forms; A, C, L, V are right-hand only) and one-handed 0–9 handshapes. Also unreviewed.
- **Non-manuals** — only incidental `mixamorigNeck` rotations in some tables (e.g. YES head dip, PAIN wince). 56 Neck/Head instructions exist across word files.

## Files

| File | Role |
|---|---|
| `src/avatar/player.js` | `createAvatar(mount, {interactive,onState,onStatus})` → `AvatarPlayer`. Scene, camera, lights, renderer, GLB load, bone map, retargeting, clock, playback state, drag-to-rotate, dispose. |
| `src/avatar/player.d.ts`, `playback.ts` | TS types: `AvatarPlayer`, `QueueItem`, `PlayerState`, `SignPlayer`, `Presentation`. |
| `src/avatar/schedule.js` | `scheduleSigns(tokens, runtime, {append})`: token → word table or per-character letters/digits; builds `runtime.animations` (frames) and `runtime.segments` (`{token, frames}`). `append` + `MAX_LIVE_BACKLOG = 8` for a live mode (tests only). |
| `src/avatar/signQueue.js` | `canonicalBone` (strip `mixamorig[:]`), `REST_POSE` from `defaultPose`, `restValue`, `normalizeFrame` (one instruction per bone-axis, last wins), `appendSignFrames` (plays a table, normalises, appends a closing frame returning touched joints to rest). |
| `src/avatar/poseMotion.js` | `compileMotion(frames, {initialPose})` → timed poses; `sampleMotionPose(pose, t, deltaFor, moved)`. |
| `src/avatar/animations/defaultPose.js` | Rest pose: Neck x π/12, arms down (Arm z ∓π/3, ForeArm y ∓π/1.5). |
| `src/avatar/animations/words.js` | Imports all `Words/*.js`, defines aliases, exports every token + `wordList`. |
| `src/avatar/animations/Words/*.js` | 20 thematic files (BasicSocial, Actions, Discourse, DailyHealth, Education, TechEmergency, Questions, Places, FoodKitchen, Objects, PeopleRelations, Verbs, States, CommonExtra, + legacy TIME/HOME/PERSON/YOU/DRINK/EAT). |
| `src/avatar/animations/Alphabets/A–Z.js`, `alphabets.js` | Letters. |
| `src/avatar/animations/numbers.js` | `NUMBER_ANIMATIONS` 0–9 via a `numberSign({thumb,fingers,curl})` generator. |
| `src/components/avatar/AvatarViewport.tsx` | React wrapper: creates/disposes player, pushes `queue` and options, error state with Retry. |
| `public/assets/remy.glb` | Rendered rig: 67 joints, 7 meshes, 21 textures, **0 morph targets**, 0 clips. |
| `public/assets/ybot.glb` | Reference rig the tables were authored against; used **only by tests**. |

The tables still contain legacy hooks (`ref.characters`, `ref.pending`, `ref.animate()`) from the original player they were written for; the current `runtime` sets `pending: true`, so those branches never fire.

## Rendering pipeline (`player.js`)

1. `WebGLRenderer({antialias, alpha})`, pixel ratio ≤2, `ResizeObserver` → `resize()`.
2. `PerspectiveCamera(fov 27)`; presentation `figure` → y 0.51, `hands` → y 0.38 + fov 20; z = 3.
3. Lights: hemisphere + key directional + bluish rim.
4. `GLTFLoader.loadAsync('/assets/remy.glb')` once per page (`modelPromise`, reset on failure); each viewport `SkeletonUtils.clone`s it; `avatar.position.y = -0.85`; skinned meshes `frustumCulled = false`.
5. For each bone: `bones.set(canonicalName, {bone, rest: localQuat, bindAxes: worldQuat, toBoneAxes: inverse(worldQuat), delta:{x,y,z}})`.
6. **Retargeting** (`applyBone`): tables are expressed in YBot's world-aligned bind axes, so `bone.quaternion = rest · toBoneAxes · R(delta) · bindAxes` — the Euler delta is conjugated into Remy's bone frame.
7. **Render on demand**: rAF loop only while `playing && !suspended`; renders only when a bone changed. Mirroring = CSS `scaleX(-1)` on the mount. Drag rotates `avatar.rotation.y` within ±0.65 rad.

## Motion compilation (`poseMotion.js`)

Per frame: tracks for every bone-axis whose target differs from the running position.
- `moveMs = max(125, bodyTravel·340, handTravel·270)` (travel in radians; finger bones matched by regex).
- Holds: empty frame → 150 ms; expressive non-neutral pose with big hand change, or last pose before neutral → 105 ms.
- Tangents: joining velocity = harmonic mean of adjacent slopes when same sign, else 0 (eases to stop at reversals); no tangent across holds.
- Sampling: quintic Hermite (`10t³−15t⁴+6t⁵` + tangent basis), clamped between `from` and `target`, exact at t=1.
- `initialPose`: when a new queue replaces an old one mid-pose, the first frame starts from the visible pose and releases joints the new phrase doesn't use (commit `00a0efe`).

## Playback state machine

`setQueue(items)` → `restart()` → `step(0)` → `scheduleSigns(queue.slice(index))` → `compileMotion` → `signEndTimes` (per segment) → `play()`.
`animate(now)`: advance `motionTime += min(dt,100)·speed`; sample poses up to `motionTime`; apply changed bones; advance `index` past finished segments; at end → `loop ? restart() : finished`. `report()` throttles `onState` to 40 progress steps per sign. `step(i)` re-schedules from sign *i* (gloss-rail click). `toggle()` pauses/resumes. `PlayerState.transitioning` is always `false` (UI text for it never shows).

## Trace: "Where is the pain?" → pixels (verified via Node + browser)

1. `ConversationPanel` submit → `SpeechToSignPage.translate("typed")`.
2. `useSignQueue.translate` → `prepareSpeech` → `/api/config` `{online:false}` → `translateOffline` → `textToGloss` → reorder WH last → `["PAIN","WHERE"]`.
3. `queue = [{gloss:"PAIN",label:"PAIN",missing:false},{gloss:"WHERE",…}]` → `SignerStage` → `AvatarViewport` → `player.setQueue`.
4. `scheduleSigns`: `words.PAIN` is a function → `appendSignFrames` → 5 frames (both index hands up, twist with neck wince, back, twist, rest); `WHERE` → 4 frames. Segments `[{PAIN,5},{WHERE,4}]`.
5. `compileMotion` → 9 timed poses, total ≈ **4.49 s** at 1×. (`A-M-I-T` fingerspelled ≈ 5.2 s.)
6. rAF loop samples, `applyBone` writes quaternions, `renderer.render`; `onState` drives caption "PAIN · Sign 1 of 2", gold dot, progress bar.

## Unavailable signs
A token without a word table is spelled with letters/digits (`schedule.js`); characters without a table are skipped. Since `sanitizeTokens` already spells unknown words, the avatar never stalls; the only "missing" items in the UI are words in unsupported scripts.

## Second, separate motion system (landing only)

`src/engine/avatar/signMotion.ts` loads **ISLRTC dictionary landmark recordings** (format 2: 169 floats/frame @15 fps — wrist image coords + 21 world landmarks per hand + 13 pose points) from `public/signs/<gloss>.json`. Used by `features/landing/HandTrace.tsx` and `intro/SigningHands.tsx` to draw **2D** hands. Only `hello`, `pain`, `welcome`, `where` are shipped. It is **not** connected to Remy. The header mentions `skeleton.ts` (absent).

## Limitations / risks
- Linguistic accuracy of every word, letter and digit is unverified by fluent ISL signers.
- No facial expressions (no morph targets); WH-question brow, negation head-shake etc. absent. `engine/avatar/nonManual.ts` + `grammar.toGloss` markers are unused.
- No spatial grammar, verb agreement, or classifiers.
- Retargeting assumes YBot and Remy share Mixamo bone names (tested: every table's joints exist on both rigs).
- `step()` recompiles everything from the chosen index; fine for short phrases.
- Each `AvatarViewport` creates its own WebGL context (landing + studio never coexist, so OK today).
