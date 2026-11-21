/**
 * Ready-made cards a Deaf person shows to hearing staff, and the replies staff
 * can tap back. Every line has English and Hindi, because the person reading
 * the card at an Indian counter may read either.
 *
 * Hindi is written to avoid gendered verb endings, so one card works for anyone.
 */
import type { LucideIcon } from "lucide-react";
import { Ambulance, Building2, CarTaxiFront, Pill, ShieldAlert, ShoppingBag, Siren, TrainFront } from "lucide-react";

export interface Line {
  en: string;
  hi: string;
}

/** A card can carry a blank the user fills in before showing it. */
export interface CardDef extends Line {
  id: string;
  fill?: { label: string; placeholder: string };
  /** Filled from the user's "About me" details. */
  profile?: "contact" | "allergies" | "medicines" | "conditions";
}

export interface Place {
  id: string;
  title: string;
  /** Who you show it to, in the person's own words. */
  hint: string;
  icon: LucideIcon;
  cards: CardDef[];
  replies: Line[];
}

export const DEAF_CARD: CardDef = {
  id: "deaf",
  en: "I am Deaf. Please write, type or show me.",
  hi: "मैं बधिर हूँ। कृपया लिखकर, टाइप करके या इशारे से बताइए।",
};

const COMMON_REPLIES: Line[] = [
  { en: "Yes.", hi: "हाँ।" },
  { en: "No.", hi: "नहीं।" },
  { en: "Please wait here.", hi: "कृपया यहाँ इंतज़ार कीजिए।" },
];

export const EMERGENCY: Place = {
  id: "emergency",
  title: "Emergency",
  hint: "Show anyone nearby",
  icon: Siren,
  cards: [
    { id: "help", en: "I am Deaf. I need help.", hi: "मैं बधिर हूँ। मुझे मदद चाहिए।" },
    { id: "ambulance", en: "Please call an ambulance: 108.", hi: "कृपया एम्बुलेंस बुलाइए: 108" },
    { id: "police", en: "Please call the police: 112.", hi: "कृपया पुलिस को बुलाइए: 112" },
    { id: "contact", en: "Please call my emergency contact.", hi: "कृपया मेरे आपातकालीन संपर्क को फ़ोन कीजिए।", profile: "contact" },
    { id: "hurt", en: "I am hurt.", hi: "मुझे चोट लगी है।" },
    { id: "accident", en: "I have been in an accident.", hi: "मेरे साथ दुर्घटना हुई है।" },
    { id: "fire", en: "There is a fire. Call 101.", hi: "आग लगी है। 101 पर फ़ोन कीजिए।" },
    { id: "lost", en: "I am lost. Please help me get to this address.", hi: "मुझे रास्ता नहीं मिल रहा। कृपया इस पते तक पहुँचने में मदद कीजिए।", fill: { label: "Address", placeholder: "Where you need to go" } },
    { id: "alarm", en: "I cannot hear alarms or announcements. Please write what is happening.", hi: "मुझे अलार्म या घोषणाएँ सुनाई नहीं देतीं। कृपया लिखकर बताइए कि क्या हो रहा है।" },
    { id: "medical", en: "My medical details are below.", hi: "मेरी चिकित्सा जानकारी नीचे है।", profile: "conditions" },
  ],
  replies: [
    { en: "Help is coming.", hi: "मदद आ रही है।" },
    { en: "Stay here.", hi: "यहीं रहिए।" },
    { en: "Are you hurt?", hi: "क्या आपको चोट लगी है?" },
    { en: "Where does it hurt?", hi: "कहाँ दर्द हो रहा है?" },
    { en: "Come with me.", hi: "मेरे साथ आइए।" },
    { en: "You are safe now.", hi: "अब आप सुरक्षित हैं।" },
    { en: "Show me your phone or ID.", hi: "अपना फ़ोन या पहचान पत्र दिखाइए।" },
    { en: "I have called for help.", hi: "मैंने मदद के लिए फ़ोन कर दिया है।" },
  ],
};

