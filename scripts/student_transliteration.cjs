/**
 * Comprehensive, accurate Malayalam to English transliteration
 * tailored specifically for Kerala Dars student names and hometowns.
 */

const MALAYALAM_TO_ENGLISH_WORDS = {
  // Common Titles & Honorifics
  'ഹാഫിള്': 'Hafiz',
  'ഹാഫിസ്': 'Hafiz',
  'സയ്യിദ്': 'Sayyid',
  'അൽഅമീൻ': 'Al-Ameen',
  'അൽ അമീൻ': 'Al-Ameen',
  'സൗത്ത്': 'South',

  // Names (A)
  'അംജദ്': 'Amjad',
  'അജ്മൽ': 'Ajmal',
  'അതീഖ്': 'Atheeq',
  'അദ്നാൻ': 'Adnan',
  'അനസ്': 'Anas',
  'അഫ്': 'Af',
  'അഫ്നാൻ': 'Afnan',
  'അഫ്‌ലഹ്': 'Aflah',
  'അബൂബക്കർ': 'Abubakkar',
  'അബ്ദുറഹ്മാൻ': 'Abdurahman',
  'അബ്ദുല്ല': 'Abdullah',
  'അബ്ദുള്ള': 'Abdullah',
  'അബ്ദുൽ': 'Abdul',
  'അമീൻ': 'Ameen',
  'അമൻ': 'Aman',
  'അമൽ': 'Amal',
  'അലി': 'Ali',
  'അഷ്ഫാക്ക്': 'Ashfaq',
  'അഹ്മദ്': 'Ahmad',
  'അഹ്‌മദ്‌': 'Ahmad',
  'അഹമ്മദ്': 'Ahmad',
  'അൻവറലി': 'Anvarali',
  'അൻഷിദ്': 'Anshid',
  'അൻഷിഫ്': 'Anshif',
  'അർമിയാഅ്': 'Armiya',
  'അർഷദ്': 'Arshad',
  'ആദിൽ': 'Aadil',
  'ആരിഫുദ്ദീൻ': 'Arifuddeen',
  'ആരിഫ്': 'Arif',
  'ആഷിഖ്': 'Aashiq',
  'ആഷിഫ്': 'Aashif',
  'ഇംതിയാസ്': 'Imthiyas',
  'ഇബ്രാഹീം': 'Ibrahim',
  'ഇസ്മായിൽ': 'Ismail',
  'ഇഹ്തിഷാം': 'Ihtisham',
  'ഇഹ്സാൻ': 'Ihsan',
  'ഇഹ്‌സാൻ': 'Ihsan',
  'ഇർഷാദ്': 'Irshad',
  'ഉമറുൽ': 'Umarul',
  'ഉമർ': 'Umar',
  'ഉവൈസ്': 'Uwais',
  'ഉസ്മാൻ': 'Usman',
  'ഔഫി': 'Aufi',

  // Names (J, T, D, N)
  'ജംഷാദ്': 'Jamshad',
  'ജഅ്ഫർ': 'Jafar',
  'ജമലുല്ലൈലി': 'Jamalullaili',
  'ജലാലുദ്ധീൻ': 'Jalaluddeen',
  'ജലാൽ': 'Jalal',
  'ജവാദ്': 'Jawad',
  'ജാസിം': 'Jasim',
  'ജാസിർ': 'Jasir',
  'ജുറൈജ്': 'Juraij',
  'ജൗഹർ': 'Jauhar',
  'ത്വയ്യിബ്': 'Thayyib',
  'ദിൽഷാദ്': 'Dilshad',
  'നഫിൽ': 'Nafil',
  'നവാസ്': 'Nawas',
  'നവാർ': 'Nawar',
  'നസീം': 'Naseem',
  'നസീഫ്': 'Naseef',
  'നസീബ്': 'Naseeb',
  'നസീൽ': 'Naseel',
  'നസ്വീഹ്': 'Nasweeh',
  'നാഫി': 'Nafi',
  'നാസിഫ്': 'Nasif',
  'നാസർ': 'Nasar',
  'നിയാസ്': 'Niyas',
  'നിഷാൽ': 'Nishal',
  'നിസാർ': 'Nisar',
  'നിഹാൽ': 'Nihal',
  'നുഅ്മാൻ': 'Numan',

  // Names (F, B, M, Y, R, L, S, H)
  'ഫലാഹ്': 'Falah',
  'ഫവാസ്': 'Fawas',
  'ഫഹീം': 'Faheem',
  'ഫാഇസ്': 'Fayis',
  'ഫായിസ്': 'Fayis',
  'ഫാരിസി': 'Farisi',
  'ഫാരിസ്': 'Faris',
  'ഫാറൂഖ്': 'Farooq',
  'ഫാസിൽ': 'Fasil',
  'ഫർഹാൻ': 'Farhan',
  'ബഷീർ': 'Basheer',
  'ബാസിം': 'Basim',
  'ബാസിത്': 'Basith',
  'ബാസിത്ത്': 'Basith',
  'ബിലാൽ': 'Bilal',
  'ബുഖാരി': 'Bukhari',
  'ബുർഹാൻ': 'Burhan',
  'മജീദ്': 'Majeed',
  'മഹ്മൂദ്': 'Mahmood',
  'മാഹിൻ': 'Mahin',
  'മിദ്‌ലാജ്': 'Midlaj',
  'മിൻഹാജുൽ': 'Minhajul',
  'മിൻഹാജ്': 'Minhaj',
  'മുഖ്താർ': 'Mukhtar',
  'മുജീബ്': 'Mujeeb',
  'മുനവ്വർ': 'Munawwar',
  'മുനീസ്': 'Munees',
  'മുബഷിർ': 'Mubashir',
  'മുബാറക്': 'Mubarak',
  'മുസ്ഥഫ': 'Musthafa',
  'മുസ്തഫ': 'Musthafa',
  'മുഹമ്മദ്': 'Muhammed',
  'മുഹമ്മദ്‌': 'Muhammed',
  'മുഹ്സിൻ': 'Muhsin',
  'മുഹ്‌സിൻ': 'Muhsin',
  'യാസീൻ': 'Yaseen',
  'യൂസുഫ്': 'Yusuf',
  'രിള്‌വാൻ': 'Rizwan',
  'റംഷാദ്': 'Ramshad',
  'റഈസ്': 'Raees',
  'റബീഹ്': 'Rabeeh',
  'റഷാദ്': 'Rashad',
  'റഷീദ്': 'Rasheed',
  'റഹ്മാൻ': 'Rahman',
  'റാഫിഅ്': 'Rafi',
  'റാഷിദ്': 'Rashid',
  'റയ്യാൻ': 'Rayyan',
  'റിഷാൽ': 'Rishal',
  'റിസാൻ': 'Rizan',
  'റിസ്വാൻ': 'Rizwan',
  'റിഹാൻ': 'Rihan',
  'റിൻഷാദ്': 'Rinshad',
  'ലഹ്': 'Lah',
  'ലുഖ്മാനുൽ': 'Luqmanul',
  'ശംനാദ്': 'Shamnad',
  'ശഫീഖ്': 'Shafeeq',
  'ശബീഹ്': 'Shabeeh',
  'ശബീൽ': 'Shabeel',
  'ശമീം': 'Shameem',
  'ശമ്മാസ്': 'Shammas',
  'ശാദി': 'Shadi',
  'ശാനിബ്': 'Shanib',
  'ശാമിൽ': 'Shamil',
  'ശാഹിദ്': 'Shahid',
  'ശാക്കിർ': 'Shakir',
  'ഷാക്കിർ': 'Shakir',
  'ഷാഫി': 'Shafi',
  'ഷാഫിൽ': 'Shafil',
  'ഷഫീഅ്': 'Shafi',
  'ഷമ്മാസ്': 'Shammas',
  'ഷഹീം': 'Shaheem',
  'ഷിബിൻ': 'Shibin',
  'സഅദ്': 'Saad',
  'സഈദ്': 'Saeed',
  'സജീർ': 'Sajeer',
  'സവാദ്': 'Sawad',
  'സഹൽ': 'Sahal',
  'സാജിർ': 'Sajir',
  'സാദിൻ': 'Sadin',
  'സാലിഹ്': 'Salih',
  'സിനാദ്': 'Sinad',
  'സിനാൻ': 'Sinan',
  'സിയാദ്': 'Siyad',
  'സിയാസ്': 'Siyas',
  'സിദ്ദീഖ്': 'Siddeeq',
  'സുഹൈബ്': 'Suhaib',
  'സുഹൈൽ': 'Suhail',
  'സ്വഫ്‌വാൻ': 'Safwan',
  'സ്വബീഹ്': 'Sabeeh',
  'സ്വാലിഹ്': 'Salih',
  'സൽമാനുൽ': 'Salmanul',
  'സൽമാൻ': 'Salman',
  'ഹകീം': 'Hakeem',
  'ഹഖ്': 'Haq',
  'ഹനാൻ': 'Hanan',
  'ഹല്ലാജ്': 'Hallaj',
  'ഹസീബ്': 'Haseeb',
  'ഹസൻ': 'Hasan',
  'ഹസ്സൻ': 'Hassan',
  'ഹുസൈൻ': 'Hussain',
  'ഹാദി': 'Hadi',
  'ഹാമിദ്': 'Hamid',
  'ഹാശിം': 'Hashim',
  'ഹാഷിം': 'Hashim',
  'ഹാശിർ': 'Hashir',

  // Places (Hometowns / Deshams)
  'അകംപാടം': 'Akampadam',
  'അത്താണിക്കൽ': 'Athanikkal',
  'അത്തോളി': 'Atholi',
  'അമ്പാഴക്കോട്': 'Ambazhakkode',
  'അമ്മിനിക്കാട്': 'Amminikkad',
  'അരിപ്ര': 'Aripara',
  'അരിമ്പ്ര': 'Arimbra',
  'അരിയൂർ': 'Ariyoor',
  'അരീക്കോട്': 'Areekode',
  'അറവങ്കര': 'Aravankara',
  'ആക്കോട്': 'Akkode',
  'ആതവനാട്': 'Athavanad',
  'ആനമങ്ങാട്': 'Aanamangad',
  'ആമയൂർ': 'Amayur',
  'ആലത്തൂർ': 'Alathoor',
  'ആലത്തൂർപടി': 'Alathurpadi',
  'ആൽപറമ്പ്': 'Alparamba',
  'ഇരിങ്ങാട്ടിരി': 'Iringattiri',
  'ഇരിങ്ങാവൂർ': 'Iringavoor',
  'ഇരുമ്പുഴി': 'Irumpuzhi',
  'എകരൂൽ': 'Ekarool',
  'എടക്കര': 'Edakkara',
  'എടവണ്ണ': 'Edavanna',
  'എറണാകുളം': 'Ernakulam',
  'എളമരം': 'Elamaram',
  'ഒറ്റപ്പാലം': 'Ottappalam',
  'കട്ടിലശ്ശേരി': 'Kattilassery',
  'കന്യാകുമാരി': 'Kanyakumari',
  'കമ്പളക്കാട്': 'Kambalakkad',
  'കരിങ്കല്ലത്താണി': 'Karinkallathani',
  'കരിപ്പൂർ': 'Karippur',
  'കരുവാരകുണ്ട്': 'Karuvarakundu',
  'കരുവാരക്കുണ്ട്': 'Karuvarakundu',
  'കണ്ണൂർ': 'Kannur',
  'കൽപ്പറ്റ': 'Kalpetta',
  'കാച്ചിനിക്കാട്': 'Kachinikkad',
  'കാഞ്ഞങ്ങാട്': 'Kanhangad',
  'കാപ്പ്': 'Kappu',
  'കാരത്തൂർ': 'Karathur',
  'കാളമ്പാടി': 'Kalambadi',
  'കാവനൂർ': 'Kavanur',
  'കാവുന്തറ': 'Kavunthara',
  'കാസറഗോഡ്': 'Kasaragod',
  'കിടങ്ങയം': 'Kidangayam',
  'കിളിനക്കോട്': 'Kilinakkode',
  'കിളിനക്കോട്': 'Kilinakkode',
  'കുന്നക്കാവ്': 'Kunnakkavu',
  'കുറ്റിപ്പുറം': 'Kuttippuram',
  'കൂട്ടായി': 'Koottayi',
  'കൂട്ടിലങ്ങാടി': 'Koottilangadi',
  'കൂത്തുപറമ്പ്': 'Koothuparamba',
  'കൂറ്റമ്പാറ': 'Koottambara',
  'കെകീഴാറ്റൂർ': 'K. Keezhattur',
  'കൊല്ലം': 'Kollam',
  'കൊല്ലം': 'Kollam',
  'കൊളപ്പുറം': 'Kolappuram',
  'കോഴിക്കോട്': 'Kozhikode',
  'കോഴിക്കോട്': 'Kozhikode',
  'കൊട്ടാരക്കര': 'Kottarakkara',
  'കൊണ്ടോട്ടി': 'Kondotty',
  'കോട്ടക്കൽ': 'Kottakkal',
  'ഗൂഡല്ലൂർ': 'Gudalur',
  'ചട്ടിപ്പറമ്പ്': 'Chattipparamba',
  'ചാപ്പനങ്ങാടി': 'Chappanangadi',
  'ചാലക്കുടി': 'Chalakudy',
  'ചാവക്കാട്': 'Chavakkad',
  'ചുങ്കത്തറ': 'Chungathara',
  'ചെട്ടിപ്പടി': 'Chettippadi',
  'ചെമ്മലശ്ശേരി': 'Chemmalassery',
  'ചെമ്മാട്': 'Chemmad',
  'ചെറുകുന്ന്': 'Cherukunnu',
  'ചെറുകുളമ്പ്': 'Cherukulamba',
  'ചെറുപ്പുളശ്ശേരി': 'Cherpulassery',
  'ചെർപ്പുളശ്ശേരി': 'Cherpulassery',
  'ചെർക്കള': 'Cherkkala',
  'ചേലേമ്പ്ര': 'Chelembra',
  'ചോളോട്': 'Cholode',
  'ചോളോട്': 'Cholode',
  'തള്ളച്ചിറ': 'Thallachira',
  'താമരശ്ശേരി': 'Thamarassery',
  'താനൂർ': 'Tanur',
  'തവനൂർ': 'Thavanur',
  'തിരുവിഴാംകുന്ന്': 'Thiruvizhamkunnu',
  'തിരൂർ': 'Tirur',
  'തുവ്വൂർ': 'Thuvvoor',
  'തൃക്കരിപ്പൂർ': 'Thrikkaripur',
  'തൃപ്പനച്ചി': 'Thrippanachi',
  'തേലക്കാട്': 'Thelakkad',
  'തൊടുപുഴ': 'Thodupuzha',
  'നറുക്കോട്': 'Narukkode',
  'നാട്ടുകൽ': 'Nattukal',
  'നിലമ്പൂർ': 'Nilambur',
  'നീലാഞ്ചേരി': 'Neelanchery',
  'നെന്മിനി': 'Nenmini',
  'പടിക്കൽ': 'Padikkal',
  'പടിഞ്ഞാറ്റുമുറി': 'Padinjattumuri',
  'പരപ്പനങ്ങാടി': 'Parappanangadi',
  'പരിയാപുരം': 'Pariyapuram',
  'പറപ്പൂർ': 'Parappur',
  'പള്ളിക്കൽ': 'Pallikkal',
  'പള്ളിപ്പുറം': 'Pallippuram',
  'പഴമള്ളൂർ': 'Pazhamalloor',
  'പാങ്ങ്': 'Pang',
  'പാട്ടക്കരിമ്പ്': 'Pattakarimbu',
  'പാണക്കാട്': 'Panakkad',
  'പാണ്ടിക്കാട്': 'Pandikkad',
  'പാതിരമണ്ണ': 'Pathiramanna',
  'പാപ്പിനിശ്ശേരി': 'Pappinissery',
  'പാറക്കണ്ണി': 'Parakkanni',
  'പാലക്കാട്': 'Palakkad',
  'പുല്ലാനൂർ': 'Pullanur',
  'പുലാമന്തോൾ': 'Pulamanthole',
  'പെരിന്തൽമണ്ണ': 'Perinthalmanna',
  'പൊൻമള': 'Ponmala',
  'പേരാമ്പ്ര': 'Perambra',
  'പൊന്നാനി': 'Ponnani',
  'ബസാർ': 'Bazaar',
  'ഭീമനാട്': 'Bheemanad',
  'മടവൂർ': 'Madavoor',
  'മണലായ': 'Manalaya',
  'മണ്ണാർക്കാട്': 'Mannarkkad',
  'മണ്ണാർമല': 'Mannarmala',
  'മരുത': 'Marutha',
  'മഞ്ചേരി': 'Manjeri',
  'മലപ്പുറം': 'Malappuram',
  'മക്കരപ്പറമ്പ്': 'Makkaraparamba',
  'മാരായമംഗലം': 'Marayamangalam',
  'മീനാർക്കുഴി': 'Meenarkkuzhi',
  'മുള്ളമ്പാറ': 'Mullampara',
  'മേൽമുറി': 'Melmuri',
  'മേലാറ്റൂർ': 'Melattur',
  'രാമപുരം': 'Ramapuram',
  'വടകര': 'Vadakara',
  'വടക്കാഞ്ചേരി': 'Vadakkanchery',
  'വയനാട്': 'Wayanad',
  'വല്ലപ്പുഴ': 'Vallappuzha',
  'വളമംഗലം': 'Valamangalam',
  'വളാഞ്ചേരി': 'Valanchery',
  'വള്ളുവങ്ങാട്': 'Valluvangad',
  'വഴിക്കടവ്': 'Vazhikkadavu',
  'വാണിയമ്പലം': 'Vaniyambalam',
  'വാളാട്': 'Valad',
  'വണ്ടൂർ': 'Wandoor',
  'വിളയൂർ': 'Vilayur',
  'വെട്ടം': 'Vettom',
  'വെട്ടിച്ചിറ': 'Vettichira',
  'വെള്ളമുണ്ട': 'Vellamunda',
  'വെള്ളില': 'Vellila',
  'വേങ്ങര': 'Vengara',
  'വേങ്ങൂർ': 'Vengoor',

  // Initials
  'എ': 'A.',
  'എം': 'M.',
  'എംകെ': 'M.K.',
  'എസ്': 'S.',
  'എൻ': 'N.',
  'ഐ': 'I.',
  'കെ': 'K.',
  'ടി': 'T.',
  'പി': 'P.',
  'പികെ': 'P.K.',
  'വി': 'V.',
  'വികെ': 'V.K.',
  'വിപി': 'V.P.',
  'സി': 'C.',
  'സിഎം': 'C.M.',
  'സികെ': 'C.K.'
};

