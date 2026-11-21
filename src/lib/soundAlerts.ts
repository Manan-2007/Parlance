/**
 * Which everyday sounds Parlance can alert to, and how YAMNet's AudioSet
 * labels (public/models/yamnet.tflite) map onto them. Pure: tested in node.
 */

export interface SoundGroup {
  id: string;
  label: string;
  /** Short words for the full-screen alert. */
  alert: string;
  hi: string;
  /** YAMNet label names, exactly as in the model's label list. */
  labels: string[];
  /** Score needed at normal sensitivity. */
  threshold: number;
  /** On by default. */
  defaultOn: boolean;
  /** Repeat and pulse harder for sounds that mean danger. */
  urgent?: boolean;
}

export const SOUND_GROUPS: SoundGroup[] = [
  { id: "door", label: "Doorbell or knocking", alert: "Someone's at the door", hi: "दरवाज़े पर कोई है", labels: ["Doorbell", "Ding-dong", "Knock"], threshold: 0.3, defaultOn: true },
  { id: "alarm", label: "Smoke or fire alarm", alert: "Alarm", hi: "अलार्म बज रहा है", labels: ["Smoke detector, smoke alarm", "Fire alarm", "Alarm", "Buzzer"], threshold: 0.3, defaultOn: true, urgent: true },
  { id: "siren", label: "Siren", alert: "Siren nearby", hi: "पास में सायरन", labels: ["Siren", "Civil defense siren", "Police car (siren)", "Ambulance (siren)", "Fire engine, fire truck (siren)", "Emergency vehicle"], threshold: 0.35, defaultOn: true, urgent: true },
  { id: "baby", label: "Baby crying", alert: "Baby crying", hi: "बच्चा रो रहा है", labels: ["Baby cry, infant cry", "Crying, sobbing"], threshold: 0.35, defaultOn: true },
  { id: "whistle", label: "Pressure cooker or kettle whistle", alert: "Cooker whistle", hi: "कुकर की सीटी", labels: ["Whistle", "Steam whistle", "Whistling", "Steam"], threshold: 0.35, defaultOn: true },
  { id: "phone", label: "Phone ringing", alert: "Phone ringing", hi: "फ़ोन बज रहा है", labels: ["Telephone bell ringing", "Ringtone", "Telephone"], threshold: 0.35, defaultOn: true },
  { id: "clock", label: "Alarm clock", alert: "Alarm clock", hi: "अलार्म घड़ी", labels: ["Alarm clock", "Beep, bleep"], threshold: 0.4, defaultOn: false },
  { id: "shout", label: "Someone shouting", alert: "Someone is shouting", hi: "कोई चिल्ला रहा है", labels: ["Shout", "Yell", "Screaming", "Children shouting"], threshold: 0.4, defaultOn: false, urgent: true },
  { id: "horn", label: "Vehicle horn", alert: "Horn", hi: "हॉर्न", labels: ["Vehicle horn, car horn, honking", "Air horn, truck horn", "Toot", "Train horn", "Car alarm"], threshold: 0.4, defaultOn: false },
  { id: "dog", label: "Dog barking", alert: "Dog barking", hi: "कुत्ता भौंक रहा है", labels: ["Bark", "Dog"], threshold: 0.45, defaultOn: false },
  { id: "glass", label: "Glass breaking", alert: "Glass breaking", hi: "काँच टूटा", labels: ["Shatter"], threshold: 0.35, defaultOn: false, urgent: true },
  { id: "water", label: "Tap left running", alert: "Water running", hi: "नल खुला है", labels: ["Water tap, faucet", "Sink (filling or washing)"], threshold: 0.5, defaultOn: false },
];

export type Sensitivity = "low" | "normal" | "high";

const SCALE: Record<Sensitivity, number> = { low: 1.35, normal: 1, high: 0.7 };

export interface Category {
  categoryName: string;
  score: number;
}

/** Groups heard in one classification, with the best score for each. */
export function matchGroups(categories: readonly Category[], enabled: ReadonlySet<string>, sensitivity: Sensitivity): { id: string; score: number }[] {
  const hits = new Map<string, number>();
  for (const group of SOUND_GROUPS) {
    if (!enabled.has(group.id)) continue;
    const limit = Math.min(0.95, group.threshold * SCALE[sensitivity]);
    for (const category of categories) {
      if (category.score >= limit && group.labels.includes(category.categoryName)) {
        hits.set(group.id, Math.max(hits.get(group.id) ?? 0, category.score));
      }
    }
  }
  return [...hits].map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score);
}

/** The most likely thing heard, for the "listening now" line. */
export function topSound(categories: readonly Category[]): Category | null {
  return [...categories].sort((a, b) => b.score - a.score)[0] ?? null;
}

export const DEFAULT_GROUPS = SOUND_GROUPS.filter((g) => g.defaultOn).map((g) => g.id);
