const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const governance = require('./src/logic.js');

const read = (name) => fs.readFileSync(path.join(__dirname, name), 'utf8');

test('incident severity is provisional and never defaults an unclassified incident to Low', () => {
  assert.equal(governance.severity([], false, '').level, 'Unclassified');
  assert.equal(governance.severity(['Medium', 'High'], false, '').level, 'High');
  assert.deepEqual(governance.severity(['Medium'], true, ''), {
    level: 'High', aggregated: true, uplifted: false
  });
  assert.deepEqual(governance.severity(['Critical'], true, 'Low'), {
    level: 'Critical', aggregated: false, uplifted: false
  });
  assert.equal(governance.severity([], false, 'High').level, 'High');
});

test('incident routing has no invented severity-based deadlines', () => {
  assert.equal(governance.ROUTES.Low.recipient, 'Service Owner');
  assert.equal(governance.ROUTES.High.recipient, 'AI Governance Working Group');
  assert.match(governance.ROUTES.Critical.target, /Immediate escalation/);
  assert.ok(Object.values(governance.ROUTES).every((route) => !Object.hasOwn(route, 'deadline')));
  assert.equal(governance.deadlineFor, undefined);
});

test('WCC-AIG-07 arithmetic does not infer undocumented residual-tier bands', () => {
  const score = governance.calculateRisk([1, 2, 3, 1, 2], 2, 2);
  assert.deepEqual(score, { impact: 3, likelihood: 2, control: 2, inherent: 6, residual: 2.4, tier: null, authoritative: true });
  assert.equal(governance.calculateRisk([5, 1, 2, 4, 1], 4, 5).residual, 20);
  assert.equal(governance.calculateRisk([5, 1, 2, 4, 1], 4, 5).tier, null);
  assert.equal(governance.calculateRisk([2, 2, 2, 2], 2, 2), null);
  assert.equal(governance.calculateRisk([2, 2, 2, 2, 2], 0, 2), null);
});

