/**
 * The Learn curriculum: units built around situations where a hearing person
 * meets a Deaf person, not around the alphabet.
 *
 * Every sign is an ISLRTC dictionary gloss with a landmark recording in
 * public/signs/ (checked by test/learn.test.js). Phrases are written in ISL
 * gloss order using the grammar rules below, which are the well-attested core
 * of ISL syntax (ISLRTC teaching material; Zeshan 2003, "Indian Sign Language:
 * sociolinguistic and grammatical features"): time first, verb last, question
 * words last, negation after what it negates, no copula or articles, and
 * yes/no questions marked on the face.
 *
 * Phrase glosses are the signs a learner can practise here. They are not a
 * claim that this is the only way to sign the sentence.
 */

export type GrammarRule = "wh-last" | "time-first" | "verb-last" | "no-copula" | "negation-after" | "yes-no-face";

export const GRAMMAR_RULES: Record<GrammarRule, { title: string; body: string }> = {
  "wh-last": {
    title: "Question words go last",
    body: "WHAT, WHERE, WHO, WHEN, WHY and HOW MUCH come at the end of an ISL sentence, usually with your eyebrows drawn together.",
  },
  "time-first": {
    title: "Time comes first",
    body: "Say when before what: YESTERDAY I HOME GO. ISL marks past and future with time signs, not by changing the verb.",
  },
  "verb-last": {
    title: "The verb goes at the end",
    body: "ISL is usually subject, object, verb: I WATER WANT, not I WANT WATER.",
  },
  "no-copula": {
    title: "No 'is', 'am', 'are' or 'the'",
    body: "ISL has no signs for these. 'I am deaf' is simply I DEAF.",
  },
  "negation-after": {
    title: "NO follows what it negates",
    body: "Put the negation after the verb, and shake your head while you sign it: I UNDERSTAND NO.",
  },
  "yes-no-face": {
    title: "Yes/no questions are on your face",
    body: "Keep the word order of a statement and raise your eyebrows, leaning slightly forward. The face is the grammar here.",
  },
};

export interface Phrase {
  id: string;
  english: string;
  /** Word-for-word reading of the gloss, when it helps. */
  literal?: string;
  glosses: string[];
  rules: GrammarRule[];
}

export interface DialogueLine {
  who: "they" | "you";
  english: string;
  glosses: string[];
  rules?: GrammarRule[];
}

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  signs: string[];
  /** Phrase ids practised at the end of this lesson. */
  phrases?: string[];
}

export type UnitIcon = "hand" | "ear" | "stethoscope" | "siren" | "clock" | "shopping";

export interface Unit {
  id: string;
  title: string;
  tagline: string;
  situation: string;
  icon: UnitIcon;
  lessons: Lesson[];
  phrases: Phrase[];
  /** A short role-play that closes the unit. */
  dialogue?: { title: string; setting: string; lines: DialogueLine[] };
  etiquette: { title: string; points: string[] };
}

