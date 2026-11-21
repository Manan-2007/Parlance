// Generated from parlance-isl/src/features/cards/cardData.ts. Keep the two in step.
//
// Ready-made cards a Deaf person shows to hearing staff, and the replies staff
// can tap back. Every line has English and Hindi, because the person reading
// the card at an Indian counter may read either. Hindi avoids gendered verb
// endings, so one card works for anyone.
import 'package:flutter/material.dart';

class Line {
  const Line({required this.en, required this.hi});
  final String en;
  final String hi;
}

/// A blank the person fills in before showing the card.
class CardFill {
  const CardFill({required this.label, required this.placeholder});
  final String label;
  final String placeholder;
}

/// Details from "About me" that a card can carry.
enum ProfileField { contact, allergies, medicines, conditions }

class CardDef extends Line {
  const CardDef({
    required this.id,
    required super.en,
    required super.hi,
    this.fill,
    this.profile,
  });
  final String id;
  final CardFill? fill;
  final ProfileField? profile;
}

class Place {
  const Place({
    required this.id,
    required this.title,
    required this.hint,
    required this.icon,
    required this.cards,
    required this.replies,
  });
  final String id;
  final String title;
  final String hint;
  final IconData icon;
  final List<CardDef> cards;
  final List<Line> replies;
}

class EmergencyNumber {
  const EmergencyNumber(this.number, this.label);
  final String number;
  final String label;
}

const deafCard = CardDef(
  id: 'deaf',
  en: 'I am Deaf. Please write, type or show me.',
  hi: 'मैं बधिर हूँ। कृपया लिखकर, टाइप करके या इशारे से बताइए।',
);

const emergency = Place(
  id: 'emergency',
  title: 'Emergency',
  hint: 'Show anyone nearby',
  icon: Icons.emergency_rounded,
  cards: [
    CardDef(
      id: 'help',
      en: 'I am Deaf. I need help.',
      hi: 'मैं बधिर हूँ। मुझे मदद चाहिए।',
    ),
    CardDef(
      id: 'ambulance',
      en: 'Please call an ambulance: 108.',
      hi: 'कृपया एम्बुलेंस बुलाइए: 108',
    ),
    CardDef(
      id: 'police',
      en: 'Please call the police: 112.',
      hi: 'कृपया पुलिस को बुलाइए: 112',
    ),
    CardDef(
      id: 'contact',
      en: 'Please call my emergency contact.',
      hi: 'कृपया मेरे आपातकालीन संपर्क को फ़ोन कीजिए।',
      profile: ProfileField.contact,
    ),
    CardDef(id: 'hurt', en: 'I am hurt.', hi: 'मुझे चोट लगी है।'),
    CardDef(
      id: 'accident',
      en: 'I have been in an accident.',
      hi: 'मेरे साथ दुर्घटना हुई है।',
    ),
    CardDef(
      id: 'fire',
      en: 'There is a fire. Call 101.',
      hi: 'आग लगी है। 101 पर फ़ोन कीजिए।',
    ),
    CardDef(
      id: 'lost',
      en: 'I am lost. Please help me get to this address.',
      hi: 'मुझे रास्ता नहीं मिल रहा। कृपया इस पते तक पहुँचने में मदद कीजिए।',
      fill: CardFill(label: 'Address', placeholder: 'Where you need to go'),
    ),
    CardDef(
      id: 'alarm',
      en: 'I cannot hear alarms or announcements. Please write what is happening.',
      hi: 'मुझे अलार्म या घोषणाएँ सुनाई नहीं देतीं। कृपया लिखकर बताइए कि क्या हो रहा है।',
    ),
    CardDef(
      id: 'medical',
      en: 'My medical details are below.',
      hi: 'मेरी चिकित्सा जानकारी नीचे है।',
      profile: ProfileField.conditions,
    ),
  ],
  replies: [
    Line(en: 'Help is coming.', hi: 'मदद आ रही है।'),
    Line(en: 'Stay here.', hi: 'यहीं रहिए।'),
    Line(en: 'Are you hurt?', hi: 'क्या आपको चोट लगी है?'),
    Line(en: 'Where does it hurt?', hi: 'कहाँ दर्द हो रहा है?'),
    Line(en: 'Come with me.', hi: 'मेरे साथ आइए।'),
    Line(en: 'You are safe now.', hi: 'अब आप सुरक्षित हैं।'),
    Line(
      en: 'Show me your phone or ID.',
      hi: 'अपना फ़ोन या पहचान पत्र दिखाइए।',
    ),
    Line(
      en: 'I have called for help.',
      hi: 'मैंने मदद के लिए फ़ोन कर दिया है।',
    ),
  ],
);

