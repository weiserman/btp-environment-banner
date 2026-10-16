// Unit tests for rules.js and tagging.js. No dependencies: `node test/run-tests.js`.
// All IDs and hosts are made up.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const ctx = vm.createContext({ URL });
for (const file of ['rules.js', 'tagging.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
}
const api = vm.runInContext(`({ ENV_TYPES, sanitizeRule, sanitizeRules, parseRulesFile,
  mergeRules, exportRulesFile, findTagTarget, findRuleForUrl, upsertTag, removeTag })`, ctx);

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`ok - ${name}`);
  } catch (e) {
    console.error(`FAIL - ${name}\n${e.stack}`);
    process.exitCode = 1;
  }
}
// vm objects have a different prototype, so compare via JSON.
const same = (actual, expected) => assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected);

const SUB = 'https://emea.cockpit.btp.cloud.sap/cockpit/#/globalaccount/00000000-0000-4000-8000-000000000000/subaccount/AAAAAAAA-aaaa-4aaa-8aaa-aaaaaaaaaaaa/subaccountoverview';
const ORG = 'https://mobile-service-cockpit-web.cfapps.ap10.hana.ondemand.com/cockpit/v1/org/33333333-3333-4333-8333-333333333333/space/x/index.html#/p';
const HOST_DEV = 'https://dev-myapp.ap10.content-agent.cloud.sap/index.html';
const HOST_TST = 'https://tst-myapp.ap10.content-agent.cloud.sap/index.html#/x';

test('sanitizeRule keeps valid rules and normalises fields', () => {
  same(api.sanitizeRule({ label: ' PRD ', description: 'Prod', badge: 'prd', color: '#C62828', striped: true, match: ' /org/x ' }),
    { label: 'PRD', description: 'Prod', badge: 'PRD', color: '#c62828', striped: true, match: '/org/x', enabled: true });
});

test('sanitizeRule replaces unsafe colours with the fallback', () => {
  for (const color of ['red', 'red;background:url(https://x)', '#fff', '#12345g', 'url(x)', 42, null, undefined]) {
    assert.strictEqual(api.sanitizeRule({ label: 'X', match: 'y', color }).color, '#555555', String(color));
  }
});

test('sanitizeRule rejects unusable input and truncates long text', () => {
  for (const bad of [null, 'x', 42, [], {}, { label: 'X' }, { match: 'y' }, { label: ' ', match: 'y' }, { label: 1, match: 'y' }]) {
    assert.strictEqual(api.sanitizeRule(bad), null, JSON.stringify(bad));
  }
  const long = api.sanitizeRule({ label: 'L'.repeat(50), description: 'D'.repeat(500), badge: 'BADGE', match: 'm'.repeat(500) });
  assert.deepStrictEqual([long.label.length, long.description.length, long.badge, long.match.length], [20, 60, 'BADG', 200]);
  assert.strictEqual(api.sanitizeRule({ label: 'X', match: 'y', striped: 'yes', enabled: 0 }).striped, false);
});

test('sanitizeRules handles non-arrays', () => {
  for (const value of [undefined, null, 'x', {}]) assert.strictEqual(api.sanitizeRules(value).length, 0);
});

test('export / parse round trip', () => {
  const rules = api.sanitizeRules([{ label: 'DEV', match: '/org/a', color: '#2e7d32' }, { label: 'PRD', match: '/org/b', striped: true }]);
  const file = JSON.parse(api.exportRulesFile(rules));
  assert.strictEqual(file.format, 'btp-env-banner-rules');
  same(api.parseRulesFile(JSON.stringify(file)).rules, JSON.parse(JSON.stringify(rules)));
});

test('parseRulesFile accepts a bare array and counts invalid rules', () => {
  const { rules, skipped } = api.parseRulesFile(JSON.stringify([{ label: 'A', match: 'a' }, { label: 'B' }, 'junk']));
  assert.deepStrictEqual([rules.length, skipped], [1, 2]);
});

test('parseRulesFile rejects files without rules', () => {
  assert.throws(() => api.parseRulesFile('{"foo": 1}'), /No rules/);
  assert.throws(() => api.parseRulesFile('not json'));
});

