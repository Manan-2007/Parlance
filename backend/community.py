"""Parlance Community: long-form discussion between Deaf and hard-of-hearing
people (and the people around them), plus live meetup rooms for people in the
same place ("Here, together").

Everything is stored in one SQLite file on this computer
(PARLANCE_COMMUNITY_DB, default backend/data/community.sqlite3).

Identity: joining creates a member with a chosen handle (never a real name is
asked) and returns a random token. The browser keeps the token and sends it as
`Authorization: Bearer <token>`; only its SHA-256 is stored. Every write checks
who is asking: you can edit or delete only your own posts, only a question's
author marks the answer, only a meetup's host starts or ends its live room.

Live updates use server-sent events on channels:
  feed            new threads, for the Community home
  thread:<id>     replies, edits, helpful counts, "N reading now"
  live:<code>     live meetup messages, "N here now"
A live room's code is shown only to its host (as a QR code at the venue), so
joining it means being there. Its messages are deleted when the meetup ends.
"""

from __future__ import annotations

import asyncio
from collections import defaultdict, deque
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import sqlite3
import threading
import time
from typing import Any, Callable, Optional
import unicodedata

from fastapi import APIRouter, Header, Query, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

SPACES = [
    {"id": "everyday", "title": "Everyday life", "description": "Shops, travel, neighbours, banks and getting things done."},
    {"id": "work", "title": "Work and jobs", "description": "Interviews, workplace access, interpreters at work, careers."},
    {"id": "study", "title": "Study and exams", "description": "School, college, exam support, ISL in the classroom."},
    {"id": "health", "title": "Health", "description": "Doctors, hospitals, hearing aids, implants and feeling well."},
    {"id": "rights", "title": "Rights and documents", "description": "UDID card, disability certificate, schemes and your rights."},
    {"id": "family", "title": "Family and friends", "description": "Hearing families, CODAs, relationships, raising children."},
    {"id": "learn-isl", "title": "Learning ISL", "description": "Regional signs, new words, finding practice partners."},
    {"id": "tech", "title": "Tech and tools", "description": "Captions, video calls, apps and phones that work for you."},
    {"id": "meetups", "title": "Meetups", "description": "Meet in person. The host opens a live room when you are there."},
]
SPACE_IDS = {space["id"] for space in SPACES}
KINDS = {"discussion", "question", "meetup"}
WAYS = {"deaf", "hard-of-hearing", "deafblind", "family", "learning", "interpreter", "teacher"}
REPORT_REASONS = {"spam", "rude", "unsafe", "private", "other"}
INPUTS = {"typed", "spoken", "signed"}

HIDE_AFTER_REPORTS = 3
POSTS_PER_MINUTE = 6
LIVE_PER_MINUTE = 20
LIVE_OPENS_BEFORE_MS = 60 * 60 * 1000
MAX_MEETUP_MS = 12 * 60 * 60 * 1000
MINUTE_MS = 60 * 1000

def _handle_ok(handle: str) -> bool:
    """Letters in any script (with Devanagari vowel signs), digits, and _ . - or spaces inside."""

    def word(char: str) -> bool:
        return char.isalnum() or char == "_" or unicodedata.category(char).startswith("M")

    if not (3 <= len(handle) <= 24) or unicodedata.category(handle[0]).startswith("M"):
        return False
    if not (word(handle[0]) and word(handle[-1])):
        return False
    return all(word(char) or char in " .-" for char in handle)


class CommunityError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _clean(text: Any, field: str, low: int, high: int, multiline: bool = False) -> str:
    if not isinstance(text, str):
        raise CommunityError(400, f"{field} is missing.")
    text = text.replace("\r\n", "\n").strip()
    if not multiline:
        text = " ".join(text.split())
    else:
        text = re.sub(r"\n{3,}", "\n\n", text)
    if len(text) < low:
        raise CommunityError(400, f"{field} is too short. Write at least {low} characters.")
    if len(text) > high:
        raise CommunityError(400, f"{field} is too long. Keep it under {high} characters.")
    return text


