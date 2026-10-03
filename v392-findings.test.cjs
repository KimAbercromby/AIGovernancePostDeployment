// One test per v3.9.2 pilot-readiness finding fixed in this router (scenario test of suite
// v3.9.1, 30 September 2026). Expected values come from fixtures/suite-v3.9.6-targets.json,
// generated from the v3.9.6 workbooks and forms by scripts/generate-fixtures.py.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const G = require('./src/logic.js');

const read = (file) => fs.readFileSync(path.join(__dirname, file), 'utf8');
const targets = JSON.parse(read('fixtures/suite-v3.9.6-targets.json'));
const html = read('index.html');
const app = read('src/app.js');

const baseChange = {
  airId: 'AIR-T004', airIdVerified: true, system: 'Council tax chatbot', useScope: 'UC-ID specific', ucId: 'UC-T011'
};

// AIG-ASS-02 v1.10 Risk Assessment C42 (mandatory risk floor), reimplemented from the formula
// read from the workbook, over the Step 4 answers C50:C56.
function ass02C42(c) {
  const f = targets.sheets.ass02TriageImport.step4Formulas.C42;
  assert.equal(f, '=IF(COUNTIF(C50:C56,"Yes")+COUNTIF(C50:C56,"No")+COUNTIF(C56,"Unsure")<7,"Incomplete",IF(OR(C54="Yes",C56="Yes",C56="Unsure"),"Critical",IF(COUNTIF(C50:C56,"Yes")>0,"High","Low")))');
  const answered = c.filter((v) => v === 'Yes' || v === 'No').length + (c[6] === 'Unsure' ? 1 : 0);
  if (answered < 7) return 'Incomplete';
  if (c[4] === 'Yes' || c[6] === 'Yes' || c[6] === 'Unsure') return 'Critical';
  return c.includes('Yes') ? 'High' : 'Low';
}

test('T-05: ticked change triggers carry into the AIG-ASS-02 Triage Import Step 4 rows (S11)', () => {
  // S11: the chatbot switches model and adds a balance lookup (authority changed).
  const answers = { specialData: 'No', vulnerable: 'No', housingCare: 'No', novel: 'No', statutory: 'No' };
  const rows = G.triageImportRows({ ...baseChange, changeTriggers: ['modelDataSupplier', 'authority'], triggerAnswers: answers }, null);
  const v = (field) => rows.find((r) => r.cells[0] === field).cells[1];
  assert.deepEqual(G.STEP4_TRIGGERS.map((t) => v(t[1])), ['No', 'No', 'No', 'No', 'No', 'Yes', 'Unsure']);
  assert.equal(v('Is Agent'), 'Yes');
  assert.equal(v('Mandatory Risk Floor'), 'Critical');
  assert.equal(v('Mandatory Risk Floor'), ass02C42(G.STEP4_TRIGGERS.map((t) => v(t[1]))));
  // Every value lands in its controlled Step 4 list.
  const lists = targets.sheets.ass02TriageImport.step4Lists;
  G.STEP4_TRIGGERS.slice(0, 6).forEach((t) => assert.ok(lists['C50:C55'].includes(v(t[1])), t[1]));
  assert.ok(lists.C56.includes(v('Trigger — Agentic Autonomous Action')));
  assert.ok(lists.C66.includes(v('Is Agent')));
  // Rows land at their exact Triage Import labels (rows 34-41, 46).
  const labels = targets.sheets.ass02TriageImport.rows.map((r) => r[0]);
  G.STEP4_TRIGGERS.forEach((t, i) => assert.equal(labels.indexOf(t[1]), 29 + i));
  // Unanswered triggers block the handover instead of exporting a blank Step 4.
  assert.match(G.validateChange({ ...baseChange, changeTriggers: ['modelDataSupplier'], triggerAnswers: {} }), /answer every §4\.4\.6 mandatory escalation trigger/);
  assert.equal(G.validateChange({ ...baseChange, changeTriggers: ['modelDataSupplier', 'authority'], triggerAnswers: answers }), '');
});

