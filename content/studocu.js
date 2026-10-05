// howhow - Studocu Engine: Deep Clone Style Scaling, Auto-Hydration & High-Res PDF Export
(() => {
  if (globalThis.__howhowStudocuInjected) return;
  globalThis.__howhowStudocuInjected = true;

  const SCALE_FACTOR = 4;
  const HEIGHT_SCALE_DIVISOR = 4;

  function copyComputedStyle(source, target, scaleFactor, shouldScaleHeight = false, shouldScaleWidth = false, heightScaleDivisor = 4, widthScaleDivisor = 4, shouldScaleMargin = false, marginScaleDivisor = 4) {
    const computedStyle = window.getComputedStyle(source);
    if (!computedStyle) return;

    const normalProps = [
      'position', 'left', 'top', 'bottom', 'right',
      'font-family', 'font-weight', 'font-style',
      'color', 'background-color',
      'text-align', 'white-space',
      'display', 'visibility', 'opacity', 'z-index',
      'text-shadow', 'unicode-bidi', 'font-feature-settings', 'padding'
    ];

    const scaleProps = ['font-size', 'line-height'];
    let styleString = '';

    normalProps.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'auto' && value !== 'normal') {
        styleString += `${prop}: ${value} !important; `;
      }
    });

    const widthValue = computedStyle.getPropertyValue('width');
    if (widthValue && widthValue !== 'none' && widthValue !== 'auto') {
      if (shouldScaleWidth) {
        const numValue = parseFloat(widthValue);
        if (!isNaN(numValue) && numValue > 0) {
          const unit = widthValue.replace(numValue.toString(), '');
          styleString += `width: ${numValue / widthScaleDivisor}${unit} !important; `;
        } else {
          styleString += `width: ${widthValue} !important; `;
        }
      } else {
        styleString += `width: ${widthValue} !important; `;
      }
    }

    const heightValue = computedStyle.getPropertyValue('height');
    if (heightValue && heightValue !== 'none' && heightValue !== 'auto') {
      if (shouldScaleHeight) {
        const numValue = parseFloat(heightValue);
        if (!isNaN(numValue) && numValue > 0) {
          const unit = heightValue.replace(numValue.toString(), '');
          styleString += `height: ${numValue / heightScaleDivisor}${unit} !important; `;
        } else {
          styleString += `height: ${heightValue} !important; `;
        }
      } else {
        styleString += `height: ${heightValue} !important; `;
      }
    }

    ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'].forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'auto') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          if (shouldScaleMargin && numValue !== 0) {
            const unit = value.replace(numValue.toString(), '');
            styleString += `${prop}: ${numValue / marginScaleDivisor}${unit} !important; `;
          } else {
            styleString += `${prop}: ${value} !important; `;
          }
        }
      }
    });

    scaleProps.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'auto' && value !== 'normal') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue !== 0) {
          const unit = value.replace(numValue.toString(), '');
          styleString += `${prop}: ${numValue / scaleFactor}${unit} !important; `;
        } else {
          styleString += `${prop}: ${value} !important; `;
        }
      }
    });

    const transformOrigin = computedStyle.getPropertyValue('transform-origin');
    if (transformOrigin) {
      styleString += `transform-origin: ${transformOrigin} !important; -webkit-transform-origin: ${transformOrigin} !important; `;
    }

    styleString += 'overflow: visible !important; max-width: none !important; max-height: none !important; clip: auto !important; clip-path: none !important; ';
    target.style.cssText += styleString;
  }

  function deepCloneWithStyles(element, scaleFactor, heightScaleDivisor, depth = 0) {
    const clone = element.cloneNode(false);
    const hasTextClass = element.classList && element.classList.contains('t');
    const hasUnderscoreClass = element.classList && element.classList.contains('_');

    const shouldScaleMargin = element.tagName === 'SPAN' &&
      element.classList &&
      element.classList.contains('_') &&
      Array.from(element.classList).some(cls => /^_(?:\d+[a-z]*|[a-z]+\d*)$/i.test(cls));

    copyComputedStyle(element, clone, scaleFactor, hasTextClass, hasUnderscoreClass, heightScaleDivisor, 4, shouldScaleMargin, scaleFactor);

    if (element.classList && element.classList.contains('pc')) {
      clone.style.setProperty('transform', 'none', 'important');
      clone.style.setProperty('-webkit-transform', 'none', 'important');
      clone.style.setProperty('overflow', 'visible', 'important');
      clone.style.setProperty('max-width', 'none', 'important');
      clone.style.setProperty('max-height', 'none', 'important');
    }

    if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
      clone.textContent = element.textContent;
    } else {
      element.childNodes.forEach(child => {
        if (child.nodeType === 1) {
          clone.appendChild(deepCloneWithStyles(child, scaleFactor, heightScaleDivisor, depth + 1));
        } else if (child.nodeType === 3) {
          clone.appendChild(child.cloneNode(true));
        }
      });
    }
    return clone;
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

  function showStatusOverlay(text) {
    let overlay = document.getElementById('howhow-overlay-status');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'howhow-overlay-status';
      overlay.style.cssText = 'position:fixed; top:20px; right:20px; background:#18181b; color:#ffffff; padding:12px 20px; border-radius:10px; font-family:-apple-system,BlinkMacSystemFont,sans-serif; font-size:13px; font-weight:600; z-index:9999999; box-shadow:0 10px 25px rgba(0,0,0,0.25); border:1px solid #3f3f46; transition:opacity 0.3s ease;';
      document.body.appendChild(overlay);
    }
    overlay.innerText = text;
    overlay.style.opacity = '1';
    return overlay;
  }

  function hideStatusOverlay() {
    const overlay = document.getElementById('howhow-overlay-status');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
    }
  }

  function renderCleanViewer() {
    const pages = document.querySelectorAll('div[data-page-index]');
    if (pages.length === 0) {
      return { ok: false, error: 'Không tìm thấy trang tài liệu Studocu nào.' };
    }

    ensureViewerStyles();

    // Dọn dẹp viewer cũ nếu có
    const existingViewer = document.getElementById('clean-viewer-container');
    if (existingViewer) existingViewer.remove();

    const viewerContainer = document.createElement('div');
    viewerContainer.id = 'clean-viewer-container';

    pages.forEach((page, index) => {
      const pc = page.querySelector('.pc');
      let width = 595.3; // Fallback A4
      let height = 841.9;

      if (pc) {
        const pcStyle = window.getComputedStyle(pc);
        let pcWidth = NaN;
        let pcHeight = NaN;
        if (pcStyle) {
          pcWidth = parseFloat(pcStyle.width);
          pcHeight = parseFloat(pcStyle.height);
        }
        if (!isNaN(pcWidth) && pcWidth > 0 && !isNaN(pcHeight) && pcHeight > 0) {
          width = pcWidth;
          height = pcHeight;
        } else {
          const rect = pc.getBoundingClientRect();
          if (rect && rect.width > 10 && rect.height > 10) {
            width = rect.width;
            height = rect.height;
          }
        }
      }

      const newPage = document.createElement('div');
      newPage.className = 'std-page';
      newPage.id = `page-${index + 1}`;
      newPage.setAttribute('data-page-number', index + 1);
      newPage.style.width = width + 'px';
      newPage.style.height = height + 'px';

      // 1. Layer Background ảnh
      const originalImg = page.querySelector('img.bi') || page.querySelector('img');
      if (originalImg) {
        const bgLayer = document.createElement('div');
        bgLayer.className = 'layer-bg';
        const imgClone = originalImg.cloneNode(true);
        imgClone.style.cssText = 'width: 100%; height: 100%; object-fit: cover; object-position: top center';
        bgLayer.appendChild(imgClone);
        newPage.appendChild(bgLayer);
      }

      // 2. Layer Text chuẩn xác
      const originalPc = page.querySelector('.pc');
      if (originalPc) {
        const textLayer = document.createElement('div');
        textLayer.className = 'layer-text';
        const pcClone = deepCloneWithStyles(originalPc, SCALE_FACTOR, HEIGHT_SCALE_DIVISOR);
        pcClone.querySelectorAll('img').forEach(img => { img.style.display = 'none'; });
        textLayer.appendChild(pcClone);
        newPage.appendChild(textLayer);
      }

      viewerContainer.appendChild(newPage);
    });

    document.body.appendChild(viewerContainer);

    setTimeout(() => {
      window.print();
    }, 800);

    return { ok: true, count: pages.length };
  }

  async function autoScrollAndHydrate() {
    return new Promise((resolve) => {
      showStatusOverlay('🚀 Đang tự động nạp toàn bộ trang để tạo PDF sắc nét...');
      let oldScrollY = -1;
      let sameCount = 0;
      const scrollStep = 800;

      const scrollInterval = setInterval(() => {
        window.scrollBy(0, scrollStep);

        if (window.scrollY === oldScrollY) {
          sameCount++;
          if (sameCount >= 3) {
            clearInterval(scrollInterval);
            showStatusOverlay('✅ Đã nạp xong tài liệu! Đang chuẩn bị bản in PDF...');
            setTimeout(() => {
              hideStatusOverlay();
              const result = renderCleanViewer();
              resolve(result);
            }, 800);
          }
        } else {
          sameCount = 0;
          oldScrollY = window.scrollY;
        }
      }, 500);
    });
  }

  // ==========================================
  // UNBLUR ENGINE
  // ==========================================
  function unblurStudocu() {
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
    });

    document.querySelectorAll('#modal-overlay, [class*="PremiumOverlay"], [class*="premium-overlay"]').forEach(el => {
      el.style.display = 'none';
    });

    return { ok: true, message: 'Đã mở khóa nội dung mờ!' };
  }

  // Lắng nghe lệnh từ popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.target !== 'howhow-studocu') return;

    if (message.action === 'START_PDF') {
      const pages = document.querySelectorAll('div[data-page-index]');
      if (pages.length <= 3) {
        // Tự động cuộn nạp toàn bộ trang nếu chưa cuộn
        autoScrollAndHydrate().then(sendResponse);
      } else {
        const result = renderCleanViewer();
        sendResponse(result);
      }
      return true;
    }

    if (message.action === 'UNBLUR') {
      const result = unblurStudocu();
      sendResponse(result);
      return true;
    }
  });
})();
