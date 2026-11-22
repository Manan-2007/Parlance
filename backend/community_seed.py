"""Sample Community content for a new database, so a demo never starts empty.

Every sample member is flagged `sample`, and the app labels their posts
"Sample". The posts describe experiences and point people to the official
source; they do not state rules or legal facts. Set
PARLANCE_COMMUNITY_SEED=0 to start with an empty Community instead.
"""

from __future__ import annotations

HOUR = 60 * 60 * 1000
DAY = 24 * HOUR

MEMBERS = {
    "aarav": ("Aarav_signs", "Pune", ["deaf"]),
    "meera": ("Meera K", "Bengaluru", ["hard-of-hearing"]),
    "ishaan": ("Ishaan D", "Delhi", ["deaf"]),
    "fatima": ("Fatima R", "Hyderabad", ["family"]),
    "kavya": ("Kavya learns", "Mumbai", ["learning"]),
    "joseph": ("Joseph T", "Kochi", ["deaf", "teacher"]),
}

# (author, space, kind, title, body, hours ago, [(author, reply, hours ago)], answer index)
THREADS = [
    (
        "ishaan", "rights", "question",
        "How long did your UDID card take to arrive?",
        "I applied online for my UDID card about two months ago. The status still says it is waiting for the medical board. "
        "Did anyone have to go to the hospital in person? What did you take with you, and how did you talk to the staff there?",
        70,
        [
            ("meera", "Mine needed a hospital visit for the hearing test. I took my Aadhaar, a passport photo and copies of my old reports. "
                      "Ask for a copy of the test report before you leave, it saved me a second trip.", 66),
            ("fatima", "I went with my brother. We wrote our questions on paper before going, and he showed them at each counter. "
                       "The Parlance visit card also works for this: symptoms, papers and questions in one place.", 60),
            ("joseph", "Mine took about three months. When the status did not change, I emailed the district office with my application number. "
                       "Check the official UDID website for the right contact for your district.", 41),
        ],
        0,
    ),
    (
        "aarav", "work", "discussion",
        "Telling an employer you are Deaf: before or after the interview?",
        "I always worry about this. If I say it on the application, sometimes I get no call. If I say it at the interview, they look surprised "
        "and the whole interview is about my hearing, not my work. I work in accounts. What has worked for you?",
        52,
        [
            ("ishaan", "I write one line in my cover letter about how I work best: email and chat for quick things, captions or an interpreter for meetings. "
                       "Companies that have a problem with that line would have been a problem later anyway.", 49),
            ("meera", "I ask for the interview on a video call with captions turned on. It shows I know what I need, and they see it working before they decide.", 31),
            ("kavya", "Hearing person here, I hire for a small team. Telling us early helped us book an interpreter. Please do not feel you must hide it.", 12),
        ],
        None,
    ),
    (
        "fatima", "study", "question",
        "Extra time or a scribe in Class 12 exams: where do we ask?",
        "My younger sister is Deaf and has her Class 12 board exams next year. Her school says it is not sure what support she can get. "
        "Who did you ask, and how early?",
        30,
        [
            ("joseph", "I teach at a school for Deaf students. Write to your exam board directly and keep a copy of the letter and the reply. "
                       "The rules differ between boards and change, so the board's own answer is the one that counts. Start at least six months before.", 27),
            ("aarav", "Also ask if the question paper instructions can be given in writing. Spoken instructions at the start of the exam caused me problems.", 20),
        ],
        0,
    ),
    (
        "kavya", "learn-isl", "discussion",
        "Same word, different signs: what is WATER in your city?",
        "I am learning ISL from the dictionary videos, but my Deaf colleague from Kolkata signs some words differently. "
        "Let's collect regional signs here. Say your city and describe how you sign WATER.",
        26,
        [
            ("ishaan", "Delhi: the same as the ISLRTC dictionary for WATER. For DRINK we add a small tilt like holding a glass.", 24),
            ("joseph", "Kochi: my students use the dictionary sign, but older people here often use a local sign. Both are right. Learn the one people around you use.", 18),
        ],
        None,
    ),
    (
        "meera", "tech", "discussion",
        "What do you use to follow video calls at work?",
        "Live captions in video call apps are fine for clear English, but my team speaks Hinglish fast and the captions get lost. "
        "What setup works for you? Two screens? A second phone with captions?",
        20,
        [
            ("aarav", "I ask for an agenda before the call and a written summary after. Captions for the middle part, and I ask people to type key numbers in the chat.", 16),
            ("kavya", "We started saying our name before speaking in calls with our Deaf colleague. Small thing, big difference for following who is talking.", 9),
        ],
        None,
    ),
    (
        "joseph", "family", "discussion",
        "My parents still do not sign. How did you get your family to learn?",
        "I am 34 and my parents still use gestures and lip reading with me. I want proper conversations with them. "
        "Did anyone's family start learning as adults? What helped them keep going?",
        14,
        [
            ("fatima", "My parents are Deaf, so it was the other way round for me. What worked for my hearing aunt: ten signs a week about food and family, practised at dinner.", 11),
            ("meera", "My mother learned with the Learn tab in Parlance, five minutes a day. Signs for the things she says every day came first, like EAT and SLEEP.", 6),
        ],
        None,
    ),
    (
        "aarav", "health", "question",
        "Explaining symptoms at a clinic without an interpreter",
        "Last week the doctor kept talking to my mother instead of me. I am an adult. How do you make sure the doctor talks to you, "
        "and how do you explain symptoms clearly when there is no interpreter?",
        8,
        [
            ("ishaan", "I write my symptoms before going: when it started, where it hurts, what makes it worse, medicines I take. "
                       "I hand it to the doctor first and say 'please write or type your answers to me'.", 5),
        ],
        None,
    ),
]

