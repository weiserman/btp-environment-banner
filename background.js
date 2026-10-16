// Sets a per-tab toolbar badge from the environment reported by content.js.
// Makes no network requests and stores nothing.
const DEFAULT_TITLE = 'Environment Banner for BTP (click to tag this page)';
const BTP_HOSTS = ['.ondemand.com', '.cloud.sap'];
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function clearBadge(tabId) {
  chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {});
  chrome.action.setTitle({ tabId, title: DEFAULT_TITLE }).catch(() => {});
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  // Only accept messages from this extension's own content scripts.
  if (sender.id !== chrome.runtime.id || msg?.type !== 'env' || sender.tab?.id == null) return;
  const tabId = sender.tab.id;
  const env = msg.env;

  if (!env) {
    clearBadge(tabId);
    return;
  }

  const label = String(env.label || '').slice(0, 20);
  const description = String(env.description || '').slice(0, 60);
  chrome.action.setBadgeText({ tabId, text: String(env.badge || label).slice(0, 4) });
  chrome.action.setBadgeBackgroundColor({ tabId, color: HEX_COLOR.test(env.color) ? env.color : '#555555' });
  chrome.action.setBadgeTextColor?.({ tabId, color: '#fff' });
  chrome.action.setTitle({
    tabId,
    title: `Environment: ${label}${description ? ` — ${description}` : ''} (click to change)`
  });
});

// Leaving BTP: no content script runs there, so clear the badge.
// tab.url is only visible for hosts in host_permissions, so an undefined URL
// also means "not a BTP page".
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status !== 'loading') return;
  let host = '';
  try { host = new URL(tab.url).hostname; } catch {}
  if (!BTP_HOSTS.some(h => `.${host}`.endsWith(h))) clearBadge(tabId);
});