const places = <Place>[
  Place(
    id: 'hospital',
    title: 'Hospital or clinic',
    hint: 'Reception, nurse or doctor',
    icon: Icons.local_hospital_rounded,
    cards: [
      CardDef(
        id: 'doctor',
        en: 'I need to see a doctor.',
        hi: 'मुझे डॉक्टर से मिलना है।',
      ),
      CardDef(
        id: 'pain',
        en: 'I have pain here.',
        hi: 'मुझे यहाँ दर्द है।',
        fill: CardFill(
          label: 'Where',
          placeholder: 'For example: stomach, head',
        ),
      ),
      CardDef(id: 'fever', en: 'I have a fever.', hi: 'मुझे बुखार है।'),
      CardDef(
        id: 'allergies',
        en: 'I am allergic to:',
        hi: 'मुझे इनसे एलर्जी है:',
        profile: ProfileField.allergies,
      ),
      CardDef(
        id: 'medicines',
        en: 'I take these medicines:',
        hi: 'मेरी दवाइयाँ ये हैं:',
        profile: ProfileField.medicines,
      ),
      CardDef(
        id: 'write',
        en: 'Please write down what the doctor says.',
        hi: 'कृपया डॉक्टर की बात लिखकर दीजिए।',
      ),
      CardDef(
        id: 'interpreter',
        en: 'Please get an ISL interpreter if you can.',
        hi: 'हो सके तो कृपया ISL दुभाषिया बुलाइए।',
      ),
      CardDef(id: 'toilet', en: 'Where is the toilet?', hi: 'शौचालय कहाँ है?'),
    ],
    replies: [
      Line(en: 'Yes.', hi: 'हाँ।'),
      Line(en: 'No.', hi: 'नहीं।'),
      Line(en: 'Please wait here.', hi: 'कृपया यहाँ इंतज़ार कीजिए।'),
      Line(en: 'Please sit down.', hi: 'कृपया बैठिए।'),
      Line(
        en: 'The doctor will see you soon.',
        hi: 'डॉक्टर जल्दी ही आपको देखेंगे।',
      ),
      Line(en: 'Where is the pain?', hi: 'दर्द कहाँ है?'),
      Line(en: 'Since when?', hi: 'कब से?'),
      Line(en: 'Show your prescription.', hi: 'अपना पर्चा दिखाइए।'),
      Line(en: 'Pay at the counter.', hi: 'काउंटर पर भुगतान कीजिए।'),
      Line(en: 'Come back tomorrow.', hi: 'कल फिर आइए।'),
    ],
  ),
  Place(
    id: 'pharmacy',
    title: 'Pharmacy',
    hint: 'The chemist at the counter',
    icon: Icons.medication_rounded,
    cards: [
      CardDef(
        id: 'need',
        en: 'I need this medicine.',
        hi: 'मुझे यह दवाई चाहिए।',
        fill: CardFill(
          label: 'Medicine',
          placeholder: 'Name, or show the prescription',
        ),
      ),
      CardDef(
        id: 'how',
        en: 'How should I take this medicine?',
        hi: 'यह दवाई कैसे लेनी है?',
      ),
      CardDef(
        id: 'dose',
        en: 'Please write the dose and the timing.',
        hi: 'कृपया खुराक और समय लिखकर दीजिए।',
      ),
      CardDef(
        id: 'allergies',
        en: 'I am allergic to:',
        hi: 'मुझे इनसे एलर्जी है:',
        profile: ProfileField.allergies,
      ),
      CardDef(
        id: 'cheaper',
        en: 'Is there a cheaper option?',
        hi: 'क्या कोई सस्ता विकल्प है?',
      ),
    ],
    replies: [
      Line(en: 'Yes.', hi: 'हाँ।'),
      Line(en: 'No.', hi: 'नहीं।'),
      Line(en: 'Please wait here.', hi: 'कृपया यहाँ इंतज़ार कीजिए।'),
      Line(en: 'Take it after food.', hi: 'खाने के बाद लीजिए।'),
      Line(en: 'Take it before food.', hi: 'खाने से पहले लीजिए।'),
      Line(en: 'Once a day.', hi: 'दिन में एक बार।'),
      Line(en: 'Twice a day.', hi: 'दिन में दो बार।'),
      Line(en: 'Three times a day.', hi: 'दिन में तीन बार।'),
      Line(en: 'We don\'t have it.', hi: 'यह हमारे पास नहीं है।'),
      Line(en: 'You need a prescription.', hi: 'इसके लिए पर्चा चाहिए।'),
    ],
  ),
  Place(
    id: 'police',
    title: 'Police station',
    hint: 'The officer at the desk',
    icon: Icons.local_police_rounded,
    cards: [
      CardDef(
        id: 'complaint',
        en: 'I want to file a complaint.',
        hi: 'मुझे शिकायत दर्ज करानी है।',
      ),
      CardDef(
        id: 'stolen',
        en: 'My phone was stolen.',
        hi: 'मेरा फ़ोन चोरी हो गया है।',
      ),
      CardDef(
        id: 'theft',
        en: 'Something was stolen from me.',
        hi: 'मेरा सामान चोरी हो गया है।',
        fill: CardFill(label: 'What', placeholder: 'For example: wallet, bag'),
      ),
      CardDef(
        id: 'interpreter',
        en: 'I need an ISL interpreter.',
        hi: 'मुझे ISL दुभाषिया चाहिए।',
      ),
      CardDef(
        id: 'write',
        en: 'Please write your questions.',
        hi: 'कृपया अपने सवाल लिखिए।',
      ),
      CardDef(
        id: 'copy',
        en: 'Please give me a copy of my complaint.',
        hi: 'कृपया मेरी शिकायत की एक प्रति दीजिए।',
      ),
    ],
    replies: [
      Line(en: 'Yes.', hi: 'हाँ।'),
      Line(en: 'No.', hi: 'नहीं।'),
      Line(en: 'Please wait here.', hi: 'कृपया यहाँ इंतज़ार कीजिए।'),
      Line(en: 'Write what happened.', hi: 'जो हुआ, वह लिखिए।'),
      Line(en: 'When did it happen?', hi: 'यह कब हुआ?'),
      Line(en: 'Where did it happen?', hi: 'यह कहाँ हुआ?'),
      Line(en: 'Show your ID.', hi: 'अपना पहचान पत्र दिखाइए।'),
      Line(en: 'Sign here.', hi: 'यहाँ हस्ताक्षर कीजिए।'),
      Line(en: 'Come back tomorrow.', hi: 'कल फिर आइए।'),
    ],
  ),
  Place(
    id: 'bank',
    title: 'Bank',
    hint: 'The cashier or help desk',
    icon: Icons.account_balance_rounded,
    cards: [
      CardDef(
        id: 'deposit',
        en: 'I want to deposit money.',
        hi: 'मुझे पैसे जमा करने हैं।',
      ),
      CardDef(
        id: 'withdraw',
        en: 'I want to withdraw money.',
        hi: 'मुझे पैसे निकालने हैं।',
      ),
      CardDef(
        id: 'account',
        en: 'I want to open an account.',
        hi: 'मुझे खाता खोलना है।',
      ),
      CardDef(
        id: 'card',
        en: 'My card is not working.',
        hi: 'मेरा कार्ड काम नहीं कर रहा।',
      ),
      CardDef(
        id: 'mobile',
        en: 'Please update my mobile number.',
        hi: 'कृपया मेरा मोबाइल नंबर बदल दीजिए।',
      ),
      CardDef(
        id: 'write',
        en: 'Please write it down for me.',
        hi: 'कृपया मेरे लिए लिख दीजिए।',
      ),
    ],
    replies: [
      Line(en: 'Yes.', hi: 'हाँ।'),
      Line(en: 'No.', hi: 'नहीं।'),
      Line(en: 'Please wait here.', hi: 'कृपया यहाँ इंतज़ार कीजिए।'),
      Line(en: 'Fill in this form.', hi: 'यह फ़ॉर्म भरिए।'),
      Line(
        en: 'Show your ID or Aadhaar.',
        hi: 'अपना पहचान पत्र या आधार दिखाइए।',
      ),
      Line(en: 'Sign here.', hi: 'यहाँ हस्ताक्षर कीजिए।'),
      Line(en: 'Go to that counter.', hi: 'उस काउंटर पर जाइए।'),
      Line(
        en: 'Wait for your token number.',
        hi: 'अपने टोकन नंबर का इंतज़ार कीजिए।',
      ),
      Line(en: 'It is done.', hi: 'काम हो गया।'),
    ],
  ),
  Place(
    id: 'railway',
    title: 'Railway station',
    hint: 'Ticket counter or enquiry',
    icon: Icons.train_rounded,
    cards: [
      CardDef(
        id: 'ticket',
        en: 'One ticket, please, to:',
        hi: 'कृपया एक टिकट दीजिए:',
        fill: CardFill(label: 'To', placeholder: 'Station name'),
      ),
      CardDef(
        id: 'platform',
        en: 'Which platform is this train on?',
        hi: 'यह ट्रेन किस प्लेटफ़ॉर्म पर है?',
        fill: CardFill(label: 'Train', placeholder: 'Train name or number'),
      ),
      CardDef(
        id: 'late',
        en: 'Is the train late?',
        hi: 'क्या ट्रेन देर से है?',
      ),
      CardDef(
        id: 'announce',
        en: 'I cannot hear announcements. Please tell me if the platform changes.',
        hi: 'मुझे घोषणाएँ सुनाई नहीं देतीं। प्लेटफ़ॉर्म बदले तो कृपया बताइए।',
      ),
      CardDef(
        id: 'counter',
        en: 'Where is the ticket counter?',
        hi: 'टिकट काउंटर कहाँ है?',
      ),
      CardDef(
        id: 'seat',
        en: 'Please help me find my seat.',
        hi: 'कृपया मेरी सीट ढूँढने में मदद कीजिए।',
      ),
    ],
    replies: [
      Line(en: 'Yes.', hi: 'हाँ।'),
      Line(en: 'No.', hi: 'नहीं।'),
      Line(en: 'Please wait here.', hi: 'कृपया यहाँ इंतज़ार कीजिए।'),
      Line(en: 'The train is on time.', hi: 'ट्रेन समय पर है।'),
      Line(en: 'The train is late.', hi: 'ट्रेन देर से है।'),
      Line(en: 'The platform has changed.', hi: 'प्लेटफ़ॉर्म बदल गया है।'),
      Line(en: 'Go to that counter.', hi: 'उस काउंटर पर जाइए।'),
      Line(en: 'Show your ticket.', hi: 'अपना टिकट दिखाइए।'),
      Line(en: 'This is the wrong train.', hi: 'यह गलत ट्रेन है।'),
    ],
  ),
  Place(
    id: 'auto',
    title: 'Auto or taxi',
    hint: 'The driver',
    icon: Icons.local_taxi_rounded,
    cards: [
      CardDef(
        id: 'goto',
        en: 'Please take me to:',
        hi: 'कृपया मुझे यहाँ ले चलिए:',
        fill: CardFill(label: 'To', placeholder: 'Address or landmark'),
      ),
      CardDef(
        id: 'fare',
        en: 'How much will it cost?',
        hi: 'कितना किराया होगा?',
      ),
      CardDef(
        id: 'meter',
        en: 'Please use the meter.',
        hi: 'कृपया मीटर चालू कीजिए।',
      ),
      CardDef(id: 'stop', en: 'Please stop here.', hi: 'कृपया यहीं रोकिए।'),
      CardDef(id: 'slow', en: 'Please drive slowly.', hi: 'कृपया धीरे चलाइए।'),
    ],
    replies: [
      Line(en: 'Yes.', hi: 'हाँ।'),
      Line(en: 'No.', hi: 'नहीं।'),
      Line(en: 'Please wait here.', hi: 'कृपया यहाँ इंतज़ार कीजिए।'),
      Line(en: 'Get in.', hi: 'बैठिए।'),
      Line(en: 'I will use the meter.', hi: 'मीटर से ही चलेंगे।'),
      Line(en: 'I don\'t know that place.', hi: 'मुझे वह जगह नहीं पता।'),
      Line(en: 'We are here.', hi: 'हम पहुँच गए।'),
    ],
  ),
  Place(
    id: 'shop',
    title: 'Shop or market',
    hint: 'The shopkeeper',
    icon: Icons.shopping_bag_rounded,
    cards: [
      CardDef(id: 'price', en: 'How much is this?', hi: 'यह कितने का है?'),
      CardDef(
        id: 'writeprice',
        en: 'Please write the price.',
        hi: 'कृपया दाम लिखकर बताइए।',
      ),
      CardDef(id: 'want', en: 'I want this one.', hi: 'मुझे यह चाहिए।'),
      CardDef(
        id: 'upi',
        en: 'Can I pay by UPI?',
        hi: 'क्या UPI से भुगतान हो सकता है?',
      ),
      CardDef(
        id: 'size',
        en: 'Do you have another size?',
        hi: 'क्या दूसरा साइज़ है?',
      ),
      CardDef(
        id: 'bag',
        en: 'Please give me a bag.',
        hi: 'कृपया एक थैला दीजिए।',
      ),
    ],
    replies: [
      Line(en: 'Yes.', hi: 'हाँ।'),
      Line(en: 'No.', hi: 'नहीं।'),
      Line(en: 'Please wait here.', hi: 'कृपया यहाँ इंतज़ार कीजिए।'),
      Line(en: 'We don\'t have it.', hi: 'यह हमारे पास नहीं है।'),
      Line(en: 'UPI is fine.', hi: 'UPI चलेगा।'),
      Line(en: 'Cash only.', hi: 'सिर्फ़ नकद।'),
      Line(en: 'Pay here.', hi: 'यहाँ भुगतान कीजिए।'),
      Line(en: 'Here is your change.', hi: 'यह रहे आपके छुट्टे पैसे।'),
    ],
  ),
];

const emergencyNumbers = <EmergencyNumber>[
  EmergencyNumber('112', 'All emergencies'),
  EmergencyNumber('108', 'Ambulance'),
  EmergencyNumber('101', 'Fire'),
];

Place? placeById(String id) => id == emergency.id
    ? emergency
    : places.where((p) => p.id == id).firstOrNull;