class CommunityStore:
    """All Community data and the rules about who may change it."""

    def __init__(self, path: str | Path, clock: Callable[[], int] | None = None, seed: bool = False):
        self.clock = clock or (lambda: int(time.time() * 1000))
        self.lock = threading.RLock()
        path = str(path)
        if path != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path, check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA foreign_keys = ON")
        if path != ":memory:":
            self.db.execute("PRAGMA journal_mode = WAL")
        self._create()
        self.recent: dict[tuple[int, str], deque] = defaultdict(deque)
        if seed and not self.db.execute("SELECT 1 FROM members LIMIT 1").fetchone():
            from .community_seed import seed_community

            seed_community(self)

    # --- schema ---------------------------------------------------------------

    def _create(self):
        self.db.executescript(
            """
            CREATE TABLE IF NOT EXISTS members (
              id INTEGER PRIMARY KEY,
              handle TEXT NOT NULL UNIQUE COLLATE NOCASE,
              city TEXT NOT NULL DEFAULT '',
              ways TEXT NOT NULL DEFAULT '[]',
              token_hash TEXT NOT NULL UNIQUE,
              sample INTEGER NOT NULL DEFAULT 0,
              created_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS threads (
              id INTEGER PRIMARY KEY,
              space TEXT NOT NULL,
              kind TEXT NOT NULL,
              title TEXT NOT NULL,
              body TEXT NOT NULL,
              input TEXT NOT NULL DEFAULT 'typed',
              author_id INTEGER NOT NULL REFERENCES members(id),
              created_at INTEGER NOT NULL,
              edited_at INTEGER,
              last_activity_at INTEGER NOT NULL,
              answer_id INTEGER,
              hidden INTEGER NOT NULL DEFAULT 0,
              deleted INTEGER NOT NULL DEFAULT 0,
              place TEXT,
              city TEXT,
              starts_at INTEGER,
              ends_at INTEGER,
              live_code TEXT,
              live_started_at INTEGER
            );
            CREATE INDEX IF NOT EXISTS threads_space ON threads(space, last_activity_at);
            CREATE UNIQUE INDEX IF NOT EXISTS threads_live_code ON threads(live_code) WHERE live_code IS NOT NULL;
            CREATE TABLE IF NOT EXISTS replies (
              id INTEGER PRIMARY KEY,
              thread_id INTEGER NOT NULL REFERENCES threads(id),
              author_id INTEGER NOT NULL REFERENCES members(id),
              body TEXT NOT NULL,
              input TEXT NOT NULL DEFAULT 'typed',
              quote_id INTEGER,
              created_at INTEGER NOT NULL,
              edited_at INTEGER,
              hidden INTEGER NOT NULL DEFAULT 0,
              deleted INTEGER NOT NULL DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS replies_thread ON replies(thread_id, created_at);
            CREATE TABLE IF NOT EXISTS helpful (
              member_id INTEGER NOT NULL REFERENCES members(id),
              target TEXT NOT NULL,
              target_id INTEGER NOT NULL,
              PRIMARY KEY (member_id, target, target_id)
            );
            CREATE TABLE IF NOT EXISTS reports (
              member_id INTEGER NOT NULL REFERENCES members(id),
              target TEXT NOT NULL,
              target_id INTEGER NOT NULL,
              reason TEXT NOT NULL,
              created_at INTEGER NOT NULL,
              PRIMARY KEY (member_id, target, target_id)
            );
            CREATE TABLE IF NOT EXISTS going (
              member_id INTEGER NOT NULL REFERENCES members(id),
              thread_id INTEGER NOT NULL REFERENCES threads(id),
              PRIMARY KEY (member_id, thread_id)
            );
            CREATE TABLE IF NOT EXISTS live_messages (
              id INTEGER PRIMARY KEY,
              thread_id INTEGER NOT NULL REFERENCES threads(id),
              author_id INTEGER NOT NULL REFERENCES members(id),
              text TEXT NOT NULL,
              input TEXT NOT NULL DEFAULT 'typed',
              created_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS live_thread ON live_messages(thread_id, created_at);
            """
        )
        self.db.commit()

    # --- helpers --------------------------------------------------------------

    def _member_public(self, row: sqlite3.Row) -> dict:
        return {
            "id": row["id"],
            "handle": row["handle"],
            "city": row["city"],
            "ways": json.loads(row["ways"]),
            "sample": bool(row["sample"]),
            "joinedAt": row["created_at"],
        }

    def _author(self, member_id: int) -> dict:
        row = self.db.execute("SELECT * FROM members WHERE id = ?", (member_id,)).fetchone()
        return self._member_public(row)

    def _limit(self, member: dict, bucket: str, per_minute: int):
        now = self.clock()
        stamps = self.recent[(member["id"], bucket)]
        while stamps and stamps[0] <= now - MINUTE_MS:
            stamps.popleft()
        if len(stamps) >= per_minute:
            raise CommunityError(429, "You are posting very fast. Wait a minute, then try again.")
        stamps.append(now)

    def _ways(self, ways: Any) -> list[str]:
        if ways is None:
            return []
        if not isinstance(ways, list) or any(w not in WAYS for w in ways):
            raise CommunityError(400, "Choose how you communicate from the list.")
        return sorted(set(ways))

    def _city(self, city: Any) -> str:
        if city in (None, ""):
            return ""
        return _clean(city, "City", 2, 40)

    def _input(self, value: Any) -> str:
        return value if value in INPUTS else "typed"

    def _helpful_count(self, target: str, target_id: int) -> int:
        return self.db.execute("SELECT COUNT(*) FROM helpful WHERE target = ? AND target_id = ?", (target, target_id)).fetchone()[0]

    def _my_helpful(self, viewer: Optional[dict], target: str, target_id: int) -> bool:
        if not viewer:
            return False
        return self.db.execute(
            "SELECT 1 FROM helpful WHERE member_id = ? AND target = ? AND target_id = ?", (viewer["id"], target, target_id)
        ).fetchone() is not None

    def _thread_row(self, thread_id: int) -> sqlite3.Row:
        row = self.db.execute("SELECT * FROM threads WHERE id = ? AND deleted = 0", (thread_id,)).fetchone()
        if not row:
            raise CommunityError(404, "That post was not found. It may have been deleted.")
        return row

    def _visible_thread(self, thread_id: int, viewer: Optional[dict]) -> sqlite3.Row:
        row = self._thread_row(thread_id)
        if row["hidden"] and not (viewer and viewer["id"] == row["author_id"]):
            raise CommunityError(404, "That post was hidden after several people reported it.")
        return row

    def _thread_out(self, row: sqlite3.Row, viewer: Optional[dict]) -> dict:
        now = self.clock()
        replies = self.db.execute(
            "SELECT COUNT(*) FROM replies WHERE thread_id = ? AND deleted = 0 AND hidden = 0", (row["id"],)
        ).fetchone()[0]
        mine = bool(viewer and viewer["id"] == row["author_id"])
        out = {
            "id": row["id"],
            "space": row["space"],
            "kind": row["kind"],
            "title": row["title"],
            "body": row["body"],
            "input": row["input"],
            "author": self._author(row["author_id"]),
            "createdAt": row["created_at"],
            "editedAt": row["edited_at"],
            "lastActivityAt": row["last_activity_at"],
            "replyCount": replies,
            "helpful": self._helpful_count("thread", row["id"]),
            "myHelpful": self._my_helpful(viewer, "thread", row["id"]),
            "answerId": row["answer_id"],
            "hidden": bool(row["hidden"]),
            "mine": mine,
            "meetup": None,
        }
        if row["kind"] == "meetup":
            live = bool(row["live_code"]) and row["ends_at"] > now
            out["meetup"] = {
                "place": row["place"],
                "city": row["city"],
                "startsAt": row["starts_at"],
                "endsAt": row["ends_at"],
                "going": self.db.execute("SELECT COUNT(*) FROM going WHERE thread_id = ?", (row["id"],)).fetchone()[0],
                "imGoing": bool(viewer) and self.db.execute(
                    "SELECT 1 FROM going WHERE thread_id = ? AND member_id = ?", (row["id"], viewer["id"])
                ).fetchone() is not None,
                "live": live,
                # The code is the way in, so only the host sees it (to show at the venue).
                "code": row["live_code"] if live and mine else None,
            }
        return out

    def _reply_out(self, row: sqlite3.Row, viewer: Optional[dict]) -> dict:
        return {
            "id": row["id"],
            "threadId": row["thread_id"],
            "body": row["body"],
            "input": row["input"],
            "quoteId": row["quote_id"],
            "author": self._author(row["author_id"]),
            "createdAt": row["created_at"],
            "editedAt": row["edited_at"],
            "helpful": self._helpful_count("reply", row["id"]),
            "myHelpful": self._my_helpful(viewer, "reply", row["id"]),
            "mine": bool(viewer and viewer["id"] == row["author_id"]),
        }

    def _touch(self, thread_id: int):
        self.db.execute("UPDATE threads SET last_activity_at = ? WHERE id = ?", (self.clock(), thread_id))

    # --- members --------------------------------------------------------------

    def join(self, handle: Any, city: Any = None, ways: Any = None, sample: bool = False) -> tuple[dict, str]:
        handle = _clean(handle, "Name", 3, 24)
        if not _handle_ok(handle):
            raise CommunityError(400, "Use letters, numbers, spaces, dots, dashes or underscores in your name.")
        token = secrets.token_urlsafe(32)
        with self.lock:
            try:
                cursor = self.db.execute(
                    "INSERT INTO members (handle, city, ways, token_hash, sample, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                    (handle, self._city(city), json.dumps(self._ways(ways)), _hash(token), int(sample), self.clock()),
                )
            except sqlite3.IntegrityError:
                raise CommunityError(409, "Someone already uses that name. Try another one.")
            self.db.commit()
            return self._author(cursor.lastrowid), token

    def member_for_token(self, token: Optional[str]) -> Optional[dict]:
        if not token:
            return None
        with self.lock:
            row = self.db.execute("SELECT * FROM members WHERE token_hash = ?", (_hash(token),)).fetchone()
            return self._member_public(row) if row else None

    def update_me(self, member: dict, city: Any = None, ways: Any = None) -> dict:
        with self.lock:
            self.db.execute(
                "UPDATE members SET city = ?, ways = ? WHERE id = ?",
                (self._city(city), json.dumps(self._ways(ways)), member["id"]),
            )
            self.db.commit()
            return self._author(member["id"])

    # --- spaces and threads ---------------------------------------------------

    def spaces(self) -> list[dict]:
        with self.lock:
            counts = {
                row["space"]: (row["n"], row["last"])
                for row in self.db.execute(
                    "SELECT space, COUNT(*) AS n, MAX(last_activity_at) AS last FROM threads WHERE deleted = 0 AND hidden = 0 GROUP BY space"
                )
            }
        return [{**space, "threads": counts.get(space["id"], (0, None))[0], "lastActivityAt": counts.get(space["id"], (0, None))[1]} for space in SPACES]

    def threads(self, viewer: Optional[dict], space: Optional[str] = None, sort: str = "active", q: str = "", limit: int = 30, offset: int = 0) -> list[dict]:
        where = ["deleted = 0", "hidden = 0"]
        args: list[Any] = []
        if space:
            if space not in SPACE_IDS:
                raise CommunityError(404, "That space does not exist.")
            where.append("space = ?")
            args.append(space)
        if q.strip():
            needle = "%" + q.strip()[:80].replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
            where.append("(title LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\')")
            args += [needle, needle]
        order = "last_activity_at DESC"
        if sort == "new":
            order = "created_at DESC"
        elif sort == "unanswered":
            where.append("kind = 'question' AND answer_id IS NULL")
            order = "created_at DESC"
        elif sort == "meetups":
            where.append("kind = 'meetup' AND ends_at > ?")
            args.append(self.clock())
            order = "starts_at ASC"
        elif sort != "active":
            raise CommunityError(400, "Sort by active, new, unanswered or meetups.")
        limit = max(1, min(int(limit), 50))
        offset = max(0, int(offset))
        with self.lock:
            rows = self.db.execute(
                f"SELECT * FROM threads WHERE {' AND '.join(where)} ORDER BY {order} LIMIT ? OFFSET ?", (*args, limit, offset)
            ).fetchall()
            return [self._thread_out(row, viewer) for row in rows]

    def create_thread(self, member: dict, space: Any, kind: Any, title: Any, body: Any, input: Any = "typed", meetup: Optional[dict] = None) -> dict:
        if space not in SPACE_IDS:
            raise CommunityError(400, "Choose a space for your post.")
        if kind not in KINDS:
            raise CommunityError(400, "Choose discussion, question or meetup.")
        title = _clean(title, "Title", 4, 120)
        body = _clean(body, "Post", 1 if kind == "meetup" else 10, 4000, multiline=True)
        now = self.clock()
        place = city = None
        starts = ends = None
        if kind == "meetup":
            if not isinstance(meetup, dict):
                raise CommunityError(400, "Add where and when the meetup is.")
            place = _clean(meetup.get("place"), "Place", 2, 80)
            city = _clean(meetup.get("city"), "City", 2, 40)
            starts, ends = meetup.get("startsAt"), meetup.get("endsAt")
            if not all(isinstance(v, int) and not isinstance(v, bool) for v in (starts, ends)):
                raise CommunityError(400, "Add a start and end time.")
            if starts < now - 15 * MINUTE_MS:
                raise CommunityError(400, "The meetup starts in the past. Pick a later time.")
            if starts > now + 180 * 24 * 60 * MINUTE_MS:
                raise CommunityError(400, "Meetups can be planned up to six months ahead.")
            if not starts < ends <= starts + MAX_MEETUP_MS:
                raise CommunityError(400, "A meetup ends after it starts, and lasts at most 12 hours.")
        with self.lock:
            self._limit(member, "post", POSTS_PER_MINUTE)
            cursor = self.db.execute(
                """INSERT INTO threads (space, kind, title, body, input, author_id, created_at, last_activity_at, place, city, starts_at, ends_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (space, kind, title, body, self._input(input), member["id"], now, now, place, city, starts, ends),
            )
            if kind == "meetup":
                self.db.execute("INSERT INTO going (member_id, thread_id) VALUES (?, ?)", (member["id"], cursor.lastrowid))
            self.db.commit()
            return self._thread_out(self._thread_row(cursor.lastrowid), member)

    def thread(self, thread_id: int, viewer: Optional[dict]) -> dict:
        with self.lock:
            row = self._visible_thread(thread_id, viewer)
            replies = self.db.execute(
                "SELECT * FROM replies WHERE thread_id = ? AND deleted = 0 AND (hidden = 0 OR author_id = ?) ORDER BY created_at, id",
                (thread_id, viewer["id"] if viewer else -1),
            ).fetchall()
            return {**self._thread_out(row, viewer), "replies": [self._reply_out(r, viewer) for r in replies]}

    def edit_thread(self, member: dict, thread_id: int, title: Any, body: Any) -> dict:
        with self.lock:
            row = self._thread_row(thread_id)
            if row["author_id"] != member["id"]:
                raise CommunityError(403, "You can only edit your own posts.")
            title = _clean(title, "Title", 4, 120)
            body = _clean(body, "Post", 1 if row["kind"] == "meetup" else 10, 4000, multiline=True)
            self.db.execute("UPDATE threads SET title = ?, body = ?, edited_at = ? WHERE id = ?", (title, body, self.clock(), thread_id))
            self.db.commit()
            return self._thread_out(self._thread_row(thread_id), member)

    def delete_thread(self, member: dict, thread_id: int):
        with self.lock:
            row = self._thread_row(thread_id)
            if row["author_id"] != member["id"]:
                raise CommunityError(403, "You can only delete your own posts.")
            self.db.execute("UPDATE threads SET deleted = 1, live_code = NULL WHERE id = ?", (thread_id,))
            self.db.execute("DELETE FROM live_messages WHERE thread_id = ?", (thread_id,))
            self.db.commit()

    # --- replies --------------------------------------------------------------

    def reply(self, member: dict, thread_id: int, body: Any, input: Any = "typed", quote_id: Any = None) -> dict:
        body = _clean(body, "Reply", 1, 2000, multiline=True)
        with self.lock:
            self._visible_thread(thread_id, member)
            if quote_id is not None:
                quoted = self.db.execute(
                    "SELECT 1 FROM replies WHERE id = ? AND thread_id = ? AND deleted = 0 AND hidden = 0", (quote_id, thread_id)
                ).fetchone()
                if not quoted:
                    quote_id = None
            self._limit(member, "post", POSTS_PER_MINUTE)
            cursor = self.db.execute(
                "INSERT INTO replies (thread_id, author_id, body, input, quote_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (thread_id, member["id"], body, self._input(input), quote_id, self.clock()),
            )
            self._touch(thread_id)
            self.db.commit()
            row = self.db.execute("SELECT * FROM replies WHERE id = ?", (cursor.lastrowid,)).fetchone()
            return self._reply_out(row, member)

    def _reply_row(self, reply_id: int) -> sqlite3.Row:
        row = self.db.execute("SELECT * FROM replies WHERE id = ? AND deleted = 0", (reply_id,)).fetchone()
        if not row:
            raise CommunityError(404, "That reply was not found. It may have been deleted.")
        return row

    def edit_reply(self, member: dict, reply_id: int, body: Any) -> dict:
        with self.lock:
            row = self._reply_row(reply_id)
            if row["author_id"] != member["id"]:
                raise CommunityError(403, "You can only edit your own replies.")
            body = _clean(body, "Reply", 1, 2000, multiline=True)
            self.db.execute("UPDATE replies SET body = ?, edited_at = ? WHERE id = ?", (body, self.clock(), reply_id))
            self.db.commit()
            return self._reply_out(self._reply_row(reply_id), member)

    def delete_reply(self, member: dict, reply_id: int) -> int:
        with self.lock:
            row = self._reply_row(reply_id)
            if row["author_id"] != member["id"]:
                raise CommunityError(403, "You can only delete your own replies.")
            self.db.execute("UPDATE replies SET deleted = 1 WHERE id = ?", (reply_id,))
            self.db.execute("UPDATE threads SET answer_id = NULL WHERE answer_id = ?", (reply_id,))
            self.db.commit()
            return row["thread_id"]

    # --- helpful, answers, reports, going ---------------------------------------

    def _target_row(self, target: str, target_id: int) -> sqlite3.Row:
        if target == "thread":
            return self._thread_row(target_id)
        if target == "reply":
            return self._reply_row(target_id)
        raise CommunityError(400, "Mark a post or a reply.")

    def set_helpful(self, member: dict, target: str, target_id: int, on: bool) -> dict:
        with self.lock:
            row = self._target_row(target, target_id)
            if row["author_id"] == member["id"]:
                raise CommunityError(403, "You cannot mark your own post as helpful.")
            if on:
                self.db.execute("INSERT OR IGNORE INTO helpful (member_id, target, target_id) VALUES (?, ?, ?)", (member["id"], target, target_id))
            else:
                self.db.execute("DELETE FROM helpful WHERE member_id = ? AND target = ? AND target_id = ?", (member["id"], target, target_id))
            self.db.commit()
            thread_id = row["id"] if target == "thread" else row["thread_id"]
            return {"target": target, "id": target_id, "threadId": thread_id, "count": self._helpful_count(target, target_id)}

    def set_answer(self, member: dict, thread_id: int, reply_id: Optional[int]) -> dict:
        with self.lock:
            row = self._thread_row(thread_id)
            if row["author_id"] != member["id"]:
                raise CommunityError(403, "Only the person who asked can choose the answer.")
            if row["kind"] != "question":
                raise CommunityError(400, "Only questions have answers.")
            if reply_id is not None:
                reply = self.db.execute(
                    "SELECT 1 FROM replies WHERE id = ? AND thread_id = ? AND deleted = 0 AND hidden = 0", (reply_id, thread_id)
                ).fetchone()
                if not reply:
                    raise CommunityError(400, "That reply is not in this question.")
            self.db.execute("UPDATE threads SET answer_id = ? WHERE id = ?", (reply_id, thread_id))
            self.db.commit()
            return self._thread_out(self._thread_row(thread_id), member)

    def report(self, member: dict, target: str, target_id: int, reason: Any) -> dict:
        if reason not in REPORT_REASONS:
            raise CommunityError(400, "Choose why you are reporting this.")
        with self.lock:
            row = self._target_row(target, target_id)
            if row["author_id"] == member["id"]:
                raise CommunityError(400, "You cannot report your own post. You can delete it instead.")
            self.db.execute(
                "INSERT OR IGNORE INTO reports (member_id, target, target_id, reason, created_at) VALUES (?, ?, ?, ?, ?)",
                (member["id"], target, target_id, reason, self.clock()),
            )
            count = self.db.execute("SELECT COUNT(*) FROM reports WHERE target = ? AND target_id = ?", (target, target_id)).fetchone()[0]
            hidden = count >= HIDE_AFTER_REPORTS
            if hidden:
                table = "threads" if target == "thread" else "replies"
                self.db.execute(f"UPDATE {table} SET hidden = 1 WHERE id = ?", (target_id,))
                if target == "reply":
                    self.db.execute("UPDATE threads SET answer_id = NULL WHERE answer_id = ?", (target_id,))
            self.db.commit()
            thread_id = row["id"] if target == "thread" else row["thread_id"]
            return {"target": target, "id": target_id, "threadId": thread_id, "hidden": hidden}

    def set_going(self, member: dict, thread_id: int, on: bool) -> dict:
        with self.lock:
            row = self._visible_thread(thread_id, member)
            if row["kind"] != "meetup":
                raise CommunityError(400, "Only meetups have a guest list.")
            if on:
                self.db.execute("INSERT OR IGNORE INTO going (member_id, thread_id) VALUES (?, ?)", (member["id"], thread_id))
            else:
                self.db.execute("DELETE FROM going WHERE member_id = ? AND thread_id = ?", (member["id"], thread_id))
            self.db.commit()
            return self._thread_out(row, member)

    # --- live meetup rooms ("Here, together") -----------------------------------

    def purge_live(self) -> list[str]:
        """Ends rooms whose meetup is over and deletes their messages."""
        with self.lock:
            ended = self.db.execute(
                "SELECT id, live_code FROM threads WHERE live_code IS NOT NULL AND ends_at <= ?", (self.clock(),)
            ).fetchall()
            for row in ended:
                self.db.execute("DELETE FROM live_messages WHERE thread_id = ?", (row["id"],))
                self.db.execute("UPDATE threads SET live_code = NULL WHERE id = ?", (row["id"],))
            if ended:
                self.db.commit()
            return [row["live_code"] for row in ended]

    def start_live(self, member: dict, thread_id: int) -> dict:
        self.purge_live()
        with self.lock:
            row = self._thread_row(thread_id)
            if row["kind"] != "meetup":
                raise CommunityError(400, "Only meetups have a live room.")
            if row["author_id"] != member["id"]:
                raise CommunityError(403, "Only the host can open the live room.")
            now = self.clock()
            if now < row["starts_at"] - LIVE_OPENS_BEFORE_MS:
                raise CommunityError(400, "The live room opens an hour before the meetup starts.")
            if now >= row["ends_at"]:
                raise CommunityError(400, "This meetup has ended.")
            if not row["live_code"]:
                for _ in range(50):
                    code = f"{secrets.randbelow(1_000_000):06d}"
                    if not self.db.execute("SELECT 1 FROM threads WHERE live_code = ?", (code,)).fetchone():
                        break
                self.db.execute("UPDATE threads SET live_code = ?, live_started_at = ? WHERE id = ?", (code, now, thread_id))
                self.db.commit()
            return self._thread_out(self._thread_row(thread_id), member)

    def end_live(self, member: dict, thread_id: int) -> Optional[str]:
        with self.lock:
            row = self._thread_row(thread_id)
            if row["author_id"] != member["id"]:
                raise CommunityError(403, "Only the host can end the live room.")
            code = row["live_code"]
            self.db.execute("DELETE FROM live_messages WHERE thread_id = ?", (thread_id,))
            self.db.execute("UPDATE threads SET live_code = NULL WHERE id = ?", (thread_id,))
            self.db.commit()
            return code

    def _live_row(self, code: Any) -> sqlite3.Row:
        digits = re.sub(r"\D", "", str(code or ""))
        if len(digits) != 6:
            raise CommunityError(400, "The code has six digits.")
        row = self.db.execute(
            "SELECT * FROM threads WHERE live_code = ? AND deleted = 0 AND ends_at > ?", (digits, self.clock())
        ).fetchone()
        if not row:
            raise CommunityError(404, "No live meetup has that code. Check it with the host.")
        return row

    def live(self, code: Any, viewer: Optional[dict]) -> dict:
        self.purge_live()
        with self.lock:
            row = self._live_row(code)
            messages = self.db.execute(
                "SELECT * FROM live_messages WHERE thread_id = ? ORDER BY id DESC LIMIT 200", (row["id"],)
            ).fetchall()
            return {
                "code": row["live_code"],
                "threadId": row["id"],
                "title": row["title"],
                "place": row["place"],
                "city": row["city"],
                "startsAt": row["starts_at"],
                "endsAt": row["ends_at"],
                "host": self._author(row["author_id"]),
                "isHost": bool(viewer and viewer["id"] == row["author_id"]),
                "messages": [self._live_out(m) for m in reversed(messages)],
            }

    def _live_out(self, row: sqlite3.Row) -> dict:
        return {"id": row["id"], "text": row["text"], "input": row["input"], "author": self._author(row["author_id"]), "createdAt": row["created_at"]}

    def say_live(self, member: dict, code: Any, text: Any, input: Any = "typed") -> dict:
        self.purge_live()
        text = _clean(text, "Message", 1, 280)
        with self.lock:
            row = self._live_row(code)
            self._limit(member, "live", LIVE_PER_MINUTE)
            cursor = self.db.execute(
                "INSERT INTO live_messages (thread_id, author_id, text, input, created_at) VALUES (?, ?, ?, ?, ?)",
                (row["id"], member["id"], text, self._input(input), self.clock()),
            )
            self.db.commit()
            message = self.db.execute("SELECT * FROM live_messages WHERE id = ?", (cursor.lastrowid,)).fetchone()
            return {"code": row["live_code"], "message": self._live_out(message)}


# --- live events (server-sent events) -------------------------------------------


class Hub:
    """In-memory publish/subscribe for one server process."""

    def __init__(self):
        self.channels: dict[str, set[asyncio.Queue]] = defaultdict(set)

    def count(self, channel: str) -> int:
        return len(self.channels.get(channel, ()))

    def publish(self, channel: str, event: dict):
        for queue in list(self.channels.get(channel, ())):
            if queue.qsize() < 200:
                queue.put_nowait(event)

    def subscribe(self, channel: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self.channels[channel].add(queue)
        self.publish(channel, {"type": "presence", "count": self.count(channel)})
        return queue

    def unsubscribe(self, channel: str, queue: asyncio.Queue):
        self.channels[channel].discard(queue)
        if not self.channels[channel]:
            self.channels.pop(channel, None)
        else:
            self.publish(channel, {"type": "presence", "count": self.count(channel)})


# --- HTTP routes ----------------------------------------------------------------

router = APIRouter(prefix="/community")
hub = Hub()
_store: Optional[CommunityStore] = None
_store_lock = threading.Lock()


def get_store() -> CommunityStore:
    global _store
    with _store_lock:
        if _store is None:
            path = os.environ.get("PARLANCE_COMMUNITY_DB") or str(Path(__file__).parent / "data" / "community.sqlite3")
            _store = CommunityStore(path, seed=os.environ.get("PARLANCE_COMMUNITY_SEED", "1") != "0")
        return _store


def _token(authorization: Optional[str]) -> Optional[str]:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip() or None
    return None


async def _viewer(authorization: Optional[str]) -> Optional[dict]:
    return await run_in_threadpool(get_store().member_for_token, _token(authorization))


async def _member(authorization: Optional[str]) -> dict:
    member = await _viewer(authorization)
    if not member:
        raise CommunityError(401, "Join the community first: choose a name to post with.")
    return member


async def _run(fn, *args, **kwargs):
    return await run_in_threadpool(fn, *args, **kwargs)


def error_response(error: CommunityError) -> JSONResponse:
    return JSONResponse({"error": error.message}, status_code=error.status)


class JoinBody(BaseModel):
    handle: str
    city: Optional[str] = None
    ways: Optional[list[str]] = None


class MeBody(BaseModel):
    city: Optional[str] = None
    ways: Optional[list[str]] = None


class ThreadBody(BaseModel):
    space: str
    kind: str
    title: str
    body: str
    input: Optional[str] = "typed"
    meetup: Optional[dict] = None


class EditBody(BaseModel):
    title: Optional[str] = None
    body: str


class ReplyBody(BaseModel):
    body: str
    input: Optional[str] = "typed"
    quoteId: Optional[int] = None


class ToggleBody(BaseModel):
    on: bool = True


class AnswerBody(BaseModel):
    replyId: Optional[int] = None


class ReportBody(BaseModel):
    reason: str


class LiveBody(BaseModel):
    text: str
    input: Optional[str] = "typed"


def _summary(thread: dict) -> dict:
    return {key: value for key, value in thread.items() if key != "replies"}


def _public(thread: dict) -> dict:
    """A thread as anyone else sees it (no viewer-specific fields or host code)."""
    out = {**_summary(thread), "mine": False, "myHelpful": False}
    if out.get("meetup"):
        out["meetup"] = {**out["meetup"], "code": None, "imGoing": False}
    return out


@router.get("/spaces")
async def list_spaces():
    return {"spaces": await _run(get_store().spaces)}


@router.post("/join")
async def join(body: JoinBody):
    member, token = await _run(get_store().join, body.handle, body.city, body.ways)
    return {"member": member, "token": token}


@router.get("/me")
async def me(authorization: Optional[str] = Header(None)):
    return {"member": await _member(authorization)}


@router.patch("/me")
async def update_me(body: MeBody, authorization: Optional[str] = Header(None)):
    member = await _member(authorization)
    return {"member": await _run(get_store().update_me, member, body.city, body.ways)}


@router.get("/threads")
async def list_threads(
    space: Optional[str] = None,
    sort: str = "active",
    q: str = "",
    limit: int = Query(30, ge=1, le=50),
    offset: int = Query(0, ge=0),
    authorization: Optional[str] = Header(None),
):
    viewer = await _viewer(authorization)
    return {"threads": await _run(get_store().threads, viewer, space, sort, q, limit, offset)}


@router.post("/threads")
async def create_thread(body: ThreadBody, authorization: Optional[str] = Header(None)):
    member = await _member(authorization)
    thread = await _run(get_store().create_thread, member, body.space, body.kind, body.title, body.body, body.input, body.meetup)
    hub.publish("feed", {"type": "thread-new", "thread": _public(thread)})
    return {"thread": thread}


@router.get("/threads/{thread_id}")
async def get_thread(thread_id: int, authorization: Optional[str] = Header(None)):
    viewer = await _viewer(authorization)
    thread = await _run(get_store().thread, thread_id, viewer)
    return {"thread": thread, "reading": hub.count(f"thread:{thread_id}")}


@router.patch("/threads/{thread_id}")
async def edit_thread(thread_id: int, body: EditBody, authorization: Optional[str] = Header(None)):
    member = await _member(authorization)
    thread = await _run(get_store().edit_thread, member, thread_id, body.title, body.body)
    hub.publish(f"thread:{thread_id}", {"type": "thread-updated", "thread": _public(thread)})
    return {"thread": thread}


@router.delete("/threads/{thread_id}")
async def delete_thread(thread_id: int, authorization: Optional[str] = Header(None)):
    member = await _member(authorization)
    await _run(get_store().delete_thread, member, thread_id)
    hub.publish(f"thread:{thread_id}", {"type": "thread-removed", "threadId": thread_id})
    return {"ok": True}


@router.post("/threads/{thread_id}/replies")
async def add_reply(thread_id: int, body: ReplyBody, authorization: Optional[str] = Header(None)):
    member = await _member(authorization)
    reply = await _run(get_store().reply, member, thread_id, body.body, body.input, body.quoteId)
    hub.publish(f"thread:{thread_id}", {"type": "reply", "reply": {**reply, "mine": False, "myHelpful": False}})
    hub.publish("feed", {"type": "activity", "threadId": thread_id})
    return {"reply": reply}


@router.patch("/replies/{reply_id}")
async def edit_reply(reply_id: int, body: ReplyBody, authorization: Optional[str] = Header(None)):
    member = await _member(authorization)
    reply = await _run(get_store().edit_reply, member, reply_id, body.body)
    hub.publish(f"thread:{reply['threadId']}", {"type": "reply-updated", "reply": {**reply, "mine": False, "myHelpful": False}})
    return {"reply": reply}


@router.delete("/replies/{reply_id}")
async def delete_reply(reply_id: int, authorization: Optional[str] = Header(None)):
    member = await _member(authorization)
    thread_id = await _run(get_store().delete_reply, member, reply_id)
    hub.publish(f"thread:{thread_id}", {"type": "reply-removed", "id": reply_id})
    return {"ok": True}


async def _helpful(target: str, target_id: int, body: ToggleBody, authorization: Optional[str]):
    member = await _member(authorization)
    result = await _run(get_store().set_helpful, member, target, target_id, body.on)
    hub.publish(f"thread:{result['threadId']}", {"type": "helpful", "target": target, "id": target_id, "count": result["count"]})
    return result


@router.post("/threads/{thread_id}/helpful")
async def thread_helpful(thread_id: int, body: ToggleBody, authorization: Optional[str] = Header(None)):
    return await _helpful("thread", thread_id, body, authorization)


@router.post("/replies/{reply_id}/helpful")
async def reply_helpful(reply_id: int, body: ToggleBody, authorization: Optional[str] = Header(None)):
    return await _helpful("reply", reply_id, body, authorization)


@router.post("/threads/{thread_id}/report")
async def thread_report(thread_id: int, body: ReportBody, authorization: Optional[str] = Header(None)):
    return await _report("thread", thread_id, body, authorization)


@router.post("/replies/{reply_id}/report")
async def reply_report(reply_id: int, body: ReportBody, authorization: Optional[str] = Header(None)):
    return await _report("reply", reply_id, body, authorization)


async def _report(target: str, target_id: int, body: ReportBody, authorization: Optional[str]):
    member = await _member(authorization)
    result = await _run(get_store().report, member, target, target_id, body.reason)
    if result["hidden"]:
        if target == "reply":
            hub.publish(f"thread:{result['threadId']}", {"type": "reply-removed", "id": target_id})
        else:
            hub.publish(f"thread:{target_id}", {"type": "thread-removed", "threadId": target_id})
    return result


@router.post("/threads/{thread_id}/answer")
async def answer(thread_id: int, body: AnswerBody, authorization: Optional[str] = Header(None)):
    member = await _member(authorization)
    thread = await _run(get_store().set_answer, member, thread_id, body.replyId)
    hub.publish(f"thread:{thread_id}", {"type": "thread-updated", "thread": _public(thread)})
    return {"thread": thread}


@router.post("/threads/{thread_id}/going")
async def going(thread_id: int, body: ToggleBody, authorization: Optional[str] = Header(None)):
    member = await _member(authorization)
    thread = await _run(get_store().set_going, member, thread_id, body.on)
    hub.publish(f"thread:{thread_id}", {"type": "thread-updated", "thread": _public(thread)})
    return {"thread": thread}


@router.post("/threads/{thread_id}/live")
async def start_live(thread_id: int, authorization: Optional[str] = Header(None)):
    member = await _member(authorization)
    thread = await _run(get_store().start_live, member, thread_id)
    hub.publish(f"thread:{thread_id}", {"type": "thread-updated", "thread": _public(thread)})
    return {"thread": thread}


@router.delete("/threads/{thread_id}/live")
async def end_live(thread_id: int, authorization: Optional[str] = Header(None)):
    member = await _member(authorization)
    code = await _run(get_store().end_live, member, thread_id)
    if code:
        hub.publish(f"live:{code}", {"type": "live-ended"})
    thread = await _run(get_store().thread, thread_id, member)
    hub.publish(f"thread:{thread_id}", {"type": "thread-updated", "thread": _public(thread)})
    return {"ok": True}


@router.get("/live/{code}")
async def get_live(code: str, authorization: Optional[str] = Header(None)):
    viewer = await _viewer(authorization)
    for ended in await _run(get_store().purge_live):
        hub.publish(f"live:{ended}", {"type": "live-ended"})
    room = await _run(get_store().live, code, viewer)
    return {"room": room, "here": hub.count(f"live:{room['code']}")}


@router.post("/live/{code}/messages")
async def say_live(code: str, body: LiveBody, authorization: Optional[str] = Header(None)):
    member = await _member(authorization)
    result = await _run(get_store().say_live, member, code, body.text, body.input)
    hub.publish(f"live:{result['code']}", {"type": "live-message", "message": result["message"]})
    return {"message": result["message"]}


CHANNEL_RE = re.compile(r"^(feed|thread:\d{1,12}|live:\d{6})$")


@router.get("/events")
async def events(request: Request, channel: str):
    if not CHANNEL_RE.match(channel):
        raise CommunityError(400, "Unknown channel.")
    if channel.startswith("live:"):
        await _run(get_store().live, channel[5:], None)  # only open rooms can be followed
    elif channel.startswith("thread:"):
        await _run(get_store().thread, int(channel[7:]), None)

    queue = hub.subscribe(channel)

    async def stream():
        try:
            yield "retry: 3000\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=15)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    yield ": still here\n\n"
        finally:
            hub.unsubscribe(channel, queue)

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )
