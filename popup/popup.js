// howhow - Popup Controller with Advanced Extraction & Unblur Integrations

const I18N = {
  vi: {
    langName: 'Tiếng Việt',
    downloadPdf: 'Tải file PDF',
    loadingPdf: 'Đang chuẩn bị...',
    warningTitle: 'Lưu ý:',
    warningContent: 'Để tải toàn bộ tài liệu hãy cuộn xuống dưới cùng trang tài liệu mà bạn muốn tải (Studocu, Scribd, SlideShare) để nạp đầy đủ các trang trước khi in.',
    unlockDoc: 'Mở khóa tài liệu',
    coffeeTitle: 'Ủng hộ cốc cà phê',
    scanCode: 'Quét mã',
    modalTitle: 'Ủng hộ cốc cà phê ☕',
    modalMsg: 'Quét mã để ủng hộ nhóm phát triển howhow. Cảm ơn bạn rất nhiều! ✨',
    unlockedSuccess: 'Đã mở khóa và làm rõ tài liệu!',
    notSupported: 'Hãy mở trang Studocu, Scribd hoặc SlideShare',
    preparingPrint: 'Đang nạp các trang và chuẩn bị in PDF...',
    printReady: 'Hộp thoại in đã mở. Hãy chọn "Lưu dưới dạng PDF"!',
    clearingCookies: 'Đang xóa cookies & làm mới để gỡ watermark...',

    // Platform subtitles
    defaultSub: 'In tài liệu chất lượng cao',
    studocuDownloadSub: 'Tự động dàn trang in chất lượng cao',
    studocuUnlockTitle: 'Xem file & Xóa Watermark',
    studocuWarning: '💡 Mẹo: Nếu gặp lỗi "ERR_CONNECTION_RESET", hãy bật WARP 1.1.1.1 hoặc dùng studocu.vn. Nhớ cuộn xuống để nạp hết trang trước khi in.',
    scribdDownloadSub: 'Tự động tải & unblur PDF',
    scribdUnlockTitle: 'Mở khóa & Xóa Banner',
    slideshareDownloadSub: 'Dàn trang in slide ngang A4',
    slideshareUnlockTitle: 'Dọn sạch quảng cáo'
  },
  en: {
    langName: 'English',
    downloadPdf: 'Download PDF',
    loadingPdf: 'Preparing...',
    warningTitle: 'Note:',
    warningContent: 'To export the full document, please scroll down to the bottom of the document page (Studocu, Scribd, SlideShare) to load all pages.',
    unlockDoc: 'Unlock Document',
    coffeeTitle: 'Buy me a coffee',
    scanCode: 'Scan QR',
    modalTitle: 'Buy me a coffee ☕',
    modalMsg: 'Scan the QR code to support howhow development. Thank you so much! ✨',
    unlockedSuccess: 'Document unlocked and unblurred!',
    notSupported: 'Please open Studocu, Scribd, or SlideShare',
    preparingPrint: 'Preparing pages and launching print...',
    printReady: 'Print dialog opened. Select "Save as PDF"!',
    clearingCookies: 'Clearing cookies & reloading to remove watermark...',

    // Platform subtitles
    defaultSub: 'High quality document print',
    studocuDownloadSub: 'Auto layout high-res print',
    studocuUnlockTitle: 'View file & Clear Watermark',
    studocuWarning: '💡 Tip: If blocked with "ERR_CONNECTION_RESET", use 1.1.1.1 (WARP) or studocu.vn. Scroll down to load all pages before printing.',
    scribdDownloadSub: 'Auto unblur & download PDF',
    scribdUnlockTitle: 'Unlock & Remove Banners',
    slideshareDownloadSub: 'Landscape A4 slide layout',
    slideshareUnlockTitle: 'Clean advertisements'
  }
};

let currentLang = 'vi';
let activeTab = null;
let currentPlatform = null; // 'studocu' | 'scribd' | 'slideshare' | null

// Elements
const langButton = document.getElementById('langButton');
const langMenu = document.getElementById('langMenu');
const currentLangText = document.getElementById('currentLangText');

const btnDownloadPdf = document.getElementById('btnDownloadPdf');
const txtDownloadPdf = document.getElementById('txtDownloadPdf');
const txtDownloadSub = document.getElementById('txtDownloadSub');

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
// 1. TAB & PLATFORM DETECTION
// ==========================================

async function getTargetTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && !tab.url?.startsWith(chrome.runtime.getURL(''))) {
      return tab;
    }
  } catch {}

  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab && !tab.url?.startsWith(chrome.runtime.getURL(''))) {
      return tab;
    }
  } catch {}

  return null;
}

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

// ==========================================
// 2. COOKIE CLEARING (STUDOCU BYPASS)
// ==========================================

