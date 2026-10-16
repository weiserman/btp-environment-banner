// Pure helpers for tagging a page from the toolbar popup. Kept free of
// chrome.* calls so they can be tested in Node.
const GUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

// Friendly names for BTP apps, shown in the popup. First match wins.
const APP_NAMES = [
  [/^mobile-service-cockpit/, 'Mobile Services'],
  [/(^|\.)cockpit\.btp\.cloud\.sap$/, 'BTP cockpit'],
  [/\.content-agent\.cloud\.sap$/, 'Content Agent'],
  [/\.integrationsuite(-trial)?\./, 'Integration Suite'],
  [/\.it-cpi\w*\./, 'Cloud Integration'],
  [/\.launchpad\.cfapps\./, 'Work Zone / Launchpad'],
  [/\.build\.cloud\.sap$/, 'SAP Build'],
  [/\.hcs\.cloud\.sap$/, 'Datasphere'],
  [/\.s4hana\.cloud\.sap$/, 'S/4HANA Cloud'],
  [/\.abap\.\w+\.hana\.ondemand\.com$/, 'ABAP environment'],
  [/\.(trial-)?accounts\d*\.(ondemand\.com|cloud\.sap)$/, 'Cloud Identity Services'],
  [/\.authentication\./, 'XSUAA login']
];

// Hosts that serve every environment, so the hostname alone says nothing
// about DEV / TEST / PRD and must not be tagged.
const SHARED_HOSTS = [
  /(^|\.)cockpit\.btp\.cloud\.sap$/,
  /^mobile-service-cockpit/,
  /^accounts\.sap\.com$/
];

const BTP_HOST = /(\.ondemand\.com|\.cloud\.sap)$/;

function appNameFor(hostname) {
  return APP_NAMES.find(([re]) => re.test(hostname))?.[1] || 'BTP app';
}

// Works out what to tag on a page. Returns
// { kind, app, key, match } or { error } or null for non-BTP pages.
// `key` is what identifies the target inside rule matches (for replace/remove).
function findTagTarget(url) {
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  const host = parsed.hostname.toLowerCase();
  if (!BTP_HOST.test(host)) return null;
  const app = appNameFor(host);

  const sub = new RegExp(`/subaccount/(${GUID})`, 'i').exec(url);
  if (sub) {
    const key = sub[1].toLowerCase();
    return { kind: 'Subaccount', app, key, match: `/subaccount/${key}` };
  }
  const org = new RegExp(`/org/(${GUID})`, 'i').exec(url);
  if (org) {
    const key = org[1].toLowerCase();
    return { kind: 'CF org', app, key, match: `/org/${key}` };
  }
  if (SHARED_HOSTS.some(re => re.test(host))) {
    return { error: `${app} is shared by all environments. Open a subaccount or org page to tag it.` };
  }
  return { kind: 'Host', app, key: `//${host}/`, match: `//${host}/` };
}

const ruleHasKey = (rule, key) => (rule.match || '').toLowerCase().includes(key);

// Same first-match-wins logic as content.js.
function findRuleForUrl(envs, url) {
  const u = (url || '').toLowerCase();
  return envs.find(e => e.enabled !== false && e.match && e.match.trim() &&
    u.includes(e.match.trim().toLowerCase())) || null;
}

// Replaces every rule mentioning the target with one rule of the given type,
// placed first so it wins over any broader rule.
function upsertTag(envs, target, typeLabel, name) {
  const rest = envs.filter(e => !ruleHasKey(e, target.key));
  return [envRule(typeLabel, target.match, (name || '').trim()), ...rest];
}

function removeTag(envs, target) {
  return envs.filter(e => !ruleHasKey(e, target.key));
}
