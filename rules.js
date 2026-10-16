// Rule model shared by content.js, options.js and popup.js.
// A rule matches when its `match` text appears anywhere in the page URL
// (case-insensitive). The first enabled matching rule wins.
const STORAGE_KEY = 'envs';
const RULES_FORMAT = 'btp-env-banner-rules';

// Styling for each environment type, used by the toolbar popup when tagging.
const ENV_TYPES = [
  { label: 'DEV', description: 'Development', badge: 'DEV', color: '#2e7d32', striped: false },
  { label: 'TEST', description: 'Test / QA', badge: 'TST', color: '#ef6c00', striped: false },
  { label: 'PRD', description: 'PRODUCTION', badge: 'PRD', color: '#c62828', striped: true }
];

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const FALLBACK_COLOR = '#555555';
const LIMITS = { label: 20, description: 60, badge: 4, match: 200 };

function envRule(typeLabel, match, description) {
  const type = ENV_TYPES.find(t => t.label === typeLabel);
  return { ...type, description: description || type.description, match, enabled: true };
}

// Normalises a rule from storage, an import file or the settings form, and
// returns null when it is unusable. Every rule that reaches the banner goes
// through this, so colours are always plain #rrggbb values and text is short.
function sanitizeRule(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const str = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
  const rule = {
    label: str(raw.label, LIMITS.label),
    description: str(raw.description, LIMITS.description),
    badge: str(raw.badge, LIMITS.badge).toUpperCase(),
    color: HEX_COLOR.test(raw.color) ? raw.color.toLowerCase() : FALLBACK_COLOR,
    striped: raw.striped === true,
    match: str(raw.match, LIMITS.match),
    enabled: raw.enabled !== false
  };
  return rule.label && rule.match ? rule : null;
}

function sanitizeRules(list) {
  return Array.isArray(list) ? list.map(sanitizeRule).filter(Boolean) : [];
}

// Reads an exported rules file: { format, version, envs: [...] } or a bare array.
function parseRulesFile(text) {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : data?.envs;
  if (!Array.isArray(list)) throw new Error('No rules found in this file.');
  const rules = sanitizeRules(list);
  return { rules, skipped: list.length - rules.length };
}

// Imported rules replace existing rules with the same match; the rest are appended.
function mergeRules(existing, imported) {
  const key = rule => rule.match.toLowerCase();
  const rules = existing.slice();
  let updated = 0;
  let added = 0;
  for (const rule of imported) {
    const i = rules.findIndex(r => key(r) === key(rule));
    if (i >= 0) {
      rules[i] = rule;
      updated++;
    } else {
      rules.push(rule);
      added++;
    }
  }
  return { rules, updated, added };
}

function exportRulesFile(rules) {
  return JSON.stringify({ format: RULES_FORMAT, version: 1, exported: new Date().toISOString(), envs: rules }, null, 2) + '\n';
}
