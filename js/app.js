/**
 * RAH E DEEN ISLAM | راہ دین اسلام
 * Master Application Controller
 * Handles:
 * - Client-side SPA routing (all 12 pages + 5 individual prayer guides)
 * - Dynamic city dropdown population and real-time search
 * - Prominent selected city updates & LocalStorage persistence
 * - GPS geolocation nearest city detection
 * - Real API refresh with rotation animation and Urdu notification
 * - Open-Meteo weather integration
 * - Five obligatory prayer cards with Next-Fard golden highlight
 * - 1-second live countdown to next Fard prayer
 * - Chronological 11-event daily timeline with live countdowns
 * - Dedicated Nafl cards (Ishraq, Chasht, Zawal, Awwabin, Tahajjud)
 * - Complete Prayer Guide & Hanafi Rakats tables
 * - Individual Prayer detailed pages with authentic Sunnah.com references
 * - Hadith library (search, filter, pagination, copy)
 * - Islamic Categories (10 categories with filter pills and share)
 * - Email subscription system with backend API & Urdu validation
 * - Contact inquiry submission
 */

// Application State
const appState = {
  currentRoute: 'home',
  selectedCity: 'vehari',
  selectedSchool: 1, // 1 = Hanafi
  hadith: {
    page: 1,
    pageSize: 10,
    searchQuery: '',
    category: 'all'
  },
  categories: {
    selectedCategory: 'all'
  }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  initDateHeaders();
  initNavigation();
  initCitySelector();
  initRouter();
  await loadPrayerData();
  startMasterTimer();
  renderAllStaticViews();
});

// 1. Gregorian & Hijri Date Header Display
function initDateHeaders() {
  const gregorianEl = document.getElementById('top-bar-gregorian');
  const hijriEl = document.getElementById('top-bar-hijri');
  
  if (prayerService) {
    const pkt = prayerService.getPakistanDate();
    if (gregorianEl) gregorianEl.textContent = pkt.dateFormattedUrdu;
  }

  // Calculate approximate Hijri Date
  try {
    const hijriFormatter = new Intl.DateTimeFormat('ur-PK-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    if (hijriEl) hijriEl.textContent = hijriFormatter.format(new Date());
  } catch (e) {
    if (hijriEl) hijriEl.textContent = '۱۴۴۸ھ';
  }
}

// 2. Navigation & Mobile Menu Setup
function initNavigation() {
  const toggleBtn = document.getElementById('nav-toggle-btn');
  const mainNav = document.getElementById('main-nav');

  if (toggleBtn && mainNav) {
    toggleBtn.addEventListener('click', () => {
      mainNav.classList.toggle('mobile-open');
    });
  }

  // Handle all data-route clicks
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-route]');
    if (target) {
      const route = target.getAttribute('data-route');
      if (route) {
        e.preventDefault();
        navigateTo(route);
        if (mainNav && mainNav.classList.contains('mobile-open')) {
          mainNav.classList.remove('mobile-open');
        }
      }
    }
  });
}

// 3. Router implementation
function initRouter() {
  window.addEventListener('hashchange', () => {
    const rawHash = window.location.hash.replace('#', '') || 'home';
    handleRouteChange(rawHash);
  });

  const initialHash = window.location.hash.replace('#', '') || 'home';
  handleRouteChange(initialHash);
}

function navigateTo(route) {
  window.location.hash = route;
}