MEETUPS = [
    (
        "ishaan", "ISL coffee morning", "Lodhi Garden, main gate", "Delhi", 2 * DAY + 3 * HOUR, 3 * HOUR,
        "A relaxed morning for Deaf people, families and learners. No speaking needed. Beginners are welcome; bring a friend who wants to learn.",
    ),
    (
        "joseph", "Job interview practice in ISL", "Public library reading room", "Kochi", 5 * DAY + 5 * HOUR, 2 * HOUR,
        "Practise answering common interview questions in pairs, with feedback from people who work in offices. Bring your CV if you like.",
    ),
]


def seed_community(store) -> None:
    real_clock = store.clock
    now = real_clock()
    members = {}
    for key, (handle, city, ways) in MEMBERS.items():
        store.clock = lambda: now - 90 * DAY
        members[key], _token = store.join(handle, city, ways, sample=True)

    try:
        for author, space, kind, title, body, hours, replies, answer in THREADS:
            store.clock = lambda h=hours: now - h * HOUR
            thread = store.create_thread(members[author], space, kind, title, body)
            store.recent.clear()
            reply_ids = []
            for reply_author, text, reply_hours in replies:
                store.clock = lambda h=reply_hours: now - h * HOUR
                reply_ids.append(store.reply(members[reply_author], thread["id"], text)["id"])
                store.recent.clear()
            for helper in ("meera", "kavya", "joseph")[: max(1, len(replies) - 1)]:
                if reply_ids and helper != replies[0][0]:
                    store.set_helpful(members[helper], "reply", reply_ids[0], True)
            if answer is not None and reply_ids:
                store.set_answer(members[author], thread["id"], reply_ids[answer])

        store.clock = real_clock
        for host, title, place, city, starts_in, length, body in MEETUPS:
            starts = now + starts_in
            starts -= starts % HOUR
            store.create_thread(
                members[host], "meetups", "meetup", title, body,
                meetup={"place": place, "city": city, "startsAt": starts, "endsAt": starts + length},
            )
            store.recent.clear()
    finally:
        store.clock = real_clock
        store.recent.clear()
