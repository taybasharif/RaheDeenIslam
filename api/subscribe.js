/**
 * Vercel Serverless Function & Node.js Endpoint: /api/subscribe
 * RAH E DEEN ISLAM | راہ دین اسلام
 * Handles Email Subscriptions with validation, duplicate detection, and Urdu responses
 */

const fs = require('fs');
const path = require('path');

// Storage path: in local development we save to data/subscribers.json
// On Vercel serverless /tmp or memory fallback
const DATA_FILE = path.join(process.cwd(), 'data', 'subscribers.json');
let inMemorySubscribers = ['p9158412@gmail.com'];

function getSubscribers() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    // Read fallback
  }
  return inMemorySubscribers.map(e => ({ email: e, subscribedAt: new Date().toISOString() }));
}

function saveSubscribers(list) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    // On read-only serverless file systems, keep in-memory
    inMemorySubscribers = list.map(item => item.email);
  }
}

// RFC 5322 compliant regex for email validation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Admin stats via GET (only returns count for privacy)
  if (req.method === 'GET') {
    const subs = getSubscribers();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'success',
      totalSubscribers: subs.length,
      platform: 'Rah e Deen Islam'
    }));
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  // Parse Body
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }

  const rawEmail = body?.email || '';
  const email = String(rawEmail).trim().toLowerCase();

  // Validate format
  if (!email || !EMAIL_REGEX.test(email) || email.length > 254) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 400;
    res.end(JSON.stringify({
      success: false,
      message: 'براہ کرم درست ای میل پتہ درج کریں۔ (Please enter a valid email address.)'
    }));
    return;
  }

  // Read subscribers
  const subscribers = getSubscribers();
  const existing = subscribers.find(s => s.email.toLowerCase() === email);

  if (existing) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 409;
    res.end(JSON.stringify({
      success: false,
      isDuplicate: true,
      message: 'یہ ای میل پتہ پہلے سے رجسٹرڈ ہے۔ آپ کا شکریہ! (This email is already subscribed.)'
    }));
    return;
  }

  // Append new subscriber
  const newSubscriber = {
    email,
    subscribedAt: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
  };

  subscribers.push(newSubscriber);
  saveSubscribers(subscribers);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = 200;
  res.end(JSON.stringify({
    success: true,
    message: 'آپ کا ای میل کامیابی سے شامل کر لیا گیا ہے۔ جزاک اللہ خیر! (Successfully subscribed!)',
    subscriberCount: subscribers.length
  }));
};
