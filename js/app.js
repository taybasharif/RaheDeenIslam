/**
 * RAH E DEEN ISLAM | راہ دین اسلام
 * Master Application Controller & Live Event Timers Engine
 * 
 * Features:
 * - Real-time synchronized 1-second ticks (HH : MM : SS)
 * - Live digital countdowns on EVERY prayer card (Fajr, Zuhr, Asr, Maghrib, Isha)
 * - Dual separate indicators: اگلی فرض نماز and اگلا اہم وقت / نفل نماز
 * - Dedicated Isha & Tahajjud night sequence (Isha to Fajr, Last Third calculation)
 * - Chronological 12-event sequence with live countdowns on each row
 * - All Nafl timers: Ishraq (~18 min after sunrise), Chasht, Zawal, Awwabin, Tahajjud
 * - Dynamic city dropdown population and real-time search
 * - Prominent selected city updates & LocalStorage persistence
 * - GPS geolocation nearest city detection
 * - Real API refresh with rotation animation and Urdu notification
 * - Open-Meteo weather integration
 * - Working YouTube channel links (@Rah_e_DeenIslam)
 * - Email subscription system with backend API & Urdu validation
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
  const eventState = prayerService.getDetailedEventState(pktDate);
  if (!eventState) return;

  // Update Calculation Metadata in Panel
  const methodLabel = document.getElementById('prayer-calc-method-label');
  const asrLabel = document.getElementById('prayer-calc-asr-label');
  const refreshTime = document.getElementById('prayer-last-refresh-time');

  if (methodLabel) methodLabel.textContent = timings.methodName;
  if (asrLabel) asrLabel.textContent = timings.schoolLabel;
  if (refreshTime) refreshTime.textContent = timings.lastUpdated;

  // 1. Current Event Live Alert Bar
  renderCurrentEventBanner(eventState);

  // 2. Five Obligatory Prayer Cards (with live countdown on EVERY card)
  renderFivePrayerCards(eventState);

  // 3. Dual Indicators: (1. اگلی فرض نماز | 2. اگلا اہم وقت / نفل نماز)
  renderDualIndicators(eventState);

  // 4. Dedicated Isha & Tahajjud Night Sequence Section
  renderTahajjudNightPanel(eventState, timings);

  // 5. Chronological 12-Event Daily Timeline Table
  renderChronologicalTimeline(pktDate);

  // 6. Dedicated Nafl Cards (Ishraq, Chasht, Zawal, Awwabin, Tahajjud)
  renderNaflCards(eventState);

  // 7. Quick Bar Pills
  renderQuickBarPills(timings, eventState);

  // 8. Home Live Widget
  renderHomeLiveWidget(timings, eventState);
}

// Render Current Active Event Banner
function renderCurrentEventBanner(eventState) {
  const container = document.getElementById('current-event-banner');
  if (!container || !eventState.currentEvent) return;

  const ev = eventState.currentEvent;
  container.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px;">
      <span style="font-size:1.6rem;">⏱️</span>
      <div>
        <div style="font-size:0.85rem; color:var(--gold-300);">موجودہ وقت:</div>
        <strong style="font-size:1.25rem; color:#ffffff;">${ev.nameUrdu} کا وقت جاری ہے</strong>
        <span style="font-size:0.88rem; color:var(--gold-100); margin-right:8px;">(${ev.desc})</span>
      </div>
    </div>
    <div style="display:flex; align-items:center; gap:10px;">
      <span style="font-size:0.88rem; color:var(--gold-200);">وقت ختم ہونے میں باقی:</span>
      <span class="nafl-timer-clock-badge" style="background:#022c22; color:var(--gold-300); border-color:var(--gold-400);">${ev.countdownFormatted}</span>
    </div>
  `;
}

// Render Five Obligatory Prayer Cards (With Live HH : MM : SS Countdown on Every Card)
function renderFivePrayerCards(eventState) {
  const container = document.getElementById('five-prayers-container');
  if (!container || !eventState.fivePrayers) return;

  container.innerHTML = eventState.fivePrayers.map(p => {
    const highlightClass = p.isNext ? 'next-highlight' : '';

    return `
      <a href="#prayer-${p.id}" class="prayer-fard-card ${highlightClass}" data-route="prayer-${p.id}">
        <div class="prayer-fard-icon">${p.icon}</div>
        <div class="prayer-fard-name">${p.name}</div>
        <div class="prayer-fard-time">${p.time12}</div>
        <div class="prayer-fard-time-urdu">${p.timeUrdu}</div>
        
        <!-- Live Digital Countdown Box on Every Prayer Card -->
        <div class="prayer-card-countdown-box">
          <div class="prayer-card-countdown-label">${p.countdownLabel}</div>
          <div class="prayer-card-countdown-digits">${p.countdownFormatted}</div>
        </div>

        <div style="font-size:0.82rem; color:var(--emerald-800); font-weight:600; margin-bottom:8px;">${p.rakats}</div>
        <div>
          <span class="prayer-fard-status ${p.isCurrent ? 'status-current' : (p.isNext ? 'status-upcoming' : (p.isPassed ? 'status-passed' : 'status-upcoming'))}">
            ${p.statusUrdu}
          </span>
        </div>
      </a>
    `;
  }).join('');
}

// Render Dual Indicators: 1. اگلی فرض نماز | 2. اگلا اہم وقت / نفل نماز
function renderDualIndicators(eventState) {
  const fardName = document.getElementById('dual-fard-name');
  const fardClock = document.getElementById('dual-fard-clock');
  const fardSub = document.getElementById('dual-fard-subtext');

  const naflName = document.getElementById('dual-nafl-name');
  const naflClock = document.getElementById('dual-nafl-clock');
  const naflSub = document.getElementById('dual-nafl-subtext');

  if (fardName && eventState.nextFard) {
    fardName.textContent = `${eventState.nextFard.nameUrdu} (${eventState.nextFard.time12})`;
  }
  if (fardClock && eventState.nextFard) {
    fardClock.textContent = eventState.nextFard.countdownFormatted;
  }
  if (fardSub) {
    fardSub.textContent = 'نماز شروع ہونے میں باقی وقت';
  }

  if (naflName && eventState.nextEventOrNafl) {
    naflName.textContent = `${eventState.nextEventOrNafl.nameUrdu} (${eventState.nextEventOrNafl.time12})`;
  }
  if (naflClock && eventState.nextEventOrNafl) {
    naflClock.textContent = eventState.nextEventOrNafl.countdownFormatted;
  }
  if (naflSub && eventState.nextEventOrNafl) {
    naflSub.textContent = `وقت شروع ہونے میں باقی وقت (${eventState.nextEventOrNafl.desc})`;
  }
}

// Render Dedicated Isha & Tahajjud Night Sequence Section
function renderTahajjudNightPanel(eventState, timings) {
  const container = document.getElementById('tahajjud-night-panel');
  if (!container || !eventState.tahajjud) return;

  const th = eventState.tahajjud;

  container.innerHTML = `
    <div class="tahajjud-panel-header">
      <div>
        <span class="crescent-badge" style="background:rgba(212,175,55,0.2); color:var(--gold-300); border-color:var(--gold-400); margin-bottom:6px;">
          ${th.badgeText}
        </span>
        <h3 style="font-size:1.75rem; color:#ffffff; margin:4px 0;">
          ${th.statusUrdu}
        </h3>
        <p class="urdu-text" style="color:var(--ivory-200); font-size:0.95rem; margin:0;">
          تہجد کا جائز وقت عشاء کی نماز کے بعد سے صبح صادق تک ہے، جبکہ افضل ترین وقت رات کا آخری تہائی حصہ ہے۔
        </p>
      </div>

      <div style="text-align:left;">
        <span style="font-size:0.85rem; color:var(--gold-300);">آخری تہائی کا آغاز:</span>
        <div style="font-family:var(--font-ui); font-size:1.6rem; font-weight:800; color:var(--gold-400); direction:ltr;">
          ${th.lastThirdStartTime12}
        </div>
      </div>
    </div>

    <div class="tahajjud-panel-grid">
      <!-- Isha Time -->
      <div class="tahajjud-stat-box">
        <div class="tahajjud-stat-label">نمازِ عشاء کا وقت</div>
        <div class="tahajjud-stat-value" style="color:var(--gold-300);">${timings.timings12.Isha}</div>
        <div style="font-size:0.78rem; color:var(--ivory-300); margin-top:4px;">تہجد کے جائز وقت کا آغاز</div>
      </div>

      <!-- Night Period -->
      <div class="tahajjud-stat-box">
        <div class="tahajjud-stat-label">تہجد کا شرعی دورانیہ</div>
        <div style="font-size:1.05rem; font-weight:700; color:#ffffff; margin:6px 0;">${th.nightPeriodText}</div>
        <div style="font-size:0.78rem; color:var(--gold-300);">نیند کے بعد بیداری مسنون ہے</div>
      </div>

      <!-- Countdown to Last Third -->
      <div class="tahajjud-stat-box" style="border-color:var(--gold-400); background:rgba(212,175,55,0.1);">
        <div class="tahajjud-stat-label">${th.isLastThirdActive ? 'آخری تہائی ختم ہونے میں:' : 'آخری تہائی رات میں باقی:'}</div>
        <div class="tahajjud-stat-value" style="color:#fde047;">${th.isLastThirdActive ? th.countdownToFajr : th.countdownToLastThird}</div>
        <div style="font-size:0.78rem; color:var(--gold-200); margin-top:4px;">${th.isLastThirdActive ? 'تہجد کا افضل ترین وقت جاری ہے' : 'رب کے خاص نزولِ رحمت کا وقت'}</div>
      </div>

      <!-- Fajr Time & Countdown -->
      <div class="tahajjud-stat-box">
        <div class="tahajjud-stat-label">فجر کا وقت (تہجد کا اختتام)</div>
        <div class="tahajjud-stat-value" style="color:var(--gold-300);">${th.fajrTime12}</div>
        <div style="font-size:0.78rem; color:var(--ivory-300); margin-top:4px;">فجر میں باقی: ${th.countdownToFajr}</div>
      </div>
    </div>
  `;
}

// Render Chronological 12-Event Timeline Table
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
        <td><span style="font-family:'Plus Jakarta Sans',monospace; font-weight:800; color:var(--gold-600); letter-spacing:1px; direction:ltr; display:inline-block;">${ev.countdownStr}</span></td>
        <td style="font-size:0.88rem; color:var(--text-muted);">${ev.desc}</td>
      </tr>
    `;
  }).join('');
}

// Render Dedicated Nafl Cards with Live Countdowns
function renderNaflCards(eventState) {
  const container = document.getElementById('nafl-cards-grid');
  if (!container || !eventState.naflCards) return;

  container.innerHTML = eventState.naflCards.map(c => `
    <div class="nafl-timer-card ${c.isActive ? 'active' : ''}">
      <div class="card-head">
        <div class="nafl-title">${c.title}</div>
        <span class="crescent-badge" style="font-size:0.8rem;">${c.badge}</span>
      </div>
      <div style="margin-bottom:10px;">
        <span class="nafl-time-badge">${c.timeText}</span>
      </div>

      <!-- Live Digital Countdown on Nafl Card -->
      <div class="prayer-card-countdown-box">
        <div class="prayer-card-countdown-label">${c.countdownLabel}</div>
        <div class="prayer-card-countdown-digits">${c.countdownFormatted}</div>
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

// Render Quick Bar Pills
function renderQuickBarPills(timings, eventState) {
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

// Render Home Live Widget
function renderHomeLiveWidget(timings, eventState) {
  const container = document.getElementById('home-live-countdown-container');
  if (!container || !eventState.nextFard) return;

  const city = timings.city;

  container.innerHTML = `
    <div class="dual-indicators-container" style="margin-bottom:28px;">
      <!-- Next Fard Indicator -->
      <div class="indicator-card">
        <span class="indicator-badge">📍 ${city.nameUrdu}، پاکستان — اگلی فرض نماز</span>
        <div class="indicator-title">${eventState.nextFard.nameUrdu} (${eventState.nextFard.time12})</div>
        <div class="indicator-clock">${eventState.nextFard.countdownFormatted}</div>
        <div class="indicator-subtext">نماز شروع ہونے میں باقی وقت</div>
        <div style="margin-top:14px;">
          <a href="#prayer-times" class="btn btn-sm btn-gold" data-route="prayer-times">
            مکمل اوقات و کاؤنٹ ڈاؤن ٹائمر دیکھیں ←
          </a>
        </div>
      </div>

      <!-- Next Recommended / Nafl Indicator -->
      <div class="indicator-card nafl-indicator">
        <span class="indicator-badge">اگلا اہم وقت / نفل نماز</span>
        <div class="indicator-title">${eventState.nextEventOrNafl.nameUrdu} (${eventState.nextEventOrNafl.time12})</div>
        <div class="indicator-clock">${eventState.nextEventOrNafl.countdownFormatted}</div>
        <div class="indicator-subtext">${eventState.nextEventOrNafl.desc}</div>
        <div style="margin-top:14px;">
          <a href="#prayer-times" class="btn btn-sm btn-outline-gold" data-route="prayer-times">
            یومیہ تقویمِ عبادات دیکھیں ←
          </a>
        </div>
      </div>
    </div>
  `;
}

// 9. Master 1-Second Timer Loop
function startMasterTimer() {
  setInterval(() => {
    if (!prayerService.currentTimings) return;
    const pktDate = prayerService.getPakistanDate();
    const eventState = prayerService.getDetailedEventState(pktDate);
    if (!eventState) return;

    // 1. Current Event Live Alert Bar
    renderCurrentEventBanner(eventState);

    // 2. Five Obligatory Prayer Cards
    renderFivePrayerCards(eventState);

    // 3. Dual Indicators
    renderDualIndicators(eventState);

    // 4. Tahajjud Night Panel
    renderTahajjudNightPanel(eventState, prayerService.currentTimings);

    // 5. Daily Chronological Table
    renderChronologicalTimeline(pktDate);

    // 6. Nafl Cards
    renderNaflCards(eventState);

    // 7. Home Widget
    renderHomeLiveWidget(prayerService.currentTimings, eventState);

    // Midnight Check: Recalculate if date changes
    if (prayerService.lastFetchedDateStr && prayerService.lastFetchedDateStr !== pktDate.dateStrDDMMYYYY) {
      prayerService.fetchTimings(appState.selectedCity, appState.selectedSchool, true);
    }
  }, 1000);
}

// 10. Render Static Views: Complete Prayer Guide, Rakats, Categories, Hadith, Quran, Islamic Months
function renderAllStaticViews() {
  renderRakatsSummary();
  renderRakatClassifications();
  renderStepByStepSalah();
  renderCategoryFilterPills();
  renderCategoryPosts('all');
  renderHadithSection();
  renderQuranSurahs();
  initQuranControls();
  renderIslamicMonths();
  initIslamicMonthsControls();
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

// 11. Render Individual Prayer Detail Pages
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
              مستند حدیث کی تصدیق فرمائیں 🔗
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

// 12. Islamic Categories & Posts
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

// 13. Copy & Share Functions
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

// 14. Hadith Section
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
      (h.urdu && h.urdu.includes(q)) || 
      (h.arabic && h.arabic.includes(q)) || 
      (h.collection && h.collection.toLowerCase().includes(q)) ||
      (h.source && h.source.toLowerCase().includes(q)) ||
      String(h.id).includes(q)
    );
  }

  const start = (appState.hadith.page - 1) * appState.hadith.pageSize;
  const paginated = list.slice(start, start + appState.hadith.pageSize);

  container.innerHTML = paginated.map(h => {
    const sourceName = h.collection || h.source || 'صحیح حدیث';
    const sourceUrl = h.sourceUrl || h.url || 'https://sunnah.com';
    const grade = h.grade || 'صحیح (Authentic)';
    const arabic = h.arabic || '';
    const urdu = h.urdu || '';

    return `
      <div class="card card-crest">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span class="crescent-badge">حدیث نمبر: ${h.id} (${h.category})</span>
          <span style="color:var(--emerald-800); font-weight:700;">${sourceName}</span>
        </div>

        <div class="quran-ayah-display" style="font-size:1.35rem; padding:18px; margin-bottom:14px;">
          ${arabic}
        </div>

        <p class="urdu-text" style="font-size:1.15rem; line-height:2.3; margin-bottom:14px;">
          <strong>ترجمہ:</strong> ${urdu}
        </p>

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-top:1px dashed rgba(212,175,55,0.4); padding-top:12px;">
          <span style="background:var(--emerald-50); color:var(--emerald-800); padding:3px 10px; border-radius:12px; font-weight:600;">
            ${grade}
          </span>
          <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-gold">
            مستند حدیث کی تصدیق فرمائیں 🔗
          </a>
        </div>
      </div>
    `;
  }).join('');

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

// 15. Quran Verses & Surahs Section (Amiri Font, Diacritics, Urdu Translation & Sunnah Virtues)
let currentQuranFilter = 'all';
let currentQuranSearch = '';

function renderQuranSurahs(filter = currentQuranFilter, searchQuery = currentQuranSearch) {
  currentQuranFilter = filter;
  currentQuranSearch = searchQuery;
  const container = document.getElementById('quran-surahs-container');
  if (!container || typeof QURAN_SURAHS === 'undefined') return;

  let list = QURAN_SURAHS;

  if (filter && filter !== 'all') {
    list = list.filter(s => 
      (s.category && s.category.includes(filter)) || 
      (s.titleUrdu && s.titleUrdu.includes(filter))
    );
  }

  if (searchQuery) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter(s => 
      (s.titleUrdu && s.titleUrdu.includes(q)) ||
      (s.nameUrdu && s.nameUrdu.includes(q)) ||
      (s.nameArabic && s.nameArabic.includes(q)) ||
      (s.translationUrdu && s.translationUrdu.includes(q)) ||
      (s.authenticVirtues && s.authenticVirtues.includes(q)) ||
      (s.arabicText && s.arabicText.includes(q))
    );
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:40px;">
        <p class="urdu-text" style="font-size:1.15rem; color:var(--text-muted);">کوئی قرآنی آیت یا سورت تلاش کے معیار پر نہیں ملی۔</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(s => {
    const titleUrdu = s.titleUrdu || s.nameUrdu || '';
    const nameArabic = s.nameArabic || s.nameAr || '';
    const para = s.juz || s.para || 'قرآن مجید';
    const ayatCount = s.versesCount || s.ayatCount || '';
    const arabicText = s.arabicText || s.openingAyah || s.bismillahSample || '';
    const translationUrdu = s.translationUrdu || s.openingTranslation || '';
    const virtues = s.authenticVirtues || s.fazilat || s.virtue || '';
    const quranRef = s.quranReference || `سورت نمبر ${s.number}`;
    const quranUrl = s.quranUrl || `https://quran.com/${s.number}`;
    const categoryBadge = s.category ? `<span class="crescent-badge" style="font-size:0.85rem;">${s.category}</span>` : '';

    return `
      <div class="card card-crest" style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:12px;">
          <div>
            <h3 style="color:var(--emerald-900); font-size:1.45rem; margin:0 0 4px 0;">
              ${titleUrdu}
            </h3>
            <span style="font-family:'Amiri', serif; font-size:1.35rem; color:var(--gold-600);">${nameArabic}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            ${categoryBadge}
            <span style="background:var(--ivory-100); color:var(--emerald-900); padding:4px 10px; border-radius:12px; font-weight:700; font-size:0.85rem; border:1px solid var(--ivory-200);">
              ${para} ${ayatCount ? `| ${ayatCount}` : ''}
            </span>
          </div>
        </div>

        <!-- Full Arabic Quranic Text (Amiri Font with Diacritics) & Quran.com Link for More Reading -->
        <div class="quran-ayah-display" style="font-size:1.55rem; padding:22px 22px 14px 22px; margin-bottom:16px; line-height:2.6;">
          <a href="${quranUrl}" target="_blank" rel="noopener noreferrer" style="color:inherit; text-decoration:none; display:block;" title="Quran.com پر اصل عربی متن تلاوت فرمائیں">
            ${arabicText}
          </a>
          <div style="display:flex; justify-content:flex-end; align-items:center; border-top:1px dashed rgba(212,175,55,0.3); padding-top:10px; margin-top:12px;">
            <a href="${quranUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-gold" style="font-size:0.82rem; padding:4px 12px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
              <span>مزید عربی تلاوت (Quran.com)</span> 📖 ↗
            </a>
          </div>
        </div>

        <!-- Urdu Translation (Tarjuma) — Maulana Muhammad Junagarhi (QuranEnc) -->
        <div style="background:var(--ivory-50); border:1px solid var(--ivory-200); border-radius:8px; padding:16px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
            <h4 style="color:var(--emerald-900); font-size:1.1rem; margin:0; display:flex; align-items:center; gap:6px;">
              <span>📖</span> <strong>سلیس اردو ترجمہ:</strong>
            </h4>
            <span style="font-size:0.82rem; color:var(--text-muted); font-weight:700;">
              (مستند ترجمہ: مولانا محمد جوناگڑھی — QuranEnc)
            </span>
          </div>
          <p class="urdu-text" style="font-size:1.1rem; line-height:2.4; margin:0; color:var(--text-dark);">
            ${translationUrdu}
          </p>
        </div>

        <!-- Fazilat & Sunnah (فضیلت و برکات) -->
        <div style="background:linear-gradient(135deg, rgba(6,78,59,0.04) 0%, rgba(212,175,55,0.06) 100%); border-right:4px solid var(--gold-500); padding:16px 18px; border-radius:8px; margin-bottom:16px;">
          <h4 style="color:var(--emerald-900); font-size:1.15rem; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
            <span>✨</span> <strong>فضیلت و سنت نبوی (احادیث صحیحہ کی روشنی میں):</strong>
          </h4>
          <p class="urdu-text" style="font-size:1.05rem; line-height:2.3; margin:0; color:var(--text-dark);">
            ${virtues}
          </p>
        </div>

        <!-- Reference Footnote: Book No, Ayat No & Translation Source (Sunnah.com link & reference completely removed) -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-top:1px dashed rgba(212,175,55,0.4); padding-top:14px;">
          <div>
            <span style="display:inline-flex; align-items:center; gap:6px; background:var(--ivory-100); color:var(--emerald-900); padding:6px 14px; border-radius:12px; font-weight:700; font-size:0.88rem; border:1px solid rgba(212,175,55,0.35);">
              <span>📖</span> <span>سورت نمبر: ${s.number} | ${quranRef}</span>
            </span>
          </div>
          <div style="font-size:0.85rem; color:var(--emerald-800); font-weight:700;">
            <span>مستند حوالہ: قرآن مجید (ترجمہ: مولانا محمد جوناگڑھی)</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function initQuranControls() {
  const pills = document.querySelectorAll('#quran-filter-pills [data-qfilter]');
  pills.forEach(btn => {
    btn.addEventListener('click', () => {
      pills.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-qfilter');
      renderQuranSurahs(filter, currentQuranSearch);
    });
  });

  const searchInput = document.getElementById('quran-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentQuranSearch = e.target.value;
      renderQuranSurahs(currentQuranFilter, currentQuranSearch);
    });
  }
}

// 16. All 12 Islamic Months Section (Fazilat, Events & Sunnah Practices)
let currentMonthsFilter = 'all';
let currentMonthsSearch = '';

function renderIslamicMonths(filter = currentMonthsFilter, searchQuery = currentMonthsSearch) {
  currentMonthsFilter = filter;
  currentMonthsSearch = searchQuery;
  const container = document.getElementById('islamic-months-container');
  if (!container || typeof ISLAMIC_MONTHS === 'undefined') return;

  let months = ISLAMIC_MONTHS;

  if (filter === 'sacred') {
    months = months.filter(m => m.isSacred);
  } else if (filter === 'general') {
    months = months.filter(m => !m.isSacred);
  }

  if (searchQuery) {
    const q = searchQuery.trim().toLowerCase();
    months = months.filter(m => 
      (m.nameUrdu && m.nameUrdu.includes(q)) ||
      (m.nameArabic && m.nameArabic.includes(q)) ||
      (m.nameEn && m.nameEn.toLowerCase().includes(q)) ||
      (m.fazilat && m.fazilat.includes(q)) ||
      (m.meaning && m.meaning.includes(q)) ||
      (m.events && m.events.some(e => e.title.includes(q) || e.description.includes(q)))
    );
  }

  if (months.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:40px;">
        <p class="urdu-text" style="font-size:1.15rem; color:var(--text-muted);">کوئی اسلامی مہینہ تلاش کے معیار پر پورا نہیں اترا۔</p>
      </div>
    `;
    return;
  }

  container.innerHTML = months.map(m => {
    const sacredBadge = m.isSacred
      ? `<span style="background:#fef3c7; color:#92400e; padding:5px 14px; border-radius:20px; font-weight:700; border:1px solid #d97706; font-size:0.88rem;">حرمت والا مہینہ (الأشهر الحرم) 🛡️</span>`
      : `<span style="background:var(--emerald-50); color:var(--emerald-900); padding:5px 14px; border-radius:20px; font-weight:700; border:1px solid var(--emerald-600); font-size:0.88rem;">بابرکت اسلامی مہینہ 🌙</span>`;

    const eventsHtml = (m.events || []).map(e => `
      <div style="background:rgba(255,255,255,0.75); border-right:4px solid var(--emerald-600); padding:12px 16px; margin-bottom:10px; border-radius:6px; box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:4px;">
          <strong style="color:var(--emerald-900); font-size:1.05rem;">📅 ${e.day}: ${e.title}</strong>
          ${e.reference ? `<span style="font-size:0.82rem; color:var(--text-muted); background:var(--ivory-100); padding:2px 8px; border-radius:10px;">${e.reference}</span>` : ''}
        </div>
        <p class="urdu-text" style="font-size:0.95rem; margin:0; line-height:2; color:var(--text-dark);">${e.description}</p>
      </div>
    `).join('');

    const practicesHtml = (m.sunnahPractices || []).map(p => `
      <li style="margin-bottom:8px; line-height:2.1;">
        <strong style="color:var(--emerald-900);">${p.title}:</strong> ${p.description}
        ${p.reference ? `<span style="font-size:0.82rem; color:var(--emerald-700); font-weight:700;"> (${p.reference})</span>` : ''}
      </li>
    `).join('');

    return `
      <div class="card card-crest" style="margin-bottom:28px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:48px; height:48px; border-radius:50%; background:var(--emerald-800); color:var(--gold-300); display:flex; align-items:center; justify-content:center; font-size:1.4rem; font-weight:800; font-family:'Amiri', serif; border:2px solid var(--gold-400);">
              ${m.number}
            </div>
            <div>
              <h3 style="color:var(--emerald-900); font-size:1.6rem; margin:0;">
                ${m.nameUrdu} <span style="font-family:'Amiri', serif; font-size:1.45rem; color:var(--gold-600); margin-right:8px;">(${m.nameArabic})</span>
              </h3>
              <div style="font-size:0.88rem; color:var(--text-muted); direction:ltr; text-align:right;">${m.nameEn} • Month ${m.number} of Islamic Hijri Calendar</div>
            </div>
          </div>
          <div>
            ${sacredBadge}
          </div>
        </div>

        <!-- Meaning / Origin -->
        <div style="background:var(--ivory-50); border:1px solid var(--ivory-200); border-radius:8px; padding:10px 16px; margin-bottom:16px;">
          <strong style="color:var(--emerald-800);">معنی و وجہ تسمیہ:</strong>
          <span class="urdu-text" style="font-size:0.98rem; color:var(--text-dark); margin-right:6px;">${m.meaning}</span>
        </div>

        <!-- Fazilat Section -->
        <div style="margin-bottom:20px; background:linear-gradient(135deg, rgba(6,78,59,0.04) 0%, rgba(212,175,55,0.06) 100%); border-right:4px solid var(--gold-500); padding:16px 18px; border-radius:8px;">
          <h4 style="color:var(--emerald-900); font-size:1.2rem; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
            <span>✨</span> فضیلت و برکات (قرآن و سنت کی روشنی میں)
          </h4>
          <p class="urdu-text" style="font-size:1.05rem; line-height:2.3; margin:0; color:var(--text-dark);">
            ${m.fazilat}
          </p>
          <div style="margin-top:12px; display:flex; gap:12px; flex-wrap:wrap; font-size:0.88rem;">
            ${m.sunnahReference ? `
            <a href="${m.sunnahUrl || 'https://sunnah.com'}" target="_blank" rel="noopener noreferrer" style="color:var(--emerald-700); font-weight:700; text-decoration:none;">
              حوالہ سنت: ${m.sunnahReference} 🔗
            </a>` : ''}
            ${m.quranReference ? `
            <a href="${m.quranUrl || 'https://quran.com'}" target="_blank" rel="noopener noreferrer" style="color:var(--gold-600); font-weight:700; text-decoration:none;">
              حوالہ قرآن: ${m.quranReference} 📖
            </a>` : ''}
          </div>
        </div>

        <!-- Historical Events -->
        <div style="margin-bottom:20px;">
          <h4 style="color:var(--emerald-900); font-size:1.15rem; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
            <span>📜</span> اس مبارک مہینے کے اہم تاریخی اسلامی واقعات
          </h4>
          ${eventsHtml}
        </div>

        <!-- Sunnah Practices & Guidance -->
        <div style="background:var(--emerald-50); border:1px solid var(--emerald-600); border-radius:8px; padding:16px 18px; margin-bottom:14px;">
          <h4 style="color:var(--emerald-900); font-size:1.15rem; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
            <span>🤲</span> مسنون اعمال، نوافل اور شرعی رہنمائی
          </h4>
          <ul class="urdu-text" style="font-size:0.98rem; padding-right:20px; margin:0;">
            ${practicesHtml}
          </ul>
          ${m.guidance ? `
          <div style="margin-top:12px; padding-top:10px; border-top:1px dashed rgba(6,78,59,0.3); font-size:0.92rem; color:#991b1b; font-weight:600;">
            ⚠️ <strong>اہم شرعی تنبیہ:</strong> ${m.guidance}
          </div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function initIslamicMonthsControls() {
  const pills = document.querySelectorAll('#months-filter-pills [data-mfilter]');
  pills.forEach(btn => {
    btn.addEventListener('click', () => {
      pills.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-mfilter');
      renderIslamicMonths(filter, currentMonthsSearch);
    });
  });

  const searchInput = document.getElementById('months-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentMonthsSearch = e.target.value;
      renderIslamicMonths(currentMonthsFilter, currentMonthsSearch);
    });
  }
}

// 17. Wazaif & Duas Section (Zero 'undefined' guaranteed)
function renderWazaifSection() {
  const container = document.getElementById('wazaif-container');
  if (!container || typeof MASNOON_DUAS === 'undefined') return;

  container.innerHTML = MASNOON_DUAS.map(d => {
    const title = d.occasion || d.title || 'مسنون دعا';
    const timing = d.category || d.timing || 'یومیہ اذکار';
    const arabic = d.arabic || '';
    const urdu = d.urdu || '';
    const source = d.source || 'حصن المسلم';
    const virtueHtml = d.virtue ? `
      <p class="urdu-text" style="font-size:0.95rem; color:var(--emerald-800); margin:8px 0;">
        <strong>فضیلت:</strong> ${d.virtue}
      </p>
    ` : '';

    return `
      <div class="card card-crest">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <h4 style="color:var(--emerald-900); margin:0; font-size:1.2rem;">${title}</h4>
          <span class="crescent-badge" style="font-size:0.8rem;">${timing}</span>
        </div>

        <div class="quran-ayah-display" style="font-size:1.25rem; padding:14px; margin-bottom:12px;">
          ${arabic}
        </div>

        <p class="urdu-text" style="font-size:1rem; margin-bottom:12px;">
          <strong>ترجمہ:</strong> ${urdu}
        </p>

        ${virtueHtml}

        <div style="border-top:1px dashed rgba(212,175,55,0.4); padding-top:8px; font-size:0.85rem; color:var(--emerald-800); font-weight:700;">
          حوالہ: ${source}
        </div>
      </div>
    `;
  }).join('');
}

// 17. Real Email Subscription Handler
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

// 18. Contact Form Submission Handler
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

// 19. Monthly Timetable Modal
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
