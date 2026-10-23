/**
 * ADSA T-Board Verified Knowledge Base & FAQ Database
 * Provides instant search and self-service answers for campus diners and students.
 */

export const FAQ_CATEGORIES = [
  { id: 'all', key: 'faqCatAll', label: 'All Topics' },
  { id: 'cutoff', key: 'faqCatCutoff', label: 'Cutoff & Timing' },
  { id: 'tokens', key: 'faqCatTokens', label: 'Token Locks & Status' },
  { id: 'dietary', key: 'faqCatDietary', label: 'Dietary & Avoiders' },
  { id: 'billing', key: 'faqCatBilling', label: 'Billing & Records' },
  { id: 'general', key: 'faqCatGeneral', label: 'Campus & Canteen' },
];

export const FAQ_ITEMS = [
  {
    id: 'faq_cutoff_time',
    category: 'cutoff',
    questionEn: 'What is the daily cutoff time for meal cancellations and changes?',
    questionMl: 'ഭക്ഷണ ക്രമീകരണങ്ങൾ മാറ്റാനുള്ള പ്രതിദിന കട്ട്-ഓഫ് സമയം എപ്പോഴാണ്?',
    answerEn:
      'The daily meal cutoff time is strictly 14:00 IST (2:00 PM). All cancellations, attendance toggles, and date exceptions for tomorrow’s meals must be completed before 2:00 PM so that the kitchen procurement team can calculate exact ingredient quantities.',
    answerMl:
      'പ്രതിദിന കട്ട്-ഓഫ് സമയം ഉച്ചയ്ക്ക് 2:00 മണി (14:00 IST) ആണ്. അടുത്ത ദിവസത്തെ ഭക്ഷണ മാറ്റങ്ങൾ 2 മണിക്ക് മുൻപായി പൂർത്തിയാക്കേണ്ടതാണ്.',
    tags: ['cutoff', 'time', '2pm', '14:00', 'cancel', 'tomorrow', 'procurement'],
  },
  {
    id: 'faq_after_cutoff',
    category: 'cutoff',
    questionEn: 'Can I cancel or activate a meal after the 2:00 PM cutoff has passed?',
    questionMl: 'ഉച്ചയ്ക്ക് 2 മണിക്ക് ശേഷം ഭക്ഷണം ക്യാൻസൽ ചെയ്യാനോ ആക്റ്റീവ് ആക്കാനോ സാധിക്കുമോ?',
    answerEn:
      'Once the cutoff window closes at 2:00 PM, the system enters lock mode to freeze kitchen supplies. If you have a genuine medical emergency or travel delay, contact the Canteen Convenor or submit an Urgent Lockout ticket through this Care Concierge.',
    answerMl:
      '2 മണിക്ക് ശേഷം സിസ്റ്റം ലോക്ക് ആകുന്നതാണ്. അടിയന്തിര മെഡിക്കൽ ആവശ്യങ്ങൾക്ക് കാന്റീൻ കൺവീനറുമായി ബന്ധപ്പെടുകയോ സപ്പോർട്ട് ടിക്കറ്റ് അയക്കുകയോ ചെയ്യുക.',
    tags: ['late', 'after cutoff', 'emergency', 'lock', 'freeze'],
  },
  {
    id: 'faq_token_blocked',
    category: 'tokens',
    questionEn: 'Why is my token showing as locked or blocked?',
    questionMl: 'എന്റെ ടോക്കൺ ബ്ലോക്ക് അല്ലെങ്കിൽ ലോക്ക് ആയി കാണിക്കുന്നത് എന്തുകൊണ്ട്?',
    answerEn:
      'Tokens are typically locked by the Central Committee due to pending mess fee clearances, administrative verification, or prolonged inactive periods. You can submit a "Token Lock & Attendance" ticket right here with your payment receipt to request immediate unblocking.',
    answerMl:
      'മെസ്സ് ഫീസ് കുടിശ്ശികയോ അഡ്മിനിസ്ട്രേറ്റീവ് പരിശോധനയോ കാരണമാണ് ടോക്കൺ ബ്ലോക്ക് ആകുന്നത്. സപ്പോർട്ട് ഫോം വഴി രസീത് സമർപ്പിച്ച് അൺബ്ലോക്ക് ചെയ്യാവുന്നതാണ്.',
    tags: ['blocked', 'locked', 'token', 'red', 'unblock', 'dues', 'fees'],
  },
  {
    id: 'faq_dietary_avoiders',
    category: 'dietary',
    questionEn: 'How do I register an avoidance for fish, beef, egg, or other dishes?',
    questionMl: 'മീൻ, ബീഫ്, മുട്ട മുതലായ ഭക്ഷണങ്ങൾ ഒഴിവാക്കാൻ എങ്ങനെ അപേക്ഷിക്കാം?',
    answerEn:
      'You can submit your dietary exclusion via the Student Portal under "Dietary Preferences", or submit a ticket here under "Dietary & Allergens". Once approved, your token number will automatically appear on the Kitchen Avoiders Matrix.',
    answerMl:
      'സ്റ്റുഡന്റ് പോർട്ടലിലോ അല്ലെങ്കിൽ ഈ സപ്പോർട്ട് ഫോമിലോ "ഡയറ്ററി" വിഭാഗം തിരഞ്ഞെടുത്ത് അപേക്ഷിക്കാം. അംഗീകരിച്ചാൽ അടുക്കളയിലെ ഒഴിവാക്കൽ ലിസ്റ്റിൽ ഉൾപ്പെടുത്തും.',
    tags: ['dietary', 'fish', 'beef', 'egg', 'avoiders', 'allergy', 'vegetarian'],
  },
  {
    id: 'faq_separate_dietary',
    category: 'dietary',
    questionEn: 'Does the mess prepare separate substitute dishes for avoiders?',
    questionMl: 'ഭക്ഷണം ഒഴിവാക്കുന്നവർക്ക് പകരമായി പ്രത്യേക ഭക്ഷണം തയ്യാറാക്കുമോ?',
    answerEn:
      'Yes! The culinary team receives a live Kitchen Display manifest indicating the exact number of students avoiding specific items, and prepares approved healthy substitutes (such as Dal, Egg, or Veg Curry) for those verified on the matrix.',
    answerMl:
      'അതെ, ഒഴിവാക്കുന്നവർക്ക് അനുയോജ്യമായ പകരമുള്ള ഭക്ഷണം (പരിപ്പ് കറി, വെജിറ്റബിൾ കറി മുതലായവ) അടുക്കളയിൽ തയ്യാറാക്കുന്നതാണ്.',
    tags: ['substitute', 'kitchen', 'dal', 'curry', 'special care'],
  },
  {
    id: 'faq_billing_calculation',
    category: 'billing',
    questionEn: 'How is monthly mess billing calculated from my token attendance?',
    questionMl: 'പ്രതിമാസ മെസ്സ് ബിൽ എങ്ങനെയാണ് കണക്കാക്കുന്നത്?',
    answerEn:
      'Mess dues are calculated dynamically based strictly on the meals you consumed (Active status on the Token Board). Days marked as opted out (Rejection / X) before the cutoff window are not billed to your account.',
    answerMl:
      'കട്ട്-ഓഫിന് മുൻപ് കൃത്യമായി ഒഴിവാക്കിയ ദിവസങ്ങൾ ബില്ലിൽ നിന്ന് ഒഴിവാക്കപ്പെടും. കഴിച്ച ഭക്ഷണങ്ങൾക്ക് മാത്രമേ ചാർജ്ജ് ഈടാക്കുകയുള്ളൂ.',
    tags: ['bill', 'calculation', 'fees', 'rejection', 'cost', 'dues'],
  },
  {
    id: 'faq_emergency_hotline',
    category: 'general',
    questionEn: 'Where is the physical canteen committee desk located?',
    questionMl: 'കാന്റീൻ കമ്മിറ്റി ഓഫീസ് എവിടെയാണ് സ്ഥിതി ചെയ്യുന്നത്?',
    answerEn:
      'The ADSA Canteen Operations Counter is located on the ground floor of the Alathurpadi Dars Mess Building, adjacent to the dining hall. Staff are available from 06:00 AM to 02:00 PM and 06:00 PM to 09:30 PM IST.',
    answerMl:
      'ആലത്തൂർപടി ദർസ് മെസ്സ് കെട്ടിടത്തിന്റെ ഗ്രൗണ്ട് ഫ്ലോറിൽ ഡൈനിംഗ് ഹാളിന് സമീപമാണ് ഓഫീസ്. രാവിലെ 6 മുതൽ ഉച്ചയ്ക്ക് 2 വരെയും വൈകുന്നേരം 6 മുതൽ 9:30 വരെയും ലഭ്യമാണ്.',
    tags: ['location', 'office', 'desk', 'counter', 'timing', 'alathurpadi'],
  },
];