test('T-05: the Step 4 mandatory risk floor equals AIG-ASS-02 C42 for every answer combination', () => {
  let n = 0;
  const yn = ['Yes', 'No', ''];
  for (const a of yn) for (const b of yn) for (const c of yn) for (const d of yn) for (const e of yn)
    for (const ticks of [[], ['modelDataSupplier'], ['authority'], ['purposeScope', 'authority']])
      for (const ag of ['', 'Yes', 'No', 'Unsure']) {
        const s4 = G.step4Answers(ticks, { specialData: a, vulnerable: b, housingCare: c, novel: d, statutory: e, agentic: ag });
        const vals = G.STEP4_TRIGGERS.map((t) => s4.values[t[0]]);
        const wb = ass02C42(vals);
        assert.equal(s4.mandatoryFloor || 'Incomplete', wb, JSON.stringify({ ticks, vals }));
        if (ticks.includes('modelDataSupplier') || ticks.includes('purposeScope')) assert.equal(s4.values.materialChange, 'Yes');
        if (ticks.includes('authority') && !ag) assert.equal(s4.values.agentic, 'Unsure');
        n += 1;
      }
  assert.equal(n, 3888);
  const inputs = [...html.matchAll(/data-trigger="([a-zA-Z]+)"/g)].map((m) => m[1]);
  assert.deepEqual(inputs, Object.keys(G.CHANGE_TRIGGERS));
  assert.match(app, /changeTriggers: changeTriggerKeys\(\), triggerAnswers: triggerAnswers\(\)/);
});

test('T-06: a Low incident can be classified Low, with the AIG-OPS-03 v1.6 Low indicators (S04)', () => {
  assert.equal(G.SEVERITY_WHEN.Low, targets.forms.ops03PartA.whenItApplies.Low);
  assert.match(G.SEVERITY_WHEN.Low, /Indicators: an isolated minor output inaccuracy/);
  const low = [...html.matchAll(/data-severity="Low"><span>([^<]+)<\/span>/g)].map((m) => m[1]);
  assert.deepEqual(low, ['Isolated minor output inaccuracy (for example one wrong date or figure, corrected before harm)', 'Isolated user complaint', 'Documentation error', 'Non-material process failure']);
  low.forEach((label) => assert.ok(G.SEVERITY_WHEN.Low.toLowerCase().includes(label.split(' (')[0].toLowerCase()), label));
  // S04: one wrong instalment date → Low, with the Low route; manual Low also allowed.
  assert.equal(G.severity(['Low'], false, '').level, 'Low');
  assert.equal(G.severity([], false, 'Low').level, 'Low');
  assert.equal(G.severity(['Low'], true, '').level, 'Medium', 'aggregation still raises one band');
  assert.equal(G.ROUTES.Low.target, targets.forms.ops03PartA.escalation.Low);
  assert.match(html, /<select id="i-uplift"><option value="">None<\/option><option>Low<\/option>/);
  assert.ok(G.LISTS.ops03Severity.includes('Low'));
});

test('W-04: the §4.7.17 mandatory triggers are offered and set at least High', () => {
  const para = targets.forms.ops03PartA.mandatoryTriggers;
  const boxes = [...html.matchAll(/data-severity="High" data-mandatory><span>([^<]+)<\/span>/g)].map((m) => m[1]);
  assert.deepEqual(boxes, G.MANDATORY_INCIDENT_TRIGGERS);
  boxes.forEach((b) => assert.ok(para.toLowerCase().includes(b.toLowerCase()), b));
  assert.match(para, /classify the incident at least High/);
  assert.equal(G.severity(['High'], false, '').level, 'High');
  assert.match(app, /consider a precautionary pause, and classify the incident at least High/);
});

