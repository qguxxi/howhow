// howhow - Popup Controller

const I18N = {
  vi: {
    langName: 'Tiếng Việt',
    downloadPdf: 'Tải file PDF',
    loadingPdf: 'Đang nạp dữ liệu…',
    warningTitle: 'Lưu ý:',
    warningContent: ' Để tải toàn bộ tài liệu hãy cuộn xuống dưới cùng trang tài liệu mà bạn muốn tải (Studocu, Scribd, SlideShare) để tải toàn bộ trang pdf',
    unlockDoc: 'Mở khóa tài liệu',
    coffeeTitle: 'Ủng hộ cốc cà phê',
    scanCode: 'Quét mã',
    modalTitle: 'Ủng hộ cốc cà phê ☕',
    modalMsg: 'Quét mã để ủng hộ nhóm phát triển howhow. Cảm ơn bạn rất nhiều! ✨',
    unlockedSuccess: 'Đã mở khóa và làm rõ tài liệu!',
    notSupported: 'Mở Studocu, Scribd hoặc SlideShare để sử dụng',
    preparingPrint: 'Đang nạp các trang và mở Print…',
    printReady: 'Hộp thoại in đã mở. Chọn "Save as PDF"!'
  },
  en: {
    langName: 'English',
    downloadPdf: 'Download PDF',
    loadingPdf: 'Loading document…',
    warningTitle: 'Note:',
    warningContent: ' To export the full document, please scroll down to the bottom of the document page (Studocu, Scribd, SlideShare) to load all pages.',
    unlockDoc: 'Unlock Document',
    coffeeTitle: 'Buy me a coffee',
    scanCode: 'Scan QR',
    modalTitle: 'Buy me a coffee ☕',
    modalMsg: 'Scan the QR code to support howhow development. Thank you so much! ✨',
    unlockedSuccess: 'Document unlocked and unblurred!',
    notSupported: 'Please open Studocu, Scribd, or SlideShare',
    preparingPrint: 'Preparing pages and launching print…',
    printReady: 'Print dialog opened. Select "Save as PDF"!'
  }
};

let currentLang = 'vi';
let currentTab = null;
let currentPlatform = null; // 'studocu' | 'scribd' | 'slideshare' | null

// Elements
const langButton = document.getElementById('langButton');
const langMenu = document.getElementById('langMenu');
const currentLangText = document.getElementById('currentLangText');

const btnDownloadPdf = document.getElementById('btnDownloadPdf');
const txtDownloadPdf = document.getElementById('txtDownloadPdf');

const txtWarningTitle = document.getElementById('txtWarningTitle');
const txtWarningContent = document.getElementById('txtWarningContent');

const btnUnlockDoc = document.getElementById('btnUnlockDoc');
const txtUnlockDoc = document.getElementById('txtUnlockDoc');

const txtCoffeeTitle = document.getElementById('txtCoffeeTitle');
const btnScanQr = document.getElementById('btnScanQr');
const txtScanCode = document.getElementById('txtScanCode');

const toastNotification = document.getElementById('toastNotification');
const toastMessage = document.getElementById('toastMessage');

const qrModal = document.getElementById('qrModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const txtModalTitle = document.getElementById('txtModalTitle');
const txtModalMsg = document.getElementById('txtModalMsg');

// ==========================================
// 1. NGÔN NGỮ (I18N)
// ==========================================

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('howhow_lang', lang);
  const t = I18N[lang] || I18N.vi;

  currentLangText.textContent = t.langName;
  txtDownloadPdf.textContent = t.downloadPdf;
  txtWarningTitle.textContent = t.warningTitle;
  txtWarningContent.textContent = t.warningContent;
  txtUnlockDoc.textContent = t.unlockDoc;
  txtCoffeeTitle.textContent = t.coffeeTitle;
  txtScanCode.textContent = t.scanCode;
  txtModalTitle.textContent = t.modalTitle;
  txtModalMsg.textContent = t.modalMsg;

  document.querySelectorAll('.shadcn-select-item, .lang-option').forEach(el => {
    const isActive = el.dataset.lang === lang;
    el.classList.toggle('active', isActive);
    const check = el.querySelector('.check-icon');
    if (check) {
      check.classList.toggle('hidden', !isActive);
    }
  });
}

langButton.addEventListener('click', (e) => {
  e.stopPropagation();
  langMenu.classList.toggle('hidden');
});

document.querySelectorAll('.shadcn-select-item, .lang-option').forEach(opt => {
  opt.addEventListener('click', () => {
    applyLanguage(opt.dataset.lang);
    langMenu.classList.add('hidden');
  });
});