async function clearStudocuCookies(tab) {
  try {
    const allCookies = await chrome.cookies.getAll({});
    for (const cookie of allCookies) {
      if (cookie.domain.includes('studocu') || cookie.domain.includes('studeersnel')) {
        const cleanDomain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
        const protocol = cookie.secure ? 'https:' : 'http:';
        const url = `${protocol}//${cleanDomain}${cookie.path}`;
        const details = {
          url: url,
          name: cookie.name,
          storeId: cookie.storeId
        };
        if (cookie.partitionKey) {
          details.partitionKey = cookie.partitionKey;
        }
        await chrome.cookies.remove(details);
      }
    }
    await new Promise(r => setTimeout(r, 300));
    if (tab?.id) {
      chrome.tabs.reload(tab.id);
    }
    return true;
  } catch (e) {
    console.error('Lỗi xóa cookies:', e);
    return false;
  }
}

// ==========================================
// 3. TOAST & NOTIFICATIONS
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
// 4. I18N & DYNAMIC LABELS
// ==========================================

function updateDynamicLabels() {
  const t = I18N[currentLang] || I18N.vi;

  if (currentPlatform === 'studocu') {
    if (txtDownloadSub) txtDownloadSub.textContent = t.studocuDownloadSub;
    if (txtUnlockDoc) txtUnlockDoc.textContent = t.studocuUnlockTitle;
    if (txtWarningContent) txtWarningContent.textContent = t.studocuWarning || t.warningContent;
  } else if (currentPlatform === 'scribd') {
    if (txtDownloadSub) txtDownloadSub.textContent = t.scribdDownloadSub;
    if (txtUnlockDoc) txtUnlockDoc.textContent = t.scribdUnlockTitle;
    if (txtWarningContent) txtWarningContent.textContent = t.warningContent;
  } else if (currentPlatform === 'slideshare') {
    if (txtDownloadSub) txtDownloadSub.textContent = t.slideshareDownloadSub;
    if (txtUnlockDoc) txtUnlockDoc.textContent = t.slideshareUnlockTitle;
    if (txtWarningContent) txtWarningContent.textContent = t.warningContent;
  } else {
    if (txtDownloadSub) txtDownloadSub.textContent = t.defaultSub;
    if (txtUnlockDoc) txtUnlockDoc.textContent = t.unlockDoc;
    if (txtWarningContent) txtWarningContent.textContent = t.warningContent;
  }
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('howhow_lang', lang);
  const t = I18N[lang] || I18N.vi;

  currentLangText.textContent = t.langName;
  txtDownloadPdf.textContent = t.downloadPdf;
  txtWarningTitle.textContent = t.warningTitle;
  txtWarningContent.textContent = t.warningContent;
  txtCoffeeTitle.textContent = t.coffeeTitle;
  txtScanCode.textContent = t.scanCode;
  txtModalTitle.textContent = t.modalTitle;
  txtModalMsg.textContent = t.modalMsg;

  updateDynamicLabels();

  document.querySelectorAll('.shadcn-select-item').forEach(el => {
    const isActive = el.dataset.lang === lang;
    el.classList.toggle('active', isActive);
    const check = el.querySelector('.check-icon');
    if (check) {
      check.classList.toggle('hidden', !isActive);
    }
  });
}

// Language dropdown events
langButton.addEventListener('click', (e) => {
  e.stopPropagation();
  langMenu.classList.toggle('hidden');
});

document.querySelectorAll('.shadcn-select-item').forEach(opt => {
  opt.addEventListener('click', () => {
    applyLanguage(opt.dataset.lang);
    langMenu.classList.add('hidden');
  });
});

document.addEventListener('click', () => {
  langMenu.classList.add('hidden');
});

// ==========================================
// 5. INJECT & DISPATCH ENGINE
// ==========================================

async function ensureInjected(tabId, platform) {
  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['content/viewer_styles.css']
    });
  } catch {}

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
  if (!currentPlatform || !activeTab?.id) {
    throw new Error(I18N[currentLang].notSupported);
  }

  const target = `howhow-${currentPlatform}`;
  const message = { target, action, ...payload };

  try {
    return await chrome.tabs.sendMessage(activeTab.id, message);
  } catch (err) {
    await ensureInjected(activeTab.id, currentPlatform);
    return await chrome.tabs.sendMessage(activeTab.id, message);
  }
}

// ==========================================
// 6. ACTION HANDLERS
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

// Mở khóa tài liệu
btnUnlockDoc.addEventListener('click', async () => {
  const t = I18N[currentLang];
  if (!currentPlatform) {
    showToast(t.notSupported);
    return;
  }

  btnUnlockDoc.disabled = true;

  try {
    if (currentPlatform === 'studocu') {
      showToast(t.clearingCookies, 3000);
      await clearStudocuCookies(activeTab);
    } else {
      const res = await sendPlatformMessage('UNBLUR');
      if (res?.ok) {
        showToast(res.message || t.unlockedSuccess);
      } else {
        showToast(res?.error || 'Không thể mở khóa.');
      }
    }
  } catch (e) {
    showToast(e.message || 'Lỗi kết nối với trang.');
  } finally {
    btnUnlockDoc.disabled = false;
  }
});

// Donate Modal
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
// 7. INITIALIZATION
// ==========================================

async function init() {
  const savedLang = localStorage.getItem('howhow_lang') || 'vi';
  applyLanguage(savedLang);

  activeTab = await getTargetTab();
  if (activeTab?.url) {
    currentPlatform = detectPlatform(activeTab.url);
    updateDynamicLabels();
  }
}

document.addEventListener('DOMContentLoaded', init);
