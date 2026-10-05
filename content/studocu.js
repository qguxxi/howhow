// howhow - Studocu Content Script: Unblur, Hydration, & Native PDF Export
(() => {
  if (globalThis.__howhowStudocuInjected) return;
  globalThis.__howhowStudocuInjected = true;

  const state = {
    phase: 'idle', // 'idle' | 'unblurring' | 'hydrating' | 'printing' | 'error'
    message: 'Sẵn sàng',
    pageCount: 0,
    hydratedCount: 0
  };

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const frame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));

  let pageStyle = null;
  let pageEls = [];
  let touched = [];
  let savedScroll = null;

  // ==========================================
  // 1. GỠ MỜ & VÁ REACT FIBER (UNBLUR ENGINE)
  // ==========================================

  function deblurUrl(url) {
    if (!url || typeof url !== 'string') return null;
    if (url.includes('/pages/blurred/')) {
      return url.replace('/pages/blurred/', '/pages/');
    }
    if (url.includes('/blurred/')) {
      return url.replace('/blurred/', '/');
    }
    return null;
  }

  function unblurImages() {
    document.querySelectorAll('.pf img, .page-content img').forEach(img => {
      if (img.dataset.howhowUnblurred) return;

      const curSrc = img.getAttribute('src');
      const clearSrc = deblurUrl(curSrc);
      if (clearSrc) {
        img.dataset.howhowUnblurred = '1';
        img.removeAttribute('srcset');
        img.src = clearSrc;
      }

      const dataSrc = img.getAttribute('data-src');
      const clearData = deblurUrl(dataSrc);
      if (clearData) {
        img.setAttribute('data-src', clearData);
        img.dataset.howhowUnblurred = '1';
      }

      img.style.filter = 'none';
      img.style.opacity = '1';
      img.style.visibility = 'visible';
    });
  }

  function patchReactFiberProps() {
    document.querySelectorAll('.pf, .page-content').forEach(node => {
      try {
        const fiberKey = Object.keys(node).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance'));
        if (!fiberKey) return;
        let fiber = node[fiberKey];
        let depth = 0;
        while (fiber && depth < 10) {
          if (fiber.memoizedProps && 'isBlurred' in fiber.memoizedProps) {
            fiber.memoizedProps.isBlurred = false;
            fiber.memoizedProps.hasBlurredImage = false;
            break;
          }
          fiber = fiber.return;
          depth++;
        }
      } catch (e) {}
    });
  }

  function patchNextData() {
    try {
      const el = document.querySelector('#__NEXT_DATA__');
      if (!el) return;
      const data = JSON.parse(el.textContent);
      if (data?.props?.pageProps?.documentAccess) {
        data.props.pageProps.documentAccess.hasBlurredPages = false;
      }
      el.textContent = JSON.stringify(data);
    } catch (e) {}
  }

  function removeBlurClasses(el) {
    el.classList.remove('blurred-container');
    Array.from(el.classList).forEach(cls => {
      if (cls.toLowerCase().includes('blurred')) {
        el.classList.remove(cls);
      }
    });
  }

  function performUnblur() {
    patchNextData();
    patchReactFiberProps();

    document.querySelectorAll('.pf, .page-content, [class*="blurred"], [class*="Blurred"]').forEach(el => {
      el.style.filter = 'none';
      el.style.webkitFilter = 'none';
      el.style.opacity = '1';
      el.style.userSelect = 'auto';
      el.style.pointerEvents = 'auto';
      el.style.visibility = 'visible';
      el.style.clipPath = 'none';
      el.style.webkitClipPath = 'none';
      el.classList.add('nofilter');
      removeBlurClasses(el);
    });

    document.querySelectorAll('#modal-overlay, [class*="PremiumOverlay"], [class*="premium-overlay"]').forEach(el => {
      el.style.display = 'none';
    });

    unblurImages();
  }

  // Chạy định kỳ một cách nhẹ nhàng để bắt các trang lazy render
  setInterval(performUnblur, 1000);

  // ==========================================
  // 2. KHÔI PHỤC TRANG (RESTORE)
  // ==========================================

  function restore(message = 'Sẵn sàng') {
    document.body?.classList.remove('howhow-print');

    touched.forEach(el => {
      el.classList.remove('howhow-anc', 'howhow-hide');
    });

    pageEls.forEach(el => {
      el.classList.remove('howhow-page', 'howhow-last');
      el.style.removeProperty('width');
      el.style.removeProperty('height');
      el.style.removeProperty('page');
    });

    pageStyle?.remove();
    pageStyle = null;
    touched = [];
    pageEls = [];

    if (savedScroll) {
      const { x, y } = savedScroll;
      savedScroll = null;
      requestAnimationFrame(() => window.scrollTo(x, y));
    }

    Object.assign(state, {
      phase: 'idle',
      message
    });
  }

  // ==========================================
  // 3. THU THẬP & ĐO KÍCH THƯỚC TRANG
  // ==========================================

  function hasText(p) {
    return Boolean(p.textContent && p.textContent.trim());
  }

  function readPageIndex(p) {
    const el = p.hasAttribute('data-page-index')
      ? p
      : p.closest('[data-page-index]') || p.querySelector('[data-page-index]');
    const raw = el?.getAttribute('data-page-index');
    return raw != null && raw !== '' && !isNaN(+raw) ? +raw : null;
  }

  function collectPages() {
    const all = [...document.querySelectorAll('.page-content')];
    const outer = all.filter(p => !p.parentElement?.closest('.page-content'));

    const map = new Map();
    outer.forEach((p, i) => {
      const idx = readPageIndex(p) ?? i;
      const old = map.get(idx);
      if (!old || (!hasText(old) && hasText(p))) {
        map.set(idx, p);
      }
    });

    const indexes = [...map.keys()].sort((a, b) => a - b);
    return {
      pages: indexes.map(i => map.get(i)),
      indexes,
      rawCount: all.length
    };
  }

  function measurePage(p) {
    const pageRect = p.getBoundingClientRect();
    let contentRight = 0;

    p.querySelectorAll(['table', 'img', 'svg', 'canvas', 'pre', 'figure'].join(',')).forEach(el => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        contentRight = Math.max(contentRight, r.right - pageRect.left);
      }
    });

    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.textContent?.trim()) continue;
      const parent = node.parentElement;
      if (parent) {
        const style = getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
      }
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        if (r.width > 0 && r.height > 0) {
          contentRight = Math.max(contentRight, r.right - pageRect.left);
        }
      }
      range.detach?.();
    }

    const originalW = Math.ceil(Math.max(p.offsetWidth, p.scrollWidth, pageRect.width));
    const croppedW = contentRight > 0 ? Math.ceil(contentRight + 16) : originalW;
    const h = Math.ceil(Math.max(p.offsetHeight, p.scrollHeight, pageRect.height));

    return {
      w: Math.min(originalW, croppedW),
      h
    };
  }

  // ==========================================
  // 4. AUTO SCROLL & HYDRATE ALL PAGES
  // ==========================================

  async function hydrateAllPages(scrollStep = 0.35) {
    const scroller = document.scrollingElement || document.documentElement;
    if (!savedScroll) {
      savedScroll = { x: window.scrollX, y: window.scrollY };
    }

    const oldScrollBehavior = scroller.style.getPropertyValue('scroll-behavior');
    scroller.style.setProperty('scroll-behavior', 'auto', 'important');

    const maxWaitMs = 120000;
    const scrollDelayMs = 15;
    const startedAt = performance.now();
    let lastHydrated = -1;
    let stableSince = performance.now();

    try {
      while (performance.now() - startedAt < maxWaitMs) {
        const maxY = Math.max(0, scroller.scrollHeight - window.innerHeight);
        const nextY = Math.min(window.scrollY + window.innerHeight * scrollStep, maxY);
        window.scrollTo(0, nextY);

        await sleep(scrollDelayMs);

        const { pages } = collectPages();
        const hydrated = pages.filter(p => hasText(p) || p.querySelector('img, svg, canvas')).length;

        Object.assign(state, {
          phase: 'hydrating',
          message: `Đang nạp dữ liệu: ${hydrated}/${pages.length} trang…`,
          pageCount: pages.length,
          hydratedCount: hydrated
        });

        if (hydrated !== lastHydrated) {
          lastHydrated = hydrated;
          stableSince = performance.now();
        }

        const reachedBottom = window.scrollY >= maxY - 15;
        if (reachedBottom && (performance.now() - stableSince >= 1200)) {
          return { hydrated, total: pages.length };
        }
      }

      const { pages } = collectPages();
      return { hydrated: pages.length, total: pages.length };
    } finally {
      if (oldScrollBehavior) {
        scroller.style.setProperty('scroll-behavior', oldScrollBehavior);
      } else {
        scroller.style.removeProperty('scroll-behavior');
      }
    }
  }

  async function forceEagerImages(pages) {
    const imgs = [];
    pages.forEach(p => {
      p.querySelectorAll('img').forEach(img => {
        img.loading = 'eager';
        const lazy = img.dataset.src || img.getAttribute('data-src') || img.getAttribute('data-original');
        if (lazy && (!img.src || img.src.startsWith('data:'))) {
          img.src = lazy;
        }
        imgs.push(img);
      });
    });

    await Promise.allSettled(
      imgs.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
          setTimeout(resolve, 8000);
        });
      })
    );
  }

  // ==========================================
  // 5. CHUẨN BỊ BỐ CỤC IN (PREPARE PRINT)
  // ==========================================

  function markLayout(pages) {
    const keep = new Set();
    pages.forEach(p => {
      for (let el = p.parentElement; el && el !== document.documentElement; el = el.parentElement) {
        keep.add(el);
      }
    });

    const pageSet = new Set(pages);
    keep.forEach(el => {
      el.classList.add('howhow-anc');
      touched.push(el);
    });

    keep.forEach(anc => {
      [...anc.children].forEach(ch => {
        if (!keep.has(ch) && !pageSet.has(ch)) {
          ch.classList.add('howhow-hide');
          touched.push(ch);
        }
      });
    });

    pages.forEach(p => p.classList.add('howhow-page'));
    pages.at(-1)?.classList.add('howhow-last');
    pageEls = pages;
    document.body.classList.add('howhow-print');
  }

  async function preparePrint(pages) {
    markLayout(pages);
    await frame();
    await frame();

    if (document.fonts) {
      await document.fonts.ready;
    }

    const sizes = pages.map(measurePage);
    const ref = sizes.find(s => s.w > 0 && s.h > 0) || { w: 794, h: 1123 }; // Fallback A4

    sizes.forEach(s => {
      if (!(s.w > 0 && s.h > 0)) {
        s.w = ref.w;
        s.h = ref.h;
      }
    });

    const names = new Map();
    pages.forEach((p, i) => {
      const { w, h } = sizes[i];
      const key = `hh-${w}x${h}`;
      names.set(key, { w, h });
      p.style.setProperty('width', w + 'px', 'important');
      p.style.setProperty('height', h + 'px', 'important');
      p.style.setProperty('page', key);
    });

    pageStyle = document.createElement('style');
    pageStyle.textContent =
      '@media print {\n' +
      [...names].map(([k, v]) => `  @page ${k} { size: ${v.w}px ${v.h}px; margin: 0; }`).join('\n') +
      '\n}';
    document.head.appendChild(pageStyle);

    await frame();

    Object.assign(state, {
      phase: 'printing',
      message: `Đang mở hộp thoại in ${pages.length} trang…`,
      pageCount: pages.length
    });

    window.addEventListener('afterprint', () => restore(), { once: true });
    requestAnimationFrame(() => window.print());
  }

  async function startExportPdf() {
    performUnblur();

    const initial = collectPages();
    if (!initial.pages.length) {
      return { ok: false, error: 'Không tìm thấy trang tài liệu Studocu (.page-content).' };
    }

    Object.assign(state, {
      phase: 'hydrating',
      message: `Đang nạp toàn bộ ${initial.pages.length} trang…`
    });

    try {
      await hydrateAllPages();
      const refreshed = collectPages();
      await forceEagerImages(refreshed.pages);
      await preparePrint(refreshed.pages);
      return { ok: true, pageCount: refreshed.pages.length };
    } catch (e) {
      restore();
      return { ok: false, error: e.message || String(e) };
    }
  }

  // ==========================================
  // 6. MESSAGE LISTENER
  // ==========================================

  chrome.runtime.onMessage.addListener((message, _sender, respond) => {
    if (message?.target !== 'howhow-studocu') return;

    if (message.action === 'PING') {
      const { pages } = collectPages();
      respond({ ok: true, platform: 'studocu', pageCount: pages.length, state });
      return;
    }

    if (message.action === 'UNBLUR') {
      performUnblur();
      const { pages } = collectPages();
      respond({ ok: true, message: `Đã mở khóa và làm rõ ${pages.length} trang!`, pageCount: pages.length });
      return;
    }

    if (message.action === 'START_PDF') {
      startExportPdf().then(respond);
      return true; // asynchronous response
    }

    if (message.action === 'RESTORE') {
      restore();
      respond({ ok: true });
      return;
    }
  });

  // Chạy 1 lần ban đầu
  performUnblur();
})();
