/**
 * Vercel Serverless Function & Node.js Endpoint: /api/prayer-times
 * RAH E DEEN ISLAM | راہ دین اسلام
 * Computes accurate prayer times for Pakistani cities with full 12-event sequence
 */

const { prayerService, PAK_CITIES } = require('../js/prayer-times');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
    const cityKey = (url.searchParams.get('city') || 'lahore').toLowerCase();
    const school = parseInt(url.searchParams.get('school'), 10) || 1;

    const city = PAK_CITIES[cityKey] || PAK_CITIES['lahore'];
    const pktDate = prayerService.getPakistanDate();
    const timings = prayerService.calculateOfflineTimings(city, school, pktDate, cityKey);

    // Set current timings to calculate extra times
    prayerService.currentTimings = timings;
    prayerService.calculateExtraTimes();

    const eventState = prayerService.getDetailedEventState(pktDate);
    const timelineEvents = prayerService.getDailyTimelineEvents(pktDate);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      city: cityKey,
      cityNameUrdu: city.nameUrdu,
      cityNameEn: city.nameEn,
      dateGregorian: timings.dateGregorian,
      serverTimePKT: pktDate.timeFormatted,
      timings: timings.timings,
      timings12: timings.timings12,
      timingsUrdu: timings.timingsUrdu,
      eventState,
      timelineEvents
    }));
  } catch (err) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 500;
    res.end(JSON.stringify({
      success: false,
      error: err.message
    }));
  }
};
