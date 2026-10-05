// howhow - Scribd Engine: Advanced Unblur, Paywall Removal & High-Res PDF Export
(() => {
  if (globalThis.__howhowScribdInjected) return;
  globalThis.__howhowScribdInjected = true;

  const PAGE_SELECTORS = [
    'div.outer_page',
    'div.document_page',
    'div.page_container',
    'div.page-container',
    '[id^="page_container_"]'
  ];

  function getPages() {
    for (const sel of PAGE_SELECTORS) {
      const found = document.querySelectorAll(sel);
      if (found.length > 0) return Array.from(found);
    }
    return [];
  }

  function cleanPage(el) {
    el.classList.remove('blurred_page', 'blur');
    el.querySelectorAll('.blurred_page, .blur').forEach(inner => {
      inner.classList.remove('blurred_page', 'blur');
    });

    el.querySelectorAll('img, .absimg').forEach(img => {
      img.style.setProperty('opacity', '1', 'important');
      img.style.setProperty('filter', 'none', 'important');
      img.style.setProperty('display', 'block', 'important');
    });

    // 1. Dọn dẹp bằng CSS Selectors nâng cao
    const promoSelectors = [
      '.page-blur-promo',
      '.page-blur-promo-overlay',
      '.promo_overlay',
      '.between_page_portal',
      '.between_page_ads',
      '.page_missing_explanation',
      '.page_missing_explanation_inner',
      '[class*="blur-promo"]',
      '[class*="promo-overlay"]',
      '[class*="paywall"]',
      '[class*="unlock"]',
      '[class*="promo"]'
    ];
    promoSelectors.forEach(sel => {
      el.querySelectorAll(sel).forEach(inner => inner.remove());
    });

    // 2. Dọn dẹp bằng nhận diện nội dung văn bản nhạy cảm
    const promoTexts = [
      'Unlock this document',
      'Upload to download',
      'Start your 30 day free trial',
      'Unlock the next',
      'Skip ad',
      'Read for free'
    ];

    try {
      const allElements = Array.from(el.querySelectorAll('*'));
      allElements.forEach(item => {
        if (item && item.tagName !== 'SCRIPT' && item.tagName !== 'STYLE' &&
            item.childNodes.length === 1 && item.childNodes[0].nodeType === 3) {
          const text = item.textContent.trim();
          const matched = promoTexts.some(promo => text.includes(promo));
          if (matched) {
            let current = item;
            while (current && current.parentElement &&
                   !current.parentElement.classList.contains('outer_page') &&
                   !current.parentElement.classList.contains('std-page') &&
                   !current.parentElement.classList.contains('document_page') &&
                   !current.parentElement.classList.contains('page_container') &&
                   !current.parentElement.id.startsWith('page-') &&
                   current.parentElement.tagName !== 'BODY') {
              current = current.parentElement;
            }
            if (current && current !== el && current.tagName !== 'BODY') {
              current.remove();
            }
          }
        }
      });
    } catch (e) {
      console.error('Lỗi xóa overlay văn bản: ', e);
    }

    el.querySelectorAll('.text_layer, .text_layer_container, [class*="text_layer"]').forEach(tl => {
      tl.style.setProperty('opacity', '1', 'important');
      tl.style.setProperty('color', 'black', 'important');
      tl.style.setProperty('text-shadow', 'none', 'important');
      tl.style.setProperty('visibility', 'visible', 'important');
    });

    el.querySelectorAll('svg').forEach(svg => {
      svg.style.setProperty('opacity', '1', 'important');
      svg.style.setProperty('filter', 'none', 'important');
      svg.style.setProperty('visibility', 'visible', 'important');
    });
  }

  function unblurAllScribd() {
    const pages = getPages();
    if (!pages.length) {
      return { ok: false, error: 'Không tìm thấy trang tài liệu Scribd nào.' };
    }

    pages.forEach(cleanPage);

    // Xóa thêm các banner toàn trang
    document.querySelectorAll('.between_page_portal, .between_page_ads, .global_header, [class*="Banner"]').forEach(el => {
      el.style.display = 'none';
    });

    return { ok: true, message: `Đã mở khóa và làm rõ ${pages.length} trang Scribd!` };
  }

  function ensureViewerStyles() {
    let link = document.getElementById('howhow-viewer-styles');
    if (!link) {
      link = document.createElement('link');
      link.id = 'howhow-viewer-styles';
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL('content/viewer_styles.css');
      document.head.appendChild(link);
    }
  }

  function renderCleanViewer() {
    const pages = getPages();
    if (!pages.length) {
      return { ok: false, error: 'Không tìm thấy trang tài liệu Scribd nào.' };
    }

    ensureViewerStyles();

    // Dọn viewer cũ
    const existingViewer = document.getElementById('clean-viewer-container');
    if (existingViewer) existingViewer.remove();

    const viewerContainer = document.createElement('div');
    viewerContainer.id = 'clean-viewer-container';

    pages.forEach((page, index) => {
      cleanPage(page);
      const clone = page.cloneNode(true);
      clone.classList.add('std-page');
      clone.id = `scribd-clean-page-${index + 1}`;
      clone.style.margin = '0 0 20px 0';
      clone.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
      viewerContainer.appendChild(clone);
    });

    document.body.appendChild(viewerContainer);

    setTimeout(() => {
      window.print();
    }, 800);

    return { ok: true, count: pages.length };
  }

  // Lắng nghe lệnh từ popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.target !== 'howhow-scribd') return;

    if (message.action === 'UNBLUR') {
      const res = unblurAllScribd();
      sendResponse(res);
      return true;
    }

    if (message.action === 'START_PDF') {
      const res = renderCleanViewer();
      sendResponse(res);
      return true;
    }
  });
})();
