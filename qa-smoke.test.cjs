const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');

function openTool() {
  const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const elements = new Map(), downloads = [], blobs = new Map();
  let serial = 0;
  function el(id) {
    if (!elements.has(id)) elements.set(id, {
      value: '', checked: false, hidden: false, innerHTML: '', listeners: {},
      addEventListener(type, fn) { this.listeners[type] = fn; },
      click() { this.listeners.click?.(); }, focus() {}, scrollIntoView() {},
      setAttribute() {}, querySelectorAll() { return []; }, querySelector() { return { checked: false }; }
    });
    return elements.get(id);
  }
  const impactIds = ['r_imp_res', 'r_imp_legal', 'r_imp_rep', 'r_imp_op', 'r_imp_fin'];
  for (const id of ['panel-incident', 'panel-monitor', 'panel-reassess']) {
    el(id).querySelectorAll = selector => selector === '.r_imp' ? impactIds.map(el) : [];
  }
  const document = {
    getElementById: el, querySelectorAll() { return []; }, body: { appendChild() {} },
    createElement() { return { click() { downloads.push({ name: this.download, content: blobs.get(this.href) }); }, remove() {} }; }
  };
  const sandbox = {
    document, navigator: { clipboard: { writeText: () => Promise.resolve() } }, console,
    Blob: class { constructor(parts) { this.text = parts.join(''); } },
    URL: { createObjectURL(blob) { const url = 'blob:' + ++serial; blobs.set(url, blob.text); return url; }, revokeObjectURL() {} },
    setTimeout() {}
  };
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox);
  return { el, downloads, impactIds, set(values) { for (const [key, value] of Object.entries(values)) el(key).value = value; } };
}

test('monitoring never claims a complete review without measurement, owner and evidence', () => {
  const t = openTool();
  t.set({ m_air: 'AIR-QA-1', m_cat: 'Performance', m_metric: 'Accuracy',
    m_breach: 'Yes', m_sev: 'High', m_material: 'No', m_escalation: 'Yes', m_status: 'Escalated' });
  const required = [
    ['m_period', '2026-Q3'], ['m_owner', 'Service Owner'],
    ['m_threshold', 'At least 95%'], ['m_actual', '91%'], ['m_evidence', 'Case log QA-1']
  ];
  for (const [field, value] of required) {
    t.el('m_run').click();
    assert.equal(t.el('m_results').innerHTML, '', field + ' cannot be left empty');
    assert.equal(t.el('m_formErr').hidden, false);
    t.el(field).value = value;
  }
  t.el('m_run').click();
  assert.match(t.el('m_results').innerHTML, /Handover ready — reassessment indicated/);
  t.el('m_dlRow').click();
  const row = t.downloads.find(f => f.name.includes('WCC-AIG-39'));
  assert.ok(row);
  assert.match(row.content, /Case log QA-1/);
});

test('reassessment preserves the decision gate and uses a valid register-row instruction', () => {
  const t = openTool();
  t.set({ r_air: 'AIR-QA-2', r_sys: 'Test system', r_change: 'Approved threshold breach',
    r_lik: '3', r_ctrl: '2', r_prevTier: 'Medium' });
  for (const id of t.impactIds) t.el(id).value = '3';
  t.el('r_run').click();
  assert.doesNotMatch(t.el('r_results').innerHTML, /Rthe system/);
  assert.match(t.el('r_results').innerHTML, /identify the system’s existing row by AIR-ID/);
  assert.doesNotMatch(t.el('r_results').innerHTML, /id="r_dlGate"/);
  t.set({ r_forum: 'AI Governance Working Group', r_decision: 'Pause',
    r_gateDate: '2026-09-24', r_dm: 'Chair', r_row: '7' });
  t.el('r_run').click();
  assert.match(t.el('r_results').innerHTML, /click cell <strong>R7<\/strong>/);
  t.el('r_dlGate').click();
  t.el('r_dlDecision').click();
  assert.ok(t.downloads.some(f => f.name.includes('WCC-AIG-36')));
  assert.ok(t.downloads.some(f => f.name.includes('WCC-AIG-16') && /decision-maker completes/i.test(f.content)));
});
