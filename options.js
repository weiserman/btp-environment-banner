const rowsEl = document.getElementById('rows');
const template = document.getElementById('row-template');
const statusEl = document.getElementById('status');
const emptyEl = document.getElementById('empty');

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('error', isError);
}

function updateEmpty() {
  emptyEl.hidden = rowsEl.rows.length > 0;
}

function addRow(env) {
  const row = template.content.firstElementChild.cloneNode(true);
  for (const input of row.querySelectorAll('[data-field]')) {
    const value = env[input.dataset.field];
    if (input.type === 'checkbox') input.checked = input.dataset.field === 'enabled' ? value !== false : !!value;
    else input.value = value ?? '';
  }
  row.querySelector('.delete').addEventListener('click', () => {
    row.remove();
    updateEmpty();
  });
  rowsEl.appendChild(row);
  updateEmpty();
}

function render(envs) {
  rowsEl.replaceChildren();
  envs.forEach(addRow);
  updateEmpty();
}

// Reads the table; returns null (and highlights fields) if any row is invalid.
function collect() {
  const envs = [];
  let valid = true;
  for (const row of rowsEl.rows) {
    const raw = {};
    for (const input of row.querySelectorAll('[data-field]')) {
      raw[input.dataset.field] = input.type === 'checkbox' ? input.checked : input.value;
      input.classList.remove('error');
    }
    const env = sanitizeRule(raw);
    if (!env) {
      for (const field of ['label', 'match']) {
        if (!raw[field].trim()) row.querySelector(`[data-field=${field}]`).classList.add('error');
      }
      valid = false;
      continue;
    }
    envs.push(env);
  }
  return valid ? envs : null;
}

async function loadEnvs() {
  const data = await chrome.storage.sync.get(STORAGE_KEY);
  return sanitizeRules(data[STORAGE_KEY]);
}

async function save(envs, message) {
  try {
    await chrome.storage.sync.set({ [STORAGE_KEY]: envs });
    setStatus(message || `Saved ${envs.length} rule${envs.length === 1 ? '' : 's'} – open tabs update automatically.`);
  } catch (e) {
    setStatus(`Save failed: ${e.message}`, true);
  }
}

document.getElementById('add').addEventListener('click', () => {
  addRow({ label: '', description: '', badge: '', color: '#6a1b9a', match: '', striped: false, enabled: true });
  rowsEl.lastElementChild.querySelector('[data-field=label]').focus();
});

document.getElementById('save').addEventListener('click', async () => {
  const envs = collect();
  if (!envs) return setStatus('Label and URL match are required for every rule.', true);
  render(envs);
  await save(envs);
});

document.getElementById('clear').addEventListener('click', async () => {
  if (!confirm('Delete all rules? Use Export first if you want to keep a copy.')) return;
  render([]);
  await save([], 'All rules deleted.');
});

document.getElementById('export').addEventListener('click', async () => {
  const envs = await loadEnvs();
  const blob = new Blob([exportRulesFile(envs)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `btp-env-banner-rules-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  setStatus(`Exported ${envs.length} saved rule${envs.length === 1 ? '' : 's'}.`);
});

const fileInput = document.getElementById('import-file');
document.getElementById('import').addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  fileInput.value = '';
  if (!file) return;
  let parsed;
  try {
    parsed = parseRulesFile(await file.text());
  } catch (e) {
    return setStatus(`Import failed: ${e.message}`, true);
  }
  const { rules, updated, added } = mergeRules(await loadEnvs(), parsed.rules);
  render(rules);
  const skipped = parsed.skipped ? `, ${parsed.skipped} invalid skipped` : '';
  await save(rules, `Imported ${parsed.rules.length} rule${parsed.rules.length === 1 ? '' : 's'} (${updated} updated, ${added} added${skipped}).`);
});

loadEnvs().then(render);