export const UNITS: Unit[] = [
  {
    id: "first-conversation",
    title: "Your first conversation",
    tagline: "Greet someone, say who you are, and be polite.",
    situation: "You meet a Deaf colleague, neighbour or customer for the first time.",
    icon: "hand",
    lessons: [
      { id: "greetings", title: "Greetings", summary: "Open and close a conversation.", signs: ["hello", "goodmorning", "welcome", "thankyou", "goodbye"], phrases: ["thanks-bye"] },
      { id: "about-me", title: "About me", summary: "Who you are and what you are doing.", signs: ["i", "you", "deaf", "signlanguage", "learn"], phrases: ["i-deaf", "i-learn-isl"] },
      { id: "manners", title: "Being polite", summary: "The small words that keep a conversation going.", signs: ["please", "sorry", "yes", "no", "name", "what"], phrases: ["your-name"] },
    ],
    phrases: [
      { id: "thanks-bye", english: "Thank you, goodbye.", glosses: ["thankyou", "goodbye"], rules: [] },
      { id: "i-deaf", english: "I am deaf.", literal: "I deaf", glosses: ["i", "deaf"], rules: ["no-copula"] },
      { id: "i-learn-isl", english: "I am learning sign language.", literal: "I sign language learn", glosses: ["i", "signlanguage", "learn"], rules: ["verb-last", "no-copula"] },
      { id: "your-name", english: "What is your name?", literal: "you name what", glosses: ["you", "name", "what"], rules: ["wh-last", "no-copula"] },
    ],
    dialogue: {
      title: "Meeting someone new",
      setting: "A Deaf visitor comes up to your desk.",
      lines: [
        { who: "they", english: "Hello, good morning!", glosses: ["hello", "goodmorning"] },
        { who: "you", english: "Good morning, welcome.", glosses: ["goodmorning", "welcome"] },
        { who: "they", english: "I am deaf.", glosses: ["i", "deaf"], rules: ["no-copula"] },
        { who: "you", english: "I am learning sign language.", glosses: ["i", "signlanguage", "learn"], rules: ["verb-last"] },
        { who: "they", english: "Thank you!", glosses: ["thankyou"] },
      ],
    },
    etiquette: {
      title: "Getting someone's attention",
      points: [
        "Tap a shoulder or upper arm lightly, or wave where the person can see you. Calling their name will not work.",
        "Face the person and keep eye contact while you sign or talk: it shows you are paying attention.",
        "If you are speaking too, talk normally. Shouting or over-mouthing makes your face harder to read.",
      ],
    },
  },
  {
    id: "understanding",
    title: "Understanding each other",
    tagline: "What to do when you don't understand, and other ways to talk.",
    situation: "The conversation gets stuck. These signs keep it going instead of giving up.",
    icon: "ear",
    lessons: [
      { id: "repair", title: "When you don't understand", summary: "Ask for it again, slower.", signs: ["understand", "dontknow", "again", "slow", "wait"], phrases: ["i-not-understand", "again-please"] },
      { id: "other-ways", title: "Other ways to talk", summary: "Writing, interpreters and hearing aids.", signs: ["write", "interpreter", "hearingaid", "speak", "show"], phrases: ["want-interpreter", "wait-i-write"] },
    ],
    phrases: [
      { id: "i-not-understand", english: "I don't understand.", literal: "I understand no", glosses: ["i", "understand", "no"], rules: ["negation-after"] },
      { id: "again-please", english: "Again, please.", glosses: ["again", "please"], rules: [] },
      { id: "want-interpreter", english: "Do you want an interpreter?", literal: "you interpreter want", glosses: ["you", "interpreter", "want"], rules: ["verb-last", "yes-no-face"] },
      { id: "wait-i-write", english: "Wait, I will write it.", literal: "wait, I write", glosses: ["wait", "i", "write"], rules: ["verb-last"] },
    ],
    dialogue: {
      title: "Getting back on track",
      setting: "You missed what someone signed.",
      lines: [
        { who: "they", english: "Do you understand?", glosses: ["you", "understand"], rules: ["yes-no-face"] },
        { who: "you", english: "Sorry, I don't understand. Again, please.", glosses: ["sorry", "i", "understand", "no", "again", "please"], rules: ["negation-after"] },
        { who: "they", english: "Do you want an interpreter?", glosses: ["you", "interpreter", "want"], rules: ["yes-no-face"] },
        { who: "you", english: "Wait, I will write it.", glosses: ["wait", "i", "write"], rules: ["verb-last"] },
      ],
    },
    etiquette: {
      title: "Interpreters, writing and lip-reading",
      points: [
        "With an interpreter, look at and speak to the Deaf person, not the interpreter. Say 'Do you want…', never 'Ask her if…'.",
        "Writing or typing on a phone is a fine backup. Ask which the person prefers; don't assume.",
        "Don't rely on lip-reading: much of speech is invisible on the lips. Keep your mouth uncovered anyway.",
      ],
    },
  },
  {
    id: "clinic",
    title: "At the clinic",
    tagline: "Ask where it hurts, and explain what happens next.",
    situation: "You work at a reception desk, pharmacy or ward and a Deaf patient arrives.",
    icon: "stethoscope",
    lessons: [
      { id: "feeling", title: "How do you feel?", summary: "Pain, fever and common symptoms.", signs: ["pain", "sick", "fever", "headache", "cough"], phrases: ["pain-where"] },
      { id: "care", title: "Getting care", summary: "The people and things in a clinic.", signs: ["doctor", "nurse", "medicine", "hospital", "injection"], phrases: ["doctor-come"] },
      { id: "when-where", title: "Where and when", summary: "Point to the body and the time of day.", signs: ["where", "stomach", "today", "morning", "night"], phrases: ["stomach-pain", "night-medicine"] },
    ],
    phrases: [
      { id: "pain-where", english: "Where is the pain?", literal: "pain where", glosses: ["pain", "where"], rules: ["wh-last", "no-copula"] },
      { id: "doctor-come", english: "The doctor is coming.", literal: "doctor come", glosses: ["doctor", "come"], rules: ["no-copula"] },
      { id: "stomach-pain", english: "My stomach hurts.", literal: "stomach pain", glosses: ["stomach", "pain"], rules: ["no-copula"] },
      { id: "night-medicine", english: "Take the medicine at night.", literal: "night medicine take", glosses: ["night", "medicine", "take"], rules: ["time-first", "verb-last"] },
    ],
    dialogue: {
      title: "At reception",
      setting: "A Deaf patient walks up to the desk holding their side.",
      lines: [
        { who: "you", english: "Hello. Where is the pain?", glosses: ["hello", "pain", "where"], rules: ["wh-last"] },
        { who: "they", english: "My stomach hurts.", glosses: ["stomach", "pain"] },
        { who: "you", english: "Do you have a fever?", glosses: ["you", "fever"], rules: ["yes-no-face"] },
        { who: "they", english: "Yes.", glosses: ["yes"] },
        { who: "you", english: "The doctor is coming. Please wait.", glosses: ["doctor", "come", "wait", "please"] },
      ],
    },
    etiquette: {
      title: "Healthcare, clearly",
      points: [
        "For diagnosis, consent and medication, a qualified ISL interpreter is the safe choice. Use signs to welcome, reassure and handle the simple parts.",
        "Show, don't just tell: point to the body part, the form, the medicine.",
        "Check understanding by asking the person to show you, not by asking 'Do you understand?'.",
      ],
    },
  },
  {
    id: "emergency",
    title: "Emergency",
    tagline: "Get help fast, and keep someone calm.",
    situation: "Something has gone wrong and seconds matter.",
    icon: "siren",
    lessons: [
      { id: "ask-help", title: "Asking for help", summary: "Call for the right help.", signs: ["help", "emergency", "police", "ambulance", "call"], phrases: ["call-ambulance"] },
      { id: "stay-safe", title: "Staying safe", summary: "Warn someone about danger.", signs: ["fire", "accident", "danger", "careful", "stop"], phrases: ["fire-where", "help-come"] },
    ],
    phrases: [
      { id: "call-ambulance", english: "I am calling an ambulance.", literal: "I ambulance call", glosses: ["i", "ambulance", "call"], rules: ["verb-last", "no-copula"] },
      { id: "fire-where", english: "Where is the fire?", literal: "fire where", glosses: ["fire", "where"], rules: ["wh-last"] },
      { id: "help-come", english: "Help is coming.", literal: "help come", glosses: ["help", "come"], rules: ["no-copula"] },
    ],
    dialogue: {
      title: "On the street",
      setting: "A Deaf person waves you down after a bike crash.",
      lines: [
        { who: "they", english: "Help! An accident!", glosses: ["help", "accident"] },
        { who: "you", english: "I am calling an ambulance.", glosses: ["i", "ambulance", "call"], rules: ["verb-last"] },
        { who: "they", english: "Thank you.", glosses: ["thankyou"] },
        { who: "you", english: "Wait, help is coming.", glosses: ["wait", "help", "come"] },
      ],
    },
    etiquette: {
      title: "When it is urgent",
      points: [
        "If signing fails, write, type, point and draw. Getting the message across matters more than the language.",
        "Flicking a light on and off quickly can signal an emergency in a room. Use it only when it is one.",
        "Stay where the person can see your face and hands; a Deaf person cannot hear you calling from behind.",
      ],
    },
  },
  {
    id: "numbers-time",
    title: "Numbers and time",
    tagline: "Count to ten and say when.",
    situation: "Prices, ages, tokens, appointment times: numbers come up in almost every exchange.",
    icon: "clock",
    lessons: [
      { id: "one-five", title: "One to five", summary: "The first five numbers.", signs: ["one", "two", "three", "four", "five"] },
      { id: "six-ten", title: "Six to ten", summary: "Up to ten.", signs: ["six", "seven", "eight", "nine", "ten"] },
      { id: "when", title: "When?", summary: "Time signs come first in a sentence.", signs: ["today", "yesterday", "now", "week", "time"], phrases: ["yesterday-home", "time-what"] },
    ],
    phrases: [
      { id: "yesterday-home", english: "I went home yesterday.", literal: "yesterday I home go", glosses: ["yesterday", "i", "home", "go"], rules: ["time-first", "verb-last"] },
      { id: "time-what", english: "What time is it?", literal: "time what", glosses: ["time", "what"], rules: ["wh-last", "no-copula"] },
    ],
    etiquette: {
      title: "Regional signs",
      points: [
        "ISL has regional variation, numbers included. Parlance teaches the ISLRTC dictionary form, the national reference.",
        "If the person you are talking to signs something differently, follow them. They are the expert in their language.",
      ],
    },
  },
  {
    id: "out-and-about",
    title: "Out and about",
    tagline: "Food, shopping and getting around.",
    situation: "At a shop counter, a ticket window or a canteen.",
    icon: "shopping",
    lessons: [
      { id: "needs", title: "Everyday needs", summary: "Water, food and the toilet.", signs: ["water", "food", "eat", "toilet", "hungry"], phrases: ["want-water", "toilet-where"] },
      { id: "shopping", title: "Shopping", summary: "Ask and talk about prices.", signs: ["shop", "money", "howmuch", "expensive", "cheap"], phrases: ["this-howmuch"] },
      { id: "travel", title: "Getting around", summary: "Buses, trains and tickets.", signs: ["bus", "train", "ticket", "station", "late"], phrases: ["bus-late"] },
    ],
    phrases: [
      { id: "want-water", english: "I want water.", literal: "I water want", glosses: ["i", "water", "want"], rules: ["verb-last"] },
      { id: "toilet-where", english: "Where is the toilet?", literal: "toilet where", glosses: ["toilet", "where"], rules: ["wh-last", "no-copula"] },
      { id: "this-howmuch", english: "How much is this?", literal: "this how much", glosses: ["this", "howmuch"], rules: ["wh-last", "no-copula"] },
      { id: "bus-late", english: "The bus is late.", literal: "bus late", glosses: ["bus", "late"], rules: ["no-copula"] },
    ],
    dialogue: {
      title: "At the canteen",
      setting: "A Deaf customer is at your counter.",
      lines: [
        { who: "you", english: "Do you want water?", glosses: ["you", "water", "want"], rules: ["yes-no-face", "verb-last"] },
        { who: "they", english: "Yes. Where is the toilet?", glosses: ["yes", "toilet", "where"], rules: ["wh-last"] },
        { who: "you", english: "There.", glosses: ["there"] },
        { who: "they", english: "Thank you!", glosses: ["thankyou"] },
      ],
    },
    etiquette: {
      title: "At a counter",
      points: [
        "Keep a pen and paper or your phone's notes app handy: pointing at a written price is quick and clear.",
        "Stand where your face is lit and visible. A bright window behind you turns your face into a silhouette.",
      ],
    },
  },
];

