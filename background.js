// howhow - Background Service Worker

/**
 * Xóa toàn bộ cookie của domain Studocu để reset hạn mức xem / rate limit
 */
async function clearStudocuCookies() {
  const allCookies = await chrome.cookies.getAll({});
  let count = 0;

  for (const cookie of allCookies) {
    if (cookie.domain.includes('studocu') || cookie.domain.includes('studeersnel')) {
      const cleanDomain = cookie.domain.startsWith('.')
        ? cookie.domain.substring(1)
        : cookie.domain;
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

      try {
        await chrome.cookies.remove(details);
        count++;
      } catch (e) {
        console.warn('Không thể xóa cookie:', cookie.name, e);
      }
    }
  }

  return count;
}

// Xử lý tin nhắn từ popup hoặc content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'CLEAR_COOKIES') {
    clearStudocuCookies()
      .then(count => sendResponse({ ok: true, count }))
      .catch(error => sendResponse({ ok: false, error: error.message }));
    return true; // Bất đồng bộ
  }

  if (message?.type === 'GET_TAB_INFO') {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      sendResponse({ ok: true, tab });
    }).catch(error => {
      sendResponse({ ok: false, error: error.message });
    });
    return true;
  }
});

/**
 * Tự động chuyển hướng từ studocu.com sang studocu.vn khi mạng VN chặn kết nối (ERR_CONNECTION_RESET)
 */
chrome.webNavigation.onErrorOccurred.addListener((details) => {
  if (details.frameId !== 0 || !details.url) return;

  const error = details.error || '';
  const isNetworkBlock =
    error.includes('CONNECTION_RESET') ||
    error.includes('CONNECTION_REFUSED') ||
    error.includes('CONNECTION_CLOSED') ||
    error.includes('NAME_NOT_RESOLVED') ||
    error.includes('TIMED_OUT');

  if (isNetworkBlock && details.url.includes('studocu.com')) {
    try {
      const urlObj = new URL(details.url);
      urlObj.hostname = 'www.studocu.vn';
      if (urlObj.pathname.startsWith('/en-us/')) {
        urlObj.pathname = urlObj.pathname.replace(/^\/en-us\//, '/vn/');
      }
      console.log(`[howhow] Phát hiện lỗi ${error} trên studocu.com. Đang chuyển hướng sang: ${urlObj.toString()}`);
      chrome.tabs.update(details.tabId, { url: urlObj.toString() });
    } catch (e) {
      console.warn('Lỗi khi tự động chuyển hướng studocu.com sang studocu.vn:', e);
    }
  }
});
