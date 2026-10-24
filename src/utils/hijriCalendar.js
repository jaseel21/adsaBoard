/**
 * Advanced Hijri (Islamic Lunar) Calendar Engine
 * Specifically tailored for Alathurpadi Dars / Kerala, India context.
 *
 * Supports:
 * 1. Astronomical Umm al-Qura base calculation
 * 2. Regional Hilal (moon-sighting) calibration offset (-2, -1, 0, +1, +2 days)
 * 3. Complete English, Malayalam, and Arabic month names
 * 4. Islamic milestones: Sacred Months (Al-Ashhur Al-Hurum), White Fasting Days (Ayyam al-Beed), Friday Jumu'ah, Ramadan, and Eids
 */

export const HIJRI_MONTHS_EN = [
  'Muharram',
  'Safar',
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  'Jumada al-Ula',
  'Jumada al-Ukhra',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
];

export const HIJRI_MONTHS_ML = [
  'മുഹറം',
  'സഫർ',
  'റബീഉൽ അവ്വൽ',
  'റബീഉൽ ആഖിർ',
  'ജമാദുൽ അവ്വൽ',
  'ജമാദുൽ ആഖിർ',
  'റജബ്',
  'ശഅ്ബാൻ',
  'റമളാൻ',
  'ശവ്വാൽ',
  'ദുൽഖഅ്ദ്',
  'ദുൽഹിജ്ജ',
];

export const HIJRI_MONTHS_AR = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

/**
 * Sacred Islamic Months (Al-Ashhur Al-Hurum: Muharram, Rajab, Dhu al-Qi'dah, Dhu al-Hijjah)
 * 0-indexed: 0 = Muharram, 6 = Rajab, 10 = Dhu al-Qi'dah, 11 = Dhu al-Hijjah
 */
export const SACRED_MONTH_INDICES = [0, 6, 10, 11];

/**
 * Computes calibrated Hijri date with regional moon-sighting adjustment
 *
 * @param {Date|number|string} dateInput - Baseline date (e.g. current IST date)
 * @param {number} offsetDays - Regional sighting offset (-2, -1, 0, +1, +2)
 * @returns {Object} Full Hijri date object with metadata
 */
export function getCalibratedHijriDate(dateInput = new Date(), offsetDays = 0) {
  try {
    const baseDate = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(baseDate.getTime())) {
      throw new Error('Invalid date input for Hijri calculation');
    }

    // Apply moon-sighting adjustment offset in milliseconds
    const adjustedEpoch = baseDate.getTime() + (Number(offsetDays) || 0) * 86400000;
    const adjustedDate = new Date(adjustedEpoch);

    // Use Intl DateTimeFormat with islamic-umalqura calendar
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });

    const parts = formatter.formatToParts(adjustedDate);
    let day = 1;
    let monthNum = 1; // 1-12
    let year = 1448;

    parts.forEach((p) => {
      if (p.type === 'day') day = parseInt(p.value, 10) || 1;
      if (p.type === 'month') monthNum = parseInt(p.value, 10) || 1;
      if (p.type === 'year') {
        // Strip non-numeric artifacts (e.g. "1448 AH" -> 1448)
        year = parseInt(p.value.replace(/\D/g, ''), 10) || 1448;
      }
    });

    const monthIndex = Math.max(0, Math.min(11, monthNum - 1));
    const monthNameEn = HIJRI_MONTHS_EN[monthIndex] || 'Muharram';
    const monthNameMl = HIJRI_MONTHS_ML[monthIndex] || 'മുഹറം';
    const monthNameAr = HIJRI_MONTHS_AR[monthIndex] || 'محرم';

    const isSacredMonth = SACRED_MONTH_INDICES.includes(monthIndex);
    const isAyyamAlBeed = day === 13 || day === 14 || day === 15;
    const isRamadan = monthIndex === 8;
    const isFriday = adjustedDate.getDay() === 5;

    // Detect Major Islamic Special Occasions
    let specialEventEn = null;
    let specialEventMl = null;

    if (monthIndex === 0 && day === 1) {
      specialEventEn = 'Islamic New Year';
      specialEventMl = 'ഹിജ്റ പുതുവർഷം';
    } else if (monthIndex === 0 && day === 10) {
      specialEventEn = 'Day of Ashura';
      specialEventMl = 'ആശൂറാ ദിനം';
    } else if (monthIndex === 2 && day === 12) {
      specialEventEn = 'Milad un-Nabi';
      specialEventMl = 'നബിദിനം (മീലാദ്)';
    } else if (monthIndex === 6 && day === 27) {
      specialEventEn = "Isra' & Mi'raj";
      specialEventMl = 'ഇസ്റാഅ് & മിഅ്റാജ്';
    } else if (monthIndex === 7 && day === 15) {
      specialEventEn = "Bara'at Night (Nisfu Sha'ban)";
      specialEventMl = 'ബറാഅത്ത് രാവ്';
    } else if (monthIndex === 8) {
      specialEventEn = day === 27 ? 'Laylat al-Qadr (Estimated)' : 'Holy Month of Ramadan';
      specialEventMl = day === 27 ? 'ലൈലത്തുൽ ഖദ്ർ (27-ാം രാവ്)' : 'വിശുദ്ധ റമളാൻ';
    } else if (monthIndex === 9 && day === 1) {
      specialEventEn = 'Eid al-Fitr';
      specialEventMl = 'ചെറിയ പെരുന്നാൾ (ഈദുൽ ഫിത്വർ)';
    } else if (monthIndex === 11 && day === 9) {
      specialEventEn = 'Day of Arafah';
      specialEventMl = 'അറഫാ ദിനം';
    } else if (monthIndex === 11 && day === 10) {
      specialEventEn = 'Eid al-Adha';
      specialEventMl = 'ബലിപെരുന്നാൾ (ഈദുൽ അള്ഹ)';
    } else if (monthIndex === 11 && (day === 11 || day === 12 || day === 13)) {
      specialEventEn = 'Days of Tashreeq';
      specialEventMl = 'തശ്രീഖിന്റെ ദിനങ്ങൾ';
    }

    const formattedEn = `${day} ${monthNameEn} ${year} AH`;
    const formattedMl = `${day} ${monthNameMl} ${year} ഹിജ്റ`;
    const compactEn = `${day} ${monthNameEn}`;
    const compactMl = `${day} ${monthNameMl}`;

    return {
      day,
      month: monthNum,
      monthIndex,
      year,
      monthNameEn,
      monthNameMl,
      monthNameAr,
      formattedEn,
      formattedMl,
      compactEn,
      compactMl,
      offsetDays: Number(offsetDays) || 0,
      isSacredMonth,
      isAyyamAlBeed,
      isRamadan,
      isFriday,
      specialEventEn,
      specialEventMl,
    };
  } catch (error) {
    console.warn('Error computing calibrated Hijri date:', error);
    return {
      day: 1,
      month: 1,
      monthIndex: 0,
      year: 1448,
      monthNameEn: 'Muharram',
      monthNameMl: 'മുഹറം',
      monthNameAr: 'محرم',
      formattedEn: '1 Muharram 1448 AH',
      formattedMl: '1 മുഹറം 1448 ഹിജ്റ',
      compactEn: '1 Muharram',
      compactMl: '1 മുഹറം',
      offsetDays: 0,
      isSacredMonth: true,
      isAyyamAlBeed: false,
      isRamadan: false,
      isFriday: false,
      specialEventEn: null,
      specialEventMl: null,
    };
  }
}