document.addEventListener('click', () => {
  langMenu.classList.add('hidden');
});

// ==========================================
// 2. TOAST NOTIFICATION (NON-INTRUSIVE)
// ==========================================

let toastTimer = null;
function showToast(text, durationMs = 3000) {
  clearTimeout(toastTimer);
  toastMessage.textContent = text;
  toastNotification.classList.remove('hidden');

  toastTimer = setTimeout(() => {
    toastNotification.classList.add('hidden');
  }, durationMs);
}

// ==========================================
// 3. NHẬN DIỆN PLATFORM & INJECT FALLBACK
// ==========================================

function detectPlatform(url) {
  if (!url) return null;
  if (/^https?:\/\/(?:[^/]+\.)?(studocu\.(?:com|vn|id)|studeersnel\.nl)\//i.test(url)) {
    return 'studocu';
  }
  if (/^https?:\/\/(?:[^/]+\.)?scribd\.com\//i.test(url)) {
    return 'scribd';
  }
  if (/^https?:\/\/(?:[^/]+\.)?slideshare\.net\//i.test(url)) {
    return 'slideshare';
  }
  return null;
}

async function ensureContentScriptInjected(tabId, platform) {
  if (platform === 'studocu') {
    try {
      await chrome.scripting.insertCSS({ target: { tabId }, files: ['content/studocu.css'] });
    } catch {}
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content/studocu.js'] });
    } catch {}
  } else if (platform === 'scribd') {
    try {
      await chrome.scripting.insertCSS({ target: { tabId }, files: ['content/scribd.css'] });
    } catch {}
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content/scribd.js'] });
    } catch {}
  } else if (platform === 'slideshare') {
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content/slideshare.js'] });
    } catch {}
  }
}

async function sendPlatformMessage(action, payload = {}) {
  if (!currentPlatform || !currentTab?.id) {
    throw new Error(I18N[currentLang].notSupported);
  }

  const target = `howhow-${currentPlatform}`;
  const message = { target, action, ...payload };

  try {
    return await chrome.tabs.sendMessage(currentTab.id, message);
  } catch (err) {
    await ensureContentScriptInjected(currentTab.id, currentPlatform);
    return await chrome.tabs.sendMessage(currentTab.id, message);
  }
}

// ==========================================
// 4. ACTION LISTENERS
// ==========================================

// Tải file PDF
btnDownloadPdf.addEventListener('click', async () => {
  const t = I18N[currentLang];
  if (!currentPlatform) {
    showToast(t.notSupported);
    return;
  }

  btnDownloadPdf.disabled = true;
  txtDownloadPdf.textContent = t.loadingPdf;
  showToast(t.preparingPrint, 5000);

  try {
    const res = await sendPlatformMessage('START_PDF');
    if (res?.ok) {
      showToast(t.printReady, 4000);
    } else {
      showToast(res?.error || 'Không thể tạo bản in PDF.');
    }
  } catch (e) {
    showToast(e.message || 'Lỗi khi kết nối với trang.');
  } finally {
    btnDownloadPdf.disabled = false;
    txtDownloadPdf.textContent = t.downloadPdf;
  }
});

// Mở khóa tài liệu (Unblur)
btnUnlockDoc.addEventListener('click', async () => {
  const t = I18N[currentLang];
  if (!currentPlatform) {
    showToast(t.notSupported);
    return;
  }

  btnUnlockDoc.disabled = true;
  try {
    const res = await sendPlatformMessage('UNBLUR');
    if (res?.ok) {
      showToast(res.message || t.unlockedSuccess);
    } else {
      showToast(res?.error || 'Không thể mở khóa trang.');
    }
  } catch (e) {
    showToast(e.message || 'Lỗi kết nối với trang.');
  } finally {
    btnUnlockDoc.disabled = false;
  }
});

// Modal Quét mã
btnScanQr.addEventListener('click', () => {
  qrModal.classList.remove('hidden');
});

btnCloseModal.addEventListener('click', () => {
  qrModal.classList.add('hidden');
});

qrModal.addEventListener('click', (e) => {
  if (e.target === qrModal) {
    qrModal.classList.add('hidden');
  }
});

// ==========================================
// 5. KHỞI CHẠY (INITIALIZATION)
// ==========================================

async function init() {
  const savedLang = localStorage.getItem('howhow_lang') || 'vi';
  applyLanguage(savedLang);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    currentPlatform = detectPlatform(tab?.url);
  } catch {}
}

init();
