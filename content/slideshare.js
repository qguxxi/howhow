// howhow - SlideShare Content Script: Extract High-Res Slides & Export PDF
(() => {
  if (globalThis.__howhowSlideShareInjected) return;
  globalThis.__howhowSlideShareInjected = true;

  function getSlideImages() {
    const imgs = Array.from(document.querySelectorAll('img.slide-image, img[data-full], [id^="slide-"] img, picture.slide-image img, .slide_image, img[src*="slidesharecdn.com"]'));
    const unique = new Map();

    imgs.forEach((img, index) => {
      // Tìm URL độ phân giải cao nhất
      let url = img.dataset.full || img.dataset.fullImage || img.getAttribute('data-full');

      if (!url && img.getAttribute('srcset')) {
        const parts = img.getAttribute('srcset').split(',').map(s => s.trim());
        const candidates = parts.map(p => {
          const [u, w] = p.split(/\s+/);
          return { url: u, width: parseInt(w) || 0 };
        }).sort((a, b) => b.width - a.width);

        if (candidates.length && candidates[0].url) {
          url = candidates[0].url;
        }
      }

      if (!url) {
        url = img.dataset.src || img.getAttribute('data-src') || img.src;
      }

      if (url && !url.includes('placeholder') && !url.startsWith('data:image/svg')) {
        const key = img.id || `slide_${index}`;
        if (!unique.has(url)) {
          unique.set(url, { id: key, url, index });
        }
      }
    });

    return Array.from(unique.values()).sort((a, b) => a.index - b.index);
  }

  function performUnblur() {
    // Ẩn banners, popups, sticky toolbars
    document.querySelectorAll('.j-ad, .ad-container, [class*="AdContainer"], #top-banner, .banner-wrapper, .modal-backdrop, .dialog-wrapper').forEach(el => {
      el.style.display = 'none';
    });
  }

  let printContainer = null;
  let printStyle = null;

  function restore() {
    printContainer?.remove();
    printStyle?.remove();
    printContainer = null;
    printStyle = null;
    document.body.classList.remove('howhow-slideshare-print');
  }

  async function startExportPdf() {
    const slides = getSlideImages();
    if (!slides.length) {
      return { ok: false, error: 'Không tìm thấy hình ảnh slide nào trên trang SlideShare.' };
    }

    restore();

    printContainer = document.createElement('div');
    printContainer.id = 'howhow-slideshare-container';

    // Tạo các phần tử hình ảnh slide cho trang in
    slides.forEach(({ url }, idx) => {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'howhow-slide-page';

      const img = document.createElement('img');
      img.src = url;
      img.loading = 'eager';
      img.className = 'howhow-slide-img';

      pageDiv.appendChild(img);
      printContainer.appendChild(pageDiv);
    });

    document.body.appendChild(printContainer);
    document.body.classList.add('howhow-slideshare-print');

    printStyle = document.createElement('style');
    printStyle.textContent = `
      @media screen {
        #howhow-slideshare-container { display: none !important; }
      }
      @media print {
        @page { size: landscape; margin: 0; }
        html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
        body.howhow-slideshare-print > *:not(#howhow-slideshare-container) { display: none !important; }
        #howhow-slideshare-container { display: block !important; }
        .howhow-slide-page {
          width: 100vw !important;
          height: 100vh !important;
          page-break-after: always !important;
          break-after: page !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
          background: #fff !important;
        }
        .howhow-slide-page:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
        }
        .howhow-slide-img {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
        }
      }
    `;
    document.head.appendChild(printStyle);

    window.addEventListener('afterprint', () => restore(), { once: true });
    requestAnimationFrame(() => window.print());

    return { ok: true, pageCount: slides.length };
  }

  // Message listener
  chrome.runtime.onMessage.addListener((message, _sender, respond) => {
    if (message?.target !== 'howhow-slideshare') return;

    if (message.action === 'PING') {
      const slides = getSlideImages();
      respond({ ok: true, platform: 'slideshare', pageCount: slides.length });
      return;
    }

    if (message.action === 'UNBLUR') {
      performUnblur();
      const slides = getSlideImages();
      respond({ ok: true, message: `Đã dọn dẹp giao diện SlideShare (${slides.length} slide)!`, pageCount: slides.length });
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

  performUnblur();
})();