function transliterateWord(rawWord) {
  let clean = rawWord.trim();
  if (!clean) return '';

  // Extract leading / trailing punctuation (like . , or initials like .ടി)
  let leadingPunct = '';
  let trailingPunct = '';
  
  if (clean.startsWith('.')) {
    leadingPunct = '.';
    clean = clean.slice(1);
  }
  if (clean.endsWith('.')) {
    trailingPunct = '.';
    clean = clean.slice(0, -1);
  }

  // Exact word match
  if (MALAYALAM_TO_ENGLISH_WORDS[clean]) {
    const res = MALAYALAM_TO_ENGLISH_WORDS[clean];
    // If the matched word already ends with a dot (like "V.P."), don't duplicate
    if (res.endsWith('.') && (trailingPunct === '.' || leadingPunct === '.')) {
      return res;
    }
    return leadingPunct + res + trailingPunct;
  }

  // Letter by letter fallback map
  const chilluMap = {
    'ർ': 'r', 'ൽ': 'l', 'ൾ': 'l', 'ൻ': 'n', 'ൺ': 'n', 'ൿ': 'k',
    '\u200C': '', '\u200D': '', '‌': '', '‍': ''
  };

  const charMap = {
    'അ': 'A', 'ആ': 'Aa', 'ഇ': 'I', 'ഈ': 'Ee', 'ഉ': 'U', 'ഊ': 'Oo', 'ഋ': 'Ru',
    'എ': 'E', 'ഏ': 'E', 'ഐ': 'Ai', 'ഒ': 'O', 'ഓ': 'O', 'ഔ': 'Au',
    'ക': 'k', 'ഖ': 'kh', 'ഗ': 'g', 'ഘ': 'gh', 'ങ': 'ng',
    'ച': 'ch', 'ഛ': 'chh', 'ജ': 'j', 'ഝ': 'jh', 'ഞ': 'nj',
    'ട': 't', 'ഠ': 'th', 'ഡ': 'd', 'ഢ': 'dh', 'ണ': 'n',
    'ത': 'th', 'ഥ': 'th', 'ദ': 'd', 'ധ': 'dh', 'ന': 'n',
    'പ': 'p', 'ഫ': 'f', 'ബ': 'b', 'ഭ': 'bh', 'മ': 'm',
    'യ': 'y', 'ര': 'r', 'ല': 'l', 'വ': 'v', 'ശ': 'sh', 'ഷ': 'sh', 'സ': 's', 'ഹ': 'h',
    'ള': 'l', 'ഴ': 'zh', 'റ': 'r',
    'ാ': 'a', 'ി': 'i', 'ീ': 'ee', 'ു': 'u', 'ൂ': 'oo', 'ൃ': 'ru',
    'െ': 'e', 'േ': 'e', 'ൈ': 'ai', 'ൊ': 'o', 'ോ': 'o', 'ൗ': 'au',
    '്': '', 'ം': 'm', 'ഃ': 'h'
  };

  let cleanStr = clean;
  for (const [ch, rep] of Object.entries(chilluMap)) {
    cleanStr = cleanStr.split(ch).join(rep);
  }

  let res = '';
  for (let i = 0; i < cleanStr.length; i++) {
    const ch = cleanStr[i];
    if (charMap[ch] !== undefined) {
      res += charMap[ch];
    } else {
      res += ch;
    }
  }
  res = res.replace(/[^a-zA-Z0-9\s.-]/g, '');
  const out = res ? res.charAt(0).toUpperCase() + res.slice(1) : clean;
  return leadingPunct + out + trailingPunct;
}

