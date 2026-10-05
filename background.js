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