test('W-06: precautionary pause is a Gate Log containment event with V and W, not a decision', () => {
  const ev = targets.sheets.dec04GateEvents;
  assert.deepEqual(G.TARGETS.dec04GateEvents.headers, ev.headers);
  assert.deepEqual(ev.headers.slice(-2), ['Incident ref (AIG-OPS-03), precautionary pause', 'Follow-up decision due date (precautionary pause)']);
  assert.ok(ev.lists['Event type'].includes(G.PAUSE_EVENT));
  assert.ok(ev.lists.Outcome.includes(G.PAUSE_OUTCOME));
  const row = targets.sheets.dec04Lists.outcomeMapping.find((r) => r[0] === G.PAUSE_OUTCOME);
  assert.equal(G.DEC04_OUTCOME_MAP[G.PAUSE_OUTCOME].note, row[1]);
  assert.deepEqual(G.DEC04_OUTCOME_MAP[G.PAUSE_OUTCOME].eventTypes, [row[2]]);
  // The Gate Log row check (N) rules, reproduced in validateChange.
  const N = ev.formulas.N;
  ['Precautionary pause: Outcome must be Paused, pending decision', 'Precautionary pause: AIG-OPS-03 incident ref missing',
    'Precautionary pause: follow-up decision due date missing', 'Paused, pending decision is only for a Precautionary pause event']
    .forEach((msg) => assert.ok(N.includes(msg), msg));
  const pause = {
    ...baseChange, eventType: G.PAUSE_EVENT, decision: G.PAUSE_OUTCOME, eventDate: '2026-09-29', eventForum: 'Gate 7 Operate, monitor, review & change',
    eventLifecycle: 'Deployment and Operation', eventMaker: 'Service Owner (applied the pause)', eventSource: 'AIG-OPS-03 Part A',
    eventConfirmed: true, eventUseScope: 'UC-ID specific', eventUcId: 'UC-T011', pauseIncidentRef: 'INC-0042', pauseFollowUpDue: '2026-10-06', today: '2026-09-30'
  };
  assert.equal(G.validateChange(pause), '', 'no AIG-DEC-03 reference or delegation reference is needed');
  assert.match(G.validateChange({ ...pause, decision: 'Pause' }), /Outcome must be Paused — pending decision/);
  assert.match(G.validateChange({ ...pause, pauseIncidentRef: '' }), /AIG-OPS-03 incident reference/);
  assert.match(G.validateChange({ ...pause, pauseFollowUpDue: '' }), /follow-up decision due date/);
  assert.match(G.validateChange({ ...pause, eventType: 'Review only' }), /only for a Precautionary pause/);
  // AIG-OPS-03 v1.6 Part A row and the incident-tab pause fields.
  assert.ok(targets.forms.ops03PartA.fields.includes('Precautionary pause applied? Gate Log event ID'));
  assert.deepEqual(G.TARGETS.ops03PartA.fields, targets.forms.ops03PartA.fields);
  const incident = {
    system: 'x', reporter: 'x', role: 'x', email: 'a@b.cd', identifiedAt: '2026-09-29T10:00', classification: 'Incident', happened: 'x', when: 'x',
    discovery: 'x', aiActivity: 'x', affected: 'x', impact: 'x', dataImpact: 'x', decisionImpact: 'x', useScope: 'Unknown', ongoing: 'Yes',
    suspectedBreach: 'No', securityConcern: 'No', externalNotification: 'No'
  };
  assert.equal(G.validateIncident({ ...incident, pauseApplied: 'Yes', pauseBy: 'Service Owner', pauseAt: '2026-09-29T10:30' }), '');
  assert.match(G.validateIncident({ ...incident, pauseApplied: 'Yes' }), /who applied it/);
  assert.match(G.validateIncident({ ...incident, pauseApplied: 'No', pauseBy: 'x' }), /Clear the precautionary pause details/);
  assert.match(app, /"Precautionary pause applied\? Gate Log event ID": value\("i-pause"\) === "Yes"/);
  assert.match(app, /"Event type": G\.PAUSE_EVENT/);
});

