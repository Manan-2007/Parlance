# Community

Long-form discussion for Deaf and hard-of-hearing people, their families and
learners (`/app/community`), plus live meetup rooms for people in the same
place ("Here, together"). It is the website's version of the hackathon's
Track 1 idea; the phone app (Flutter + Serverpod) is unchanged.

## Why it is not a group chat

WhatsApp and Telegram groups are fast streams with the general public. Here
people with the same everyday problems talk in depth, so the design keeps good
answers findable:

- **Spaces** (Everyday life, Work, Study, Health, Rights and documents, Family,
  Learning ISL, Tech, Meetups) hold **threads**, not one endless chat.
- **Questions** can be marked **answered** by the asker; replies can be marked
  **helpful** (one per person, never your own). Lists sort by active, new,
  unanswered or upcoming meetups, and can be searched.
- **Sign first:** every post and reply has **See in sign** (the 3D signer,
  labelled approximate) and **Read aloud**. Posts can be typed, spoken (Web
  Speech) or added from what you signed on Sign → Text (History), and show how
  they were written.
- **Meetups:** place, city and time; "I'm going". From an hour before the
  start, the host opens a **live room**: a QR code and a six-digit code shown
  at the venue. Everyone there joins, sees one wall of big messages and quick
  replies, and the room's messages are **deleted when the meetup ends** (or when
  the host ends it). The code is only given to the host, so joining means being
  there.

## Code

| Part | Where |
|---|---|
| Rules and storage (SQLite) | `backend/community.py` (`CommunityStore`) |
| HTTP routes + live events (SSE) | `backend/community.py` (`router`, `Hub`), mounted in `backend/main.py` |
| Sample posts for a new database | `backend/community_seed.py` (members flagged `sample`, shown with a "Sample" badge) |
| Backend tests | `backend/tests/test_community.py` |
| Types and pure helpers | `src/community/model.ts` (tested by `test/community.test.js`) |
| API client, live events hook | `src/services/community/` |
| Who you are (name + token, this browser only) | `src/stores/community.ts` |
| Pages | `src/features/community/` (Community, Space, Thread, New post, Live) |

The website reaches the service at `/api/community/*`, which the Vite dev and
preview servers proxy to the Python service (`/community/*` on port 8000). The
service worker never caches `/api/`.

## Rules (enforced in `CommunityStore`, checked by the tests)

- Joining asks only for a name (3–24 characters, any script), an optional city
  and how you describe yourself. The browser keeps a random token; only its
  SHA-256 is stored. Reading needs no account.
- Only the author edits or deletes a post or reply. Only the asker marks the
  answer. Only the meetup host opens or ends the live room.
- A post is hidden for everyone after 3 different people report it (the author
  still sees it, marked hidden).
- Posting is limited to 6 posts a minute (20 live messages a minute).
- Meetups start no more than 15 minutes in the past, at most 6 months ahead,
  and last at most 12 hours.

## Data

`backend/data/community.sqlite3` (gitignored), or `PARLANCE_COMMUNITY_DB`.
`PARLANCE_COMMUNITY_SEED=0` starts empty instead of with sample posts. Delete
the file to reset the Community; browsers that had joined are asked to join
again.

Live events run in one Python process (an in-memory hub), which is fine for a
local or single-server setup.