export const COMMITTEE_HOTLINES = [
  {
    id: 'hotline_convenor',
    roleEn: 'Canteen Convenor',
    roleMl: 'കാന്റീൻ കൺവീനർ',
    name: 'Abdullah M.P.',
    phone: '+91 94471 23456',
    whatsapp: '919447123456',
    availableTimeEn: '06:30 AM - 09:30 PM IST',
    availableTimeMl: 'രാവിലെ 06:30 - രാത്രി 09:30',
    primaryDutyEn: 'Daily meal operations, food quality & supplier logistics',
    primaryDutyMl: 'പ്രതിദിന ഭക്ഷണ വിതരണം, ഗുണനിലവാരം',
  },
  {
    id: 'hotline_food_quality',
    roleEn: 'Food Quality & Hygiene Lead',
    roleMl: 'ഫുഡ് ക്വാളിറ്റി & ശുചിത്വം',
    name: 'Muhammed Shafi',
    phone: '+91 98472 34567',
    whatsapp: '919847234567',
    availableTimeEn: '07:00 AM - 03:00 PM IST',
    availableTimeMl: 'രാവിലെ 07:00 - ഉച്ചയ്ക്ക് 03:00',
    primaryDutyEn: 'Kitchen sanitation, taste monitoring & dietary avoiders',
    primaryDutyMl: 'രുചി, ശുചിത്വം, പ്രത്യേക ഭക്ഷണങ്ങൾ',
  },
  {
    id: 'hotline_central',
    roleEn: 'Central Committee General Secretary',
    roleMl: 'സെൻട്രൽ കമ്മിറ്റി ജനറൽ സെക്രട്ടറി',
    name: 'Jaseel K.',
    phone: '+91 97453 45678',
    whatsapp: '919745345678',
    availableTimeEn: '09:00 AM - 08:00 PM IST',
    availableTimeMl: 'രാവിലെ 09:00 - രാത്രി 08:00',
    primaryDutyEn: 'Token unblocking, student records, fee concessions',
    primaryDutyMl: 'ടോക്കൺ അൺബ്ലോക്ക്, വിദ്യാർത്ഥി വിവരങ്ങൾ',
  },
  {
    id: 'hotline_tech',
    roleEn: 'Systems Developer & Technical Support',
    roleMl: 'സിസ്റ്റം ഡെവലപ്പർ & സാങ്കേതിക സഹായം',
    name: 'ADSA Tech Wing',
    phone: '+91 99950 00000',
    whatsapp: '919995000000',
    availableTimeEn: '24/7 Priority Emergency Channel',
    availableTimeMl: '24/7 എമർജൻസി സഹായം',
    primaryDutyEn: 'Kiosk bugs, student portal login, system outages',
    primaryDutyMl: 'ലോഗിൻ പ്രശ്നങ്ങൾ, സോഫ്റ്റ്‌വെയർ തകരാറുകൾ',
  },
];
