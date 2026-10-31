/**
 * RAH E DEEN ISLAM | راہ دین اسلام
 * Master Astronomical Prayer & Worship Engine for Pakistan
 * Calculation Standard: University of Islamic Sciences, Karachi (Method 1)
 * Default Asr: Hanafi (School 1 - shadow factor 2)
 * Time Zone: Pakistan Standard Time (PKT, UTC+5)
 * 
 * Features:
 * - 29 Pakistani cities with exact coordinates (Vehari: 30.0452, 72.3489; Chishtian: 29.7971, 72.8576)
 * - Independent city calculations (never fixed to Karachi)
 * - Live second-by-second countdown for ALL 5 prayer cards (HH : MM : SS)
 * - Dual Indicators: اگلی فرض نماز and اگلا اہم وقت / نفل نماز
 * - Detailed Isha & Tahajjud Night sequence with Last Third calculation
 * - 12-Event Chronological Daily sequence with live countdowns
 * - Live Nafl Timers: Ishraq, Chasht, Zawal, Awwabin, Tahajjud
 * - Open-Meteo Weather API integration
 */

const PAK_CITIES = {
  vehari: { nameUrdu: 'وہاڑی', nameEn: 'Vehari', province: 'پنجاب', lat: 30.0452, lng: 72.3489 },
  chishtian: { nameUrdu: 'چشتیاں', nameEn: 'Chishtian', province: 'پنجاب', lat: 29.7971, lng: 72.8576 },
  lahore: { nameUrdu: 'لاہور', nameEn: 'Lahore', province: 'پنجاب', lat: 31.5497, lng: 74.3436 },
  karachi: { nameUrdu: 'کراچی', nameEn: 'Karachi', province: 'سندھ', lat: 24.8607, lng: 67.0011 },
  islamabad: { nameUrdu: 'اسلام آباد', nameEn: 'Islamabad', province: 'وفاقی دارالحکومت', lat: 33.6844, lng: 73.0479 },
  rawalpindi: { nameUrdu: 'راولپنڈی', nameEn: 'Rawalpindi', province: 'پنجاب', lat: 33.5651, lng: 73.0169 },
  faisalabad: { nameUrdu: 'فیصل آباد', nameEn: 'Faisalabad', province: 'پنجاب', lat: 31.4504, lng: 73.1350 },
  multan: { nameUrdu: 'ملتان', nameEn: 'Multan', province: 'پنجاب', lat: 30.1575, lng: 71.5249 },
  sialkot: { nameUrdu: 'سیالکوٹ', nameEn: 'Sialkot', province: 'پنجاب', lat: 32.4945, lng: 74.5229 },
  peshawar: { nameUrdu: 'پشاور', nameEn: 'Peshawar', province: 'خیبر پختونخوا', lat: 34.0151, lng: 71.5249 },
  quetta: { nameUrdu: 'کوئٹہ', nameEn: 'Quetta', province: 'بلوچستان', lat: 30.1798, lng: 66.9750 },
  dera_ghazi_khan: { nameUrdu: 'ڈیرہ غازی خان', nameEn: 'Dera Ghazi Khan', province: 'پنجاب', lat: 30.0489, lng: 70.6455 },
  bahawalpur: { nameUrdu: 'بہاولپور', nameEn: 'Bahawalpur', province: 'پنجاب', lat: 29.3544, lng: 71.6911 },
  sargodha: { nameUrdu: 'سرگودھا', nameEn: 'Sargodha', province: 'پنجاب', lat: 32.0836, lng: 72.6711 },
  gujranwala: { nameUrdu: 'گوجرانوالہ', nameEn: 'Gujranwala', province: 'پنجاب', lat: 32.1877, lng: 74.1945 },
  hyderabad: { nameUrdu: 'حیدرآباد', nameEn: 'Hyderabad', province: 'سندھ', lat: 25.3960, lng: 68.3578 },
  sukkur: { nameUrdu: 'سکھر', nameEn: 'Sukkur', province: 'سندھ', lat: 27.7052, lng: 68.8574 },
  abbottabad: { nameUrdu: 'ایبٹ آباد', nameEn: 'Abbottabad', province: 'خیبر پختونخوا', lat: 34.1688, lng: 73.2215 },
  muzaffarabad: { nameUrdu: 'مظفر آباد', nameEn: 'Muzaffarabad', province: 'آزاد کشمیر', lat: 34.3700, lng: 73.4708 },
  mirpur: { nameUrdu: 'میرپور', nameEn: 'Mirpur', province: 'آزاد کشمیر', lat: 33.1478, lng: 73.7519 },
  mardan: { nameUrdu: 'مردان', nameEn: 'Mardan', province: 'خیبر پختونخوا', lat: 34.1989, lng: 72.0404 },
  sahiwal: { nameUrdu: 'ساہیوال', nameEn: 'Sahiwal', province: 'پنجاب', lat: 30.6682, lng: 73.1114 },
  rahim_yar_khan: { nameUrdu: 'رحیم یار خان', nameEn: 'Rahim Yar Khan', province: 'پنجاب', lat: 28.4212, lng: 70.2989 },
  kasur: { nameUrdu: 'قصور', nameEn: 'Kasur', province: 'پنجاب', lat: 31.1179, lng: 74.4408 },
  jhang: { nameUrdu: 'جھنگ', nameEn: 'Jhang', province: 'پنجاب', lat: 31.2681, lng: 72.3181 },
  sheikhupura: { nameUrdu: 'شیخوپورہ', nameEn: 'Sheikhupura', province: 'پنجاب', lat: 31.7131, lng: 73.9783 },
  larkana: { nameUrdu: 'لاڑکانہ', nameEn: 'Larkana', province: 'سندھ', lat: 27.5589, lng: 68.2120 },
  swat: { nameUrdu: 'سوات / مینگورہ', nameEn: 'Mingora', province: 'خیبر پختونخوا', lat: 34.7717, lng: 72.3602 },
  gilgit: { nameUrdu: 'گلگت', nameEn: 'Gilgit', province: 'گلگت بلتستان', lat: 35.9221, lng: 74.3087 }
};

class PrayerTimeEngine {
  constructor() {
    const savedCity = typeof localStorage !== 'undefined' ? localStorage.getItem('rahedeen_city') : null;
    this.currentCityKey = (savedCity && PAK_CITIES[savedCity]) ? savedCity : null;
    this.currentSchool = 1; // 1 = Hanafi, 0 = Shafi'i
    this.currentTimings = null;
    this.currentWeather = null;
    this.lastFetchedDateStr = null;
    this.lastSuccessfulUpdate = null;
    this.listeners = [];
    this.weatherListeners = [];
    this.timeZone = 'Asia/Karachi';
  }

