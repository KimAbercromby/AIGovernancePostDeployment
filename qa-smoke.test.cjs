const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const governance = require('./src/logic.js');

const read = (name) => fs.readFileSync(path.join(__dirname, name), 'utf8');

test('incident severity is a provisional floor and can only move upward', () => {
  assert.equal(governance.severity([], false, '').level, 'Low');
  assert.equal(governance.severity(['Medium', 'High'], false, '').level, 'High');
  assert.deepEqual(governance.severity(['Medium'], true, ''), {
    level: 'High', aggregated: true, uplifted: false
  });
  assert.deepEqual(governance.severity(['Critical'], true, 'Low'), {
    level: 'Critical', aggregated: false, uplifted: false
  });
  assert.equal(governance.severity([], false, 'High').level, 'High');
});

test('internal routing deadline arithmetic handles weekdays and critical hours', () => {
  const saturday = governance.deadlineFor('Low', '2026-09-26T09:00:00');
  assert.equal(saturday.getDay(), 5);
  assert.equal(saturday.getDate(), 9);
  const critical = governance.deadlineFor('Critical', '2026-09-25T09:30:00');
  assert.equal(critical.getTime() - new Date('2026-09-25T09:30:00').getTime(), 24 * 60 * 60 * 1000);
  assert.equal(governance.deadlineFor('High', ''), null);
});

test('indicative residual-risk arithmetic selects the highest impact and correct tier', () => {
  const low = governance.calculateRisk([1, 2, 3, 1, 2], 2, 2);
  assert.deepEqual(low, { impact: 3, likelihood: 2, control: 2, inherent: 6, residual: 2.4, tier: 'Low' });
  assert.equal(governance.calculateRisk([5, 1, 2, 4, 1], 4, 5).tier, 'Critical');
  assert.equal(governance.calculateRisk([2, 2, 2, 2], 2, 2), null);
  assert.equal(governance.calculateRisk([2, 2, 2, 2, 2], 0, 2), null);
});

test('all case-specific duty screening prompts are required for ready handover', () => {
  assert.deepEqual(governance.screenMissing({ equality: true, humanRights: false, privacy: true, other: true }), ['humanRights']);
  assert.deepEqual(governance.screenMissing({ equality: true, humanRights: true, privacy: true, other: true }), []);
  const csv = governance.handoverCsv('draft', [['Value', '=1+1', 'not executable']]);
  assert.match(csv, /Draft handover only — not a workbook row/);
  assert.match(csv, /'=1\+1/);
});

test('monitoring handover is blocked until identity, review evidence and disposition are complete', () => {
  const complete = {
    airId: 'AIR-TEST-VALID', airIdVerified: true, category: 'Performance', metric: 'Accuracy',
    period: '2026-Q3', date: '2026-09-25', owner: 'Service Owner', threshold: 'Approved threshold ref',
    actual: 'Observed value', evidence: 'Versioned evidence pointer', breach: 'No', material: 'No',
    escalation: 'No', status: 'Reviewed', severity: '', source: '', selection: '',
    population: '', sample: '', window: ''
  };
  assert.equal(governance.validateMonitoring(complete), '');
  for (const field of ['airIdVerified', 'date', 'period', 'owner', 'metric', 'threshold', 'actual', 'evidence', 'status']) {
    const incomplete = { ...complete, [field]: field === 'airIdVerified' ? false : '' };
    assert.notEqual(governance.validateMonitoring(incomplete), '', `${field} must block a handover`);
  }
  assert.match(governance.validateMonitoring({ ...complete, breach: 'Yes' }), /provisional severity/i);
  assert.match(governance.validateMonitoring({ ...complete, source: 'sample system' }), /all five sampling fields/i);
  assert.match(governance.validateMonitoring({
    ...complete, source: 'population', selection: 'Random',
    population: '10', sample: '11', window: '2026-Q3'
  }), /sample size must be between/i);
});

test('handover CSV safely escapes delimiters, quotes, line breaks and filenames', () => {
  const csv = governance.handoverCsv('draft', [['field', 'A,"B"\nC', 'review']]);
  assert.match(csv, /"A,""B""\nC"/);
  assert.equal(governance.fileKey('../../AIR #5'), '______AIR__5');
  assert.match(governance.escapeHtml('<script>"x"&'), /^&lt;script&gt;&quot;x&quot;&amp;$/);
});

test('public static page loads maintainable local source and communicates record boundaries', () => {
  const html = read('index.html');
  const app = read('src/app.js');
  assert.match(html, /src\/logic\.js/);
  assert.match(html, /src\/app\.js/);
  assert.match(html, /PROPOSED DRAFT · NOT AN APPROVED SUITE/);
  assert.match(html, /AGPI is prioritisation, not a waiver/);
  assert.match(html + app, /permanent .*AIR-ID and current assurance state/i);
  assert.match(html + app, /prospective plan, dated event and event-linked conditions/);
  assert.match(html, /WCC-AIG-45/);
  assert.match(app, /current WCC-AIG-05/);
  assert.match(app, /WCC-AIG-16 or authorised native minutes/);
  assert.match(app, /exact headers in the current integrated 05\/36 workbook/);
});

test('three distinct post-deployment workflows and exports are present', () => {
  const html = read('index.html');
  const app = read('src/app.js');
  for (const id of ['panel-incident', 'panel-change', 'panel-monitor']) assert.match(html, new RegExp(id));
  for (const artifact of ['WCC-AIG-19', 'WCC-AIG-30', 'WCC-AIG-39', 'WCC-AIG-07', 'WCC-AIG-05', 'WCC-AIG-36', 'WCC-AIG-16']) {
    assert.ok(app.includes(artifact), `expected handover route for ${artifact}`);
  }
  assert.match(app, /Event ID.*Not assigned/);
  assert.match(app, /Linked Event ID.*Owner to enter after event is logged/);
});