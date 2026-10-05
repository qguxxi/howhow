// howhow - Scribd Content Script: Unblur, Hydration, & Native PDF Export
(() => {
  if (globalThis.__howhowScribdInjected) return;
  globalThis.__howhowScribdInjected = true;

  const ROOT_SELECTOR = '.outer_page_container';
  const PAGE_SELECTOR = '.outer_page[id^="outer_page_"]';
  const STATE_KEY = '__howhowScribdState';
  const PAGE_PAD = 4;

  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

  // ==========================================
  // 1. INJECT MASTER UNBLUR STYLES
  // ==========================================

  function ensureUnblurStyles() {
    let style = document.getElementById('howhow-scribd-master-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'howhow-scribd-master-style';
      style.textContent = `
        /* Unblur Text: Override transparent text and 70px black text-shadow */
        .outer_page.blurred_page,
        .outer_page.blurred_page * {
          -webkit-user-drag: auto !important;
          user-select: text !important;
          -webkit-user-select: text !important;
        }

        .outer_page.blurred_page .text_layer,
        .outer_page.blurred_page .text_layer *,
        .outer_page.blurred_page .text_layer [style],
        .outer_page .text_layer,
        .outer_page .text_layer *,
        .outer_page .text_layer [style],
        .text_layer [style*="color: transparent"],
        .text_layer [style*="text-shadow"] {
          text-shadow: none !important;
          color: #000 !important;
          user-select: text !important;
          -webkit-user-select: text !important;
          opacity: 1 !important;
        }

        /* Unblur Images: Override opacity: 0.04 */
        .outer_page.blurred_page .image_layer img,
        .outer_page .image_layer img,
        .image_layer img[style*="opacity: 0.04"],
        .image_layer img[style*="opacity: 0."] {
          opacity: 1 !important;
          filter: none !important;
          -webkit-filter: none !important;
          visibility: visible !important;
        }

        /* Hide Scribd Paywalls, Promos, Ad countdowns, and Interstitials */
        ._3jL30R,
        [style*="--promo-vertical-offset"],
        .between_page_portal_root,
        .between_page_ads,
        .promo_wrapper,
        .document_scroller [class*="promo"],
        [class*="paywall"],
        .ad_wrapper,
        .mobile_banner,
        .autogen_class_views_read2_content_blur {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
      `;
      (document.head || document.documentElement).appendChild(style);
    }
  }

  // ==========================================
  // 2. UNBLUR ENGINE & PAYWALL REMOVAL
  // ==========================================

  function performUnblur() {
    ensureUnblurStyles();

    // 1. Remove blurred_page classes
    document.querySelectorAll('.blurred_page, [class*="blur"], .autogen_class_views_read2_content_blur').forEach(el => {
      el.classList.remove('blurred_page');
      el.style.filter = 'none';
      el.style.webkitFilter = 'none';
      el.style.opacity = '1';
    });

    // 2. Remove promo overlays from outer_page elements
    document.querySelectorAll(PAGE_SELECTOR).forEach(outerPage => {
      // Find all direct children that are promo / paywall elements
      Array.from(outerPage.children).forEach(child => {
        const isPageContent = child.classList.contains('newpage') ||
                              child.tagName === 'CANVAS' ||
                              child.className.startsWith('b_');
        if (!isPageContent) {
          // Check if this child or its sub-tree contains paywall or promo
          const text = child.innerText || '';
          if (text.includes('Unlock') || text.includes('Upload') || child.classList.contains('_3jL30R') || child.getAttribute('style')?.includes('--promo-vertical-offset')) {
            child.remove();
          }
        }
      });
    });

    // 3. Remove standalone promo overlays & between-page portals
    document.querySelectorAll('._3jL30R, [style*="--promo-vertical-offset"], .between_page_portal_root, .between_page_ads, .mobile_banner, .ad_wrapper').forEach(el => {
      el.remove();
    });

    // 4. Force unblur on image layers
    document.querySelectorAll('.image_layer img').forEach(img => {
      img.style.opacity = '1';
      img.style.filter = 'none';
      img.style.visibility = 'visible';
    });
  }

  // Auto-clean with MutationObserver
  let scrubTimer = null;
  function scheduleScrub() {
    clearTimeout(scrubTimer);
    scrubTimer = setTimeout(performUnblur, 100);
  }

  const observer = new MutationObserver((mutations) => {
    let shouldScrub = false;
    for (const m of mutations) {
      if (m.type === 'childList' && m.addedNodes.length > 0) {
        shouldScrub = true;
        break;
      }
      if (m.type === 'attributes' && m.attributeName === 'class') {
        if (m.target.classList?.contains('blurred_page')) {
          shouldScrub = true;
          break;
        }
      }
    }
    if (shouldScrub) {
      scheduleScrub();
    }
  });

  function startObserver() {
    const root = document.querySelector(ROOT_SELECTOR) || document.body;
    if (root) {
      observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }
  }

  window.addEventListener('scroll', () => scheduleScrub(), { passive: true });

  // ==========================================
  // 3. PAGE DISCOVERY & SIZING
  // ==========================================

  function getPagesInRoot(root) {
    return Array.from(root.querySelectorAll(PAGE_SELECTOR))
      .map(el => ({
        el,
        index: Number((el.id.match(/^outer_page_(\d+)$/) || [])[1])
      }))
      .filter(item => Number.isFinite(item.index))
      .sort((a, b) => a.index - b.index);
  }

  function findViewer() {
    const roots = Array.from(document.querySelectorAll(ROOT_SELECTOR));
    return roots
      .map(root => ({ root, pages: getPagesInRoot(root) }))
      .filter(item => item.pages.length > 0)
      .sort((a, b) => b.pages.length - a.pages.length)[0] || null;
  }

  function getPageSize(page) {
    const parse = val => {
      const n = Number.parseFloat(val || '');
      return Number.isFinite(n) && n > 0 ? n : 0;
    };
    const comp = getComputedStyle(page);
    let width = parse(page.style.width) || parse(comp.width) || page.offsetWidth;
    let height = parse(page.style.height) || parse(comp.height) || page.offsetHeight;

    if (!width || !height) {
      const inner = page.querySelector('.newpage');
      if (inner) {
        const scaleMatch = (inner.style.transform || '').match(/scale\(([^)]+)\)/);
        const scale = scaleMatch ? parse(scaleMatch[1]) : 1;
        width = width || parse(inner.style.width) * scale;
        height = height || parse(inner.style.height) * scale;
      }
    }

    return {
      width: Math.round((width || 794) * 100) / 100,
      height: Math.round((height || 1123) * 100) / 100
    };
  }

  // ==========================================
  // 4. HYDRATION & SCROLL HARVESTING
  // ==========================================

  async function waitForPageLoad(page, timeoutMs = 700) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const text = page.querySelector('.text_layer')?.textContent?.trim();
      const imgs = Array.from(page.querySelectorAll('.image_layer img'));
      if (text || imgs.some(img => img.complete && img.naturalWidth > 0) || page.querySelector('.image_layer canvas')) {
        return;
      }
      await pause(80);
    }
  }

  async function hydrate(viewer, state) {
    const { scrollX, scrollY } = window;
    state.scroll = { x: scrollX, y: scrollY };

    const style = document.createElement('style');
    style.textContent = `
      .howhow-hydrate {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
    state.hydrationStyle = style;

    for (const { el: page } of viewer.pages) {
      page.classList.add('howhow-hydrate');
      page.scrollIntoView({ block: 'center', behavior: 'instant' });
      
      // Clean promo if any appeared on this page
      Array.from(page.children).forEach(child => {
        if (child.classList?.contains('_3jL30R') || child.getAttribute('style')?.includes('--promo-vertical-offset')) {
          child.remove();
        }
      });

      for (const img of page.querySelectorAll('.image_layer img')) {
        img.loading = 'eager';
        img.style.opacity = '1';
      }
      await waitForPageLoad(page);
      await pause(60);
    }

    await Promise.race([document.fonts?.ready || Promise.resolve(), pause(2000)]);
    window.scrollTo(scrollX, scrollY);
    style.remove();
  }

  // ==========================================
  // 5. NATIVE HIGH QUALITY PRINT MODE
  // ==========================================

  function installPrintMode(viewer, state) {
    performUnblur();

    const moved = viewer.root.closest('.document_container') || viewer.root;
    state.moved = { node: moved, parent: moved.parentNode, next: moved.nextSibling };

    moved.classList.add('howhow-printwrap');
    document.body.appendChild(moved);

    const hideOthers = el => {
      if (el === moved || el.nodeType !== 1) return;
      el.style.setProperty('display', 'none', 'important');
    };
    Array.from(document.body.children).forEach(hideOthers);

    const sizes = new Map();
    viewer.pages.forEach(({ el: page, index }, i) => {
      const size = getPageSize(page);
      const width = Math.floor(size.width);
      const height = Math.floor(size.height);
      const isLast = i === viewer.pages.length - 1;

      page.classList.add('howhow-page');
      page.style.setProperty('width', `${width}px`, 'important');
      page.style.setProperty('height', `${height}px`, 'important');
      page.style.setProperty('overflow', 'hidden', 'important');
      page.style.setProperty('break-after', isLast ? 'auto' : 'page', 'important');
      page.style.setProperty('page-break-after', isLast ? 'auto' : 'always', 'important');

      const key = `${width}x${height}`;
      if (!sizes.has(key)) {
        sizes.set(key, { width, height, name: `hh_${key}` });
      }
      page.setAttribute('data-howhow-page-type', sizes.get(key).name);
    });

    const pageRules = Array.from(sizes.values()).map(
      ({ name, width, height }) =>
        `@page ${name}{size:${width + PAGE_PAD}px ${height + PAGE_PAD}px;margin:0}` +
        `.howhow-page[data-howhow-page-type="${name}"]{page:${name}!important;width:${width}px!important;height:${height}px!important}`
    ).join('\n');

    const printStyle = document.createElement('style');
    printStyle.id = 'howhow-scribd-print-style';
    printStyle.textContent = `
      @media print {
        ${pageRules}
        @page { margin: 0; }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: auto !important;
          height: auto !important;
          overflow: visible !important;
          background: #fff !important;
        }
        html > body > :not(.howhow-printwrap) {
          display: none !important;
        }
        .howhow-printwrap {
          display: block !important;
          visibility: visible !important;
          position: static !important;
          width: auto !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
        }
        .howhow-page {
          display: block !important;
          position: relative !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          overflow: hidden !important;
          opacity: 1 !important;
          visibility: visible !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .howhow-page .text_layer,
        .howhow-page .text_layer *,
        .howhow-page .text_layer [style] {
          text-shadow: none !important;
          color: #000 !important;
          opacity: 1 !important;
        }
        .howhow-page .image_layer img {
          opacity: 1 !important;
          filter: none !important;
        }
        ._3jL30R,
        [style*="--promo-vertical-offset"],
        .between_page_ads,
        .between_page_portal_root,
        .ad_wrapper {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(printStyle);
    state.style = printStyle;
  }

  function restore() {
    const state = window[STATE_KEY];
    if (!state) return;

    state.style?.remove();
    state.hydrationStyle?.remove();

    if (state.moved) {
      const { node, parent, next } = state.moved;
      if (parent?.isConnected) {
        if (next && next.parentNode === parent) parent.insertBefore(node, next);
        else parent.appendChild(node);
      }
    }

    if (state.scroll) {
      window.scrollTo(state.scroll.x, state.scroll.y);
    }

    Array.from(document.body.children).forEach(el => {
      el.style.removeProperty('display');
    });

    delete window[STATE_KEY];
  }

  async function startExportPdf() {
    const viewer = findViewer();
    if (!viewer) {
      return { ok: false, error: 'Chưa tìm thấy khung tài liệu Scribd (.outer_page_container).' };
    }

    const state = {};
    window[STATE_KEY] = state;

    try {
      await hydrate(viewer, state);
      installPrintMode(viewer, state);

      window.addEventListener('afterprint', () => restore(), { once: true });
      requestAnimationFrame(() => window.print());

      return { ok: true, pageCount: viewer.pages.length };
    } catch (e) {
      restore();
      return { ok: false, error: e.message || String(e) };
    }
  }

  // ==========================================
  // 6. MESSAGE LISTENER
  // ==========================================

  chrome.runtime.onMessage.addListener((message, _sender, respond) => {
    if (message?.target !== 'howhow-scribd') return;

    if (message.action === 'PING') {
      const viewer = findViewer();
      respond({ ok: true, platform: 'scribd', pageCount: viewer ? viewer.pages.length : 0 });
      return;
    }

    if (message.action === 'UNBLUR') {
      performUnblur();
      const viewer = findViewer();
      respond({ ok: true, message: 'Đã mở khóa toàn bộ tài liệu Scribd!', pageCount: viewer ? viewer.pages.length : 0 });
      return;
    }

    if (message.action === 'START_PDF') {
      startExportPdf().then(respond);
      return true;
    }

    if (message.action === 'RESTORE') {
      restore();
      respond({ ok: true });
      return;
    }
  });

  // Tự động khởi chạy unblur và observer
  ensureUnblurStyles();
  performUnblur();
  startObserver();
})();
