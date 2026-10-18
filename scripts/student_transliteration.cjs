/**
 * Accurate Malayalam to English transliteration for Kerala Dars student names
 */

const MALAYALAM_TO_ENGLISH_WORDS = {
  'അൽഅമീൻ': 'Al-Ameen',
  'അൽ അമീൻ': 'Al-Ameen',
  'ഹാഫിള്': 'Hafiz',
  'ഹാഫിസ്': 'Hafiz',
  'മുഹമ്മദ്': 'Muhammed',
  'മുഹമ്മദ്‌': 'Muhammed',
  'മുഹമ്മദ് ': 'Muhammed',
  'മുഹമ്മദ്': 'Muhammed',
  'അലി': 'Ali',
  'ജൗഹർ': 'Jauhar',
  'ചെർക്കള': 'Cherkkala',
  'അമീൻ': 'Ameen',
  'നിഷാൽ': 'Nishal',
  'അരീക്കോട്': 'Areekode',
  'സിനാൻ': 'Sinan',
  'മേൽമുറി': 'Melmuri',
  'റിസ്വാൻ': 'Rizwan',
  'ആക്കോട്': 'Akkode',
  'സ്വാലിഹ്': 'Salih',
  'സാലിഹ്': 'Salih',
  'കാപ്പ്': 'Kappu',
  'മിൻഹാജുൽ': 'Minhajul',
  'ഹഖ്': 'Haq',
  'ആലത്തൂർപടി': 'Alathurpadi',
  'മുഹ്സിൻ': 'Muhsin',
  'മുഹ്‌സിൻ': 'Muhsin',
  'മുള്ളമ്പാറ': 'Mullampara',
  'സുഹൈബ്': 'Suhaib',
  'അമ്പാഴക്കോട്': 'Ambazhakkode',
  'ജവാദ്': 'Jawad',
  'വെള്ളില': 'Vellila',
  'രാമപുരം': 'Ramapuram',
  'നറുക്കോട്': 'Narukkode',
  'മുനവ്വർ': 'Munawwar',
  'കിളിനക്കോട്': 'Kilinakkode',
  'റംഷാദ്': 'Ramshad',
  'വള്ളുവങ്ങാട്': 'Valluvangad',
  'റിൻഷാദ്': 'Rinshad',
  'പാങ്ങ്': 'Pang',
  'ശംനാദ്': 'Shamnad',
  'കിടങ്ങയം': 'Kidangayam',
  'നാഫി': 'Nafi',
  'ഉമറുൽ': 'Umarul',
  'ഫാറൂഖ്': 'Farooq',
  'റഈസ്': 'Raees',
  'വെള്ളമുണ്ട': 'Vellamunda',
  'നിഹാൽ': 'Nihal',
  'അഹ്മദ്': 'Ahmad',
  'അഹമ്മദ്': 'Ahmad',
  'കമ്പളക്കാട്': 'Kambalakkad',
  'മുബാറക്': 'Mubarak',
  'വടക്കാഞ്ചേരി': 'Vadakkanchery',
  'സുഹൈൽ': 'Suhail',
  'ചോളോട്': 'Cholode',
  'ചോളോട്': 'Cholode',
  'അബ്ദുൽ': 'Abdul',
  'ഹസീബ്': 'Haseeb',
  'മണ്ണാർക്കാട്': 'Mannarkkad',
  'ജാസിർ': 'Jasir',
  'ഷാക്കിർ': 'Shakir',
  'തൊടുപുഴ': 'Thodupuzha',
  'അഫ്സൽ': 'Afsal',
  'തവനൂർ': 'Thavanur',
  'നബീൽ': 'Nabeel',
  'കൽപ്പറ്റ': 'Kalpetta',
  'ബാസിത്': 'Basith',
  'ബാസിത്ത്': 'Basith',
  'മുസ്തഫ': 'Musthafa',
  'കരുവാരക്കുണ്ട്': 'Karuvarakundu',
  'റബീഹ്': 'Rabeeh',
  'വണ്ടൂർ': 'Wandoor',
  'അജ്മൽ': 'Ajmal',
  'കണ്ണൂർ': 'Kannur',
  'നിസാം': 'Nizam',
  'കോഴിക്കോട്': 'Kozhikode',
  'ശാക്കിർ': 'Shakir',
  'ഫായിസ്': 'Fayis',
  'താനൂർ': 'Tanur',
  'സിദ്ദീഖ്': 'Siddeeq',
  'റഷീദ്': 'Rasheed',
  'മജീദ്': 'Majeed',
  'ഹുസൈൻ': 'Hussain',
  'ഹസൻ': 'Hasan',
  'ഹസ്സൻ': 'Hassan',
  'ഉവൈസ്': 'Uwais',
  'അർഷദ്': 'Arshad',
  'റയ്യാൻ': 'Rayyan',
  'ഷാഫി': 'Shafi',
  'ഷാഫിൽ': 'Shafil',
  'നൗഫൽ': 'Noufal',
  'സൽമാൻ': 'Salman',
  'ഫാരിസ്': 'Faris',
  'ദാരിമി': 'Darimi',
  'ഫാറൂഖി': 'Farooqi',
  'മഞ്ചേരി': 'Manjeri',
  'മലപ്പുറം': 'Malappuram',
  'തിരൂർ': 'Tirur',
  'കൊണ്ടോട്ടി': 'Kondotty',
  'കോട്ടക്കൽ': 'Kottakkal',
  'പെരിന്തൽമണ്ണ': 'Perinthalmanna',
  'നിലമ്പൂർ': 'Nilambur',
  'എടവണ്ണ': 'Edavanna',
  'മക്കരപ്പറമ്പ്': 'Makkaraparamba',
  'കൂറ്റമ്പാറ': 'Koottambara',
  'പാണ്ടിക്കാട്': 'Pandikkad',
  'മേലാറ്റൂർ': 'Melattur',
  'പുലാമന്തോൾ': 'Pulamanthole',
  'വളാഞ്ചേരി': 'Valanchery',
  'കുറ്റിപ്പുറം': 'Kuttippuram',
  'പൊന്നാനി': 'Ponnani',
  'ചെമ്മാട്': 'Chemmad',
  'വേങ്ങര': 'Vengara',
  'പരപ്പനങ്ങാടി': 'Parappanangadi'
};

function transliterateWord(w) {
  const clean = w.trim();
  if (!clean) return '';
  if (MALAYALAM_TO_ENGLISH_WORDS[clean]) return MALAYALAM_TO_ENGLISH_WORDS[clean];

  // Chillu letters and special characters
  const chilluMap = {
    'ർ': 'r', 'ൽ': 'l', 'ൾ': 'l', 'ൻ': 'n', 'ൺ': 'n', 'ൿ': 'k',
    '\u200C': '', '\u200D': '', '‌': '', '‍': ''
  };

  // Letter by letter fallback map
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
  // Clean up any double spaces or odd characters
  res = res.replace(/[^a-zA-Z0-9\s.-]/g, '');
  return res ? res.charAt(0).toUpperCase() + res.slice(1) : clean;
}

function transliterateName(mlName) {
  if (!mlName) return '';
  const parts = mlName.split(/\s+/);
  return parts.map(p => transliterateWord(p)).join(' ').trim();
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
  getBatchForToken
};