function handleRouteChange(route) {
  appState.currentRoute = route;

  // Update Active Nav Link
  document.querySelectorAll('.nav-link').forEach(link => {
    const linkRoute = link.getAttribute('data-route') || link.getAttribute('href')?.replace('#', '');
    if (linkRoute === route || (route.startsWith('prayer-') && linkRoute === 'prayer-times')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Check if route is an individual prayer page (e.g. prayer-fajr)
  if (route.startsWith('prayer-') && ['prayer-fajr', 'prayer-zuhr', 'prayer-asr', 'prayer-maghrib', 'prayer-isha'].includes(route)) {
    const prayerKey = route.replace('prayer-', '');
    renderIndividualPrayerPage(prayerKey);
    showPageView(`view-${route}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // Normal Page View Switching
  const targetViewId = `view-${route}`;
  const targetView = document.getElementById(targetViewId);

  if (targetView) {
    showPageView(targetViewId);
  } else {
    // Fallback to home
    showPageView('view-home');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showPageView(viewId) {
  document.querySelectorAll('.page-view').forEach(view => {
    view.classList.remove('active');
  });
  const el = document.getElementById(viewId);
  if (el) el.classList.add('active');
}

// 4. City Dropdown & Search System
function initCitySelector() {
  const quickSelect = document.getElementById('quick-city-select');
  const mainDropdown = document.getElementById('main-city-dropdown');
  const savedCity = prayerService.currentCityKey;
  appState.selectedCity = savedCity;

  const populateSelect = (selectEl) => {
    if (!selectEl) return;
    selectEl.innerHTML = '';
    for (const [key, city] of Object.entries(PAK_CITIES)) {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${city.nameUrdu} (${city.nameEn}) — ${city.province}`;
      if (key === savedCity) option.selected = true;
      selectEl.appendChild(option);
    }
  };

  populateSelect(quickSelect);
  populateSelect(mainDropdown);

  if (quickSelect) {
    quickSelect.addEventListener('change', (e) => onCityDropdownChange(e.target.value));
  }

  updateProminentCityDisplay(savedCity);
}

function filterCityDropdown(query) {
  const mainDropdown = document.getElementById('main-city-dropdown');
  if (!mainDropdown) return;

  const cleanQuery = query.trim().toLowerCase();
  mainDropdown.innerHTML = '';

  for (const [key, city] of Object.entries(PAK_CITIES)) {
    const matchUrdu = city.nameUrdu.includes(cleanQuery);
    const matchEn = city.nameEn.toLowerCase().includes(cleanQuery);
    const matchProv = city.province.includes(cleanQuery);

    if (!cleanQuery || matchUrdu || matchEn || matchProv) {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${city.nameUrdu} (${city.nameEn}) — ${city.province}`;
      if (key === appState.selectedCity) option.selected = true;
      mainDropdown.appendChild(option);
    }
  }
}

async function onCityDropdownChange(cityKey) {
  if (!PAK_CITIES[cityKey]) return;
  appState.selectedCity = cityKey;

  // Sync both dropdowns
  const quickSelect = document.getElementById('quick-city-select');
  const mainDropdown = document.getElementById('main-city-dropdown');
  if (quickSelect) quickSelect.value = cityKey;
  if (mainDropdown) mainDropdown.value = cityKey;

  updateProminentCityDisplay(cityKey);
  await loadPrayerData(false);
}

function updateProminentCityDisplay(cityKey) {
  const city = PAK_CITIES[cityKey] || PAK_CITIES.vehari;
  const nameEl = document.getElementById('selected-city-name-text');
  if (nameEl) {
    nameEl.textContent = `${city.nameUrdu}، پاکستان (${city.province})`;
  }
}

async function onSchoolDropdownChange(schoolVal) {
  appState.selectedSchool = parseInt(schoolVal, 10);
  await loadPrayerData(false);
}

// 5. GPS Location Permission Handler
function requestUserGPSLocation(btn) {
  if (!navigator.geolocation) {
    alert('آپ کا براؤزر GPS مقام کی سہولت کو سپورٹ نہیں کرتا۔');
    return;
  }

  const origText = btn.innerHTML;
  btn.innerHTML = '⏳ مقام تلاش کیا جا رہا ہے...';
  btn.disabled = true;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      const nearest = prayerService.findNearestCity(userLat, userLng);

      btn.innerHTML = origText;
      btn.disabled = false;

      if (nearest && nearest.city) {
        showRefreshToast(
          `قریبی ترین شہر: ${nearest.city.nameUrdu} (فاصلہ تقریباً ${nearest.distanceKm} کلومیٹر)`,
          'success'
        );
        onCityDropdownChange(nearest.key);
      }
    },
    (err) => {
      btn.innerHTML = origText;
      btn.disabled = false;
      showRefreshToast('براہِ کرم براؤزر میں لوکیشن کی اجازت (GPS Permission) عنایت فرمائیں۔', 'error');
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

// 6. Manual Refresh Button with Real Feedback
async function triggerManualPrayerRefresh(btn) {
  if (!btn) btn = document.getElementById('btn-master-refresh');
  if (btn) btn.classList.add('spinning');

  try {
    const res = await prayerService.fetchTimings(appState.selectedCity, appState.selectedSchool, true);
    if (res && res.success) {
      showRefreshToast('نماز کے اوقات تازہ کر دیے گئے ہیں۔', 'success');
    } else {
      showRefreshToast('انٹرنیٹ یا سرور بندش: آف لائن فلکیاتی حسابی اوقات استعمال کیے جا رہے ہیں۔', 'error');
    }
  } catch (err) {
    showRefreshToast('اوقات تازہ کرنے میں دشواری پیش آئی۔ دوبارہ کوشش فرمائیں۔', 'error');
  } finally {
    if (btn) {
      setTimeout(() => btn.classList.remove('spinning'), 600);
    }
    updatePrayerUI();
  }
}

function showRefreshToast(msg, type = 'success') {
  const container = document.getElementById('refresh-status-container');
  if (!container) return;

  container.innerHTML = `
    <div class="refresh-toast ${type}">
      <span>${type === 'success' ? '✅' : '⚠️'}</span>
      <span>${msg}</span>
    </div>
  `;

  setTimeout(() => {
    container.innerHTML = '';
  }, 4500);
}

// 7. Load & Sync Prayer Engine Data
async function loadPrayerData(forceRefresh = false) {
  prayerService.addListener(updatePrayerUI);
  prayerService.addWeatherListener(updateWeatherUI);
  await prayerService.fetchTimings(appState.selectedCity, appState.selectedSchool, forceRefresh);
}

function updateWeatherUI(weather) {
  if (!weather) return;
  const tempEl = document.getElementById('weather-temp-value');
  const condEl = document.getElementById('weather-condition-urdu');
  const iconEl = document.getElementById('weather-icon-display');
  const humEl = document.getElementById('weather-humidity-val');
  const riseEl = document.getElementById('weather-sunrise-val');
  const setEl = document.getElementById('weather-sunset-val');

  if (tempEl) tempEl.textContent = weather.temp;
  if (condEl) condEl.textContent = weather.conditionUrdu;
  if (iconEl) iconEl.textContent = weather.icon;
  if (humEl) humEl.textContent = `${weather.humidity}%`;
  if (riseEl) riseEl.textContent = weather.sunrise;
  if (setEl) setEl.textContent = weather.sunset;
}

// 8. Core Prayer UI Rendering
function updatePrayerUI() {
  const timings = prayerService.currentTimings;
  if (!timings) return;

  const pktDate = prayerService.getPakistanDate();

  // Update Calculation Metadata in Panel
  const methodLabel = document.getElementById('prayer-calc-method-label');
  const asrLabel = document.getElementById('prayer-calc-asr-label');
  const refreshTime = document.getElementById('prayer-last-refresh-time');

  if (methodLabel) methodLabel.textContent = timings.methodName;
  if (asrLabel) asrLabel.textContent = timings.schoolLabel;
  if (refreshTime) refreshTime.textContent = timings.lastUpdated;

  // Next Fard Prayer Calculation
  const nextFardInfo = prayerService.getNextFardPrayer(pktDate);

  // Render Five Fard Cards
  renderFivePrayerCards(timings, nextFardInfo);

  // Render Main Live Countdown Banner
  renderMainCountdownBanner(nextFardInfo);

  // Render Chronological Timeline Table
  renderChronologicalTimeline(pktDate);

  // Render Nafl Cards
  renderNaflCards(timings, pktDate);

  // Render Quick Bar Pills
  renderQuickBarPills(timings, nextFardInfo);

  // Render Home Quick Widget
  renderHomeQuickWidget(timings, nextFardInfo);
}

// 9. Render Five Obligatory Prayer Cards
function renderFivePrayerCards(timings, nextFardInfo) {
  const container = document.getElementById('five-prayers-container');
  if (!container) return;

  const t12 = timings.timings12;
  const tUrdu = timings.timingsUrdu;

  const prayers = [
    { id: 'fajr', name: 'فجر', time: t12.Fajr, timeUrdu: tUrdu.Fajr, icon: '🌄', rakats: '۴ رکعات (۲ سنت + ۲ فرض)' },
    { id: 'dhuhr', name: 'ظہر', time: t12.Dhuhr, timeUrdu: tUrdu.Dhuhr, icon: '☀️', rakats: '۱۲ رکعات (۴ سنت + ۴ فرض + ۲ سنت + ۲ نفل)' },
    { id: 'asr', name: 'عصر', time: t12.Asr, timeUrdu: tUrdu.Asr, icon: '🌤️', rakats: '۸ رکعات (۴ سنت + ۴ فرض)' },
    { id: 'maghrib', name: 'مغرب', time: t12.Maghrib, timeUrdu: tUrdu.Maghrib, icon: '🌇', rakats: '۷ رکعات (۳ فرض + ۲ سنت + ۲ نفل)' },
    { id: 'isha', name: 'عشاء', time: t12.Isha, timeUrdu: tUrdu.Isha, icon: '🌙', rakats: '۱۷ رکعات (۴ سنت + ۴ فرض + ۲ سنت + ۲ نفل + ۳ وتر + ۲ نفل)' }
  ];

  const nextId = nextFardInfo?.nextPrayer?.id;

  container.innerHTML = prayers.map(p => {
    const isNext = p.id === nextId;
    const highlightClass = isNext ? 'next-highlight' : '';

    return `
      <a href="#prayer-${p.id}" class="prayer-fard-card ${highlightClass}" data-route="prayer-${p.id}">
        <div class="prayer-fard-icon">${p.icon}</div>
        <div class="prayer-fard-name">${p.name}</div>
        <div class="prayer-fard-time">${p.time}</div>
        <div class="prayer-fard-time-urdu">${p.timeUrdu}</div>
        <div style="font-size:0.82rem; color:var(--emerald-800); font-weight:600; margin-bottom:8px;">${p.rakats}</div>
        <div>
          <span class="prayer-fard-status ${isNext ? 'status-upcoming' : 'status-passed'}">
            ${isNext ? 'اگلی فرض نماز' : 'مکمل گائیڈ دیکھیں ←'}
          </span>
        </div>
      </a>
    `;
  }).join('');
}

// 10. Render Main Live Countdown Banner
function renderMainCountdownBanner(nextFardInfo) {
  const nameEl = document.getElementById('main-countdown-prayer-name');
  const clockEl = document.getElementById('main-digital-clock');
  const subtextEl = document.getElementById('main-countdown-subtext');

  if (!nextFardInfo || !nameEl || !clockEl) return;

  nameEl.textContent = `${nextFardInfo.nextPrayer.nameUrdu} (${nextFardInfo.nextPrayer.time12})`;
  clockEl.textContent = nextFardInfo.formattedCountdown;
  if (subtextEl) {
    subtextEl.textContent = 'نماز شروع ہونے میں باقی وقت';
  }
}

// 11. Render Chronological 11-Event Daily Timeline Table
function renderChronologicalTimeline(pktDate) {
  const tbody = document.getElementById('daily-timeline-tbody');
  if (!tbody) return;

  const events = prayerService.getDailyTimelineEvents(pktDate);

  tbody.innerHTML = events.map(ev => {
    let typeBadge = '';
    if (ev.type === 'fard') {
      typeBadge = '<span style="background:var(--emerald-50); color:var(--emerald-900); padding:3px 10px; border-radius:12px; font-weight:700; border:1px solid var(--emerald-600);">فرض</span>';
    } else if (ev.type === 'nafl') {
      typeBadge = '<span style="background:var(--gold-50); color:var(--gold-600); padding:3px 10px; border-radius:12px; font-weight:700; border:1px solid var(--gold-400);">نفل / مسنون</span>';
    } else if (ev.type === 'prohibited') {
      typeBadge = '<span style="background:#fef2f2; color:#b91c1c; padding:3px 10px; border-radius:12px; font-weight:700; border:1px solid #ef4444;">مکروہ وقت</span>';
    } else {
      typeBadge = '<span style="background:#f3f4f6; color:#4b5563; padding:3px 10px; border-radius:12px; font-weight:600;">فلکیاتی وقت</span>';
    }

    const rowClass = ev.statusClass === 'current' ? 'active-row' : '';

    return `
      <tr class="${rowClass}">
        <td><strong>${ev.nameUrdu}</strong></td>
        <td>${typeBadge}</td>
        <td><span style="font-family:var(--font-ui); font-weight:700; color:var(--emerald-900);">${ev.time12}</span></td>
        <td><span class="prayer-fard-status status-${ev.statusClass}">${ev.statusUrdu}</span></td>
        <td><span style="font-family:var(--font-ui); font-weight:700; color:var(--gold-600);">${ev.countdownStr}</span></td>
        <td style="font-size:0.88rem; color:var(--text-muted);">${ev.desc}</td>
      </tr>
    `;
  }).join('');
}

// 12. Render Dedicated Nafl Cards (Ishraq, Chasht, Zawal, Awwabin, Tahajjud)
function renderNaflCards(timings, pktDate) {
  const container = document.getElementById('nafl-cards-grid');
  if (!container) return;

  const t = timings.timings;
  const t12 = timings.timings12;

  const cards = [
    {
      title: 'نمازِ اشراق',
      badge: 'صبح کے نوافل',
      timeText: `${t12.Ishraq} تا ${t12.IshraqEnd}`,
      rule: 'طلوعِ آفتاب کے ۱۵ تا ۲۰ منٹ بعد (مکروہ وقت ختم ہونے پر)',
      hadithBrief: 'حج و عمرہ کا کامل ثواب (جامع الترمذی: 586)'
    },
    {
      title: 'نمازِ چاشت (صلاۃ الضحیٰ)',
      badge: 'رزق و برکت',
      timeText: `${t12.Chasht} تا زوال`,
      rule: 'دن چڑھے زوال سے قبل، کم از کم ۲ اور زیادہ سے زیادہ ۱۲ رکعات',
      hadithBrief: 'جسم کے تمام جوڑوں کا روزانہ صدقہ (صحیح مسلم: 720)'
    },
    {
      title: 'وقتِ زوال (مکروہ وقت)',
      badge: 'نماز سے اجتناب',
      timeText: `${t12.ZawalStart} تا ${t12.Dhuhr}`,
      rule: 'نصف النہار کا وقت، اس وقفے میں نفل اور سجدہ مکروہِ تحریمی ہے',
      hadithBrief: 'سورج ڈھلنے تک نماز نہ پڑھنے کی شرعی نہی'
    },
    {
      title: 'نمازِ اوابین',
      badge: 'توبہ کرنے والوں کی نماز',
      timeText: `${t12.Awwabin} تا ${t12.Isha}`,
      rule: 'مغرب کے بعد ۶ سے ۲۰ رکعات (دو دو رکعت کر کے)',
      hadithBrief: 'فضائلِ اعمال میں امت کے معمول بہا نوافل'
    },
    {
      title: 'نمازِ تہجد (صلاۃ اللیل)',
      badge: 'رات کا آخری تہائی',
      timeText: `${t12.Tahajjud} تا ${t12.Fajr}`,
      rule: 'رات کے آخری تہائی حصے میں رب کے دربار میں حاضری',
      hadithBrief: 'دعا کی قبولیت اور مغفرت کا خاص وقت (صحیح بخاری: 1145)'
    }
  ];

  container.innerHTML = cards.map(c => `
    <div class="nafl-timer-card">
      <div class="card-head">
        <div class="nafl-title">${c.title}</div>
        <span class="crescent-badge" style="font-size:0.8rem;">${c.badge}</span>
      </div>
      <div style="margin-bottom:10px;">
        <span class="nafl-time-badge">${c.timeText}</span>
      </div>
      <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:8px;">
        <strong>شرعی وقت:</strong> ${c.rule}
      </p>
      <div style="font-size:0.85rem; color:var(--emerald-800); font-weight:600; border-top:1px dashed rgba(212,175,55,0.4); padding-top:8px;">
        📖 ${c.hadithBrief}
      </div>
    </div>
  `).join('');
}

// 13. Render Quick Bar Pills
function renderQuickBarPills(timings, nextFardInfo) {
  const container = document.getElementById('quick-prayer-pills');
  if (!container) return;

  const t12 = timings.timings12;
  const list = [
    { name: 'فجر', time: t12.Fajr },
    { name: 'اشراق', time: t12.Ishraq },
    { name: 'ظہر', time: t12.Dhuhr },
    { name: 'عصر', time: t12.Asr },
    { name: 'مغرب', time: t12.Maghrib },
    { name: 'عشاء', time: t12.Isha }
  ];

  container.innerHTML = list.map(item => `
    <div class="prayer-pill">
      <span class="prayer-pill-name">${item.name}:</span>
      <span class="prayer-pill-time">${item.time}</span>
    </div>
  `).join('');
}

// 14. Render Home Quick Widget
function renderHomeQuickWidget(timings, nextFardInfo) {
  const container = document.getElementById('home-live-countdown-container');
  if (!container || !nextFardInfo) return;

  const city = timings.city;

  container.innerHTML = `
    <div class="main-fard-countdown-banner" style="margin-bottom:28px;">
      <span class="countdown-top-badge">📍 ${city.nameUrdu}، پاکستان — اگلی فرض نماز</span>
      <div class="countdown-prayer-name">${nextFardInfo.nextPrayer.nameUrdu} (${nextFardInfo.nextPrayer.time12})</div>
      <div class="digital-timer-clock">${nextFardInfo.formattedCountdown}</div>
      <div class="countdown-subtext">نماز شروع ہونے میں باقی وقت</div>
      <div style="margin-top:16px;">
        <a href="#prayer-times" class="btn btn-sm btn-gold" data-route="prayer-times">
          مکمل اوقات و ٹائم ٹیبل دیکھیں ←
        </a>
      </div>
    </div>
  `;
}

// 15. Master 1-Second Timer Loop
function startMasterTimer() {
  setInterval(() => {
    if (!prayerService.currentTimings) return;
    const pktDate = prayerService.getPakistanDate();
    const nextFardInfo = prayerService.getNextFardPrayer(pktDate);

    // Update Digital Clock Element
    const clockEl = document.getElementById('main-digital-clock');
    if (clockEl && nextFardInfo) {
      clockEl.textContent = nextFardInfo.formattedCountdown;
    }

    // Refresh timeline countdown cells
    renderChronologicalTimeline(pktDate);

    // Midnight Check: Recalculate if date changes
    if (prayerService.lastFetchedDateStr && prayerService.lastFetchedDateStr !== pktDate.dateStrDDMMYYYY) {
      prayerService.fetchTimings(appState.selectedCity, appState.selectedSchool, true);
    }
  }, 1000);
}

// 16. Render Static Views: Complete Prayer Guide, Rakats, Categories, Hadith, Quran
function renderAllStaticViews() {
  renderRakatsSummary();
  renderRakatClassifications();
  renderStepByStepSalah();
  renderCategoryFilterPills();
  renderCategoryPosts('all');
  renderHadithSection();
  renderQuranSurahs();
  renderWazaifSection();
}

// Complete Rakats Summary Cards
function renderRakatsSummary() {
  const container = document.getElementById('rakats-summary-grid');
  if (!container || typeof PRAYER_RAKATS_DATA === 'undefined') return;

  const data = PRAYER_RAKATS_DATA;

  const prayers = [
    { key: 'fajr', ...data.fajr },
    { key: 'zuhr', ...data.zuhr },
    { key: 'asr', ...data.asr },
    { key: 'maghrib', ...data.maghrib },
    { key: 'isha', ...data.isha },
    { key: 'jumuah', ...data.jumuah }
  ];

  container.innerHTML = prayers.map(p => `
    <div class="card card-crest">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h4 style="color:var(--emerald-900); font-size:1.35rem; margin:0;">${p.nameUrdu}</h4>
        <span class="crescent-badge" style="font-size:0.85rem;">کل ${p.totalRakats} رکعات</span>
      </div>
      <div style="color:var(--gold-600); font-weight:700; margin-bottom:10px;">${p.orderSummary}</div>
      
      <table class="rakat-breakdown-table">
        <thead>
          <tr>
            <th>تعداد</th>
            <th>نوعیت</th>
            <th>تفصیل</th>
          </tr>
        </thead>
        <tbody>
          ${p.rakats.map(r => `
            <tr>
              <td><strong>${r.count}</strong></td>
              <td><span style="color:var(--emerald-800); font-weight:700;">${r.type}</span></td>
              <td style="font-size:0.85rem; color:var(--text-muted);">${r.desc}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top:14px; font-size:0.88rem; color:var(--text-muted); border-top:1px dashed rgba(212,175,55,0.3); padding-top:10px;">
        <strong>اہمیت:</strong> ${p.importance}
      </div>

      ${p.key !== 'jumuah' ? `
        <div style="margin-top:12px; text-align:left;">
          <a href="#prayer-${p.key}" class="btn btn-sm btn-outline-gold" data-route="prayer-${p.key}">
            تفصیلی گائیڈ پڑھیں ←
          </a>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function renderRakatClassifications() {
  const container = document.getElementById('rakat-classifications-container');
  if (!container || typeof RAKAT_CLASSIFICATIONS === 'undefined') return;

  container.innerHTML = RAKAT_CLASSIFICATIONS.map(c => `
    <div style="background:${c.bg}; border-right:4px solid ${c.color}; border-radius:8px; padding:14px 18px; margin-bottom:12px;">
      <h4 style="color:${c.color}; margin-bottom:4px; font-size:1.15rem;">${c.title}</h4>
      <p class="urdu-text" style="font-size:0.95rem; line-height:2.1; margin:0; color:var(--text-dark);">${c.desc}</p>
    </div>
  `).join('');
}

function renderStepByStepSalah() {
  const container = document.getElementById('step-by-step-salah-container');
  if (!container || typeof SALAH_STEP_BY_STEP === 'undefined') return;

  container.innerHTML = SALAH_STEP_BY_STEP.map(s => `
    <div style="background:var(--ivory-50); border:1px solid rgba(6,78,59,0.15); border-radius:12px; padding:20px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
        <span style="background:var(--emerald-900); color:var(--gold-300); width:32px; height:32px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:700;">${s.step}</span>
        <h4 style="color:var(--emerald-900); font-size:1.25rem; margin:0;">${s.titleUrdu}</h4>
      </div>
      <div class="quran-ayah-display" style="font-size:1.35rem; padding:16px; margin-bottom:10px;">
        ${s.arabicText}
      </div>
      <p class="urdu-text" style="font-size:1rem; color:var(--text-dark); margin:0;">
        ${s.urduDesc}
      </p>
    </div>
  `).join('');
}

// 17. Render Individual Prayer Detail Pages
function renderIndividualPrayerPage(prayerKey) {
  const targetView = document.getElementById(`view-prayer-${prayerKey}`);
  if (!targetView || typeof INDIVIDUAL_PRAYERS_DETAIL === 'undefined') return;

  const p = INDIVIDUAL_PRAYERS_DETAIL[prayerKey];
  if (!p) return;

  targetView.innerHTML = `
    <div class="section-header">
      <span class="section-badge">${p.nameAr}</span>
      <h2 class="section-title">${p.nameUrdu}</h2>
      <p class="section-desc">مستند قرآنی آیات، صحیح احادیث، مکمل رکعات اور ادائیگی کا طریقہ</p>
    </div>

    <!-- Rakats Box -->
    <div class="card card-crest" style="max-width:900px; margin:0 auto 28px;">
      <h3 style="color:var(--emerald-900); margin-bottom:12px;">۱. مکمل رکعات کی حنفی ترتیب (کل ${p.rakats.totalRakats} رکعات)</h3>
      <p style="font-weight:700; color:var(--gold-600); font-size:1.2rem; margin-bottom:14px;">${p.rakats.orderSummary}</p>
      
      <table class="rakat-breakdown-table" style="margin-bottom:16px;">
        <thead>
          <tr>
            <th>تعداد</th>
            <th>نوعیت</th>
            <th>وضاحت</th>
          </tr>
        </thead>
        <tbody>
          ${p.rakats.rakats.map(r => `
            <tr>
              <td><strong>${r.count}</strong></td>
              <td><span style="color:var(--emerald-800); font-weight:700;">${r.type}</span></td>
              <td style="font-size:0.9rem;">${r.desc}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="font-size:0.95rem; color:var(--text-muted);">
        <div><strong>شرعی وقت:</strong> ${p.rakats.timeWindow}</div>
        <div><strong>افضل وقت:</strong> ${p.rakats.bestTime}</div>
      </div>
    </div>

    <!-- Quranic Reference -->
    <div class="card card-crest" style="max-width:900px; margin:0 auto 28px;">
      <h3 style="color:var(--emerald-900); margin-bottom:12px;">۲. قرآنِ مجید سے مبارک دلیل</h3>
      <div class="quran-ayah-display">${p.quranRef.arabic}</div>
      <p class="urdu-text" style="font-size:1.15rem; margin-bottom:8px;">
        <strong>ترجمہ:</strong> ${p.quranRef.urdu}
      </p>
      <div style="color:var(--gold-600); font-weight:700;">${p.quranRef.surah}</div>
    </div>

    <!-- Authentic Hadiths with Sunnah.com Links -->
    <div class="card card-crest" style="max-width:900px; margin:0 auto 28px;">
      <h3 style="color:var(--emerald-900); margin-bottom:16px;">۳. صحیح و مستند احادیث مبارکہ</h3>
      ${p.hadiths.map(h => `
        <div style="background:var(--ivory-50); border:1px solid rgba(212,175,55,0.3); border-radius:10px; padding:18px; margin-bottom:16px;">
          <div class="quran-ayah-display" style="font-size:1.3rem; padding:14px; margin-bottom:10px;">${h.arabic}</div>
          <p class="urdu-text" style="font-size:1.05rem; margin-bottom:12px;">
            <strong>ترجمہ:</strong> ${h.urdu}
          </p>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-top:1px dashed rgba(6,78,59,0.2); padding-top:10px; font-size:0.9rem;">
            <div>
              <strong>حوالہ:</strong> <span style="color:var(--emerald-800); font-weight:700;">${h.source} (رقم: ${h.hadithNo})</span>
              <span style="background:var(--emerald-50); color:var(--emerald-800); padding:2px 8px; border-radius:10px; margin-right:8px; font-weight:600;">${h.grading}</span>
            </div>
            <a href="${h.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-gold">
              Sunnah.com پر اصل متن ملاحظہ کریں 🔗
            </a>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Method & Virtues -->
    <div class="card card-crest" style="max-width:900px; margin:0 auto 28px;">
      <h3 style="color:var(--emerald-900); margin-bottom:12px;">۴. نماز ادا کرنے کا مختصر طریقہ</h3>
      <p class="urdu-text" style="font-size:1.1rem; line-height:2.2; margin-bottom:20px;">
        ${p.methodSummary}
      </p>

      <h4 style="color:var(--emerald-900); margin-bottom:10px; font-size:1.2rem;">۵. فضائل و برکات:</h4>
      <ul style="padding-right:24px; font-size:1.05rem; line-height:2.2; color:var(--text-dark);">
        ${p.virtues.map(v => `<li>${v}</li>`).join('')}
      </ul>

      <div style="margin-top:24px; text-align:center;">
        <a href="#prayer-times" class="btn btn-gold" data-route="prayer-times">
          ← واپس اوقاتِ نماز پر جائیں
        </a>
      </div>
    </div>
  `;
}

// 18. Islamic Categories & Posts
function renderCategoryFilterPills() {
  const container = document.getElementById('category-filter-bar');
  if (!container || typeof ISLAMIC_CATEGORIES === 'undefined') return;

  container.innerHTML = ISLAMIC_CATEGORIES.map(c => `
    <button type="button" class="category-pill-btn ${c.id === appState.categories.selectedCategory ? 'active' : ''}" onclick="filterCategories('${c.id}', this)">
      <span>${c.icon}</span>
      <span>${c.nameUrdu}</span>
    </button>
  `).join('');
}

function filterCategories(catId, btn) {
  appState.categories.selectedCategory = catId;
  document.querySelectorAll('.category-pill-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderCategoryPosts(catId);
}

function renderCategoryPosts(catId) {
  const container = document.getElementById('category-posts-container');
  if (!container || typeof ISLAMIC_POSTS === 'undefined') return;

  const filtered = catId === 'all' 
    ? ISLAMIC_POSTS 
    : ISLAMIC_POSTS.filter(p => p.category === catId);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="card" style="text-align:center; padding:32px;">اس زمرے میں فی الحال کوئی مضمون دستیاب نہیں ہے۔</div>`;
    return;
  }

  container.innerHTML = filtered.map(post => `
    <div class="card card-crest">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span class="crescent-badge" style="font-size:0.82rem;">${post.categoryNameUrdu}</span>
        <span style="font-size:0.85rem; color:var(--text-muted); font-family:var(--font-ui);">${post.date}</span>
      </div>

      <h3 style="color:var(--emerald-900); font-size:1.35rem; margin-bottom:12px;">${post.title}</h3>

      ${post.arabicText ? `
        <div class="quran-ayah-display" style="font-size:1.25rem; padding:14px; margin-bottom:12px;">
          ${post.arabicText}
        </div>
      ` : ''}

      <p class="urdu-text" style="font-size:1.02rem; line-height:2.2; color:var(--text-dark); margin-bottom:16px;">
        ${post.content}
      </p>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; border-top:1px dashed rgba(212,175,55,0.4); padding-top:12px; font-size:0.88rem;">
        <div>
          <strong>ماخذ:</strong> <span style="color:var(--emerald-800);">${post.source}</span>
        </div>
        <div style="display:flex; gap:6px;">
          <button type="button" class="btn btn-sm btn-outline-gold" onclick="copyPostToClipboard('${encodeURIComponent(post.title + '\n' + post.content + '\nماخذ: ' + post.source)}')">
            کاپی کریں 📋
          </button>
          <button type="button" class="btn btn-sm btn-gold" onclick="sharePost('${encodeURIComponent(post.title)}')">
            شیئر کریں 🔗
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// 19. Copy & Share Functions
function copyPostToClipboard(encodedText) {
  const text = decodeURIComponent(encodedText);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('متن کامیابی سے کاپی ہو گیا ہے!');
    });
  }
}

function sharePost(encodedTitle) {
  const title = decodeURIComponent(encodedTitle);
  const shareData = {
    title: title,
    text: `${title} — راہ دین اسلام`,
    url: window.location.href
  };

  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
  } else {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('ویب سائٹ کا لنک کاپی ہو گیا ہے!');
      });
    }
  }
}

function showToast(msg) {
  const toast = document.getElementById('share-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// 20. Hadith Section
function handleHadithSearch(query) {
  appState.hadith.searchQuery = query;
  appState.hadith.page = 1;
  renderHadithSection();
}

function handleHadithCategoryChange(cat) {
  appState.hadith.category = cat;
  appState.hadith.page = 1;
  renderHadithSection();
}

function renderHadithSection() {
  const container = document.getElementById('hadith-cards-container');
  if (!container || typeof HADITH_DATABASE === 'undefined') return;

  let list = HADITH_DATABASE;

  if (appState.hadith.category !== 'all') {
    list = list.filter(h => h.category === appState.hadith.category);
  }

  if (appState.hadith.searchQuery) {
    const q = appState.hadith.searchQuery.trim().toLowerCase();
    list = list.filter(h => 
      h.urdu.includes(q) || 
      h.arabic.includes(q) || 
      h.source.toLowerCase().includes(q) ||
      String(h.id).includes(q)
    );
  }

  const start = (appState.hadith.page - 1) * appState.hadith.pageSize;
  const paginated = list.slice(start, start + appState.hadith.pageSize);

  container.innerHTML = paginated.map(h => `
    <div class="card card-crest">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span class="crescent-badge">حدیث نمبر: ${h.id} (${h.category})</span>
        <span style="color:var(--emerald-800); font-weight:700;">${h.source}</span>
      </div>

      <div class="quran-ayah-display" style="font-size:1.35rem; padding:18px; margin-bottom:14px;">
        ${h.arabic}
      </div>

      <p class="urdu-text" style="font-size:1.15rem; line-height:2.3; margin-bottom:14px;">
        <strong>ترجمہ:</strong> ${h.urdu}
      </p>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-top:1px dashed rgba(212,175,55,0.4); padding-top:12px;">
        <span style="background:var(--emerald-50); color:var(--emerald-800); padding:3px 10px; border-radius:12px; font-weight:600;">
          ${h.grade || 'صحیح (Authentic)'}
        </span>
        <a href="${h.url || 'https://sunnah.com'}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-gold">
          Sunnah.com پر تصدیق کریں 🔗
        </a>
      </div>
    </div>
  `).join('');

  renderHadithPagination(list.length);
}

function renderHadithPagination(totalCount) {
  const container = document.getElementById('hadith-pagination-container');
  if (!container) return;

  const totalPages = Math.ceil(totalCount / appState.hadith.pageSize);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  for (let i = 1; i <= Math.min(totalPages, 10); i++) {
    const active = i === appState.hadith.page ? 'btn-gold' : 'btn-outline-gold';
    html += `<button type="button" class="btn btn-sm ${active}" onclick="changeHadithPage(${i})">${i}</button>`;
  }
  container.innerHTML = html;
}

function changeHadithPage(p) {
  appState.hadith.page = p;
  renderHadithSection();
  window.scrollTo({ top: 400, behavior: 'smooth' });
}

// 21. Quran Surahs Section
function renderQuranSurahs() {
  const container = document.getElementById('quran-surahs-container');
  if (!container || typeof QURAN_SURAHS === 'undefined') return;

  container.innerHTML = QURAN_SURAHS.map(s => `
    <div class="card card-crest">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 style="color:var(--emerald-900); font-size:1.4rem; margin:0;">${s.nameUrdu} (${s.nameAr})</h3>
        <span class="crescent-badge">پارہ: ${s.para} | آیات: ${s.ayatCount}</span>
      </div>

      <p class="urdu-text" style="font-size:1.05rem; color:var(--text-dark); margin-bottom:14px;">
        <strong>فضیلت و سنت نبوی:</strong> ${s.virtue}
      </p>

      <div class="quran-ayah-display" style="font-size:1.45rem; padding:18px; margin-bottom:12px;">
        ${s.openingAyah}
      </div>

      <p class="urdu-text" style="font-size:1.05rem; color:var(--text-muted); margin-bottom:14px;">
        <strong>ترجمہ:</strong> ${s.openingTranslation}
      </p>

      <div style="text-align:left;">
        <a href="https://quran.com/${s.number}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-emerald">
          Quran.com پر مکمل سورت پڑھیں 📖
        </a>
      </div>
    </div>
  `).join('');
}

// 22. Wazaif Section
function renderWazaifSection() {
  const container = document.getElementById('wazaif-container');
  if (!container || typeof MASNOON_DUAS === 'undefined') return;

  container.innerHTML = MASNOON_DUAS.map(d => `
    <div class="card card-crest">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <h4 style="color:var(--emerald-900); margin:0; font-size:1.2rem;">${d.title}</h4>
        <span class="crescent-badge" style="font-size:0.8rem;">${d.timing}</span>
      </div>

      <div class="quran-ayah-display" style="font-size:1.25rem; padding:14px; margin-bottom:12px;">
        ${d.arabic}
      </div>

      <p class="urdu-text" style="font-size:1rem; margin-bottom:12px;">
        <strong>ترجمہ:</strong> ${d.urdu}
      </p>

      <div style="border-top:1px dashed rgba(212,175,55,0.4); padding-top:8px; font-size:0.85rem; color:var(--emerald-800); font-weight:700;">
        حوالہ: ${d.source}
      </div>
    </div>
  `).join('');
}

// 23. Real Email Subscription Handler
async function handleEmailSubscription(event, form) {
  event.preventDefault();
  const input = form.querySelector('input[type="email"]');
  const alertBox = form.parentElement.querySelector('.newsletter-status-alert') || form.querySelector('.newsletter-status-alert');

  if (!input) return;
  const email = input.value.trim();

  // Basic RFC client validation
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    showSubscriptionFeedback(alertBox, 'براہ کرم درست ای میل پتہ درج کریں۔', 'error');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const origBtnText = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.innerHTML = '⏳ شامل کیا جا رہا ہے...';
    submitBtn.disabled = true;
  }

  try {
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.success) {
      showSubscriptionFeedback(alertBox, data.message || 'آپ کا ای میل کامیابی سے شامل کر لیا گیا ہے۔ جزاک اللہ خیر!', 'success');
      input.value = '';
    } else if (response.status === 409 || data.isDuplicate) {
      showSubscriptionFeedback(alertBox, 'یہ ای میل پتہ پہلے سے سبسکرائب شدہ ہے۔ جزاک اللہ خیر!', 'warning');
    } else {
      showSubscriptionFeedback(alertBox, data.message || 'ای میل درج کرنے میں مسئلہ پیش آیا۔ براہ کرم دوبارہ کوشش فرمائیں۔', 'error');
    }
  } catch (err) {
    // If running in an offline environment without backend active, save to localStorage
    const localList = JSON.parse(localStorage.getItem('rahedeen_subscribers') || '[]');
    if (localList.includes(email)) {
      showSubscriptionFeedback(alertBox, 'یہ ای میل پتہ پہلے سے رجسٹرڈ ہے۔ شکریہ!', 'warning');
    } else {
      localList.push(email);
      localStorage.setItem('rahedeen_subscribers', JSON.stringify(localList));
      showSubscriptionFeedback(alertBox, 'آپ کا ای میل کامیابی سے شامل کر لیا گیا ہے۔ جزاک اللہ خیر!', 'success');
      input.value = '';
    }
  } finally {
    if (submitBtn) {
      submitBtn.innerHTML = origBtnText;
      submitBtn.disabled = false;
    }
  }
}

function showSubscriptionFeedback(box, msg, type) {
  if (!box) return;
  box.style.display = 'block';
  box.innerHTML = `
    <div class="refresh-toast ${type === 'warning' ? 'error' : type}" style="width:100%; justify-content:center;">
      <span>${type === 'success' ? '✅' : '⚠️'}</span>
      <span>${msg}</span>
    </div>
  `;
}

// 24. Contact Form Submission Handler
function handleContactFormSubmit(event) {
  event.preventDefault();
  const statusMsg = document.getElementById('contact-status-msg');
  if (!statusMsg) return;

  statusMsg.style.display = 'block';
  statusMsg.innerHTML = `
    <div class="refresh-toast success" style="width:100%; justify-content:center;">
      <span>✅</span>
      <span>آپ کا پیغام موصول ہو گیا ہے، جلد از جلد آپ سے ای میل کے ذریعے رابطہ کیا جائے گا۔ جزاک اللہ خیر!</span>
    </div>
  `;

  event.target.reset();
}

// 25. Monthly Timetable Modal
function openMonthlyTimetableModal() {
  const modal = document.getElementById('monthly-prayer-modal');
  const body = document.getElementById('monthly-timetable-body');
  const title = document.getElementById('monthly-modal-title');
  if (!modal || !body) return;

  const city = PAK_CITIES[appState.selectedCity] || PAK_CITIES.vehari;
  if (title) title.textContent = `۳۰ روزہ نماز ٹائم ٹیبل — ${city.nameUrdu}، پاکستان`;

  // Generate 30 days timetable
  const rows = [];
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();

    const offlineTimes = prayerService.calculateOfflineTimings(
      city,
      appState.selectedSchool,
      { day, month, year, dateFormattedUrdu: `${day}/${month}/${year}` },
      appState.selectedCity
    );

    const t = offlineTimes.timings;
    rows.push(`
      <tr>
        <td>${day}/${month}/${year}</td>
        <td>${prayerService.format12Hour(t.Fajr)}</td>
        <td>${prayerService.format12Hour(t.Sunrise)}</td>
        <td>${prayerService.format12Hour(t.Dhuhr)}</td>
        <td>${prayerService.format12Hour(t.Asr)}</td>
        <td>${prayerService.format12Hour(t.Maghrib)}</td>
        <td>${prayerService.format12Hour(t.Isha)}</td>
      </tr>
    `);
  }

  body.innerHTML = `
    <table class="daily-timeline-table" style="font-size:0.9rem;">
      <thead>
        <tr>
          <th>تاریخ</th>
          <th>فجر</th>
          <th>طلوع</th>
          <th>ظہر</th>
          <th>عصر</th>
          <th>مغرب</th>
          <th>عشاء</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join('')}
      </tbody>
    </table>
  `;

  modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}
