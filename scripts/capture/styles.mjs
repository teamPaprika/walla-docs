import fs from 'node:fs/promises';
import path from 'node:path';

export const VIEWPORT = { width: 1728, height: 992 };

export async function hideDevChrome(page) {
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-nextjs-dialog-overlay],
      [data-nextjs-toast],
      #__next-build-watcher {
        display: none !important;
        visibility: hidden !important;
      }
      * {
        caret-color: transparent !important;
      }
    `,
  }).catch(() => {});

  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach((el) => {
      el.style.display = 'none';
    });
  });
}

export async function clearOverlays(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.walla-docs-highlight, #walla-docs-blur-style').forEach((el) => {
      el.remove();
    });
    document.querySelectorAll('[data-walla-blurred="1"]').forEach((el) => {
      el.style.filter = '';
      el.removeAttribute('data-walla-blurred');
    });
  });
}

export async function applyModalBackdropBlur(page) {
  await page.evaluate(() => {
    const dialogs = Array.from(
      document.querySelectorAll('[role="dialog"]:not([data-nextjs-dialog="true"]), [role="alertdialog"]')
    );
    if (dialogs.length === 0) return;

    // Find the top-level modal container nearest to body for each dialog
    const keepUnblurred = new Set();
    for (const d of dialogs) {
      let cur = d;
      while (cur && cur.parentElement && cur.parentElement !== document.body) {
        cur = cur.parentElement;
      }
      if (cur) keepUnblurred.add(cur);
    }

    for (const child of Array.from(document.body.children)) {
      if (child.classList.contains('walla-docs-highlight')) continue;
      if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE' || child.tagName === 'NEXTJS-PORTAL') continue;
      if (keepUnblurred.has(child)) continue;
      child.style.filter = 'blur(4px)';
      child.setAttribute('data-walla-blurred', '1');
    }

    // If the modal backdrop element is inside one of the kept portal wrappers, also blur its background shell
    for (const child of keepUnblurred) {
      for (const inner of Array.from(child.children)) {
        const isBackdrop =
          inner.hasAttribute('data-base-ui-backdrop') ||
          inner.getAttribute('aria-hidden') === 'true' ||
          (inner.className && typeof inner.className === 'string' && inner.className.includes('backdrop'));
        if (isBackdrop) {
          inner.style.backdropFilter = 'blur(4px)';
        }
      }
    }
  });
}

export async function toPercentBox(box) {
  if (!box) return undefined;
  return {
    x: Number(((box.x / VIEWPORT.width) * 100).toFixed(2)),
    y: Number(((box.y / VIEWPORT.height) * 100).toFixed(2)),
    width: Number(((box.width / VIEWPORT.width) * 100).toFixed(2)),
    height: Number(((box.height / VIEWPORT.height) * 100).toFixed(2)),
  };
}

export async function highlightBox(page, box, opts = {}) {
  if (!box) return undefined;
  const {
    padding = 4,
    color = '#f472b6',
    radius = 10,
    borderWidth = 3,
  } = opts;

  await page.evaluate(
    ({ b, pad, col, rad, bw }) => {
      const div = document.createElement('div');
      div.className = 'walla-docs-highlight';
      Object.assign(div.style, {
        position: 'fixed',
        left: `${Math.max(0, b.x - pad)}px`,
        top: `${Math.max(0, b.y - pad)}px`,
        width: `${b.width + pad * 2}px`,
        height: `${b.height + pad * 2}px`,
        border: `${bw}px solid ${col}`,
        borderRadius: `${rad}px`,
        boxShadow: '0 0 0 3px rgba(244, 114, 182, 0.22)',
        pointerEvents: 'none',
        zIndex: '2147483647',
        boxSizing: 'border-box',
      });
      document.body.appendChild(div);
    },
    { b: box, pad: padding, col: color, rad: radius, bw: borderWidth }
  );

  return toPercentBox(box);
}

export async function highlightLocator(page, locator, opts = {}) {
  await locator.first().scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(150);
  const box = await locator.first().boundingBox();
  if (!box) {
    throw new Error(`Cannot highlight locator: boundingBox is null (${locator})`);
  }
  return highlightBox(page, box, opts);
}

export async function rewriteDomainText(page) {
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.includes('localhost:20700')) {
        node.nodeValue = node.nodeValue.replace(/http:\/\/localhost:20700/g, 'https://app.walla.my').replace(/localhost:20700/g, 'app.walla.my');
      }
      if (node.nodeValue && node.nodeValue.includes('localhost:20701')) {
        node.nodeValue = node.nodeValue.replace(/http:\/\/localhost:20701/g, 'https://app.walla.my').replace(/localhost:20701/g, 'app.walla.my');
      }
    }
    document.querySelectorAll('input, textarea').forEach((el) => {
      if (el.value && (el.value.includes('localhost:20700') || el.value.includes('localhost:20701'))) {
        el.value = el.value
          .replace(/http:\/\/localhost:20700/g, 'https://app.walla.my')
          .replace(/localhost:20700/g, 'app.walla.my')
          .replace(/http:\/\/localhost:20701/g, 'https://app.walla.my')
          .replace(/localhost:20701/g, 'app.walla.my');
      }
    });
  });
}

export async function capturePng(page, absPath, options = {}) {
  const {
    modalBlur = false,
    highlight = null,
    highlightOpts = {},
    domainRewrite = false,
    waitMs = 350,
  } = options;

  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await hideDevChrome(page);
  await page.waitForTimeout(waitMs);

  if (domainRewrite) {
    await rewriteDomainText(page);
  }
  if (modalBlur) {
    await applyModalBackdropBlur(page);
  }

  let pctBox;
  if (highlight) {
    pctBox = await highlightLocator(page, highlight, highlightOpts);
  }

  await page.screenshot({ path: absPath, fullPage: false });
  await clearOverlays(page);
  console.log(`Captured: ${absPath}`);
  return pctBox;
}