test('mergeRules replaces same match (case-insensitive) and appends new', () => {
  const existing = api.sanitizeRules([{ label: 'DEV', match: '/org/A' }, { label: 'TEST', match: '/org/b' }]);
  const imported = api.sanitizeRules([{ label: 'PRD', match: '/org/a' }, { label: 'DEV', match: '/org/c' }]);
  const { rules, updated, added } = api.mergeRules(existing, imported);
  assert.deepStrictEqual([updated, added], [1, 1]);
  same(rules.map(r => [r.label, r.match]), [['PRD', '/org/a'], ['TEST', '/org/b'], ['DEV', '/org/c']]);
});

test('findTagTarget: subaccount, org, host, shared and non-BTP pages', () => {
  same(api.findTagTarget(SUB), { kind: 'Subaccount', app: 'BTP cockpit', key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', match: '/subaccount/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' });
  same(api.findTagTarget(ORG), { kind: 'CF org', app: 'Mobile Services', key: '33333333-3333-4333-8333-333333333333', match: '/org/33333333-3333-4333-8333-333333333333' });
  same(api.findTagTarget(HOST_DEV), { kind: 'Host', app: 'Content Agent', key: '//dev-myapp.ap10.content-agent.cloud.sap/', match: '//dev-myapp.ap10.content-agent.cloud.sap/' });
  assert.strictEqual(api.findTagTarget('https://x.integrationsuite.cfapps.ap10.hana.ondemand.com/shell').app, 'Integration Suite');
  // Cloud Identity Services: tagged by tenant host even though the URL has an application GUID.
  same(api.findTagTarget('https://mytenant.accounts.ondemand.com/admin/#/applications/12345678-1234-4234-8234-123456789012'),
    { kind: 'Host', app: 'Cloud Identity Services', key: '//mytenant.accounts.ondemand.com/', match: '//mytenant.accounts.ondemand.com/' });
  assert.strictEqual(api.findTagTarget('https://mytenant.accounts.cloud.sap/admin/').app, 'Cloud Identity Services');
  assert.strictEqual(api.findTagTarget('https://mytenant.trial-accounts.ondemand.com/admin/').app, 'Cloud Identity Services');
  assert.ok(api.findTagTarget('https://emea.cockpit.btp.cloud.sap/cockpit/#/globalaccount/00000000-0000-4000-8000-000000000000').error);
  assert.ok(api.findTagTarget('https://mobile-service-cockpit-web.cfapps.ap10.hana.ondemand.com/cockpit/v1/index.html').error);
  for (const url of ['https://example.com/', 'https://cloud.sap.example.com/', 'https://evilondemand.com/', 'not a url', undefined]) {
    assert.strictEqual(api.findTagTarget(url), null, String(url));
  }
});

test('tag, retag and remove keep exactly one rule per target', () => {
  const sub = api.findTagTarget(SUB);
  let envs = api.sanitizeRules([{ label: 'DEV', match: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }, { label: 'DEV', match: '/org/other' }]);
  envs = api.upsertTag(envs, sub, 'TEST', '  My sub ');
  assert.strictEqual(envs.filter(e => e.match.includes('aaaaaaaa')).length, 1);
  same([envs[0].label, envs[0].description, envs[0].color], ['TEST', 'My sub', '#ef6c00']);
  assert.strictEqual(api.findRuleForUrl(envs, SUB).label, 'TEST');
  envs = api.removeTag(envs, sub);
  assert.strictEqual(api.findRuleForUrl(envs, SUB), null);
  assert.strictEqual(envs.length, 1);
});

test('host tags do not leak to other hosts', () => {
  let envs = api.upsertTag([], api.findTagTarget(HOST_DEV), 'DEV');
  envs = api.upsertTag(envs, api.findTagTarget(HOST_TST), 'TEST');
  assert.strictEqual(api.findRuleForUrl(envs, HOST_DEV).label, 'DEV');
  assert.strictEqual(api.findRuleForUrl(envs, HOST_TST).label, 'TEST');
  assert.strictEqual(api.findRuleForUrl(envs, 'https://dev-myapp.ap10.content-agent.cloud.sap.example.com/'), null);
  assert.strictEqual(api.findRuleForUrl(envs, ORG), null);
});

test('popup rules survive sanitising unchanged', () => {
  for (const type of api.ENV_TYPES) {
    const rule = api.upsertTag([], api.findTagTarget(ORG), type.label, 'Name')[0];
    same(api.sanitizeRule(rule), JSON.parse(JSON.stringify(rule)));
  }
});

console.log(`\n${passed} passed${process.exitCode ? ', some FAILED' : ''}`);