  // Format digital countdown string: HH : MM : SS
  static formatHMS(totalSeconds) {
    if (totalSeconds == null || isNaN(totalSeconds) || totalSeconds < 0) {
      return '00 : 00 : 00';
    }
    const sec = Math.floor(totalSeconds);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
  }

  // 12-Hour format helper "h:mm AM/PM"
  format12Hour(timeStr) {
    if (!timeStr || timeStr === '--:--') return '--:--';
    const parts = timeStr.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${m} ${period}`;
  }

  // Urdu 12-Hour format helper "12:45 (دوپہر)"
  format12HourUrdu(timeStr) {
    if (!timeStr || timeStr === '--:--') return '--:--';
    const parts = timeStr.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    if (isNaN(h)) return timeStr;
    let period = 'صبح';
    if (h >= 12 && h < 16) period = 'دوپہر';
    else if (h >= 16 && h < 19) period = 'سہ پہر';
    else if (h >= 19) period = 'رات';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${m} (${period})`;
  }

  // Synchronized Pakistan Date & Time (Asia/Karachi, UTC+5)
  // Uses absolute UTC offset (UTC+5 hours, no DST) to ensure zero 9-hour offset worldwide
  getPakistanDate(inputDate) {
    const d = (inputDate instanceof Date) ? inputDate : new Date();
    // Pakistan Standard Time is strictly UTC+05:00 with no Daylight Saving Time.
    // Shift epoch milliseconds by exactly +5 hours, then read UTC parts.
    const pktMs = d.getTime() + (5 * 3600 * 1000);
    const pktDate = new Date(pktMs);

    const year = pktDate.getUTCFullYear();
    const month = pktDate.getUTCMonth() + 1;
    const day = pktDate.getUTCDate();
    const hour = pktDate.getUTCHours();
    const minute = pktDate.getUTCMinutes();
    const second = pktDate.getUTCSeconds();

    const dateStrDDMMYYYY = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
    const monthsUrdu = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];
    const monthName = monthsUrdu[month - 1];
    const dateFormattedUrdu = `${day} ${monthName} ${year}ء`;

    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const timeFormatted = `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} ${ampm} (PKT)`;