function transliterateName(mlName) {
  if (!mlName) return '';
  // Normalize leading dot on initials: e.g. " .ടി" or ".ടി" -> " ടി."
  let normalized = mlName
    .replace(/(^|\s)\.\s*([^\s.]+)/g, '$1$2.')
    .replace(/\.([^\s])/g, '. $1')
    .replace(/\s+/g, ' ');

  const parts = normalized.split(/\s+/).filter(Boolean);
  const resultParts = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === '.') {
      if (resultParts.length > 0 && !resultParts[resultParts.length - 1].endsWith('.')) {
        resultParts[resultParts.length - 1] += '.';
      }
    } else {
      resultParts.push(transliterateWord(part));
    }
  }

  return resultParts
    .join(' ')
    .replace(/\s+\./g, '.')
    .replace(/([a-zA-Z]{3,})\.$/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBatchForToken(tokenNo) {
  const t = Number(tokenNo);
  if (t >= 177 && t <= 197) return 'Batch 1';
  if (t >= 159 && t <= 176) return 'Batch 2';
  if (t >= 128 && t <= 158) return 'Batch 3';
  if (t >= 95 && t <= 127)  return 'Batch 4';
  if (t >= 70 && t <= 94)   return 'Batch 5';
  if (t >= 36 && t <= 69)   return 'Batch 6';
  if (t >= 1 && t <= 35)    return 'Batch 7';
  return 'General';
}

module.exports = {
  transliterateName,
  getBatchForToken,
  MALAYALAM_TO_ENGLISH_WORDS
};
