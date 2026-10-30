/**
 * Contact & "Ask a Question" Handler for Rah-e-Deen-Islam
 * Contact Email: hhooregul@gmail.com
 * Founder: Tayyaba
 */

function handleContactFormSubmit(event) {
  event.preventDefault();
  
  const nameEl = document.getElementById('contact-name');
  const emailEl = document.getElementById('contact-email');
  const subjectEl = document.getElementById('contact-subject');
  const messageEl = document.getElementById('contact-message');
  const statusEl = document.getElementById('contact-status-msg');

  if (!nameEl || !emailEl || !subjectEl || !messageEl) return;

  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const subject = subjectEl.value.trim();
  const message = messageEl.value.trim();

  // Validate
  if (!name || !email || !subject || !message) {
    showStatusMessage(statusEl, 'برائے مہربانی تمام خانے پُر کریں۔', 'error');
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showStatusMessage(statusEl, 'برائے مہربانی درست ای میل ایڈریس درج کریں۔', 'error');
    return;
  }

  if (message.length < 15) {
    showStatusMessage(statusEl, 'پیغام کم از کم 15 حروف پر مشتمل ہونا چاہیے۔', 'error');
    return;
  }

  // Construct direct mailto trigger for hhooregul@gmail.com
  const mailtoUrl = `mailto:hhooregul@gmail.com?subject=${encodeURIComponent('[راہِ دینِ اسلام رابطہ] ' + subject)}&body=${encodeURIComponent(
    `نام: ${name}\nای میل: ${email}\n\nپیغام:\n${message}\n\n---\nارسال بذریعہ ویب سائٹ: راہِ دینِ اسلام`
  )}`;

  // Show honest feedback and trigger mail client
  showStatusMessage(statusEl, 'جزاکم اللہ خیراً! آپ کا ای میل کلائنٹ کھولا جا رہا ہے تاکہ پیغام براہِ راست محترمہ طیبہ (hhooregul@gmail.com) کو ارسال کیا جا سکے۔', 'success');
  
  window.location.href = mailtoUrl;

  // Reset form
  setTimeout(() => {
    nameEl.value = '';
    emailEl.value = '';
    subjectEl.value = '';
    messageEl.value = '';
  }, 2000);
}

function handleAskQuestionSubmit(event) {
  event.preventDefault();

  const nameEl = document.getElementById('qa-ask-name');
  const emailEl = document.getElementById('qa-ask-email');
  const catEl = document.getElementById('qa-ask-category');
  const questionEl = document.getElementById('qa-ask-question');
  const statusEl = document.getElementById('qa-ask-status');

  if (!nameEl || !emailEl || !questionEl) return;

  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const category = catEl ? catEl.value : 'عمومی';
  const question = questionEl.value.trim();

  if (!name || !email || !question) {
    showStatusMessage(statusEl, 'برائے مہربانی اپنا نام، ای میل اور سوال مکمل لکھیں۔', 'error');
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showStatusMessage(statusEl, 'برائے مہربانی درست ای میل ایڈریس درج کریں۔', 'error');
    return;
  }

  const mailtoUrl = `mailto:hhooregul@gmail.com?subject=${encodeURIComponent('[راہِ دینِ اسلام سوال] زمرہ: ' + category)}&body=${encodeURIComponent(
    `نام سائل: ${name}\nای میل: ${email}\nزمرہ: ${category}\n\nسوال:\n${question}\n\nنوٹ: سائل کو آگاہ کر دیا گیا ہے کہ یہ تحقیقی و تعلیمی مقصد کے لیے ہے اور باقاعدہ فتوٰی کے لیے دار الافتاء سے رجوع لازم ہے۔`
  )}`;

  showStatusMessage(statusEl, 'آپ کا سوال موصول ہو گیا۔ تحقیقی جواب کے لیے رابطہ کیا جائے گا۔ ذاتی و خاندانی مسائل کے لیے اپنے مقامی دار الافتاء سے فتوٰی حاصل کریں۔', 'success');

  window.location.href = mailtoUrl;

  setTimeout(() => {
    closeModal('ask-question-modal');
    questionEl.value = '';
  }, 2500);
}

function showStatusMessage(element, text, type) {
  if (!element) return;
  element.textContent = text;
  element.style.display = 'block';
  element.className = type === 'error' ? 'alert alert-danger' : 'alert alert-success';
  element.style.padding = '10px 14px';
  element.style.borderRadius = '8px';
  element.style.marginTop = '12px';
  element.style.fontSize = '0.92rem';
  element.style.fontWeight = '600';
  
  if (type === 'error') {
    element.style.background = '#fee2e2';
    element.style.color = '#991b1b';
    element.style.border = '1px solid #f87171';
  } else {
    element.style.background = '#d1fae5';
    element.style.color = '#065f46';
    element.style.border = '1px solid #34d399';
  }
}

window.handleContactFormSubmit = handleContactFormSubmit;
window.handleAskQuestionSubmit = handleAskQuestionSubmit;
