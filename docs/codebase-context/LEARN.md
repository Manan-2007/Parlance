# Learn — teaching ISL in Parlance

> Historical teammate-branch snapshot. For the integrated setup and current behavior, read [README](../../README.md) and [CLAUDE.md](../../CLAUDE.md). The integrated app uses the bundled FastAPI backend, the Ch22 avatar, raw hand-only recognition vectors, and separate opt-in body anchors for Learn. Earlier external-VOX, Remy, test-count and recognition-quality statements below may be outdated.

Phase 1 committed on branch `manan-work` (2026-11-20). Phase 2 (Teach, decks, practise together, fingerspelling) follows below. Parlance's framing changed from "translator" to **a place to learn and translate ISL**; Learn is the default `/app` route.

## Principles (keep these)
1. **ISLRTC is the reference.** Every taught sign is an ISLRTC dictionary recording (landmarks only, extracted by VOX), linked to its official YouTube video. Remy's procedural signs are shown only as a "3D guide · approximate" and never as the reference.
2. **Feedback is honest.** Camera practice compares hands only (which hands, position, shape, palm direction, movement). The UI says, next to every score, that it cannot see the face.
3. **Production beats watching.** Every lesson asks the learner to sign; quizzes interleave recall; spaced review brings signs back.
4. **Real situations.** Units are built around meeting someone, repairing misunderstandings, clinics, emergencies, numbers/time, shopping/travel. Phrases are taught in ISL order with the grammar rule explained.
5. **Private.** Tracking runs on the device; progress lives in `localStorage["parlance.learn.v1"]`.

## Files
| Area | File | Notes |
|---|---|---|
| Curriculum | `src/learn/curriculum.ts` | 6 units, 16 lessons + 5 conversations, 80 signs, 21 phrases, grammar rules, etiquette notes |
| Lesson planning | `src/learn/lessonPlan.ts` | `planLesson`, `planPhraseLesson` (from translator tokens), `planSingleSign`, seeded shuffles, token↔gloss mapping (`glossForToken`, `avatarTokenFor`), `inferRules` |
| Spaced review | `src/learn/srs.ts` | Leitner boxes: 10 min, 1, 3, 7, 16, 35 days; `gradeFromScore` |
| Practice comparison | `src/learn/motion.ts` | `liveFrame`, features, DTW `align`, `comparePractice` → score, 4 dimension scores, ≤3 tips, aligned frames for replay |
| Progress store | `src/stores/learn.ts` | cards, lessons, saved phrases, practice days, prefs (left-handed, mirror, speed) |
| Pages | `src/features/learn/LearnPage.tsx`, `UnitPage.tsx`, `LessonPage.tsx`, `ReviewPage.tsx`, `SignLibraryPage.tsx`, `SignPage.tsx` | routes under `/app/learn` |
| Exercises | `src/features/learn/steps.tsx` | intro, watch, watch-avatar, recognise (choice), order (build the sentence), sign, listen, reply |
| Viewing | `SignFigure.tsx` (SVG figure from a format-2 frame), `ReferencePlayer.tsx`, `SignViewer.tsx` (signer / 3D guide / video tabs + facts), `OfficialVideo.tsx` (click-to-load youtube-nocookie), `RemyGuide.tsx` (lazy three.js) | |
| Camera practice | `src/features/learn/PracticePanel.tsx` | uses `useCameraTracking({ onResult })`; auto start/stop; side-by-side replay; optional VOX check for verified signs |
| Landing | `src/features/landing/LearnSection.tsx` | navy section "01 Learn" after the flow strip |
| Data | `public/signs/*.json` (239 ISLRTC motions), `public/signs/sources.json` (gloss → ISLRTC video ids) | imported by `scripts/sync-islrtc-signs.mjs "<vox path>"` |
| Calibration | `scripts/calibrate-practice.mjs "<vox path>"` | robustness + INCLUDE check; sets `GOOD_DISTANCE`/`BAD_DISTANCE` |
| Tests | `test/learn.test.js` | curriculum integrity, plans, SRS, comparison behaviour |

