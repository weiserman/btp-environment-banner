// Injects a coloured environment banner at the top of matching pages and
// reports the environment to the background worker for the toolbar badge.
(() => {
  const BANNER_HEIGHT = 28;
  const HOST_ID = 'btp-env-banner-host';
  const OFFSET_ATTR = 'data-btp-env-banner';

  let envs = [];
  let dismissed = false;
  let lastUrl = null;
  let lastEnvKey = null;

  // test/preview.html sets this to simulate a cockpit URL; page globals are
  // not visible to real content scripts, so it has no effect in the browser.
  const currentUrl = () => window.__BTP_ENV_TEST_URL__ || location.href;

  function findEnv(url) {
    const u = url.toLowerCase();
    return envs.find(e => e.enabled && u.includes(e.match.toLowerCase())) || null;
  }

  // White text on dark colours, black text on light ones.
  function textColorFor(hex) {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#000' : '#fff';
  }

  function removeBanner() {
    document.getElementById(HOST_ID)?.remove();
    document.documentElement.removeAttribute(OFFSET_ATTR);
  }

  // Turns on the page offset in banner.css (keep its 28px in sync with
  // BANNER_HEIGHT) so the banner does not cover the UI5 shell header.
  function ensureOffset() {
    if (!document.documentElement.hasAttribute(OFFSET_ATTR)) {
      document.documentElement.setAttribute(OFFSET_ATTR, '');
    }
  }

  // Static stylesheet: rule values are never interpolated into CSS or HTML.
  const BANNER_CSS = `
    .bar {
      box-sizing: border-box; height: ${BANNER_HEIGHT}px; width: 100%;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      padding: 0 36px; font: 600 13px/1 "72", "Segoe UI", Arial, sans-serif;
      letter-spacing: .04em; box-shadow: 0 1px 4px rgba(0,0,0,.35);
      user-select: none;
    }
    .bar.striped {
      background-image: repeating-linear-gradient(-45deg, rgba(0,0,0,.18) 0 12px, transparent 12px 24px);
    }
    .label { font-weight: 800; font-size: 14px; letter-spacing: .12em; }
    .desc { opacity: .95; text-transform: uppercase; }
    button {
      position: absolute; right: 6px; top: 4px; width: 20px; height: 20px;
      border: 0; border-radius: 3px; background: transparent; color: inherit;
      font: 700 16px/20px Arial, sans-serif; cursor: pointer; padding: 0;
    }
    button:hover { background: rgba(0,0,0,.2); }
  `;

  function createHost() {
    const host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText =
      `all: initial; position: fixed; top: 0; left: 0; right: 0; height: ${BANNER_HEIGHT}px; z-index: 2147483647;`;

    const style = document.createElement('style');
    style.textContent = BANNER_CSS;

    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.setAttribute('role', 'banner');

    const label = document.createElement('span');
    label.className = 'label';
    const desc = document.createElement('span');
    desc.className = 'desc';

    const close = document.createElement('button');
    close.type = 'button';
    close.title = 'Hide banner until the page is reloaded';
    close.textContent = '×';
    close.addEventListener('click', () => {
      dismissed = true;
      removeBanner();
    });

    bar.append(label, desc, close);
    host.attachShadow({ mode: 'open' }).append(style, bar);
    document.documentElement.appendChild(host);
    return host;
  }

  // env has been through sanitizeRule, so env.color is always #rrggbb.
  function showBanner(env) {
    const root = (document.getElementById(HOST_ID) || createHost()).shadowRoot;
    const bar = root.querySelector('.bar');
    bar.style.backgroundColor = env.color;
    bar.style.color = textColorFor(env.color);
    bar.classList.toggle('striped', env.striped);
    root.querySelector('.label').textContent = env.label;
    root.querySelector('.desc').textContent = env.description ? `— ${env.description}` : '';
    ensureOffset();
  }

  function reportEnv(env) {
    const key = env ? JSON.stringify([env.badge, env.color, env.label, env.description]) : '';
    if (key === lastEnvKey) return;
    lastEnvKey = key;
    try {
      chrome.runtime.sendMessage({
        type: 'env',
        env: env && { badge: env.badge, color: env.color, label: env.label, description: env.description }
      })?.catch?.(() => {});
    } catch {
      // Extension was reloaded; this orphaned script can no longer talk to it.
    }
  }

  function render() {
    lastUrl = currentUrl();
    const env = findEnv(lastUrl);
    if (env && !dismissed) showBanner(env);
    else removeBanner();
    reportEnv(env);
  }

  async function loadEnvs() {
    try {
      const data = await chrome.storage.sync.get(STORAGE_KEY);
      envs = sanitizeRules(data[STORAGE_KEY]);
    } catch {
      envs = [];
    }
  }

  try {
    console.info(`[Environment Banner for BTP] v${chrome.runtime.getManifest().version} loaded`);
  } catch {}

  loadEnvs().then(render);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !changes[STORAGE_KEY]) return;
    envs = sanitizeRules(changes[STORAGE_KEY].newValue);
    lastEnvKey = null;
    render();
  });

  window.addEventListener('hashchange', render);
  window.addEventListener('popstate', render);

  // Catch pushState navigation and pages that wipe the banner from the DOM.
  setInterval(() => {
    if (currentUrl() !== lastUrl) return render();
    if (!dismissed && findEnv(lastUrl) &&
        (!document.getElementById(HOST_ID) || !document.documentElement.hasAttribute(OFFSET_ATTR))) render();
  }, 1000);
})();
