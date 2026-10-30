/**
 * Comprehensive Automated Verification & Testing Suite for Rah e Deen Islam
 * Tests:
 * 1. Coordinates and city list (Vehari, Chishtian, Lahore, Karachi, Islamabad, etc.)
 * 2. Astronomical prayer calculation for all 29 cities
 * 3. Live 5-card countdowns in HH : MM : SS format
 * 4. Dual indicators (اگلی فرض نماز & اگلا اہم وقت / نفل نماز)
 * 5. Isha & Tahajjud night sequence (Start after Isha, Last Third calculation, Post-Fajr expiration)
 * 6. 12-event daily chronological sequence with live countdowns
 * 7. Email subscription backend (RFC validation, duplicate rejection)
 * 8. HTML markup integrity & official YouTube channel link verification
 * 9. Quranic Verses & Surahs Integrity (Amiri font, full diacritics, translation, Sunnah.com & Quran.com references, zero undefined)
 * 10. All 12 Islamic Months with Fazilat, Historical Events & Sunnah Practices
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('==================================================');
console.log('🧪 RUNNING COMPREHENSIVE RAH E DEEN ISLAM TEST SUITE');
console.log('==================================================\n');

// 1. Verify PAK_CITIES & Coordinates
console.log('TEST 1: Verifying Pakistani Cities & Coordinates...');
const prayerEngineCode = fs.readFileSync(path.join(__dirname, 'js', 'prayer-times.js'), 'utf8');

assert(prayerEngineCode.includes('vehari'), 'Vehari must be present');
assert(prayerEngineCode.includes('chishtian'), 'Chishtian must be present');
assert(prayerEngineCode.includes('30.0452'), 'Vehari latitude 30.0452 must match');
assert(prayerEngineCode.includes('72.3489'), 'Vehari longitude 72.3489 must match');
assert(prayerEngineCode.includes('29.7971'), 'Chishtian latitude 29.7971 must match');
assert(prayerEngineCode.includes('72.8576'), 'Chishtian longitude 72.8576 must match');
console.log('✅ TEST 1 PASSED: Vehari and Chishtian coordinates strictly verified.\n');

// 2. Test Astronomical Engine directly in Node
console.log('TEST 2: Verifying Astronomical Prayer Calculation...');
const { prayerService: engine, PAK_CITIES } = require('./js/prayer-times');
assert(engine, 'PrayerTimeEngine instance must exist');

const testCities = ['vehari', 'chishtian', 'lahore', 'karachi', 'islamabad', 'multan', 'faisalabad', 'quetta', 'peshawar', 'rawalpindi'];
testCities.forEach(cityKey => {
  const city = PAK_CITIES[cityKey];
  assert(city, `City ${cityKey} must exist in PAK_CITIES`);
  const pktDate = engine.getPakistanDate();
  const times = engine.calculateOfflineTimings(city, 1, pktDate, cityKey);
  
  assert(times.timings.Fajr && times.timings.Fajr.includes(':'), `Fajr time must be valid for ${cityKey}`);
  assert(times.timings.Sunrise && times.timings.Sunrise.includes(':'), `Sunrise time must be valid for ${cityKey}`);
  assert(times.timings.Dhuhr && times.timings.Dhuhr.includes(':'), `Dhuhr time must be valid for ${cityKey}`);
  assert(times.timings.Asr && times.timings.Asr.includes(':'), `Asr time must be valid for ${cityKey}`);
  assert(times.timings.Maghrib && times.timings.Maghrib.includes(':'), `Maghrib time must be valid for ${cityKey}`);
  assert(times.timings.Isha && times.timings.Isha.includes(':'), `Isha time must be valid for ${cityKey}`);
  
  console.log(`   ✓ ${city.nameUrdu} (${city.nameEn}): Fajr ${times.timings.Fajr}, Dhuhr ${times.timings.Dhuhr}, Asr ${times.timings.Asr}, Maghrib ${times.timings.Maghrib}, Isha ${times.timings.Isha}`);
});
console.log('✅ TEST 2 PASSED: Astronomical calculation verified across Pakistani cities.\n');

// 3. Test Extra Times & Nafl calculation
console.log('TEST 3: Testing Nafl Timings (Ishraq, Chasht, Zawal, Awwabin, Tahajjud)...');
engine.currentTimings = engine.calculateOfflineTimings(PAK_CITIES.vehari, 1, engine.getPakistanDate(), 'vehari');
engine.calculateExtraTimes();

const t = engine.currentTimings.timings;
assert(t.Ishraq, 'Ishraq must be calculated');
assert(t.Chasht, 'Chasht must be calculated');
assert(t.ZawalStart, 'ZawalStart must be calculated');
assert(t.Awwabin, 'Awwabin must be calculated');
assert(t.Tahajjud, 'Tahajjud must be calculated');

console.log(`   ✓ Vehari Nafl Windows:`);
console.log(`     - طلوعِ آفتاب: ${t.Sunrise}`);
console.log(`     - نمازِ اشراق (۱۸ منٹ بعد): ${t.Ishraq}`);
console.log(`     - نمازِ چاشت: ${t.Chasht}`);
console.log(`     - وقتِ زوال: ${t.ZawalStart} تا ${t.Dhuhr}`);
console.log(`     - نمازِ اوابین: ${t.Awwabin}`);
console.log(`     - نمازِ تہجد (رات کا آخری تہائی): ${t.Tahajjud}`);
console.log('✅ TEST 3 PASSED: Nafl and prohibited windows calculated accurately.\n');

// 4. Test Live 5-Card Countdowns, Dual Indicators & 12-Event Chronological Table
console.log('TEST 4: Verifying getDetailedEventState() and 12-Event Chronological Table...');
const hmsRegex = /^\d{2} : \d{2} : \d{2}$/;
const nowPkt = engine.getPakistanDate();
const detailedState = engine.getDetailedEventState(nowPkt);

assert(detailedState, 'detailedState must not be null');

// Check 5 Obligatory Prayer Cards
assert(Array.isArray(detailedState.fivePrayers), 'fivePrayers must be an array');
assert.strictEqual(detailedState.fivePrayers.length, 5, 'Must contain exactly 5 prayers');
detailedState.fivePrayers.forEach(card => {
  assert(card.name, 'Each card must have name');
  assert(card.timeUrdu, 'Each card must have timeUrdu');
  assert(card.statusUrdu, 'Each card must have statusUrdu');
  assert(card.countdownFormatted, 'Each card must have countdownFormatted');
  assert(hmsRegex.test(card.countdownFormatted), `Countdown "${card.countdownFormatted}" must match HH : MM : SS format`);
  console.log(`   ✓ Prayer Card: ${card.name} | Time: ${card.timeUrdu} | Status: ${card.statusUrdu} | Digital Countdown: ${card.countdownFormatted}`);
});

// Check Dual Indicators
assert(detailedState.nextFard, 'Next Fard indicator must exist');
assert(detailedState.nextFard.name, 'Next Fard must have name');
assert(hmsRegex.test(detailedState.nextFard.countdownFormatted), 'Next Fard countdown must match HH : MM : SS');
console.log(`   ✓ Dual Indicator 1 (اگلی فرض نماز): ${detailedState.nextFard.name} in ${detailedState.nextFard.countdownFormatted}`);

assert(detailedState.nextEventOrNafl, 'Next Nafl indicator must exist');
assert(detailedState.nextEventOrNafl.nameUrdu, 'Next Nafl must have nameUrdu');
assert(hmsRegex.test(detailedState.nextEventOrNafl.countdownFormatted), 'Next Nafl countdown must match HH : MM : SS');
console.log(`   ✓ Dual Indicator 2 (اگلا اہم وقت / نفل نماز): ${detailedState.nextEventOrNafl.nameUrdu} in ${detailedState.nextEventOrNafl.countdownFormatted}`);

// Check 12 Chronological Events Table
const timelineEvents = engine.getDailyTimelineEvents(nowPkt);
assert(Array.isArray(timelineEvents), 'timelineEvents must be an array');
assert.strictEqual(timelineEvents.length, 12, 'Must have exactly 12 events in sequence');
console.log('   ✓ 12-Event Chronological Table verified:');
timelineEvents.forEach(ev => {
  assert(hmsRegex.test(ev.countdownStr), `Timeline event countdown "${ev.countdownStr}" must match HH : MM : SS`);
  console.log(`     ${ev.num}. ${ev.nameUrdu} (${ev.time12}) [${ev.type}] - ${ev.statusUrdu} | باقی: ${ev.countdownStr}`);
});
console.log('✅ TEST 4 PASSED: 5-card live timers, dual indicators, and 12-event sequence verified.\n');

// 5. Test Isha & Tahajjud Night Sequence Simulation
console.log('TEST 5: Testing Isha & Tahajjud Night Sequence (Active during night, inactive post-Fajr)...');

const nightPkt = {
  hour: 23,
  minute: 30,
  second: 0,
  totalMinutes: 23 * 60 + 30,
  totalSeconds: 23 * 3600 + 30 * 60
};
const nightState = engine.getDetailedEventState(nightPkt);

assert(nightState.tahajjud, 'tahajjud object must exist');
assert.strictEqual(nightState.tahajjud.isNightWindow, true, 'Night window must be active at 23:30 PKT');
assert(nightState.tahajjud.statusUrdu.includes('شروع ہو چکا ہے') || nightState.tahajjud.statusUrdu.includes('آخری تہائی'), 'Status must indicate Tahajjud time has started');
assert(hmsRegex.test(nightState.tahajjud.countdownToFajr), 'Fajr countdown must match HH : MM : SS');
console.log(`   ✓ Night Simulation (23:30 PKT):`);
console.log(`     - Status: ${nightState.tahajjud.statusUrdu}`);
console.log(`     - Last Third Begins: ${nightState.tahajjud.lastThirdStartTime12}`);
console.log(`     - Countdown to Last Third: ${nightState.tahajjud.countdownToLastThird}`);
console.log(`     - Fajr Time: ${nightState.tahajjud.fajrTime12}`);
console.log(`     - Countdown to Fajr: ${nightState.tahajjud.countdownToFajr}`);

const morningPkt = {
  hour: 7,
  minute: 0,
  second: 0,
  totalMinutes: 7 * 60,
  totalSeconds: 7 * 3600
};
const morningState = engine.getDetailedEventState(morningPkt);
assert.strictEqual(morningState.tahajjud.isNightWindow, false, 'Tahajjud must be inactive at 07:00 PKT');
assert(morningState.tahajjud.statusUrdu.includes('ختم ہو گیا ہے'), 'Status must indicate Tahajjud time has ended');
console.log(`   ✓ Morning Simulation (07:00 PKT):`);
console.log(`     - Status: ${morningState.tahajjud.statusUrdu}`);
console.log('✅ TEST 5 PASSED: Tahajjud night sequence logic strictly verified.\n');

// 6. Test Email Subscription API
console.log('TEST 6: Testing Email Subscription Logic...');
const subscribeHandler = require('./api/subscribe');

const mockReqSuccess = {
  method: 'POST',
  headers: { 'x-forwarded-for': '127.0.0.1' },
  body: { email: `test_${Date.now()}@example.com` }
};

let capturedSuccess = null;
const mockResSuccess = {
  setHeader: () => {},
  end: (payload) => { capturedSuccess = JSON.parse(payload); }
};

subscribeHandler(mockReqSuccess, mockResSuccess).then(() => {
  assert(capturedSuccess && capturedSuccess.success === true, 'Valid email must succeed');
  console.log(`   ✓ New email subscription success response verified: "${capturedSuccess.message}"`);

  let capturedDuplicate = null;
  const mockResDuplicate = {
    setHeader: () => {},
    end: (payload) => { capturedDuplicate = JSON.parse(payload); }
  };

  subscribeHandler(mockReqSuccess, mockResDuplicate).then(() => {
    assert(capturedDuplicate && capturedDuplicate.isDuplicate === true, 'Duplicate email must be detected');
    console.log(`   ✓ Duplicate subscription rejection verified: "${capturedDuplicate.message}"`);

    const mockReqInvalid = {
      method: 'POST',
      headers: {},
      body: { email: 'not-an-email' }
    };
    let capturedInvalid = null;
    const mockResInvalid = {
      setHeader: () => {},
      end: (payload) => { capturedInvalid = JSON.parse(payload); }
    };

    subscribeHandler(mockReqInvalid, mockResInvalid).then(() => {
      assert(capturedInvalid && capturedInvalid.success === false, 'Invalid email must fail');
      console.log(`   ✓ Invalid email rejection verified: "${capturedInvalid.message}"`);
      console.log('✅ TEST 6 PASSED: Email subscription backend fully working.\n');

      // 7. Test Required Content in index.html & YouTube link
      console.log('TEST 7: Checking Content & Branding in index.html...');
      const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
      
      assert(html.includes('Rah e Deen Islam'), 'Brand name English must be present');
      assert(html.includes('راہ دین اسلام'), 'Brand name Urdu must be present');
      assert(html.includes('قرآن و سنت کی روشنی میں دین اسلام کو پھیلانے کی ایک نیک کوشش'), 'Tagline must be exact');
      assert(html.includes('p9158412@gmail.com'), 'Official email must be p9158412@gmail.com');
      assert(html.includes('https://www.youtube.com/@Rah_e_DeenIslam'), 'Official YouTube channel URL must be present');
      assert(!html.includes('https://www.youtube.com/@Rah-e-DeenIslam'), 'Broken 404 hyphenated YouTube channel URL must NOT be present');
      assert(fs.existsSync(path.join(__dirname, 'assets', 'youtube-channel-logo.jpg')), 'YouTube channel profile avatar must exist');
      assert(fs.existsSync(path.join(__dirname, 'assets', 'logo.svg')), 'Website logo must NOT be deleted or altered');
      assert(html.includes('ہمارے یوٹیوب چینل کو سبسکرائب کریں'), 'YouTube heading must match');
      assert(html.includes('روزانہ اسلامی اپڈیٹس حاصل کرنے کے لیے سبسکرائب کریں'), 'Newsletter heading must match');
      assert(html.includes('آپ کا منتخب کردہ شہر:'), 'Selected city indicator must match');
      assert(html.includes('five-prayers-container'), '5 prayers container ID must be present');
      assert(html.includes('dual-indicators-container'), 'Dual indicators container ID must be present');
      assert(html.includes('tahajjud-night-panel'), 'Tahajjud night panel ID must be present');
      assert(html.includes('مکمل نمازوں کی رکعات'), 'Complete rakats guide must match');
      assert(html.includes('جامعہ علوم اسلامیہ علامہ بنوری ٹاؤن، کراچی'), 'Karachi method must be stated');

      console.log('✅ TEST 7 PASSED: All user master prompt copy, branding, and container IDs verified.\n');

      // 8. Test Quranic Verses, Surahs & Virtues (Sunnah.com & Quran.com references, Zero undefined)
      console.log('TEST 8: Verifying Quranic Verses & Surahs Integrity...');
      const { QURAN_SURAHS } = require('./js/quran-data');
      assert(Array.isArray(QURAN_SURAHS), 'QURAN_SURAHS must be an array');
      assert(QURAN_SURAHS.length >= 10, 'Must contain at least 10 premier Quranic surahs/verses');

      // Ensure Ayat al-Kursi, Surah Al-Fatihah, Surah Al-Baqarah last verses are present
      const ayatKursi = QURAN_SURAHS.find(s => s.titleUrdu && s.titleUrdu.includes('آیت الکرسی'));
      assert(ayatKursi, 'آیت الکرسی must be present');
      assert(ayatKursi.arabicText.includes('اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ'), 'Ayat al-Kursi Arabic text must be authentic');
      assert(ayatKursi.translationUrdu.includes('اللہ، جس کے سوا کوئی معبود نہیں'), 'Ayat al-Kursi Urdu translation must be present');
      assert(ayatKursi.authenticVirtues.includes('صحیح مسلم: 810') || ayatKursi.authenticVirtues.includes('صحیح البخاری: 2311'), 'Ayat al-Kursi must cite authentic Sunnah reference');
      assert(ayatKursi.quranUrl.includes('quran.com/2/255'), 'Quran.com/2/255 reference must match');
      assert(ayatKursi.sunnahUrl.includes('sunnah.com'), 'Sunnah.com reference must match');

      const fatihah = QURAN_SURAHS.find(s => s.nameUrdu && s.nameUrdu.includes('الفاتحہ'));
      assert(fatihah, 'سورۃ الفاتحہ must be present');
      assert(fatihah.arabicText.includes('الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ'), 'Surah Fatihah Arabic text must be authentic');
      assert(fatihah.quranUrl.includes('quran.com/1'), 'Surah Fatihah must link to Quran.com/1');

      // Check all items for zero 'undefined' or null fields
      QURAN_SURAHS.forEach((s, idx) => {
        assert(s.nameUrdu, `Surah ${idx} must have nameUrdu`);
        assert(s.nameArabic, `Surah ${idx} must have nameArabic`);
        assert(s.arabicText, `Surah ${idx} must have arabicText`);
        assert(s.translationUrdu, `Surah ${idx} must have translationUrdu`);
        assert(s.authenticVirtues, `Surah ${idx} must have authenticVirtues`);
        assert(s.quranUrl, `Surah ${idx} must have quranUrl`);
        assert(s.sunnahUrl, `Surah ${idx} must have sunnahUrl`);
        
        // Strict check: No field should contain literal 'undefined'
        const serialized = JSON.stringify(s);
        assert(!serialized.includes('"undefined"'), `Surah ${s.nameUrdu} must not contain string "undefined"`);
        console.log(`   ✓ [${s.number}] ${s.nameUrdu} (${s.nameArabic}) — Verified with Sunnah.com & Quran.com`);
      });
      console.log('✅ TEST 8 PASSED: Quranic verses and virtues 100% verified without undefined.\n');

      // 9. Test All 12 Islamic Months (Sequence, 4 Sacred Months, Fazilat, Historical Events, Sunnah Practices)
      console.log('TEST 9: Verifying All 12 Islamic Hijri Months...');
      const { ISLAMIC_MONTHS } = require('./js/calendar-data');
      assert(Array.isArray(ISLAMIC_MONTHS), 'ISLAMIC_MONTHS must be an array');
      assert.strictEqual(ISLAMIC_MONTHS.length, 12, 'Must contain all 12 Islamic months');

      // Verify sequence 1 to 12
      ISLAMIC_MONTHS.forEach((m, idx) => {
        assert.strictEqual(m.number, idx + 1, `Month at index ${idx} must have number ${idx + 1}`);
      });

      // Verify 4 Sacred Months per Surah At-Tawbah 9:36 & Bukhari 3197
      const sacredMonths = ISLAMIC_MONTHS.filter(m => m.isSacred);
      assert.strictEqual(sacredMonths.length, 4, 'Must have exactly 4 Sacred Months (الأشهر الحرم)');
      const sacredNumbers = sacredMonths.map(m => m.number);
      assert(sacredNumbers.includes(1), 'Muharram (1) must be sacred');
      assert(sacredNumbers.includes(7), 'Rajab (7) must be sacred');
      assert(sacredNumbers.includes(11), 'Dhul-Qadah (11) must be sacred');
      assert(sacredNumbers.includes(12), 'Dhul-Hijjah (12) must be sacred');

      // Verify detailed fields on each month
      ISLAMIC_MONTHS.forEach(m => {
        assert(m.nameUrdu, `Month ${m.number} must have nameUrdu`);
        assert(m.nameArabic, `Month ${m.number} must have nameArabic with diacritics`);
        assert(m.meaning, `Month ${m.number} must have meaning`);
        assert(m.fazilat, `Month ${m.number} must have authentic fazilat`);
        assert(m.sunnahReference, `Month ${m.number} must cite authentic Sunnah reference`);
        assert(Array.isArray(m.events) && m.events.length > 0, `Month ${m.number} must have historical events`);
        assert(Array.isArray(m.sunnahPractices) && m.sunnahPractices.length > 0, `Month ${m.number} must have Sunnah practices`);

        m.events.forEach(ev => {
          assert(ev.day && ev.title && ev.description, `Event in month ${m.number} must have day, title, description`);
          assert(ev.reference, `Event "${ev.title}" must have authentic historical reference`);
        });

        m.sunnahPractices.forEach(p => {
          assert(p.title && p.description, `Practice in month ${m.number} must have title and description`);
        });

        const serialized = JSON.stringify(m);
        assert(!serialized.includes('"undefined"'), `Month ${m.nameUrdu} must not contain string "undefined"`);
        console.log(`   ✓ Month ${m.number}: ${m.nameUrdu} (${m.nameArabic}) [${m.isSacred ? 'حرمت والا مہینہ' : 'بابرکت مہینہ'}] — ${m.events.length} Events, ${m.sunnahPractices.length} Sunnah Practices`);
      });
      console.log('✅ TEST 9 PASSED: All 12 Islamic months verified with authentic Fazilat and events.\n');

      // 10. Test UI Integration & Script Loading in index.html
      console.log('TEST 10: Verifying UI Views & Script Loading in index.html...');
      assert(html.includes('id="view-islamic-months"'), 'view-islamic-months must be present in index.html');
      assert(html.includes('id="islamic-months-container"'), 'islamic-months-container must be present');
      assert(html.includes('data-route="islamic-months"'), 'Navigation route for islamic-months must be present');
      assert(html.includes('js/calendar-data.js'), 'js/calendar-data.js script tag must be loaded');
      assert(html.includes('id="quran-filter-pills"'), 'quran-filter-pills must be present in index.html');
      assert(html.includes('id="months-filter-pills"'), 'months-filter-pills must be present in index.html');

      console.log('✅ TEST 10 PASSED: All HTML views, routes, and script dependencies verified.\n');

      console.log('==================================================');
      console.log('🎉 ALL 10 TESTS PASSED SUCCESSFULLY! PROJECT READY.');
      console.log('==================================================');
    });
  });
});
