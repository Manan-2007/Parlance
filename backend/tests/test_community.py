"""Community rules: who may change what, hiding after reports, live rooms."""

import unittest

from backend.community import CommunityError, CommunityStore, HIDE_AFTER_REPORTS, POSTS_PER_MINUTE

HOUR = 60 * 60 * 1000


class Clock:
    def __init__(self):
        self.now = 1_800_000_000_000

    def __call__(self):
        return self.now


class CommunityTest(unittest.TestCase):
    def setUp(self):
        self.clock = Clock()
        self.store = CommunityStore(":memory:", clock=self.clock)
        self.asha, self.asha_token = self.store.join("Asha", "Pune", ["deaf"])
        self.ravi, _ = self.store.join("Ravi", None, ["learning"])
        self.question = self.store.create_thread(
            self.asha, "rights", "question", "Where do I renew my card?", "My disability certificate expires soon. Who renews it?"
        )

    def tick(self, ms=61_000):
        self.clock.now += ms

    def assertRefused(self, status, fn, *args):
        with self.assertRaises(CommunityError) as caught:
            fn(*args)
        self.assertEqual(caught.exception.status, status, caught.exception.message)

    def test_join_returns_a_token_and_names_are_unique(self):
        self.assertEqual(self.store.member_for_token(self.asha_token)["handle"], "Asha")
        self.assertIsNone(self.store.member_for_token("not-a-token"))
        self.assertRefused(409, self.store.join, "asha")
        self.assertRefused(400, self.store.join, "<b>")
        self.assertEqual(self.store.join("आशा के")[0]["handle"], "आशा के")  # Hindi names work
        self.assertRefused(400, self.store.join, "Bad", None, ["wizard"])

    def test_only_the_author_can_edit_or_delete(self):
        thread_id = self.question["id"]
        self.assertRefused(403, self.store.edit_thread, self.ravi, thread_id, "Changed title", "Changed body text here")
        self.assertRefused(403, self.store.delete_thread, self.ravi, thread_id)
        edited = self.store.edit_thread(self.asha, thread_id, "Renewing a disability certificate", "Who renews it, and how long does it take?")
        self.assertIsNotNone(edited["editedAt"])

        reply = self.store.reply(self.ravi, thread_id, "Ask at the district hospital.")
        self.assertRefused(403, self.store.edit_reply, self.asha, reply["id"], "Not my reply")
        self.assertRefused(403, self.store.delete_reply, self.asha, reply["id"])
        self.store.delete_reply(self.ravi, reply["id"])
        self.assertEqual(self.store.thread(thread_id, None)["replies"], [])

        self.store.delete_thread(self.asha, thread_id)
        self.assertRefused(404, self.store.thread, thread_id, None)

    def test_only_the_asker_marks_the_answer(self):
        thread_id = self.question["id"]
        reply = self.store.reply(self.ravi, thread_id, "The medical board at the district hospital.")
        self.assertRefused(403, self.store.set_answer, self.ravi, thread_id, reply["id"])
        self.assertEqual(self.store.set_answer(self.asha, thread_id, reply["id"])["answerId"], reply["id"])
        self.store.delete_reply(self.ravi, reply["id"])
        self.assertIsNone(self.store.thread(thread_id, None)["answerId"])

        discussion = self.store.create_thread(self.ravi, "tech", "discussion", "Captions on calls", "Which app gives the best captions?")
        self.assertRefused(400, self.store.set_answer, self.ravi, discussion["id"], None)

    def test_helpful_is_one_per_person_and_never_your_own(self):
        thread_id = self.question["id"]
        self.assertRefused(403, self.store.set_helpful, self.asha, "thread", thread_id, True)
        self.store.set_helpful(self.ravi, "thread", thread_id, True)
        self.assertEqual(self.store.set_helpful(self.ravi, "thread", thread_id, True)["count"], 1)
        self.assertTrue(self.store.thread(thread_id, self.ravi)["myHelpful"])
        self.assertEqual(self.store.set_helpful(self.ravi, "thread", thread_id, False)["count"], 0)

    def test_reports_hide_a_post_after_several_people(self):
        thread_id = self.question["id"]
        self.assertRefused(400, self.store.report, self.asha, "thread", thread_id, "spam")
        reporters = [self.store.join(f"Reporter {i}")[0] for i in range(HIDE_AFTER_REPORTS)]
        for reporter in reporters[:-1]:
            self.assertFalse(self.store.report(reporter, "thread", thread_id, "spam")["hidden"])
        # Reporting twice counts once.
        self.assertFalse(self.store.report(reporters[0], "thread", thread_id, "rude")["hidden"])
        self.assertTrue(self.store.report(reporters[-1], "thread", thread_id, "spam")["hidden"])
        self.assertRefused(404, self.store.thread, thread_id, self.ravi)
        self.assertEqual(self.store.thread(thread_id, self.asha)["hidden"], True)  # the author still sees it
        self.assertEqual(self.store.threads(None, "rights"), [])

    def test_posting_too_fast_is_slowed_down(self):
        for i in range(POSTS_PER_MINUTE - 1):  # the question in setUp was the first post
            self.store.reply(self.asha, self.question["id"], f"Update number {i}")
        self.assertRefused(429, self.store.reply, self.asha, self.question["id"], "One more")
        self.tick()
        self.store.reply(self.asha, self.question["id"], "After a minute it works again")

    def test_lists_filter_and_search(self):
        self.tick()
        self.store.create_thread(self.ravi, "tech", "discussion", "Phones with good captions", "Which phone shows live captions well?")
        self.assertEqual([t["space"] for t in self.store.threads(None, "tech")], ["tech"])
        self.assertEqual(len(self.store.threads(None, sort="unanswered")), 1)
        self.assertEqual(self.store.threads(None, q="captions")[0]["title"], "Phones with good captions")
        self.assertEqual(self.store.threads(None, q="100%_"), [])
        self.assertRefused(404, self.store.threads, None, "nowhere")
        spaces = {s["id"]: s["threads"] for s in self.store.spaces()}
        self.assertEqual((spaces["rights"], spaces["tech"], spaces["work"]), (1, 1, 0))

    def meetup(self, starts_in=30 * 60 * 1000, length=2 * HOUR):
        starts = self.clock.now + starts_in
        return self.store.create_thread(
            self.asha, "meetups", "meetup", "ISL coffee morning", "Come and sign with us.",
            meetup={"place": "City park gate", "city": "Pune", "startsAt": starts, "endsAt": starts + length},
        )

    def test_meetups_check_their_times(self):
        self.assertRefused(400, self.store.create_thread, self.asha, "meetups", "meetup", "No time", "Body", "typed", {"place": "Park", "city": "Pune"})
        self.assertRefused(400, self.meetup, -2 * HOUR)
        self.assertRefused(400, self.meetup, HOUR, 13 * HOUR)
        meetup = self.meetup()
        self.assertEqual(meetup["meetup"]["going"], 1)
        self.assertTrue(self.store.set_going(self.ravi, meetup["id"], True)["meetup"]["imGoing"])
        self.assertEqual(self.store.threads(None, sort="meetups")[0]["id"], meetup["id"])

    def test_live_room_belongs_to_the_host_and_ends_with_the_meetup(self):
        far = self.meetup(starts_in=3 * HOUR)
        self.assertRefused(400, self.store.start_live, self.asha, far["id"])  # opens an hour before

        meetup = self.meetup()
        self.assertRefused(403, self.store.start_live, self.ravi, meetup["id"])
        started = self.store.start_live(self.asha, meetup["id"])
        code = started["meetup"]["code"]
        self.assertRegex(code, r"^\d{6}$")
        # Only the host sees the code; others must be there to get it.
        self.assertIsNone(self.store.thread(meetup["id"], self.ravi)["meetup"]["code"])
        self.assertTrue(self.store.thread(meetup["id"], self.ravi)["meetup"]["live"])

        self.store.say_live(self.ravi, f"{code[:3]} {code[3:]}", "Hello from the table by the window")
        room = self.store.live(code, self.asha)
        self.assertTrue(room["isHost"])
        self.assertEqual([m["text"] for m in room["messages"]], ["Hello from the table by the window"])
        self.assertRefused(404, self.store.live, "000000" if code != "000000" else "111111", None)
        self.assertRefused(400, self.store.live, "12", None)

        self.clock.now = meetup["meetup"]["endsAt"]
        self.assertEqual(self.store.purge_live(), [code])
        self.assertRefused(404, self.store.live, code, None)
        count = self.store.db.execute("SELECT COUNT(*) FROM live_messages").fetchone()[0]
        self.assertEqual(count, 0)

    def test_the_host_can_end_the_room_early(self):
        meetup = self.meetup()
        code = self.store.start_live(self.asha, meetup["id"])["meetup"]["code"]
        self.store.say_live(self.asha, code, "Welcome")
        self.assertRefused(403, self.store.end_live, self.ravi, meetup["id"])
        self.assertEqual(self.store.end_live(self.asha, meetup["id"]), code)
        self.assertRefused(404, self.store.live, code, None)

    def test_sample_content_seeds_once(self):
        seeded = CommunityStore(":memory:", seed=True)
        threads = seeded.threads(None)
        self.assertGreaterEqual(len(threads), 7)
        self.assertTrue(all(t["author"]["sample"] for t in threads))
        self.assertTrue(any(t["answerId"] for t in threads))
        self.assertEqual(len(seeded.threads(None, sort="meetups")), 2)


if __name__ == "__main__":
    unittest.main()
