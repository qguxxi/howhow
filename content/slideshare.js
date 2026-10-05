// howhow - SlideShare Engine: Next.js Metadata Extraction, Clean Ads & High-Res PDF Export
(() => {
  if (globalThis.__howhowSlideShareInjected) return;
  globalThis.__howhowSlideShareInjected = true;

  function getSlideShareImages() {
    let images = [];

    // Cách 1: Quét đệ quy đối tượng __NEXT_DATA__
    try {
      const nextDataEl = document.getElementById('__NEXT_DATA__');
      if (nextDataEl) {
        const data = JSON.parse(nextDataEl.textContent);

        // 1. Tìm tổng số slide đệ quy
        let totalSlidesCount = 0;
        function findTotalSlides(obj) {
          if (!obj || typeof obj !== 'object') return;
          if (typeof obj.totalSlides === 'number' && obj.totalSlides > 0) {
            totalSlidesCount = obj.totalSlides;
            return;
          }
          if (typeof obj.total === 'number' && obj.total > 0 && obj.host && obj.imageLocation) {
            totalSlidesCount = obj.total;
            return;
          }
          for (const k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
              findTotalSlides(obj[k]);
              if (totalSlidesCount > 0) return;
            }
          }
        }
        findTotalSlides(data);

        // 2. Tìm metadata chứa host và imageLocation
        let metadata = null;
        function findSlidesMetadata(obj) {
          if (!obj || typeof obj !== 'object') return;
          if (obj.host && typeof obj.host === 'string' && obj.host.includes('slideshare') && obj.imageLocation) {
            metadata = obj;
            return;
          }
          for (const k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
              findSlidesMetadata(obj[k]);
              if (metadata) return;
            }
          }
        }
        findSlidesMetadata(data);

        if (metadata) {
          const baseUrl = metadata.host;
          const loc = metadata.imageLocation;
          const title = metadata.title || '';
          const total = totalSlidesCount || metadata.totalSlides || metadata.total || 100;

          const sizes = metadata.imageSizes || [];
          if (sizes.length > 0) {
            sizes.sort((a, b) => b.width - a.width);
            const bestSize = sizes[0];
            const quality = bestSize.quality;
            const width = bestSize.width;

            for (let i = 1; i <= total; i++) {
              const imgUrl = `${baseUrl}/${loc}/${quality}/${title}-${i}-${width}.jpg`;
              images.push(imgUrl);
            }
          }
        }

        // 3. Fallback: Gom bất kỳ link ảnh CDN trực tiếp nào trong JSON
        if (images.length === 0) {
          const directUrls = new Set();
          function collectDirectUrls(obj) {
            if (!obj) return;
            if (typeof obj === 'string') {
              if (obj.includes('slidesharecdn.com') && (obj.endsWith('.jpg') || obj.endsWith('.png') || obj.includes('.jpg?') || obj.includes('.png?'))) {
                directUrls.add(obj);
              }
            } else if (typeof obj === 'object') {
              for (const k in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, k)) {
                  collectDirectUrls(obj[k]);
                }
              }
            }
          }
          collectDirectUrls(data);
          if (directUrls.size > 0) {
            images = Array.from(directUrls);
            images.sort((a, b) => {
              const matchA = a.match(/-(\d+)-\d+\.jpg/);
              const matchB = b.match(/-(\d+)-\d+\.jpg/);
              if (matchA && matchB) {
                return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
              }
              return 0;
            });
          }
        }
      }
    } catch (e) {
      console.warn('Lỗi cào Next.js JSON SlideShare:', e);
    }

    // Cách 2: Cào qua thẻ <picture> & <source srcset>
    if (images.length === 0) {
      const pictures = document.querySelectorAll('picture');
      pictures.forEach(pic => {
        const source = pic.querySelector('source');
        let url = null;
        if (source) {
          const srcset = source.getAttribute('srcset');
          if (srcset) {
            const parts = srcset.split(',').map(s => s.trim()).filter(Boolean);
            let maxWidth = -1;
            for (const part of parts) {
              const match = part.match(/^(\S+)\s+(\d+)w$/);
              if (match) {
                const w = parseInt(match[2], 10);
                if (w > maxWidth && match[1].includes('slidesharecdn.com')) {
                  maxWidth = w;
                  url = match[1];
                }
              } else if (part.includes('slidesharecdn.com')) {
                url = part;
              }
            }
          }
        }
        if (!url) {
          const img = pic.querySelector('img');
          if (img) {
            const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-full');
            if (src && src.includes('slidesharecdn.com')) url = src;
          }
        }
        if (url) images.push(url);
      });
    }

    // Cách 3: Fallback quét toàn bộ thẻ <img>
    if (images.length === 0) {
      const imgs = document.querySelectorAll('img');
      imgs.forEach(img => {
        const src = img.getAttribute('src') ||
                    img.getAttribute('data-src') ||
                    img.getAttribute('data-full') ||
                    img.getAttribute('srcset') ||
                    img.getAttribute('data-lazy-src');

        if (src && src.includes('slidesharecdn.com')) {
          if (src.includes(' ')) {
            const parts = src.split(',').map(s => s.trim()).filter(Boolean);
            let maxWidth = -1;
            let bestUrl = null;
            for (const part of parts) {
              const match = part.match(/^(\S+)\s+(\d+)w$/);
              if (match) {
                const w = parseInt(match[2], 10);
                if (w > maxWidth) {
                  maxWidth = w;
                  bestUrl = match[1];
                }
              } else {
                bestUrl = part;
              }
            }
            if (bestUrl) images.push(bestUrl);
          } else {
            images.push(src);
          }
        }
      });
    }

    return Array.from(new Set(images));
  }

  function cleanSlideShare() {
    const selectorsToRemove = [
      '.sidebar',
      '#related-slideshows',
      '.ad-banner',
      '.global-ad-slot',
      '.ad-container',
      '.advertisement',
      '[class*="premium-promo"]',
      '[class*="paywall"]',
      'iframe[src*="ad"]',
      'div[class*="ad-"]',
      'div[id*="ad-"]'
    ];
    selectorsToRemove.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => el.remove());
    });

    document.querySelectorAll('.blur, .blurred').forEach(el => {
      el.classList.remove('blur', 'blurred');
    });

    return { ok: true, message: 'Đã dọn sạch quảng cáo và tối ưu giao diện xem online!' };
  }

  function renderSlideSharePdf() {
    const images = getSlideShareImages();
    if (!images.length) {
      return { ok: false, error: 'Không tìm thấy hình ảnh slide nào trên trang SlideShare.' };
    }

    const existingViewer = document.getElementById('clean-viewer-container');
    if (existingViewer) existingViewer.remove();

    const viewerContainer = document.createElement('div');
    viewerContainer.id = 'clean-viewer-container';

    images.forEach((imgUrl, index) => {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'std-page std-page-landscape';
      pageDiv.id = `slideshare-page-${index + 1}`;
      pageDiv.style.cssText = 'width: 100%; max-width: 1200px; margin-bottom: 20px; display: flex; justify-content: center; align-items: center; background: white;';

      const img = document.createElement('img');
      img.src = imgUrl;
      img.loading = 'eager';
      img.style.cssText = 'width: 100%; height: auto; max-height: 100vh; object-fit: contain; display: block;';

      pageDiv.appendChild(img);
      viewerContainer.appendChild(pageDiv);
    });

    document.body.appendChild(viewerContainer);

    let link = document.getElementById('howhow-viewer-styles');
    if (!link) {
      link = document.createElement('link');
      link.id = 'howhow-viewer-styles';
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL('content/viewer_styles.css');
      document.head.appendChild(link);
    }

    setTimeout(() => {
      window.print();
    }, 1000);

    return { ok: true, count: images.length };
  }

  // Lắng nghe lệnh từ popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.target !== 'howhow-slideshare') return;

    if (message.action === 'UNBLUR') {
      const res = cleanSlideShare();
      sendResponse(res);
      return true;
    }

    if (message.action === 'START_PDF') {
      const res = renderSlideSharePdf();
      sendResponse(res);
      return true;
    }
  });
})();