test('WCC-AIG-19 Part A and optional Part B reject missing or misleading inputs', () => {
  const partA = {
    system: 'Service', reporter: 'Reporter', role: 'Officer', email: 'reporter@example.org',
    identifiedAt: '2026-09-25T09:00', classification: 'Near miss', happened: 'Unexpected output',
    when: '2026-09-25T08:30', discovery: 'Monitoring alert', aiActivity: 'Ranking cases',
    affected: 'Residents; Unknown number', impact: 'Potential delay', dataImpact: 'Unknown',
    decisionImpact: 'No decision known'
  };
  assert.equal(governance.validateIncident(partA), '');
  assert.match(governance.validateIncident({ ...partA, uplift: 'High' }), /rationale for a manual severity uplift/i);
  assert.match(governance.validateIncident({ ...partA, upliftReason: 'Additional harm context' }), /Clear the uplift rationale/i);
  assert.equal(governance.validateIncident({ ...partA, uplift: 'High', upliftReason: 'Additional harm context' }), '');
  assert.match(governance.validateIncident({ ...partA, email: 'not-an-email' }), /valid reporter contact email/i);
  assert.match(governance.validateIncident({ ...partA, discovery: '' }), /Complete WCC-AIG-19 Part A/i);
  assert.match(governance.validateIncident({ ...partA, controllerAwareness: '2026-09-25T09:00' }), /optional Part B pointer/i);
  assert.equal(governance.validateIncident({
    ...partA, controllerAwareness: '2026-09-25T09:00', rightsRisk: 'Owner assessment ref',
    rightsAssessor: 'DPO', rightsAssessmentDate: '2026-09-25', icoDecision: 'Further assessment',
    decisionRationale: 'Owner assessment continues', decisionOwner: 'Controller', dpoAdviceRef: 'DPO ref'
  }), '');
  const html = read('index.html'), app = read('src/app.js');
  for (const id of ['i-email', 'i-kind', 'i-when', 'i-discovery', 'i-ai-activity', 'i-data-impact', 'i-decision-impact']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(app, /WCC-AIG-19 optional Part B pointer/);
  assert.match(app, /not a legal finding or incident record/);
});

test('WCC-AIG-36 change handover requires real plan, event and condition references', () => {
  const base = { airId: 'AIR-REAL-1', airIdVerified: true, system: 'Service' };
  assert.equal(governance.validateChange(base), '');
  assert.match(governance.validateChange({ ...base, airIdVerified: false }), /existing AIR-ID/i);
  assert.match(governance.validateChange({ ...base, planGate: 'Assurance review' }), /Complete every Gate Plan prompt/i);
  const plan = {
    ...base, planGate: 'Review forum', planTrigger: 'Pre-release', planRequirement: 'Required',
    planBasis: 'Existing change record', planDate: '2026-11-01', planRole: 'Service Owner',
    planState: 'Planned', planSourceVersion: '1.5 draft', planCriteria: 'Assurance evidence pack'
  };
  assert.equal(governance.validateChange(plan), '');
  assert.match(governance.validateChange({ ...plan, planBasis: '' }), /basis reference/i);
  assert.match(governance.validateChange({
    ...base, planGate: 'Review', planTrigger: 'Before release', planRequirement: 'Not required',
    planDate: '2026-11-01', planRole: 'Owner', planState: 'Planned', planSourceVersion: '1.5'
  }), /rationale and authority/i);
  const event = {
    ...base, decision: 'Progress', eventDate: '2026-09-25', eventForum: 'Board',
    eventLifecycle: 'Pre-deployment', eventMaker: 'Authorised role', eventRecord: 'Minute ref',
    eventAuthority: 'WCC-AIG-45 ref', evidenceSource: 'Approved evidence URI',
    eventState: 'Owner-entered state', eventConfirmed: true
  };
  assert.equal(governance.validateChange(event), '');
  assert.match(governance.validateChange({ ...event, eventAuthority: '' }), /actual authorised decision/i);
  assert.match(governance.validateChange({ ...event, eventRecord: '' }), /decision-record\/minutes reference/i);
  assert.match(governance.validateChange({ ...event, evidenceSource: '' }), /transfer checklist requires.*evidence source/i);
  assert.match(governance.validateChange({ ...event, eventId: 'invented' }), /existing Event ID/i);
  assert.match(governance.validateChange({ ...event, condition: 'Provide evidence' }), /existing Event ID/i);
  assert.match(governance.validateChange({ ...event, decision: 'Progress with condition' }), /requires a Gate Condition/i);
  assert.match(governance.validateChange({ ...event, decision: 'Priority override' }), /requires before\/after priority values/i);
  assert.equal(governance.validateChange({
    ...event, eventId: 'EVT-REAL-1', eventIdVerified: true, condition: 'Provide evidence',
    conditionOwner: 'Service Owner', conditionDue: '2026-10-10', conditionState: 'Open'
  }), '');
  assert.match(governance.validateChange({
    ...base, mapChangeDate: '2026-09-25', mapChangeType: 'Change access',
    mapPrevious: 'Read', mapNext: 'Write', mapExpansion: 'Yes', mapOwner: 'Owner'
  }), /reassessment reference/i);
});

test('all case-specific duty screening prompts are required for ready handover', () => {
  assert.deepEqual(governance.screenMissing({ equality: true, humanRights: false, privacy: true, other: true }), ['humanRights']);
  assert.deepEqual(governance.screenMissing({ equality: true, humanRights: true, privacy: true, other: true }), []);
  const csv = governance.handoverCsv('draft', [['Value', '=1+1', 'not executable']]);
  assert.match(csv, /Draft handover only — not a workbook row/);
  assert.match(csv, /'=1\+1/);
});

test('WCC-AIG-39 handover requires identity, provenance, denominators and review signals', () => {
  const complete = {
    airId: 'AIR-TEST-VALID', airIdVerified: true, system: 'Service', category: 'Performance', metric: 'Accuracy',
    period: '2026-Q3', date: '2026-09-25', owner: 'Service Owner', threshold: 'Approved threshold ref',
    actual: '93%', evidence: 'Versioned evidence pointer', breach: 'No', material: 'No',
    escalation: 'No', reassessment: 'No', status: 'Reviewed', severity: '',
    source: 'Authoritative decision log', selection: 'Stratified random',
    population: '10', sample: '4', window: '2026-Q3', sampleMethod: 'Seed 123; draw 2026-09-25',
    highImpact: 'Yes', highImpactDetail: 'All adverse decisions reviewed',
    evidenceVersion: 'v2', checker: 'Reviewer', dataCut: '2026-09-25T08:00',
    denominator: 'Source: decision log; count of eligible decisions',
    observedDenominator: '50', denominatorState: 'Observed positive', resultState: 'Observed non-zero',
    controlFailure: 'No', controlFailureDetail: '', accessExpansion: 'No', accessExpansionDetail: '',
    trend: 'Stable'
  };
  assert.equal(governance.validateMonitoring(complete), '');
  for (const field of ['airIdVerified', 'system', 'date', 'period', 'owner', 'metric', 'threshold',
    'evidence', 'evidenceVersion', 'checker', 'dataCut', 'denominator', 'controlFailure',
    'accessExpansion', 'reassessment', 'denominatorState', 'resultState']) {
    const incomplete = { ...complete, [field]: field === 'airIdVerified' ? false : '' };
    assert.notEqual(governance.validateMonitoring(incomplete), '', `${field} must block a handover`);
  }
  assert.match(governance.validateMonitoring({ ...complete, breach: 'Yes' }), /provisional severity/i);
  assert.match(governance.validateMonitoring({ ...complete, source: '' }), /For a WCC-AIG-39 handover/i);
  assert.match(governance.validateMonitoring({ ...complete, controlFailure: 'Yes' }), /control failure signal/i);
  assert.match(governance.validateMonitoring({ ...complete, accessExpansion: 'Yes' }), /access-expansion signal/i);
  assert.match(governance.validateMonitoring({ ...complete, resultState: 'Observed zero', actual: '' }), /enter an actual numeric zero/i);
  assert.match(governance.validateMonitoring({ ...complete, resultState: 'Observed zero', actual: '2' }), /enter an actual numeric zero/i);
  assert.equal(governance.validateMonitoring({
    ...complete, resultState: 'Observed zero', actual: '0',
    denominatorState: 'Observed zero', observedDenominator: '0'
  }), '');
  assert.match(governance.validateMonitoring({
    ...complete, resultState: 'Observed zero', actual: '0',
    denominatorState: 'Observed zero', observedDenominator: ''
  }), /entered explicitly as 0/i);
  assert.match(governance.validateMonitoring({ ...complete, resultState: 'Observed non-zero', actual: '0' }), /observed value that is not zero/i);
  assert.match(governance.validateMonitoring({ ...complete, resultState: 'Observed non-zero', actual: 'Unknown' }), /replace unknown\/blank/i);
  assert.match(governance.validateMonitoring({ ...complete, resultState: 'Blank / unknown', actual: '0' }), /Clear Actual Result/i);
  assert.match(governance.validateMonitoring({
    ...complete, resultState: 'Blank / unknown', actual: '', resultReason: ''
  }), /Explain why the observed result is Blank/i);
  assert.match(governance.validateMonitoring({
    ...complete, denominatorState: 'Observed zero', observedDenominator: ''
  }), /entered explicitly as 0/i);
  assert.match(governance.validateMonitoring({
    ...complete, denominatorState: 'Blank / unknown', observedDenominator: '50'
  }), /Clear the numeric denominator/i);
  assert.match(governance.validateMonitoring({
    ...complete, resultState: 'Observed zero', actual: '0',
    denominatorState: 'Blank / unknown', observedDenominator: ''
  }), /cannot use an unknown denominator/i);
  assert.equal(governance.validateMonitoring({
    ...complete, resultState: 'Observed zero', actual: '0',
    denominatorState: 'Not applicable', observedDenominator: '',
    denominator: 'Count metric; no denominator applies'
  }), '');
  assert.match(governance.validateMonitoring({
    ...complete, population: '10', sample: '11'
  }), /sample size must be zero only/i);
  assert.equal(governance.validateMonitoring({
    ...complete, selection: 'Full population (census)', population: '0', sample: '0',
    sampleMethod: 'Not applicable', highImpact: 'No', highImpactDetail: 'No records in this window',
    observedDenominator: '0', denominatorState: 'Observed zero',
    resultState: 'Blank / unknown', actual: '', resultReason: 'No records existed in the window'
  }), '');
  assert.match(governance.validateMonitoring({
    ...complete, selection: 'Simple random', sampleMethod: 'Not applicable'
  }), /random-selection method/i);
  assert.match(governance.validateMonitoring({
    ...complete, action: 'Containment in progress'
  }), /provide its owner and due date/i);
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
  assert.match(app, /WCC-AIG-16.*native minutes/);
  assert.match(app, /PENDING OWNER VERIFICATION/);
  assert.match(app, /current WCC-AIG-36 controlled vocabulary/);
  assert.match(html + app, /separate standalone draft workbooks/);
  assert.doesNotMatch(html + app, /Westminster/i);
});

test('three distinct post-deployment workflows and exports are present', () => {
  const html = read('index.html');
  const app = read('src/app.js');
  for (const id of ['panel-incident', 'panel-change', 'panel-monitor']) assert.match(html, new RegExp(id));
  for (const artifact of ['WCC-AIG-19', 'WCC-AIG-30', 'WCC-AIG-39', 'WCC-AIG-07', 'WCC-AIG-05', 'WCC-AIG-36', 'WCC-AIG-16']) {
    assert.ok(app.includes(artifact), `expected handover route for ${artifact}`);
  }
  assert.match(app, /Existing verified Event ID/);
  assert.match(app, /Event ID.*Existing verified Event ID/);
});

test('map change handoff carries reassessment and only an existing Gate Event link', () => {
  const html = read('index.html');
  const app = read('src/app.js');
  const logic = read('src/logic.js');
  assert.match(html, /Optional Capabilities and System Map change handoff/);
  assert.match(html, /Existing Gate Event ID, if appropriate/);
  assert.match(html, /id="p-criteria"/);
  assert.match(app, /Planned criteria \/ evidence to bring/);
  assert.match(logic, /A new or possibly expanded access edge needs a real reassessment reference/);
  assert.match(app, /Capabilities and System Map change handoff \(\.csv\)/);
  const entries = governance.mapChangeHandoverEntries({
    airId: 'AIR-EXISTING',
    changeDate: '2026-09-25',
    changeType: 'Change access',
    previous: 'Read access',
    next: 'Write access',
    expansion: 'Yes',
    owner: 'Service Owner',
    reassessmentRef: 'RA-2026-14',
    eventId: ''
  });
  assert.equal(entries.find((row) => row[0] === 'Change ID')[1], '');
  assert.equal(entries.find((row) => row[0] === 'Edge ID')[1], '');
  assert.equal(entries.find((row) => row[0] === 'Review / reassessment ref')[1], 'RA-2026-14');
  assert.equal(entries.find((row) => row[0] === 'Gate Event ID (if needed)')[1], '');
  assert.match(entries.find((row) => row[0] === 'Gate Event ID (if needed)')[2], /never invent/);
  const linked = governance.mapChangeHandoverEntries({
    airId: 'AIR-EXISTING', changeDate: '2026-09-25', changeType: 'Change access',
    previous: 'Read', next: 'Write', expansion: 'Yes', owner: 'Owner',
    reassessmentRef: 'RA-14', eventId: 'GE-2026-004'
  });
  assert.equal(linked.find((row) => row[0] === 'Gate Event ID (if needed)')[1], 'GE-2026-004');
  assert.match(linked.find((row) => row[0] === 'Gate Event ID (if needed)')[2], /verify it against the dated event in 36/);
});