## Lesson flow
`intro → (watch A, watch B, recognise ×2) … → 3 mixed recognise → 2 × sign it → build-the-sentence per phrase → done`.
Conversation lessons alternate **listen** (ISLRTC signer plays the line; pick the meaning) and **reply** (build the reply in ISL order). Watching a sign adds it to the review deck; first-try answers and camera scores grade it.

## How practice scoring works (`src/learn/motion.ts`)
1. **Same frame format on both sides.** Live tracker output → `liveFrame(vector141, world126, pose39)` → 169-float format-2 frame (wrists and pose in square image units; x of the 141 vector × 16/9). References already use it.
2. **Body frame.** Median shoulder midpoint and shoulder width (`anchorOf`); all positions in shoulder widths, so distance from camera and body size drop out.
3. **Per hand per frame:** wrist position; five finger curls (sum of joint angles / full curl); index–middle spread; palm normal (`shapeOf`, sign-corrected per hand block).
4. **Cleaning:** hands below the resting line ignored; a whole-recording idle hand dropped (`dropIdleHand`); frozen hands (VOX fill artefact; 37 of 239 references) ignored (`frozenBlocks`); learner dropouts ≤6 frames interpolated (`fillHandGaps`); trimmed to active frames.
5. **DTW** with a small penalty for non-diagonal steps; distance = mean frame cost along the path. Frame cost = position + 1.4·shape + 0.5·palm (paired hands) + 1.1·presence mismatch.
6. **Score** = `scoreOf(distance)` with `GOOD_DISTANCE 0.55`, `BAD_DISTANCE 1.05`.
7. **Tips** from the aligned path: hands used (both / one / other hand), height (with body zone wording), in/out, the two worst fingers, spread, palm direction, movement size, pace. No hand-count tips when the reference lost a hand.
8. **Left-handed** mode mirrors the learner (swap hands, flip x) before comparing.

### Calibration results (2026-11-20, `scripts/calibrate-practice.mjs`)
- Distorted copies of all references (speed 0.7–1.4×, position, camera distance 0.75–1.25×, jitter, 8% dropped frames): matched to their own sign first **98.7%**, top-5 **100%** of 239. Median distance 0.27 → score 100.
- INCLUDE clips by other signers (VOX `ml/data/*/MVI_*`, 160 windows, 4 words): "hello" and "thank you" rank median 8th / 6th of 239; "good morning" and "pleased" mismatch because INCLUDE uses a compound/variant and 2-second windows. Random wrong signs score median 0 (p75 18).
- **Not yet validated with live webcam users.** Real-world score distributions and tip quality need trying with real signers and cameras.