test('W-08: the monitoring download fills OPS-02 v1.6 AO (review type) and AP (agentic cadence raise)', () => {
  const ops = targets.sheets.ops02Monitoring;
  assert.deepEqual(ops.headers.slice(-2), ['Review type (§6.4.4: operational / performance / formal)', 'Agentic cadence raise applied? (action-capable uses)']);
  assert.deepEqual(G.TARGETS.ops02Monitoring.headers, ops.headers);
  assert.match(app, /"Review type \(§6\.4\.4: operational \/ performance \/ formal\)": value\("m-review-type"\)/);
  assert.match(app, /"Agentic cadence raise applied\? \(action-capable uses\)": value\("m-agentic-raise"\)/);
  // AJ by review type, as in the v1.6 formula.
  assert.match(ops.formulas.AJ, /AO5="Operational monitoring"/);
  assert.equal(G.ops02Cadence('Medium', 'Operational monitoring'), 'Monthly');
  assert.equal(G.ops02Cadence('High', 'Performance review'), 'Monthly');
  assert.equal(G.ops02Cadence('High', 'Formal review'), 'Quarterly');
  assert.equal(G.ops02Cadence('Low', 'Operational monitoring'), 'Routine operational monitoring by the Service Owner');
  assert.equal(G.ops02MaxGap('High', 'Operational monitoring'), 31);
  assert.equal(G.ops02MaxGap('Medium', 'Performance review'), 92);
  // A result reviewed less often than its tier minimum for its review type is flagged.
  const fixture = JSON.parse(read('fixtures/ops02-closure-check-cases.json'));
  const flagged = fixture.cases.filter((c) => c.row['Review type (§6.4.4: operational / performance / formal)'] && c.AH === 'NEXT REVIEW EXCEEDS TIER CADENCE');
  assert.ok(flagged.length >= 8);
  flagged.forEach((c) => assert.equal(G.ops02ClosureCheck(c.row), c.AH));
});

test('T-10: the AIR-ID check equals the AIG-INV-04 rule, which AIG-AGT-04 v0.4 now uses too', () => {
  const rules = targets.airIdRules;
  assert.equal(rules['AIG-INV-04 AI Register A4'], 'AND(LEFT(A4,4)="AIR-",LEN(TRIM(A4))=8)');
  assert.equal(rules['AIG-AGT-04 Agent Record A5'], 'OR(A5="AIR-EXAMPLE",AND(LEFT(A5,4)="AIR-",LEN(TRIM(A5))=8))');
  // Excel: LEFT/LEN on the text, case-insensitive comparison.
  const inv04 = (id) => id.slice(0, 4).toUpperCase() === 'AIR-' && id.trim().length === 8;
  const agt04 = (id) => id.toUpperCase() === 'AIR-EXAMPLE' || inv04(id);
  for (const id of ['AIR-T004', 'AIR-0042', 'air-t004', 'AIR-12345', 'XYZ-0001', 'AIR-12', 'AIR-ABCD', 'AIR-EXAMPLE']) {
    assert.equal(G.isAirId(id), inv04(id), id);
    if (id !== 'AIR-EXAMPLE') assert.equal(G.isAirId(id), agt04(id), `${id} (AGT-04)`);
  }
  assert.equal(G.isAirId('AIR-T004'), true, 'scenario IDs such as AIR-T004 pass both workbooks');
});

test('NEW-02 (v3.9.2 re-test follow-up): a blank AP is flagged like "raise not yet set"; Not action-capable is not', () => {
  const ops = targets.sheets.ops02Monitoring;
  assert.match(ops.formulas.AH, /IF\(OR\(AP5="",AP5="Action-capable: raise not yet set"\),"AGENTIC CADENCE RAISE NOT SET/);
  const fixture = JSON.parse(read('fixtures/ops02-closure-check-cases.json'));
  const AP = 'Agentic cadence raise applied? (action-capable uses)';
  const ready = fixture.cases.find((c) => c.AH === 'Closure ready for independent review' && c.row[AP] === 'Not action-capable');
  assert.ok(ready, 'fixture has a closed non-agentic row');
  const FLAG = 'AGENTIC CADENCE RAISE NOT SET (§6.4.4; size to be set by the Council)';
  assert.equal(G.ops02ClosureCheck(ready.row), 'Closure ready for independent review');
  assert.equal(G.ops02ClosureCheck({ ...ready.row, [AP]: 'Raised per Monitoring and Review Plan' }), 'Closure ready for independent review');
  assert.equal(G.ops02ClosureCheck({ ...ready.row, [AP]: 'Action-capable: raise not yet set' }), FLAG);
  assert.equal(G.ops02ClosureCheck({ ...ready.row, [AP]: '' }), FLAG);
  assert.ok(fixture.cases.some((c) => c.row[AP] === '' && c.AH === FLAG), 'recalculated workbook flags a blank AP');
});