export const ETIQUETTE_SOURCE =
  "General Deaf-awareness guidance (for example the Massachusetts Commission for the Deaf and Hard of Hearing). Customs vary between people and communities: when in doubt, ask.";

export const CONVERSATION_LESSON_ID = "conversation";

export function getUnit(id: string): Unit | undefined {
  return UNITS.find((unit) => unit.id === id);
}

export function getPhrase(unit: Unit, id: string): Phrase | undefined {
  return unit.phrases.find((phrase) => phrase.id === id);
}

/** Every lesson id in a unit, including the closing conversation when there is one. */
export function lessonIds(unit: Unit): string[] {
  const ids = unit.lessons.map((lesson) => lesson.id);
  if (unit.dialogue) ids.push(CONVERSATION_LESSON_ID);
  return ids;
}

/** Stable, globally unique key for progress: "<unit>/<lesson>". */
export function lessonKey(unitId: string, lessonId: string): string {
  return `${unitId}/${lessonId}`;
}

/** All glosses taught anywhere in the curriculum, in teaching order, without repeats. */
export function curriculumGlosses(): string[] {
  const seen = new Set<string>();
  for (const unit of UNITS) {
    for (const lesson of unit.lessons) for (const gloss of lesson.signs) seen.add(gloss);
  }
  return [...seen];
}