export const PLACES: Place[] = [
  {
    id: "hospital",
    title: "Hospital or clinic",
    hint: "Reception, nurse or doctor",
    icon: Ambulance,
    cards: [
      { id: "doctor", en: "I need to see a doctor.", hi: "मुझे डॉक्टर से मिलना है।" },
      { id: "pain", en: "I have pain here.", hi: "मुझे यहाँ दर्द है।", fill: { label: "Where", placeholder: "For example: stomach, head" } },
      { id: "fever", en: "I have a fever.", hi: "मुझे बुखार है।" },
      { id: "allergies", en: "I am allergic to:", hi: "मुझे इनसे एलर्जी है:", profile: "allergies" },
      { id: "medicines", en: "I take these medicines:", hi: "मेरी दवाइयाँ ये हैं:", profile: "medicines" },
      { id: "write", en: "Please write down what the doctor says.", hi: "कृपया डॉक्टर की बात लिखकर दीजिए।" },
      { id: "interpreter", en: "Please get an ISL interpreter if you can.", hi: "हो सके तो कृपया ISL दुभाषिया बुलाइए।" },
      { id: "toilet", en: "Where is the toilet?", hi: "शौचालय कहाँ है?" },
    ],
    replies: [
      ...COMMON_REPLIES,
      { en: "Please sit down.", hi: "कृपया बैठिए।" },
      { en: "The doctor will see you soon.", hi: "डॉक्टर जल्दी ही आपको देखेंगे।" },
      { en: "Where is the pain?", hi: "दर्द कहाँ है?" },
      { en: "Since when?", hi: "कब से?" },
      { en: "Show your prescription.", hi: "अपना पर्चा दिखाइए।" },
      { en: "Pay at the counter.", hi: "काउंटर पर भुगतान कीजिए।" },
      { en: "Come back tomorrow.", hi: "कल फिर आइए।" },
    ],
  },
  {
    id: "pharmacy",
    title: "Pharmacy",
    hint: "The chemist at the counter",
    icon: Pill,
    cards: [
      { id: "need", en: "I need this medicine.", hi: "मुझे यह दवाई चाहिए।", fill: { label: "Medicine", placeholder: "Name, or show the prescription" } },
      { id: "how", en: "How should I take this medicine?", hi: "यह दवाई कैसे लेनी है?" },
      { id: "dose", en: "Please write the dose and the timing.", hi: "कृपया खुराक और समय लिखकर दीजिए।" },
      { id: "allergies", en: "I am allergic to:", hi: "मुझे इनसे एलर्जी है:", profile: "allergies" },
      { id: "cheaper", en: "Is there a cheaper option?", hi: "क्या कोई सस्ता विकल्प है?" },
    ],
    replies: [
      ...COMMON_REPLIES,
      { en: "Take it after food.", hi: "खाने के बाद लीजिए।" },
      { en: "Take it before food.", hi: "खाने से पहले लीजिए।" },
      { en: "Once a day.", hi: "दिन में एक बार।" },
      { en: "Twice a day.", hi: "दिन में दो बार।" },
      { en: "Three times a day.", hi: "दिन में तीन बार।" },
      { en: "We don't have it.", hi: "यह हमारे पास नहीं है।" },
      { en: "You need a prescription.", hi: "इसके लिए पर्चा चाहिए।" },
    ],
  },
  {
    id: "police",
    title: "Police station",
    hint: "The officer at the desk",
    icon: ShieldAlert,
    cards: [
      { id: "complaint", en: "I want to file a complaint.", hi: "मुझे शिकायत दर्ज करानी है।" },
      { id: "stolen", en: "My phone was stolen.", hi: "मेरा फ़ोन चोरी हो गया है।" },
      { id: "theft", en: "Something was stolen from me.", hi: "मेरा सामान चोरी हो गया है।", fill: { label: "What", placeholder: "For example: wallet, bag" } },
      { id: "interpreter", en: "I need an ISL interpreter.", hi: "मुझे ISL दुभाषिया चाहिए।" },
      { id: "write", en: "Please write your questions.", hi: "कृपया अपने सवाल लिखिए।" },
      { id: "copy", en: "Please give me a copy of my complaint.", hi: "कृपया मेरी शिकायत की एक प्रति दीजिए।" },
    ],
    replies: [
      ...COMMON_REPLIES,
      { en: "Write what happened.", hi: "जो हुआ, वह लिखिए।" },
      { en: "When did it happen?", hi: "यह कब हुआ?" },
      { en: "Where did it happen?", hi: "यह कहाँ हुआ?" },
      { en: "Show your ID.", hi: "अपना पहचान पत्र दिखाइए।" },
      { en: "Sign here.", hi: "यहाँ हस्ताक्षर कीजिए।" },
      { en: "Come back tomorrow.", hi: "कल फिर आइए।" },
    ],
  },
  {
    id: "bank",
    title: "Bank",
    hint: "The cashier or help desk",
    icon: Building2,
    cards: [
      { id: "deposit", en: "I want to deposit money.", hi: "मुझे पैसे जमा करने हैं।" },
      { id: "withdraw", en: "I want to withdraw money.", hi: "मुझे पैसे निकालने हैं।" },
      { id: "account", en: "I want to open an account.", hi: "मुझे खाता खोलना है।" },
      { id: "card", en: "My card is not working.", hi: "मेरा कार्ड काम नहीं कर रहा।" },
      { id: "mobile", en: "Please update my mobile number.", hi: "कृपया मेरा मोबाइल नंबर बदल दीजिए।" },
      { id: "write", en: "Please write it down for me.", hi: "कृपया मेरे लिए लिख दीजिए।" },
    ],
    replies: [
      ...COMMON_REPLIES,
      { en: "Fill in this form.", hi: "यह फ़ॉर्म भरिए।" },
      { en: "Show your ID or Aadhaar.", hi: "अपना पहचान पत्र या आधार दिखाइए।" },
      { en: "Sign here.", hi: "यहाँ हस्ताक्षर कीजिए।" },
      { en: "Go to that counter.", hi: "उस काउंटर पर जाइए।" },
      { en: "Wait for your token number.", hi: "अपने टोकन नंबर का इंतज़ार कीजिए।" },
      { en: "It is done.", hi: "काम हो गया।" },
    ],
  },
  {
    id: "railway",
    title: "Railway station",
    hint: "Ticket counter or enquiry",
    icon: TrainFront,
    cards: [
      { id: "ticket", en: "One ticket, please, to:", hi: "कृपया एक टिकट दीजिए:", fill: { label: "To", placeholder: "Station name" } },
      { id: "platform", en: "Which platform is this train on?", hi: "यह ट्रेन किस प्लेटफ़ॉर्म पर है?", fill: { label: "Train", placeholder: "Train name or number" } },
      { id: "late", en: "Is the train late?", hi: "क्या ट्रेन देर से है?" },
      { id: "announce", en: "I cannot hear announcements. Please tell me if the platform changes.", hi: "मुझे घोषणाएँ सुनाई नहीं देतीं। प्लेटफ़ॉर्म बदले तो कृपया बताइए।" },
      { id: "counter", en: "Where is the ticket counter?", hi: "टिकट काउंटर कहाँ है?" },
      { id: "seat", en: "Please help me find my seat.", hi: "कृपया मेरी सीट ढूँढने में मदद कीजिए।" },
    ],
    replies: [
      ...COMMON_REPLIES,
      { en: "The train is on time.", hi: "ट्रेन समय पर है।" },
      { en: "The train is late.", hi: "ट्रेन देर से है।" },
      { en: "The platform has changed.", hi: "प्लेटफ़ॉर्म बदल गया है।" },
      { en: "Go to that counter.", hi: "उस काउंटर पर जाइए।" },
      { en: "Show your ticket.", hi: "अपना टिकट दिखाइए।" },
      { en: "This is the wrong train.", hi: "यह गलत ट्रेन है।" },
    ],
  },
  {
    id: "auto",
    title: "Auto or taxi",
    hint: "The driver",
    icon: CarTaxiFront,
    cards: [
      { id: "goto", en: "Please take me to:", hi: "कृपया मुझे यहाँ ले चलिए:", fill: { label: "To", placeholder: "Address or landmark" } },
      { id: "fare", en: "How much will it cost?", hi: "कितना किराया होगा?" },
      { id: "meter", en: "Please use the meter.", hi: "कृपया मीटर चालू कीजिए।" },
      { id: "stop", en: "Please stop here.", hi: "कृपया यहीं रोकिए।" },
      { id: "slow", en: "Please drive slowly.", hi: "कृपया धीरे चलाइए।" },
    ],
    replies: [
      ...COMMON_REPLIES,
      { en: "Get in.", hi: "बैठिए।" },
      { en: "I will use the meter.", hi: "मीटर से ही चलेंगे।" },
      { en: "I don't know that place.", hi: "मुझे वह जगह नहीं पता।" },
      { en: "We are here.", hi: "हम पहुँच गए।" },
    ],
  },
  {
    id: "shop",
    title: "Shop or market",
    hint: "The shopkeeper",
    icon: ShoppingBag,
    cards: [
      { id: "price", en: "How much is this?", hi: "यह कितने का है?" },
      { id: "writeprice", en: "Please write the price.", hi: "कृपया दाम लिखकर बताइए।" },
      { id: "want", en: "I want this one.", hi: "मुझे यह चाहिए।" },
      { id: "upi", en: "Can I pay by UPI?", hi: "क्या UPI से भुगतान हो सकता है?" },
      { id: "size", en: "Do you have another size?", hi: "क्या दूसरा साइज़ है?" },
      { id: "bag", en: "Please give me a bag.", hi: "कृपया एक थैला दीजिए।" },
    ],
    replies: [
      ...COMMON_REPLIES,
      { en: "We don't have it.", hi: "यह हमारे पास नहीं है।" },
      { en: "UPI is fine.", hi: "UPI चलेगा।" },
      { en: "Cash only.", hi: "सिर्फ़ नकद।" },
      { en: "Pay here.", hi: "यहाँ भुगतान कीजिए।" },
      { en: "Here is your change.", hi: "यह रहे आपके छुट्टे पैसे।" },
    ],
  },
];

export const ALL_PLACES: Place[] = [EMERGENCY, ...PLACES];

export function findPlace(id: string | undefined): Place | undefined {
  return ALL_PLACES.find((place) => place.id === id);
}

export function placeIcon(id: string): LucideIcon {
  return findPlace(id)?.icon ?? Siren;
}

/** Indian emergency numbers, for display. Calling needs a hearing helper. */
export const EMERGENCY_NUMBERS = [
  { number: "112", label: "All emergencies" },
  { number: "108", label: "Ambulance" },
  { number: "101", label: "Fire" },
];