## Known limitations
- No facial grammar or mouthing, either taught by the figure or checked by the camera (the official video covers it visually).
- Recordings are one signer; regional variants are not covered (the unit notes say to follow the person you're talking to).
- Number signs 6–10 and some others may be two-handed in ISLRTC; whatever the recording shows is what is taught.
- `sources.json` lists every clip VOX considered for a word; the first is shown, which may not be the exact clip the landmarks came from.
- Etiquette notes are general Deaf-awareness guidance, not India-specific research.

---

## Phase 2 (2026-11-20): Teach, decks, practise together, fingerspelling

### What was added
| Feature | Route | Files |
|---|---|---|
| Teach hub (my recordings, my decks, open a deck file, author credit) | `/app/learn/teach` | `src/features/teach/TeachPage.tsx` |
| Record a sign (landmarks only; optional "fingerspelled letter" tag) | `/app/learn/teach/record` | `src/features/teach/RecordPage.tsx` |
| Deck builder (ISLRTC signs + recordings, teaching order, phrases in ISL order, save / share / try) | `/app/learn/teach/decks/:deckId` (`new`) | `src/features/teach/DeckEditorPage.tsx` |
| Deck page, shared-link page | `/app/learn/decks/:deckId`, `/app/learn/deck#<data>` | `src/features/learn/DeckPage.tsx` |
| Deck lesson | `/app/learn/decks/:deckId/lesson` | `LessonPage.tsx` + `planDeckLesson` |
| Practise together (two learners, or learner + fluent signer) | `/app/learn/together` | `src/features/learn/TogetherPage.tsx`, `src/learn/together.ts` |
| Fingerspelling (read words at speed; spell your name) | `/app/learn/fingerspelling` | `FingerspellingPage.tsx`, `SpellingAvatar.tsx`, `src/learn/fingerspell.ts` |

### Data
- **Recordings** (`src/learn/recordings.ts`): format-2 frames quantised to int16 (1e-4 resolution) and base64url-encoded; key `rec:<id>`. Validated on import (id charset, 4–120 frames, string lengths).
- **Decks** (`src/learn/decks.ts`): `{ id, title, description, author, items[], signs[] (embedded recordings), phrases[] }`. Shared as `/app/learn/deck#<deflate-raw + base64url JSON>`; the fragment never reaches a server. Also a `.parlance-deck.json` file. `validateDeck` drops unknown glosses, recording keys without an embedded recording, unused recordings, and enforces limits (40 signs, 30 recordings, 20 phrases, 12 signs per phrase).
- **Storage** (`src/stores/teach.ts`): zustand persisted to IndexedDB (`src/lib/idbStorage.ts`; database `parlance`, store `kv`, key `parlance.teach.v1`), falling back to localStorage then memory. Wait on `hydrated` / `teachReady()` before resolving `rec:` keys.
- **Resolution**: `loadMotion`, `englishOf`, `sourceOf`, `sourceLabel` in `src/features/learn/signData.ts` treat ISLRTC glosses and `rec:` keys alike, so the viewer, quizzes, practice, review and pair game all work with recordings. Recordings are always labelled "Recorded by …, not reviewed".

### Shared capture
`src/features/learn/useSignCapture.ts` (countdown, auto start/stop, timeout, error text) and `CaptureStage.tsx` (live figure + preview + overlays) are used by camera practice and by Record. Keep `CaptureStage` mounted while the camera runs: the tracker reads frames from its `<video>`.

### Fingerspelling honesty
There are no ISLRTC letter recordings (VOX's dictionary index has none), so letters come from Remy's approximate tables, and the page says so. Single-letter queue items use a trailing hyphen (`"I-"`) so the scheduler fingerspells I instead of playing the pronoun. A letter can be checked with the camera only when a recording tagged with that letter exists (own recordings or any saved deck): a teacher can record the alphabet and share it as a deck.

### Verification (2026-11-20)
- 25 tests pass (`test/teach.test.js` adds: encoding precision and score preservation, custom-sign validation, deck link/file round trip, tampered decks, deck lesson plans, pair rounds, fingerspelling helpers including I-as-letter).
- Browser, with a stand-in recording written to IndexedDB (camera blocked in the test pane):
  - Teach hub showed the recordings.
  - A recording's page played it, with the not-reviewed notice.
  - A deck was built in the editor and its share link (11k characters with one recording) generated.
  - On wiped storage the link opened, saved, and its lesson played the embedded recording.
  - A practise-together round ran end to end.
  - Fingerspelling read (wrong answer, then reveal) and spell (live letter highlight) worked.
  - No horizontal scroll at 375 px on the new pages.
- **Not tested:** recording with a real camera, and practice against a real recording.

---

## Phase 3 (2026-11-20): sign checks, the reader, practice log

### Sign checks by fluent signers — `/app/learn/check-signs`
- Reviewers go through four sets: Remy's 164 3D signs, its 26 letters, the 80 ISLRTC lesson signs, and recordings. They mark each sign correct, regional variant or wrong (for ISLRTC: "I sign it the same / differently / recording looks wrong"), with an optional note. Keys 1, 2, 3 pick a verdict.
- Checks are stored in the teach store (`myReviews`, `region`, author) and shared as a link `/app/learn/checks#<packed>` or a `parlance-sign-checks.json` file. Received packs go to `reviewPacks`.
- `src/learn/reviews.ts`:
  - review keys: `gloss`, `remy:<TOKEN>`, `letter:<A-Z>`, `rec:<id>`;
  - `validatePack` drops bad keys, verdicts and duplicates, and caps 600 reviews and 200-character notes;
  - `summarize` counts each reviewer once per key;
  - `statusOf`: a flag wins ties, then variant.
- `src/learn/packing.ts` holds the shared deflate + base64url helpers, now used by decks too.
- Status is shown by `src/features/learn/ReviewBadge.tsx` (`useReviewSummaries`, `ReviewBadge`):
  - in the sign viewer, and in Remy's 3D guide;
  - as dots on fingerspelling letters;
  - as a warning on the Speech → Sign stage when the current sign has been flagged as wrong.

### Sign to the reader — `/app/learn/reader`
Practise the signs VOX has verified (34 of its 36 have ISLRTC recordings) and see whether the recogniser reads you. It uses the existing WebSocket client: VOX has no CORS, so its HTTP `/health` can't be called from the browser. It shows buffering and the closest-guess hints, plus offline and no-model states with the start command. Verified 2026-11-20: connected to a running VOX and rendered. Signing to it with a camera is **not** tested.

### Practice log and tip feedback
Every camera attempt is logged in `parlance.learn.v1` → `practiceLog`: score, distance, dimension scores, tip kinds, left-handed flag, and the learner's "Were these tips useful?" answer. The newest 300 are kept. Settings → Learning → Practice log has Download (`parlance-practice-log.json`) and Clear. Send that file in to re-tune `GOOD_DISTANCE` / `BAD_DISTANCE` and the tip thresholds.

### VOX repo
`backend/test_client.py` in the VOX checkout was updated: 141-float frames with a synthetic body pose, and the current reply shapes (candidate / buffered). A real "hello" sample is read at 0.98. The change is **uncommitted in the VOX repo**; VOX also has unrelated uncommitted edits in `backend/main.py` that were left untouched.

### Still open
- Alphabet references from ISLRTC videos: this needs permission to download the clips, then VOX's extraction scripts. A teacher can record letters in Teach today.
- Tuning scores from real webcam use: this needs the practice log from real attempts.

### Verification (2026-11-20)
- 29 tests pass (`test/reviews.test.js` adds key validation, cleaning, reviewer de-duplication, status rules, and the link/file round trip).
- In the browser:
  - a check was saved, and its flag appeared on the Speech → Sign stage for WATER with the note;
  - another reviewer's link opened and was added, and their letter-A verdict showed as a green dot in Fingerspelling;
  - the reader page connected to VOX.

---

## Recognizer-linked practice and progress (2026-11-21)

- **Sign to the reader** (`ReaderPage.tsx`) picks signs from your own reviews first (due
  ones, then 70% from signs you have seen) and opens on a given sign with
  `/app/learn/reader?sign=<gloss>`. If the sign ends uncertain but the target was one of the
  recogniser's suggestions, it is marked **Almost** (graded `hard`) instead of a miss.
  Hints say "lower your hands": the ISL transformer commits on release.
- **Sign pages** show "Sign it to the reader" when the shipped model may write that word
  automatically (`public/signs/recognition.json` `reliable`).
- **Learn hub** shows a day streak (`practiceStreak`) and "Signs to work on"
  (`signsToWorkOn`: forgotten after being learned, or best camera match below 65), both
  in `src/learn/srs.ts` with tests in `test/learn.test.js`.
