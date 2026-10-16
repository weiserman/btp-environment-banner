const $ = id => document.getElementById(id);

async function loadEnvs() {
  const data = await chrome.storage.sync.get(STORAGE_KEY);
  return sanitizeRules(data[STORAGE_KEY]);
}

// Saves and closes the popup; on failure (e.g. sync storage quota) shows why.
async function saveEnvs(envs) {
  try {
    await chrome.storage.sync.set({ [STORAGE_KEY]: envs });
    window.close();
  } catch (e) {
    $('status').textContent = `Could not save: ${e.message}`;
  }
}

async function init() {
  $('settings').addEventListener('click', e => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
    window.close();
  });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const target = findTagTarget(tab?.url);
  if (!target || target.error) {
    $('no-target').hidden = false;
    if (target?.error) $('no-target-msg').textContent = target.error;
    return;
  }

  $('target').hidden = false;
  $('app').textContent = target.app;
  $('kind').textContent = target.kind === 'Host' ? '' : `${target.kind} `;
  $('key').textContent = target.kind === 'Host' ? target.key.replace(/\//g, '') : target.key;
  $('name').placeholder = `e.g. ${target.app} DEV`;

  const envs = await loadEnvs();
  const current = findRuleForUrl(envs, tab.url);
  if (current) {
    $('current').hidden = false;
    $('current').style.background = current.color;
    $('current').textContent = `Currently: ${current.label}${current.description ? ` — ${current.description}` : ''}`;
    // Only prefill a name the user chose; built-in descriptions such as
    // "Development subaccount" would be wrong after switching type.
    const stock = new Set(ENV_TYPES.map(e => e.description));
    if (current.description && !stock.has(current.description)) $('name').value = current.description;
    // A broader rule from the settings page can't be removed from here.
    $('remove').hidden = !ruleHasKey(current, target.key);
  }

  for (const type of ENV_TYPES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = type.label;
    btn.title = `Tag as ${type.description}`;
    btn.style.background = type.color;
    if (current?.label === type.label) btn.classList.add('selected');
    btn.addEventListener('click', async () => {
      await saveEnvs(upsertTag(await loadEnvs(), target, type.label, $('name').value));
    });
    $('types').appendChild(btn);
  }

  $('remove').addEventListener('click', async () => {
    await saveEnvs(removeTag(await loadEnvs(), target));
  });
}

init().catch(e => { $('status').textContent = `Error: ${e.message}`; });