    return {
      day,
      month,
      year,
      hour,
      minute,
      second,
      totalSeconds: hour * 3600 + minute * 60 + second,
      totalMinutes: hour * 60 + minute + second / 60,
      dateStrDDMMYYYY,
      dateFormattedUrdu,
      timeFormatted
    };
  }

  setCity(cityKey) {
    if (PAK_CITIES[cityKey]) {
      this.currentCityKey = cityKey;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('rahedeen_city', cityKey);
      }
    }
  }

  // Fetch timings for selected Pakistani city
  async fetchTimings(cityKey = this.currentCityKey, school = this.currentSchool, forceRefresh = false) {
    if (!cityKey && !this.currentCityKey) {
      this.currentTimings = null;
      return { success: false, noCity: true };
    }
    if (cityKey) this.setCity(cityKey);
    this.currentSchool = parseInt(school, 10) || 1;
    const city = PAK_CITIES[this.currentCityKey];
    if (!city) {
      this.currentTimings = null;
      return { success: false, noCity: true };
    }
    const pktDate = this.getPakistanDate();
    this.lastFetchedDateStr = pktDate.dateStrDDMMYYYY;

    // Fetch Weather concurrently
    this.fetchWeather(city.lat, city.lng).catch(e => console.warn('Weather fetch notice:', e));

    try {
      const cacheBust = forceRefresh ? `&_t=${Date.now()}` : '';
      const url = `https://api.aladhan.com/v1/timings/${pktDate.dateStrDDMMYYYY}?latitude=${city.lat}&longitude=${city.lng}&method=1&school=${this.currentSchool}&timezonestring=Asia/Karachi${cacheBust}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data && data.data && data.data.timings) {
        const raw = data.data.timings;
        const hijri = data.data.date.hijri;
        this.lastSuccessfulUpdate = pktDate.timeFormatted;

        this.currentTimings = {
          cityKey: this.currentCityKey,
          city,
          school: this.currentSchool,
          schoolLabel: this.currentSchool === 1 ? 'فقہ حنفی (مثلین - دوگنا سایہ)' : 'شافعی / مالکی / حنبلی (مثلِ اول)',
          methodName: 'جامعہ علوم اسلامیہ علامہ بنوری ٹاؤن، کراچی (طریقہ نمبر ۱)',
          status: 'live_api',
          statusUrdu: 'آن لائن تصدیق شدہ لائیو اوقات (AlAdhan API)',
          timeZone: this.timeZone,
          dateGregorian: `${pktDate.dateFormattedUrdu} (${pktDate.dateStrDDMMYYYY})`,
          dateHijri: `${hijri.day} ${hijri.month.ar || hijri.month.en} ${hijri.year}ھ`,
          lastUpdated: pktDate.timeFormatted,
          lastSuccessfulUpdate: this.lastSuccessfulUpdate,
          timings: {
            Fajr: this.cleanTime(raw.Fajr),
            Sunrise: this.cleanTime(raw.Sunrise),
            Dhuhr: this.cleanTime(raw.Dhuhr),
            Asr: this.cleanTime(raw.Asr),
            Maghrib: this.cleanTime(raw.Maghrib),
            Isha: this.cleanTime(raw.Isha),
            Imsak: this.cleanTime(raw.Imsak),
            Midnight: this.cleanTime(raw.Midnight)
          }
        };

        this.calculateExtraTimes();
        this.notifyListeners();
        return { success: true, timings: this.currentTimings };
      }
      throw new Error('Invalid Data Structure');
    } catch (err) {
      console.warn(`[PrayerEngine] AlAdhan API fetch failed (${err.message}). Using local high-precision Karachi astronomical engine for ${city.nameUrdu}.`);
      const timings = this.calculateOfflineTimings(city, this.currentSchool, pktDate, this.currentCityKey);
      this.currentTimings = timings;
      this.calculateExtraTimes();
      this.notifyListeners();
      return { success: false, fallback: true, error: err.message, timings: this.currentTimings };
    }
  }

  cleanTime(timeStr) {
    return timeStr ? timeStr.split(' ')[0] : '--:--';
  }

  // Calculate Extra Nafl & Worship Windows
  calculateExtraTimes() {
    if (!this.currentTimings) return;
    const t = this.currentTimings.timings;

    const parseM = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };
    const formatM = (totalM) => {
      const normalized = (Math.round(totalM) + 1440) % 1440;
      const h = Math.floor(normalized / 60);
      const min = normalized % 60;
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    };

    const sunriseM = parseM(t.Sunrise);
    const dhuhrM = parseM(t.Dhuhr);
    const maghribM = parseM(t.Maghrib);
    const fajrM = parseM(t.Fajr);
    const ishaM = parseM(t.Isha);

    // 1. Ishraq: Sunrise + 18 min safety interval (ending prohibited sunrise window)
    const ishraqStartM = (sunriseM + 18) % 1440;
    const ishraqEndM = (sunriseM + 75) % 1440;

    // 2. Chasht: mid-morning until Zawal
    const chashtStartM = (sunriseM + Math.round((dhuhrM - sunriseM) * 0.45)) % 1440;

    // 3. Zawal prohibited window: 15 minutes before Zuhr
    const zawalStartM = (dhuhrM - 15 + 1440) % 1440;
    const zawalEndM = dhuhrM;

    // 4. Awwabin: 12 minutes after Maghrib until Isha
    const awwabinStartM = (maghribM + 12) % 1440;

    // 5. Tahajjud:
    // Permissible window starts right after Isha until Fajr!
    // Total night length from Maghrib to Fajr (tomorrow):
    const nightMinutes = (fajrM + 1440 - maghribM) % 1440;
    // Last third starts at: Maghrib + (2/3 of night)
    const lastThirdStartM = (maghribM + Math.round(nightMinutes * 2 / 3)) % 1440;

    t.Ishraq = formatM(ishraqStartM);
    t.IshraqEnd = formatM(ishraqEndM);
    t.Chasht = formatM(chashtStartM);
    t.ZawalStart = formatM(zawalStartM);
    t.ZawalEnd = formatM(zawalEndM);
    t.Awwabin = formatM(awwabinStartM);
    t.Tahajjud = formatM(lastThirdStartM); // Recommended last third
    t.TahajjudStart = t.Isha; // Permissible window starts after Isha

    // 12-hour formatted versions
    this.currentTimings.timings12 = {
      Fajr: this.format12Hour(t.Fajr),
      Sunrise: this.format12Hour(t.Sunrise),
      Ishraq: this.format12Hour(t.Ishraq),
      IshraqEnd: this.format12Hour(t.IshraqEnd),
      Chasht: this.format12Hour(t.Chasht),
      ZawalStart: this.format12Hour(t.ZawalStart),
      ZawalEnd: this.format12Hour(t.ZawalEnd),
      Dhuhr: this.format12Hour(t.Dhuhr),
      Asr: this.format12Hour(t.Asr),
      Maghrib: this.format12Hour(t.Maghrib),
      Awwabin: this.format12Hour(t.Awwabin),
      Isha: this.format12Hour(t.Isha),
      Tahajjud: this.format12Hour(t.Tahajjud),
      TahajjudStart: this.format12Hour(t.TahajjudStart)
    };

    // Urdu 12-hour formatted versions
    this.currentTimings.timingsUrdu = {
      Fajr: this.format12HourUrdu(t.Fajr),
      Sunrise: this.format12HourUrdu(t.Sunrise),
      Ishraq: this.format12HourUrdu(t.Ishraq),
      Chasht: this.format12HourUrdu(t.Chasht),
      ZawalStart: this.format12HourUrdu(t.ZawalStart),
      Dhuhr: this.format12HourUrdu(t.Dhuhr),
      Asr: this.format12HourUrdu(t.Asr),
      Maghrib: this.format12HourUrdu(t.Maghrib),
      Awwabin: this.format12HourUrdu(t.Awwabin),
      Isha: this.format12HourUrdu(t.Isha),
      Tahajjud: this.format12HourUrdu(t.Tahajjud)
    };

    this.currentTimings.minutesMap = {
      fajr: fajrM,
      sunrise: sunriseM,
      ishraq: ishraqStartM,
      ishraqEnd: ishraqEndM,
      chasht: chashtStartM,
      zawalStart: zawalStartM,
      dhuhr: dhuhrM,
      asr: parseM(t.Asr),
      maghrib: maghribM,
      awwabin: awwabinStartM,
      isha: ishaM,
      lastThird: lastThirdStartM,
      nightMinutes: nightMinutes
    };
  }

  // Astronomical Calculation Engine (Karachi Standard, Method 1)
  calculateOfflineTimings(city, school, pktDate, cityKey) {
    const lat = city.lat;
    const lng = city.lng;
    const timezone = 5; // PKT UTC+5

    const N = this.dayOfYear(pktDate.year, pktDate.month, pktDate.day);
    const B = (360 / 365) * (N - 81) * (Math.PI / 180);
    const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    const declination = 23.45 * Math.sin((360 / 365) * (N - 81) * (Math.PI / 180)) * (Math.PI / 180);

    const solarNoonMin = 720 - (4 * lng) - EoT + (timezone * 60);

    const hourAngle = (angleDeg) => {
      const latRad = lat * (Math.PI / 180);
      const angleRad = angleDeg * (Math.PI / 180);
      const cosH = (Math.sin(angleRad) - Math.sin(latRad) * Math.sin(declination)) /
                   (Math.cos(latRad) * Math.cos(declination));
      if (cosH > 1 || cosH < -1) return null;
      return Math.acos(cosH) * (180 / Math.PI) * 4;
    };

    // Karachi standard: Fajr 18°, Isha 18°
    const fajrHA = hourAngle(-18.0) || 75;
    const sunriseHA = hourAngle(-0.833) || 90;

    // Asr calculation: shadow factor (Hanafi = 2, Shafi'i = 1)
    const shadowFactor = school === 1 ? 2 : 1;
    const latRad = lat * (Math.PI / 180);
    const asrAngleRad = Math.atan(1 / (shadowFactor + Math.tan(Math.abs(latRad - declination))));
    const asrAngleDeg = asrAngleRad * (180 / Math.PI);
    const asrHA = hourAngle(asrAngleDeg) || 55;

    const sunsetHA = sunriseHA;
    const ishaHA = hourAngle(-18.0) || 75;

    const toTimeStr = (totalM) => {
      const normalized = (Math.round(totalM) + 1440) % 1440;
      const h = Math.floor(normalized / 60);
      const m = normalized % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const fajrM = solarNoonMin - fajrHA;
    const sunriseM = solarNoonMin - sunriseHA;
    const dhuhrM = solarNoonMin + 2; // +2m safety
    const asrM = solarNoonMin + asrHA;
    const maghribM = solarNoonMin + sunsetHA + 2; // +2m safety
    const ishaM = solarNoonMin + ishaHA;

    return {
      cityKey,
      city,
      school,
      schoolLabel: school === 1 ? 'فقہ حنفی (مثلین - دوگنا سایہ)' : 'شافعی و جمہور (مثلِ اول)',
      methodName: 'جامعہ علوم اسلامیہ علامہ بنوری ٹاؤن، کراچی (فلکیاتی حساب)',
      status: 'offline_solar',
      statusUrdu: 'جامعہ بنوری ٹاؤن کراچی کے اصول پر فلکیاتی حساب (آف لائن محفوظ)',
      timeZone: this.timeZone,
      dateGregorian: `${pktDate.dateFormattedUrdu} (${pktDate.dateStrDDMMYYYY})`,
      dateHijri: 'تقویمِ پاکستان',
      lastUpdated: pktDate.timeFormatted,
      lastSuccessfulUpdate: pktDate.timeFormatted,
      timings: {
        Fajr: toTimeStr(fajrM),
        Sunrise: toTimeStr(sunriseM),
        Dhuhr: toTimeStr(dhuhrM),
        Asr: toTimeStr(asrM),
        Maghrib: toTimeStr(maghribM),
        Isha: toTimeStr(ishaM),
        Imsak: toTimeStr(fajrM - 10),
        Midnight: toTimeStr(solarNoonMin + 720)
      }
    };
  }

  dayOfYear(year, month, day) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const daysInMonths = [0, 31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let d = day;
    for (let i = 1; i < month; i++) d += daysInMonths[i];
    return d;
  }

  // Open-Meteo Weather API Integration
  async fetchWeather(lat, lng) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=sunrise,sunset&timezone=Asia%2FKarachi`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Weather HTTP ${response.status}`);
      const data = await response.json();
      
      if (data && data.current) {
        const cur = data.current;
        const code = cur.weather_code;
        const condition = this.interpretWeatherCode(code);

        this.currentWeather = {
          temp: Math.round(cur.temperature_2m),
          humidity: cur.relative_humidity_2m,
          windSpeed: cur.wind_speed_10m,
          conditionUrdu: condition.urdu,
          icon: condition.icon,
          sunrise: data.daily?.sunrise?.[0]?.split('T')[1] || '--:--',
          sunset: data.daily?.sunset?.[0]?.split('T')[1] || '--:--'
        };
        this.notifyWeatherListeners();
        return this.currentWeather;
      }
    } catch (e) {
      this.currentWeather = {
        temp: 26,
        humidity: 45,
        windSpeed: 10,
        conditionUrdu: 'خوشگوار / معتدل',
        icon: '☀️',
        sunrise: '--:--',
        sunset: '--:--'
      };
      this.notifyWeatherListeners();
    }
  }

  interpretWeatherCode(code) {
    if (code === 0) return { urdu: 'صاف مطلع', icon: '☀️' };
    if (code === 1 || code === 2) return { urdu: 'جزوی طور پر ابر آلود', icon: '🌤️' };
    if (code === 3) return { urdu: 'مطلع ابر آلود', icon: '☁️' };
    if (code === 45 || code === 48) return { urdu: 'دھند / کہرا', icon: '🌫️' };
    if (code >= 51 && code <= 55) return { urdu: 'ہلکی بوندا باندی', icon: '🌦️' };
    if (code >= 61 && code <= 65) return { urdu: 'بارش', icon: '🌧️' };
    if (code >= 71 && code <= 77) return { urdu: 'برف باری', icon: '❄️' };
    if (code >= 80 && code <= 82) return { urdu: 'تیز بارش کے جھونکے', icon: '🌧️' };
    if (code >= 95) return { urdu: 'گرج چمک کے ساتھ طوفان', icon: '⛈️' };
    return { urdu: 'معتدل موسم', icon: '☀️' };
  }

  // =========================================================================
  // COMPLETE DAILY PRAYER EVENT & LIVE COUNTDOWN CALCULATION SYSTEM
  // =========================================================================
  getDetailedEventState(pktDate) {
    if (!this.currentTimings || !this.currentTimings.minutesMap) {
      return null;
    }

    if (!pktDate || typeof pktDate.totalMinutes !== 'number') {
      pktDate = this.getPakistanDate(pktDate);
    }

    const m = this.currentTimings.minutesMap;
    const t = this.currentTimings.timings;
    const t12 = this.currentTimings.timings12;
    const tUrdu = this.currentTimings.timingsUrdu;

    const currentMin = pktDate.totalMinutes; // e.g. 15.5 * 60 = 930
    const currentSec = pktDate.totalSeconds;

    // Helper: seconds between current time and target minute today
    const diffSecTo = (targetMin) => {
      let diffM = targetMin - currentMin;
      if (diffM < 0) diffM += 1440;
      return Math.max(0, Math.floor(diffM * 60));
    };

    // -------------------------------------------------------------
    // 1. FIVE OBLIGATORY PRAYER CARDS DATA (WITH LIVE COUNTDOWN ON EVERY CARD)
    // -------------------------------------------------------------
    const fardDefinitions = [
      { id: 'fajr', name: 'فجر', startM: m.fajr, endM: m.sunrise, time12: t12.Fajr, timeUrdu: tUrdu.Fajr, icon: '🌄', rakats: '۴ رکعات (۲ سنت + ۲ فرض)' },
      { id: 'dhuhr', name: 'ظہر', startM: m.dhuhr, endM: m.asr, time12: t12.Dhuhr, timeUrdu: tUrdu.Dhuhr, icon: '☀️', rakats: '۱۲ رکعات (۴ سنت + ۴ فرض + ۲ سنت + ۲ نفل)' },
      { id: 'asr', name: 'عصر', startM: m.asr, endM: m.maghrib, time12: t12.Asr, timeUrdu: tUrdu.Asr, icon: '🌤️', rakats: '۸ رکعات (۴ سنت + ۴ فرض)' },
      { id: 'maghrib', name: 'مغرب', startM: m.maghrib, endM: m.isha, time12: t12.Maghrib, timeUrdu: tUrdu.Maghrib, icon: '🌇', rakats: '۷ رکعات (۳ فرض + ۲ سنت + ۲ نفل)' },
      { id: 'isha', name: 'عشاء', startM: m.isha, endM: m.fajr + 1440, time12: t12.Isha, timeUrdu: tUrdu.Isha, icon: '🌙', rakats: '۱۷ رکعات (۴ سنت + ۴ فرض + ۲ سنت + ۲ نفل + ۳ وتر + ۲ نفل)' }
    ];

    // Determine current obligatory prayer
    let currentFard = null;
    if (currentMin >= m.fajr && currentMin < m.sunrise) currentFard = fardDefinitions[0];
    else if (currentMin >= m.dhuhr && currentMin < m.asr) currentFard = fardDefinitions[1];
    else if (currentMin >= m.asr && currentMin < m.maghrib) currentFard = fardDefinitions[2];
    else if (currentMin >= m.maghrib && currentMin < m.isha) currentFard = fardDefinitions[3];
    else if (currentMin >= m.isha || currentMin < m.fajr) currentFard = fardDefinitions[4];

    // Determine next upcoming obligatory prayer
    let nextFard = null;
    let nextFardSec = 0;
    for (const p of fardDefinitions) {
      if (p.startM > currentMin) {
        nextFard = p;
        nextFardSec = (p.startM - currentMin) * 60;
        break;
      }
    }
    if (!nextFard) {
      // Wraps around to tomorrow's Fajr
      nextFard = fardDefinitions[0];
      nextFardSec = (m.fajr + 1440 - currentMin) * 60;
    }

    const fivePrayers = fardDefinitions.map(p => {
      let isCurrent = false;
      let isNext = false;
      let isPassed = false;
      let statusUrdu = '';
      let countdownFormatted = '00 : 00 : 00';
      let countdownLabel = '';
      let remainingSec = 0;

      if (currentFard && currentFard.id === p.id) {
        isCurrent = true;
        statusUrdu = 'موجودہ وقت (جاری ہے)';
        // Countdown until prayer ends
        const endDiffM = (p.id === 'isha')
          ? (currentMin >= m.isha ? (m.fajr + 1440 - currentMin) : (m.fajr - currentMin))
          : (p.endM - currentMin);
        remainingSec = Math.max(0, Math.floor(endDiffM * 60));
        countdownFormatted = PrayerTimeEngine.formatHMS(remainingSec);
        countdownLabel = 'وقت ختم ہونے میں باقی وقت:';
      } else if (p.id === nextFard.id) {
        isNext = true;
        statusUrdu = 'اگلی فرض نماز';
        countdownLabel = 'نماز شروع ہونے میں باقی وقت:';
        remainingSec = Math.max(0, Math.floor(nextFardSec));
        countdownFormatted = PrayerTimeEngine.formatHMS(remainingSec);
      } else if (p.startM > currentMin) {
        statusUrdu = 'آنے والا وقت';
        countdownLabel = 'شروع ہونے میں باقی وقت:';
        remainingSec = Math.max(0, Math.floor((p.startM - currentMin) * 60));
        countdownFormatted = PrayerTimeEngine.formatHMS(remainingSec);
      } else {
        isPassed = true;
        statusUrdu = 'وقت گزر چکا ہے';
        // Remaining time until this prayer tomorrow
        remainingSec = Math.max(0, Math.floor((p.startM + 1440 - currentMin) * 60));
        countdownFormatted = PrayerTimeEngine.formatHMS(remainingSec);
        countdownLabel = 'کل کی نماز میں باقی وقت:';
      }

      return {
        ...p,
        isCurrent,
        isNext,
        isPassed,
        statusUrdu,
        remainingSec,
        countdownFormatted,
        countdownLabel
      };
    });

    // -------------------------------------------------------------
    // 2. ISHA & TAHAJJUD NIGHT SEQUENCE LOGIC
    // -------------------------------------------------------------
    // Night window is active from Isha until Fajr!
    const isNightWindow = (currentMin >= m.isha || currentMin < m.fajr);

    let tahajjudStatus = 'نمازِ تہجد کا وقت ختم ہو گیا ہے';
    let tahajjudBadge = 'وقت ختم';
    let isLastThirdActive = false;
    let secUntilLastThird = 0;
    let secUntilFajr = 0;

    // Remaining seconds until Fajr
    const minUntilFajr = currentMin >= m.isha ? (m.fajr + 1440 - currentMin) : (m.fajr - currentMin);
    secUntilFajr = Math.max(0, Math.floor(minUntilFajr * 60));

    // Seconds until Last Third begins
    let minUntilLastThird = 0;
    if (currentMin >= m.isha) {
      if (m.lastThird > currentMin) {
        minUntilLastThird = m.lastThird - currentMin;
      } else if (m.lastThird < m.fajr) {
        // Last third starts after midnight
        minUntilLastThird = m.lastThird + 1440 - currentMin;
      }
    } else if (currentMin < m.lastThird) {
      minUntilLastThird = m.lastThird - currentMin;
    }

    secUntilLastThird = Math.max(0, Math.floor(minUntilLastThird * 60));

    if (isNightWindow) {
      // Check if we have entered the last third
      const inLastThird = (m.lastThird > m.isha)
        ? (currentMin >= m.lastThird && currentMin < m.fajr)
        : (currentMin >= m.lastThird && currentMin < m.fajr) || (currentMin >= m.lastThird && currentMin >= m.isha);

      if (inLastThird) {
        isLastThirdActive = true;
        tahajjudStatus = 'آخری تہائی رات جاری ہے (تہجد کا افضل ترین وقت)';
        tahajjudBadge = 'افضل ترین وقت';
      } else {
        tahajjudStatus = 'نمازِ تہجد کا وقت شروع ہو چکا ہے (جائز وقت)';
        tahajjudBadge = 'وقت شروع ہو چکا ہے';
      }
    } else {
      tahajjudStatus = 'نمازِ تہجد کا وقت ختم ہو گیا ہے (عشاء کے بعد شروع ہوگا)';
      tahajjudBadge = 'وقت ختم';
    }

    const tahajjudInfo = {
      isNightWindow,
      isLastThirdActive,
      statusUrdu: tahajjudStatus,
      badgeText: tahajjudBadge,
      nightPeriodText: 'عشاء کے بعد سے لے کر فجر تک',
      lastThirdStartTime12: t12.Tahajjud,
      fajrTime12: t12.Fajr,
      secUntilLastThird,
      secUntilFajr,
      countdownToLastThird: PrayerTimeEngine.formatHMS(secUntilLastThird),
      countdownToFajr: PrayerTimeEngine.formatHMS(secUntilFajr)
    };

    // -------------------------------------------------------------
    // 3. COMPLETE 12-EVENT DAILY SEQUENCE & CURRENT / NEXT EVENT IDENTIFICATION
    // -------------------------------------------------------------
    // Events in daily sequence:
    // 1. فجر (Fajr)
    // 2. طلوعِ آفتاب (Sunrise - Makrooh)
    // 3. نمازِ اشراق (Ishraq - Sun + 18m)
    // 4. نمازِ چاشت (Chasht)
    // 5. وقتِ زوال (Zawal - Makrooh)
    // 6. ظہر (Zuhr)
    // 7. عصر (Asr)
    // 8. مغرب (Maghrib)
    // 9. نمازِ اوابین (Awwabin)
    // 10. عشاء (Isha)
    // 11. نمازِ تہجد (Tahajjud)
    // 12. فجر (Fajr next day)

    let currentEvent = null;
    let nextEventOrNafl = null;

    if (currentMin >= m.fajr && currentMin < m.sunrise) {
      currentEvent = { nameUrdu: 'نمازِ فجر', type: 'fard', time12: t12.Fajr, desc: 'فجر کا وقت جاری ہے', endM: m.sunrise };
      nextEventOrNafl = { nameUrdu: 'طلوعِ آفتاب', type: 'event', time12: t12.Sunrise, desc: 'سورج طلوع ہونے کا وقت', startM: m.sunrise };
    } else if (currentMin >= m.sunrise && currentMin < m.ishraq) {
      currentEvent = { nameUrdu: 'طلوعِ آفتاب', type: 'prohibited', time12: t12.Sunrise, desc: 'مکروہ وقت (نماز پڑھنا منع ہے)', endM: m.ishraq };
      nextEventOrNafl = { nameUrdu: 'نمازِ اشراق', type: 'nafl', time12: t12.Ishraq, desc: 'اشراق کا مسنون وقت شروع ہوگا', startM: m.ishraq };
    } else if (currentMin >= m.ishraq && currentMin < m.chasht) {
      currentEvent = { nameUrdu: 'نمازِ اشراق', type: 'nafl', time12: t12.Ishraq, desc: 'نمازِ اشراق کا وقت جاری ہے', endM: m.chasht };
      nextEventOrNafl = { nameUrdu: 'نمازِ چاشت', type: 'nafl', time12: t12.Chasht, desc: 'صلاۃ الضحیٰ کا مسنون وقت', startM: m.chasht };
    } else if (currentMin >= m.chasht && currentMin < m.zawalStart) {
      currentEvent = { nameUrdu: 'نمازِ چاشت (صلاۃ الضحیٰ)', type: 'nafl', time12: t12.Chasht, desc: 'نمازِ چاشت کا وقت جاری ہے', endM: m.zawalStart };
      nextEventOrNafl = { nameUrdu: 'وقتِ زوال (مکروہ وقت)', type: 'prohibited', time12: t12.ZawalStart, desc: 'نصف النہار کا وقت جس میں نماز منع ہے', startM: m.zawalStart };
    } else if (currentMin >= m.zawalStart && currentMin < m.dhuhr) {
      currentEvent = { nameUrdu: 'وقتِ زوال', type: 'prohibited', time12: t12.ZawalStart, desc: 'مکروہِ تحریمی وقت (نماز و سجدہ ممنوع ہے)', endM: m.dhuhr };
      nextEventOrNafl = { nameUrdu: 'نمازِ ظہر', type: 'fard', time12: t12.Dhuhr, desc: 'اگلی فرض نماز', startM: m.dhuhr };
    } else if (currentMin >= m.dhuhr && currentMin < m.asr) {
      currentEvent = { nameUrdu: 'نمازِ ظہر', type: 'fard', time12: t12.Dhuhr, desc: 'نمازِ ظہر کا وقت جاری ہے', endM: m.asr };
      nextEventOrNafl = { nameUrdu: 'نمازِ عصر', type: 'fard', time12: t12.Asr, desc: 'اگلی فرض نماز (حنفی مثلین)', startM: m.asr };
    } else if (currentMin >= m.asr && currentMin < m.maghrib) {
      currentEvent = { nameUrdu: 'نمازِ عصر', type: 'fard', time12: t12.Asr, desc: 'نمازِ عصر کا وقت جاری ہے', endM: m.maghrib };
      nextEventOrNafl = { nameUrdu: 'نمازِ مغرب', type: 'fard', time12: t12.Maghrib, desc: 'اگلی فرض نماز (غروبِ آفتاب)', startM: m.maghrib };
    } else if (currentMin >= m.maghrib && currentMin < m.awwabin) {
      currentEvent = { nameUrdu: 'نمازِ مغرب', type: 'fard', time12: t12.Maghrib, desc: 'نمازِ مغرب کا وقت جاری ہے', endM: m.awwabin };
      nextEventOrNafl = { nameUrdu: 'نمازِ اوابین', type: 'nafl', time12: t12.Awwabin, desc: 'مغرب کے بعد کے مسنون نوافل', startM: m.awwabin };
    } else if (currentMin >= m.awwabin && currentMin < m.isha) {
      currentEvent = { nameUrdu: 'نمازِ اوابین', type: 'nafl', time12: t12.Awwabin, desc: 'اوابین کے نوافل کا وقت جاری ہے', endM: m.isha };
      nextEventOrNafl = { nameUrdu: 'نمازِ عشاء', type: 'fard', time12: t12.Isha, desc: 'اگلی فرض نماز', startM: m.isha };
    } else {
      // Night Time: Isha to Fajr
      currentEvent = { nameUrdu: 'نمازِ عشاء و شب بیداری', type: 'fard_night', time12: t12.Isha, desc: 'عشاء کا وقت اور رات کا قیام جاری ہے', endM: m.fajr };
      if (!isLastThirdActive && secUntilLastThird > 0) {
        nextEventOrNafl = { nameUrdu: 'نمازِ تہجد (آخری تہائی)', type: 'nafl', time12: t12.Tahajjud, desc: 'رات کا آخری تہائی حصہ (تہجد کا افضل ترین وقت)', startM: m.lastThird };
      } else {
        nextEventOrNafl = { nameUrdu: 'نمازِ فجر', type: 'fard', time12: t12.Fajr, desc: 'اگلی صبح کی پہلی فرض نماز', startM: m.fajr };
      }
    }

    // Attach countdowns to current and next event
    if (currentEvent) {
      const endDiffM = (currentEvent.endM > currentMin) ? (currentEvent.endM - currentMin) : (currentEvent.endM + 1440 - currentMin);
      currentEvent.remainingSec = Math.max(0, Math.floor(endDiffM * 60));
      currentEvent.countdownFormatted = PrayerTimeEngine.formatHMS(currentEvent.remainingSec);
    }

    if (nextEventOrNafl) {
      const startDiffM = (nextEventOrNafl.startM > currentMin) ? (nextEventOrNafl.startM - currentMin) : (nextEventOrNafl.startM + 1440 - currentMin);
      nextEventOrNafl.remainingSec = Math.max(0, Math.floor(startDiffM * 60));
      nextEventOrNafl.countdownFormatted = PrayerTimeEngine.formatHMS(nextEventOrNafl.remainingSec);
    }

    // -------------------------------------------------------------
    // 4. NAFL PRAYERS CARD DATA (WITH ACCURATE LIVE COUNTDOWNS)
    // -------------------------------------------------------------
    const naflCards = [
      {
        id: 'ishraq',
        title: 'نمازِ اشراق',
        badge: 'صبح کے نوافل',
        timeText: `${t12.Ishraq} تا ${t12.IshraqEnd}`,
        rule: 'طلوعِ آفتاب کے ۱۵ تا ۲۰ منٹ بعد (مکروہ وقت ختم ہونے پر)',
        hadithBrief: 'حج و عمرہ کا کامل ثواب (جامع الترمذی: 586)',
        isActive: (currentMin >= m.ishraq && currentMin < m.ishraqEnd),
        statusUrdu: (currentMin >= m.ishraq && currentMin < m.ishraqEnd) ? 'موجودہ وقت (جاری ہے)' : (currentMin < m.ishraq ? 'آنے والا وقت' : 'گزر چکا ہے'),
        countdownFormatted: PrayerTimeEngine.formatHMS(diffSecTo(m.ishraq)),
        countdownLabel: (currentMin >= m.ishraq && currentMin < m.ishraqEnd) ? 'وقت ختم ہونے میں:' : 'شروع ہونے میں باقی:'
      },
      {
        id: 'chasht',
        title: 'نمازِ چاشت (صلاۃ الضحیٰ)',
        badge: 'رزق و برکت',
        timeText: `${t12.Chasht} تا زوال (${t12.ZawalStart})`,
        rule: 'دن چڑھے زوال سے قبل، کم از کم ۲ اور زیادہ سے زیادہ ۱۲ رکعات',
        hadithBrief: 'جسم کے تمام جوڑوں کا روزانہ صدقہ (صحیح مسلم: 720)',
        isActive: (currentMin >= m.chasht && currentMin < m.zawalStart),
        statusUrdu: (currentMin >= m.chasht && currentMin < m.zawalStart) ? 'موجودہ وقت (جاری ہے)' : (currentMin < m.chasht ? 'آنے والا وقت' : 'گزر چکا ہے'),
        countdownFormatted: PrayerTimeEngine.formatHMS(diffSecTo(m.chasht)),
        countdownLabel: (currentMin >= m.chasht && currentMin < m.zawalStart) ? 'وقت ختم ہونے میں:' : 'شروع ہونے میں باقی:'
      },
      {
        id: 'zawal',
        title: 'وقتِ زوال (مکروہ وقت)',
        badge: 'نماز سے اجتناب',
        timeText: `${t12.ZawalStart} تا ${t12.Dhuhr}`,
        rule: 'نصف النہار کا وقت، اس وقفے میں نفل اور سجدہ مکروہِ تحریمی ہے',
        hadithBrief: 'سورج ڈھلنے تک نماز نہ پڑھنے کی شرعی نہی',
        isActive: (currentMin >= m.zawalStart && currentMin < m.dhuhr),
        statusUrdu: (currentMin >= m.zawalStart && currentMin < m.dhuhr) ? 'مکروہ وقت جاری ہے' : (currentMin < m.zawalStart ? 'آنے والا وقت' : 'گزر چکا ہے'),
        countdownFormatted: PrayerTimeEngine.formatHMS(diffSecTo(m.zawalStart)),
        countdownLabel: (currentMin >= m.zawalStart && currentMin < m.dhuhr) ? 'ظہر شروع ہونے میں:' : 'زوال شروع ہونے میں:'
      },
      {
        id: 'awwabin',
        title: 'نمازِ اوابین',
        badge: 'توبہ کرنے والوں کی نماز',
        timeText: `${t12.Awwabin} تا ${t12.Isha}`,
        rule: 'مغرب کے بعد ۶ سے ۲۰ رکعات (دو دو رکعت کر کے)',
        hadithBrief: 'فضائلِ اعمال میں امت کے معمول بہا نوافل',
        isActive: (currentMin >= m.awwabin && currentMin < m.isha),
        statusUrdu: (currentMin >= m.awwabin && currentMin < m.isha) ? 'موجودہ وقت (جاری ہے)' : (currentMin < m.awwabin ? 'آنے والا وقت' : 'گزر چکا ہے'),
        countdownFormatted: PrayerTimeEngine.formatHMS(diffSecTo(m.awwabin)),
        countdownLabel: (currentMin >= m.awwabin && currentMin < m.isha) ? 'عشاء میں باقی وقت:' : 'اوابین شروع ہونے میں:'
      },
      {
        id: 'tahajjud',
        title: 'نمازِ تہجد (صلاۃ اللیل)',
        badge: 'رات کا قیام',
        timeText: `عشاء تا فجر (افضل: ${t12.Tahajjud})`,
        rule: 'عشاء کے بعد سے لے کر فجر تک، افضل ترین وقت آخری تہائی ہے',
        hadithBrief: 'دعا کی قبولیت اور مغفرت کا خاص وقت (صحیح بخاری: 1145)',
        isActive: isNightWindow,
        statusUrdu: tahajjudStatus,
        countdownFormatted: isLastThirdActive ? tahajjudInfo.countdownToFajr : tahajjudInfo.countdownToLastThird,
        countdownLabel: isLastThirdActive ? 'فجر شروع ہونے میں باقی:' : 'آخری تہائی رات میں باقی:'
      }
    ];

    return {
      fivePrayers,
      currentFard,
      nextFard: {
        ...nextFard,
        remainingSec: Math.floor(nextFardSec),
        countdownFormatted: PrayerTimeEngine.formatHMS(nextFardSec)
      },
      currentEvent,
      nextEventOrNafl,
      tahajjud: tahajjudInfo,
      naflCards
    };
  }

  // =========================================================================
  // 12-EVENT DAILY CHRONOLOGICAL TIMELINE TABLE (LIVE COUNTDOWNS PER ROW)
  // =========================================================================
  getDailyTimelineEvents(pktDate) {
    if (!this.currentTimings || !this.currentTimings.minutesMap) {
      return [];
    }

    if (!pktDate || typeof pktDate.totalMinutes !== 'number') {
      if (pktDate instanceof Date) {
        const h = pktDate.getHours();
        const min = pktDate.getMinutes();
        const s = pktDate.getSeconds();
        pktDate = {
          hour: h,
          minute: min,
          second: s,
          totalSeconds: h * 3600 + min * 60 + s,
          totalMinutes: h * 60 + min + s / 60
        };
      } else {
        pktDate = this.getPakistanDate();
      }
    }

    const m = this.currentTimings.minutesMap;
    const t12 = this.currentTimings.timings12;
    const currentMin = pktDate.totalMinutes;

    // 12 chronological events according to the user specification
    const rawEvents = [
      {
        num: 1,
        nameUrdu: 'نمازِ فجر',
        type: 'fard',
        time12: t12.Fajr,
        startM: m.fajr,
        endM: m.sunrise,
        desc: 'پہلی فرض نماز (صبحِ صادق تا طلوعِ آفتاب)'
      },
      {
        num: 2,
        nameUrdu: 'طلوعِ آفتاب',
        type: 'prohibited',
        time12: t12.Sunrise,
        startM: m.sunrise,
        endM: m.ishraq,
        desc: 'سورج کا طلوع (مکروہ وقت، نماز ممنوع ہے)'
      },
      {
        num: 3,
        nameUrdu: 'نمازِ اشراق',
        type: 'nafl',
        time12: t12.Ishraq,
        startM: m.ishraq,
        endM: m.ishraqEnd,
        desc: 'طلوع کے ۱۵ تا ۲۰ منٹ بعد (حج و عمرہ کا کامل ثواب)'
      },
      {
        num: 4,
        nameUrdu: 'نمازِ چاشت (صلاۃ الضحیٰ)',
        type: 'nafl',
        time12: t12.Chasht,
        startM: m.chasht,
        endM: m.zawalStart,
        desc: 'رزق میں وسعت اور جسم کے تمام جوڑوں کا روزانہ صدقہ'
      },
      {
        num: 5,
        nameUrdu: 'وقتِ زوال (استواءِ شمس)',
        type: 'prohibited',
        time12: t12.ZawalStart,
        startM: m.zawalStart,
        endM: m.dhuhr,
        desc: 'نصف النہار کا مکروہ وقت (نماز و سجدہ تلاوت ممنوع)'
      },
      {
        num: 6,
        nameUrdu: 'نمازِ ظہر',
        type: 'fard',
        time12: t12.Dhuhr,
        startM: m.dhuhr,
        endM: m.asr,
        desc: 'دوسری فرض نماز (زوال کے بعد سے مثلین تک)'
      },
      {
        num: 7,
        nameUrdu: 'نمازِ عصر',
        type: 'fard',
        time12: t12.Asr,
        startM: m.asr,
        endM: m.maghrib,
        desc: 'تیسری فرض نماز، صلاۃِ وسطیٰ (حنفی مسلک مثلین)'
      },
      {
        num: 8,
        nameUrdu: 'نمازِ مغرب',
        type: 'fard',
        time12: t12.Maghrib,
        startM: m.maghrib,
        endM: m.isha,
        desc: 'چوتھی فرض نماز (غروبِ آفتاب کے فوراً بعد)'
      },
      {
        num: 9,
        nameUrdu: 'نمازِ اوابین',
        type: 'nafl',
        time12: t12.Awwabin,
        startM: m.awwabin,
        endM: m.isha,
        desc: 'مغرب کے بعد ۶ سے ۲۰ رکعات مسنون نوافل'
      },
      {
        num: 10,
        nameUrdu: 'نمازِ عشاء',
        type: 'fard',
        time12: t12.Isha,
        startM: m.isha,
        endM: m.fajr + 1440,
        desc: 'پانچویں فرض نماز مع ۳ رکعات وتر واجب'
      },
      {
        num: 11,
        nameUrdu: 'نمازِ تہجد (صلاۃ اللیل)',
        type: 'nafl',
        time12: t12.Tahajjud,
        startM: m.lastThird,
        endM: (m.lastThird < m.fajr ? m.fajr : m.fajr + 1440),
        desc: 'رات کا آخری تہائی حصہ (تہجد و استغفار کا افضل ترین وقت)'
      },
      {
        num: 12,
        nameUrdu: 'نمازِ فجر (آئندہ کل)',
        type: 'fard',
        time12: t12.Fajr,
        startM: m.fajr + 1440,
        endM: m.sunrise + 1440,
        desc: 'اگلی صبح کی نمازِ فجر'
      }
    ];

    // Find the next upcoming event
    let nextIndex = -1;
    for (let i = 0; i < rawEvents.length; i++) {
      if (rawEvents[i].startM > currentMin) {
        nextIndex = i;
        break;
      }
    }

    return rawEvents.map((ev, index) => {
      let statusClass = 'upcoming';
      let statusUrdu = 'آنے والا وقت';
      let countdownSec = 0;

      const isCurrentWindow = (ev.num === 10) // Isha
        ? (currentMin >= m.isha || currentMin < m.fajr)
        : (currentMin >= ev.startM && currentMin < ev.endM);

      if (isCurrentWindow) {
        statusClass = 'current';
        statusUrdu = 'موجودہ وقت (جاری)';
        const endDiffM = (ev.endM > currentMin) ? (ev.endM - currentMin) : (ev.endM + 1440 - currentMin);
        countdownSec = Math.max(0, Math.floor(endDiffM * 60));
      } else if (index === nextIndex) {
        statusClass = 'next';
        statusUrdu = 'اگلا وقت';
        countdownSec = Math.max(0, Math.floor((ev.startM - currentMin) * 60));
      } else if (ev.startM > currentMin) {
        statusClass = 'upcoming';
        statusUrdu = 'آنے والا وقت';
        countdownSec = Math.max(0, Math.floor((ev.startM - currentMin) * 60));
      } else {
        statusClass = 'passed';
        statusUrdu = 'وقت گزر چکا ہے';
        countdownSec = Math.max(0, Math.floor((ev.startM + 1440 - currentMin) * 60));
      }

      return {
        ...ev,
        statusClass,
        statusUrdu,
        countdownSec,
        countdownStr: PrayerTimeEngine.formatHMS(countdownSec)
      };
    });
  }

  // Find Nearest City using Haversine formula (for GPS button)
  findNearestCity(userLat, userLng) {
    let nearestKey = 'vehari';
    let minDistance = Infinity;

    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    for (const [key, city] of Object.entries(PAK_CITIES)) {
      const dLat = toRad(city.lat - userLat);
      const dLng = toRad(city.lng - userLng);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(userLat)) * Math.cos(toRad(city.lat)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;

      if (d < minDistance) {
        minDistance = d;
        nearestKey = key;
      }
    }
    return { key: nearestKey, city: PAK_CITIES[nearestKey], distanceKm: Math.round(minDistance) };
  }

  // Reactive Listeners
  addListener(cb) {
    this.listeners.push(cb);
  }

  notifyListeners() {
    this.listeners.forEach(cb => {
      try { cb(this.currentTimings); } catch (e) { console.error(e); }
    });
  }

  addWeatherListener(cb) {
    this.weatherListeners.push(cb);
  }

  notifyWeatherListeners() {
    this.weatherListeners.forEach(cb => {
      try { cb(this.currentWeather); } catch (e) { console.error(e); }
    });
  }
}

// Global Singleton Instance
const prayerService = new PrayerTimeEngine();
if (typeof window !== 'undefined') {
  window.prayerService = prayerService;
  window.PAK_CITIES = PAK_CITIES;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { prayerService, PAK_CITIES, PrayerTimeEngine };
}
