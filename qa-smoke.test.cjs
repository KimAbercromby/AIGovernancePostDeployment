const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const governance = require('./src/logic.js');

const read = (name) => fs.readFileSync(path.join(__dirname, name), 'utf8');
// Generated from the v3.9 source workbooks/forms (file, sheet and header row are recorded in the fixture).
const targets = JSON.parse(read('fixtures/suite-v3.9-targets.json'));
const decode = (value) => value.replace(/&amp;/g, '&');
// Options of a <select>, ignoring the blank "Select" prompt.
const optionsOf = (html, id) => [...html.match(new RegExp(`id="${id}">(.*?)</select>`))[1]
  .matchAll(/<option(?: value="([^"]*)")?>([^<]*)<\/option>/g)]
  .map((m) => decode(m[1] !== undefined ? m[1] : m[2])).filter(Boolean);

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

test('incident routing quotes the AIG-OPS-03 severity table and calculates no deadline', () => {
  assert.equal(governance.ROUTES.Low.recipient, 'Service Owner');
  assert.equal(governance.ROUTES.High.recipient, 'AI Governance Working Group');
  assert.match(governance.ROUTES.Critical.target, /Immediate escalation/);
  for (const level of governance.SEVERITY_ORDER) {
    assert.equal(governance.ROUTES[level].target, targets.forms.ops03PartA.escalation[level], `${level} escalation text matches AIG-OPS-03`);
  }
  assert.ok(Object.values(governance.ROUTES).every((route) => !Object.hasOwn(route, 'deadline')));
  assert.equal(governance.deadlineFor, undefined);
});

test('AIG-ASS-02 v1.8 arithmetic and tier bands match the workbook', () => {
  const score = governance.calculateRisk([1, 2, 3, 1, 2], 2, 2);
  assert.deepEqual(score, {
    impact: 3, likelihood: 2, control: 2, inherent: 6, inherentTier: 'Medium',
    controlFactor: 0.4, residual: 2.4, residualTier: 'Low', impactFloor: ''
  });
  assert.equal(governance.calculateRisk([5, 1, 2, 4, 1], 4, 5).residual, 20);
  assert.equal(governance.calculateRisk([5, 1, 2, 4, 1], 4, 5).impactFloor, 'Medium');
  // Values recalculated from the v3.9 workbook (fixtures/ass02-risk-cases.json).
  for (const c of JSON.parse(read('fixtures/ass02-risk-cases.json')).cases) {
    const r = governance.calculateRisk(c.impacts, c.likelihood, c.control);
    assert.equal(r.impact, c.impact); assert.equal(r.inherent, c.inherent); assert.equal(r.inherentTier, c.inherentTier);
    assert.ok(Math.abs(r.residual - c.residual) < 1e-9, `residual ${r.residual} vs ${c.residual}`);
    assert.equal(r.residualTier, c.residualTier);
    assert.equal(Boolean(r.impactFloor), Boolean(c.impactFloorFlag));
  }
  // Full grid against a transcription of the AIG-ASS-02 C37–C41 formulas.
  for (let i = 1; i <= 5; i += 1) for (let l = 1; l <= 5; l += 1) for (let k = 1; k <= 5; k += 1) {
    const r = governance.calculateRisk([i, 1, 1, 1, 1], l, k);
    const c37 = l * i, c40 = c37 * (k / 5);
    const c38 = c37 >= 16 ? 'Critical' : c37 >= 11 ? 'High' : c37 >= 6 ? 'Medium' : 'Low';
    const c41 = c40 > 15 ? 'Critical' : c40 > 10 ? 'High' : c40 > 5 ? 'Medium' : 'Low';
    assert.equal(r.inherent, c37); assert.ok(Math.abs(r.residual - c40) < 1e-9);
    assert.equal(r.inherentTier, c38); assert.equal(r.residualTier, c41);
  }
  assert.equal(governance.calculateRisk([2, 2, 2, 2], 2, 2), null);
  assert.equal(governance.calculateRisk([2, '', 2, 2, 2], 2, 2), null);
  assert.equal(governance.calculateRisk([2, 2, 2, 2, 2], 0, 2), null);
});

test('AIG-OPS-03 Part A and optional Part B reject missing or misleading inputs', () => {
  const partA = {
    system: 'Service', reporter: 'Reporter', role: 'Officer', email: 'reporter@example.org',
    useScope: 'Unknown',
    identifiedAt: '2026-09-25T09:00', classification: 'Near miss', happened: 'Unexpected output',
    when: '2026-09-25T08:30', discovery: 'Monitoring alert', aiActivity: 'Ranking cases',
    affected: 'Residents; Unknown number', impact: 'Potential delay', dataImpact: 'Unknown',
    decisionImpact: 'No decision known', ongoing: 'No', suspectedBreach: 'No', securityConcern: 'No',
    externalNotification: 'Unsure'
  };
  assert.equal(governance.validateIncident(partA), '');
  assert.match(governance.validateIncident({ ...partA, useScope: '' }), /explicit use scope/i);
  assert.match(governance.validateIncident({ ...partA, useScope: 'UC-ID specific' }), /exact UC-ID/i);
  assert.match(governance.validateIncident({ ...partA, useScope: 'Shared system baseline', ucId: 'UC-1' }), /Clear the UC-ID/i);
  assert.equal(governance.validateIncident({ ...partA, useScope: 'UC-ID specific', ucId: 'UC-1' }), '');
  assert.match(governance.validateIncident({ ...partA, uplift: 'High' }), /rationale for a manual severity uplift/i);
  assert.match(governance.validateIncident({ ...partA, upliftReason: 'Additional harm context' }), /Clear the uplift rationale/i);
  assert.equal(governance.validateIncident({ ...partA, uplift: 'High', upliftReason: 'Additional harm context' }), '');
  assert.match(governance.validateIncident({ ...partA, email: 'not-an-email' }), /valid reporter contact email/i);
  assert.match(governance.validateIncident({ ...partA, discovery: '' }), /Complete AIG-OPS-03 Part A/i);
  for (const key of ['ongoing', 'suspectedBreach', 'securityConcern', 'externalNotification']) {
    assert.match(governance.validateIncident({ ...partA, [key]: '' }), /Complete AIG-OPS-03 Part A/i, `${key} is a Part A field`);
  }
  assert.match(governance.validateIncident({ ...partA, ongoing: 'Unknown' }), /Yes or No/);
  assert.match(governance.validateIncident({ ...partA, suspectedBreach: 'Maybe' }), /Yes, No or Uncertain/);
  assert.match(governance.validateIncident({ ...partA, externalNotification: 'Uncertain' }), /Yes, No or Unsure/);
  assert.match(governance.validateIncident({ ...partA, classification: 'Event' }), /Incident, Near miss or Concern/);
  assert.match(governance.validateIncident({ ...partA, breachIndicator: true }), /answer .*Yes or Uncertain/i);
  assert.equal(governance.validateIncident({ ...partA, breachIndicator: true, suspectedBreach: 'Uncertain' }), '');
  assert.match(governance.validateIncident({ ...partA, airId: 'AIR-REAL-1' }), /AIG-INV-04 format/);
  assert.equal(governance.validateIncident({ ...partA, airId: 'AIR-0042' }), '');
  assert.match(governance.validateIncident({ ...partA, controllerAwareness: '2026-09-25T09:00' }), /optional Part B pointer/i);
  assert.equal(governance.validateIncident({
    ...partA, controllerAwareness: '2026-09-25T09:00', rightsRisk: 'Owner assessment ref',
    rightsAssessor: 'DPO', rightsAssessmentDate: '2026-09-25', icoDecision: 'Further assessment',
    decisionRationale: 'Owner assessment continues', decisionOwner: 'Controller', dpoAdviceRef: 'DPO ref'
  }), '');
  const html = read('index.html'), app = read('src/app.js');
  for (const id of ['i-email', 'i-kind', 'i-when', 'i-discovery', 'i-ai-activity', 'i-data-impact', 'i-decision-impact',
    'i-breach', 'i-security', 'i-external', 'i-sent', 'i-dpo-referred']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(app, /AIG-OPS-03 optional Part B pointer/);
  const affected = [...html.matchAll(/data-affected><span>([^<]+)<\/span>/g)].map((m) => m[1]);
  assert.deepEqual(affected, targets.forms.ops03PartA.tickBoxes, 'section 3 tick boxes match the form');
  assert.deepEqual(optionsOf(html, 'i-ongoing'), governance.LISTS.ops03Ongoing);
  assert.deepEqual(optionsOf(html, 'i-breach'), governance.LISTS.ops03SuspectedBreach);
  assert.deepEqual(optionsOf(html, 'i-security'), governance.LISTS.ops03Security);
  assert.deepEqual(optionsOf(html, 'i-external'), governance.LISTS.ops03External);
  assert.deepEqual(optionsOf(html, 'i-kind'), governance.LISTS.ops03Classification);
  assert.deepEqual(optionsOf(html, 'i-ico-decision'), governance.LISTS.ops03IcoDecision);
  assert.match(app, /not a legal finding or incident record/);
});

test('AIG-DEC-04 change handover requires real plan, event and condition references', () => {
  const base = { airId: 'AIR-0001', airIdVerified: true, system: 'Service', useScope: 'Unknown' };
  assert.equal(governance.validateChange(base), '');
  assert.match(governance.validateChange({ ...base, airIdVerified: false }), /existing AIR-ID/i);
  assert.match(governance.validateChange({ ...base, airId: 'AIR-REAL-1' }), /AIG-INV-04 format/);
  assert.match(governance.validateChange({ ...base, planGate: 'Assurance review', planUseScope: 'Unknown' }), /Complete every Gate Plan prompt/i);
  const plan = {
    ...base, planGate: 'Gate 7 Operate, monitor, review & change', planTrigger: 'Pre-release', planRequirement: 'Required',
    planUseScope: 'UC-ID specific', planUcId: 'UC-REAL-1',
    planBasis: 'Existing change record', planDate: '2026-11-01', planRole: 'Service Owner',
    planState: 'Planned', planSourceVersion: '1.5 draft', planCriteria: 'Assurance evidence pack'
  };
  assert.equal(governance.validateChange(plan), '');
  assert.match(governance.validateChange({ ...plan, planGate: 'Review forum' }), /Gate \/ forum from the AIG-DEC-04 list/);
  assert.match(governance.validateChange({ ...plan, planState: 'Draft' }), /Planned, Complete, Superseded or Cancelled/);
  assert.match(governance.validateChange({ ...plan, planUcId: '' }), /exact UC-ID covered/i);
  assert.match(governance.validateChange({ ...plan, planBasis: '' }), /basis reference/i);
  assert.match(governance.validateChange({
    ...base, planGate: 'Gate 5 Ethics assessment', planTrigger: 'Before release', planRequirement: 'Not applicable',
    planUseScope: 'Unknown',
    planDate: '2026-11-01', planRole: 'Owner', planState: 'Planned', planSourceVersion: '1.5'
  }), /rationale and authority/i);
  const event = {
    ...base, eventType: 'Decision', decision: 'Progress', eventDate: '2026-09-25',
    eventForum: 'Gate 7 Operate, monitor, review & change', eventUseScope: 'Unknown',
    eventLifecycle: 'Monitoring and Review', eventMaker: 'Authorised role', eventRecord: 'Minute ref',
    eventAuthority: 'AIG-AGT-04 ref', eventSource: 'Approved minutes', eventConfirmed: true
  };
  assert.equal(governance.validateChange(event), '');
  assert.match(governance.validateChange({ ...event, eventUseScope: '' }), /decision scope/i);
  const scopedEvent = {
    ...event, eventUseScope: 'UC-ID specific', eventUcId: 'UC-REAL-1',
    useDecisionRef: 'DEC-UC-42', permittedPurpose: 'Triage only', permittedUsers: 'Reviewers',
    permittedData: 'Submitted application data', permittedActions: 'Rank for review',
    exclusions: 'No final decisions', permittedConditions: 'Human review required'
  };
  assert.equal(governance.validateChange(scopedEvent), '');
  assert.match(governance.validateChange({ ...scopedEvent, useDecisionRef: '' }), /per-UC decision reference/i);
  assert.match(governance.validateChange({ ...event, eventUseScope: 'Unknown', eventUcId: 'UC-REAL-1' }), /Clear UC-specific/i);
  assert.match(governance.validateChange({
    ...scopedEvent, eventId: 'EVT-REAL-1', eventIdVerified: true,
    condition: 'Keep human review', conditionOwner: 'Owner', conditionDue: '2026-10-10',
    conditionState: 'Open', conditionUseScope: 'UC-ID specific', conditionUcId: 'UC-OTHER'
  }), /match the event.s exact use scope/i);
  assert.match(governance.validateChange({ ...event, eventAuthority: '' }), /transfer checklist requires an actual date.*checked authority reference/i);
  assert.match(governance.validateChange({ ...event, eventRecord: '' }), /decision-record\/minutes reference/i);
  assert.match(governance.validateChange({ ...event, eventSource: '' }), /transfer checklist requires.*source/i);
  assert.match(governance.validateChange({ ...event, eventForum: 'Board' }), /Gate \/ forum from the AIG-DEC-04 list/);
  assert.match(governance.validateChange({ ...event, eventLifecycle: 'Pre-deployment' }), /lifecycle stage from the AIG-DEC-04 list/);
  assert.match(governance.validateChange({ ...event, eventTime: '9am' }), /hh:mm/);
  assert.equal(governance.validateChange({ ...event, eventTime: '09:30' }), '');
  assert.match(governance.validateChange({ ...event, today: '2026-09-24' }), /cannot be in the future/);
  assert.match(governance.validateChange({ ...event, eventUseScope: 'UC-ID specific', eventUcId: 'UC-1, UC-2' }), /One UC-ID per Gate Event row/);
  for (const outcome of ['Suspend', 'Decommission', 'Re-authorise']) {
    assert.equal(governance.validateChange({ ...event, decision: outcome }), '', `${outcome} is a v3.9 decision outcome`);
    assert.match(governance.validateChange({ ...event, eventType: 'Review only', decision: outcome }), /set Event type to Decision/);
  }
  assert.match(governance.validateChange({ ...event, decision: '' }), /Decision event needs a decision Outcome/);
  assert.match(governance.validateChange({ ...event, decision: 'Opinion only' }), /Decision event needs a decision Outcome/);
  assert.equal(governance.validateChange({ ...event, eventType: 'Intake / registration', decision: '' }), '');
  assert.equal(governance.validateChange({ ...event, eventType: 'Assurance opinion', decision: 'Opinion only' }), '');
  assert.match(governance.validateChange({ ...event, eventType: 'Assurance opinion', decision: 'No decision' }), /allowed only with Event type/);
  assert.match(governance.validateChange({ ...event, eventId: 'invented' }), /existing Event ID/i);
  assert.match(governance.validateChange({ ...event, condition: 'Provide evidence' }), /existing Event ID/i);
  assert.match(governance.validateChange({ ...event, decision: 'Progress with condition' }), /requires a Gate Condition/i);
  const conditioned = {
    ...event, decision: 'Progress with condition', eventId: 'EVT-REAL-1', eventIdVerified: true,
    condition: 'Provide evidence', conditionOwner: 'Service Owner', conditionDue: '2026-10-10',
    conditionState: 'Open', conditionUseScope: 'Unknown'
  };
  assert.equal(governance.validateChange(conditioned), '');
  assert.match(governance.validateChange({ ...conditioned, decision: 'Progress' }), /parent event must be a Decision with Outcome Progress with condition or Re-authorise/);
  assert.equal(governance.validateChange({ ...conditioned, decision: 'Re-authorise' }), '');
  assert.match(governance.validateChange({ ...conditioned, conditionDue: '2026-09-01' }), /cannot be before the parent event date/);
  for (const state of ['Met', 'Overdue', 'Superseded']) {
    assert.match(governance.validateChange({ ...conditioned, conditionState: state }), /Open, Closed-verified, Accepted-open, Waived or Unknown/);
  }
  assert.match(governance.validateChange({ ...conditioned, conditionState: 'Closed-verified' }), /closed \/ waived date/);
  assert.match(governance.validateChange({
    ...conditioned, conditionState: 'Closed-verified', conditionResolved: '2026-10-01', conditionEvidence: 'EV-1'
  }), /Verified by \/ date/);
  assert.match(governance.validateChange({
    ...conditioned, conditionState: 'Closed-verified', conditionResolved: '2026-10-01', conditionEvidence: 'EV-1',
    conditionVerified: 'Lead, 2026-10-01', conditionMonitoring: 'Yes'
  }), /AIG-OPS-02 evidence ref/);
  assert.equal(governance.validateChange({
    ...conditioned, conditionState: 'Closed-verified', conditionResolved: '2026-10-01', conditionEvidence: 'EV-1',
    conditionVerified: 'Lead, 2026-10-01', conditionMonitoring: 'Yes', conditionOps02Ref: 'OPS-02 row 12'
  }), '');
  assert.match(governance.validateChange({ ...conditioned, conditionState: 'Waived' }), /closed \/ waived date/);
  assert.match(governance.validateChange({ ...event, eventType: 'Priority override', decision: '' }), /requires before\/after priority values/i);
  const override = { ...event, eventType: 'Priority override', decision: '', priorityBefore: 'Priority 3 – Standard', priorityAfter: 'Priority 2 – High', priorityRef: 'ASR-7' };
  assert.equal(governance.validateChange(override), '');
  assert.equal(governance.validateChange({ ...override, decision: 'No decision' }), '');
  assert.match(governance.validateChange({ ...override, decision: 'Progress' }), /leave Outcome blank or choose No decision/i);
  assert.match(governance.validateChange({ ...override, priorityBefore: 'Priority 3' }), /controlled list/);
  assert.match(governance.validateChange({ ...event, priorityBefore: 'Priority 3 – Standard', priorityAfter: 'Priority 2 – High', priorityRef: 'X' }), /Event type Priority override/i);
  assert.match(governance.validateChange({ ...event, eventType: '' }), /Select the AIG-DEC-04 Event type/i);
  assert.match(governance.validateChange({ ...event, decision: 'Noted' }), /Select an AIG-DEC-04 Outcome/i);
  assert.match(governance.validateChange({ ...event, decision: 'Escalation raised' }), /Select an AIG-DEC-04 Outcome/i);
  assert.equal(governance.validateChange({ ...event, eventType: 'Review only', decision: 'No decision' }), '');
  assert.match(governance.validateChange({ ...event, eventType: 'Review only', decision: 'Progress' }), /set Event type to Decision/i);
  assert.equal(governance.validateChange({ ...event, eventType: 'Review only', decision: 'No decision', escalated: 'Yes', escalatedTo: 'Cabinet' }), '');
  assert.match(governance.validateChange({ ...event, escalated: 'Yes' }), /Name the forum/i);
  assert.match(governance.validateChange({ ...event, escalatedTo: 'Cabinet' }), /Clear the escalation forum/i);
  assert.equal(governance.validateChange({
    ...base, eventId: 'EVT-REAL-1', eventIdVerified: true, condition: 'Provide evidence',
    conditionOwner: 'Service Owner', conditionDue: '2026-10-10', conditionState: 'Open',
    conditionUseScope: 'Unknown'
  }), '', 'an existing event-linked condition does not require a new decision');
  const map = {
    ...base, mapChangeDate: '2026-09-25', mapChangeType: 'Reduce access',
    mapPrevious: 'Write', mapNext: 'Read', mapExpansion: 'No', mapOwner: 'Owner'
  };
  assert.equal(governance.validateChange(map), '');
  assert.match(governance.validateChange({ ...map, mapExpansion: 'Yes' }), /reassessment reference/i);
  assert.match(governance.validateChange({ ...map, mapChangeType: 'Expand access' }), /reassessment reference/i);
  assert.match(governance.validateChange({ ...map, mapChangeType: 'Add link' }), /reassessment reference/i);
  assert.equal(governance.validateChange({ ...map, mapChangeType: 'Add link', mapReassessment: 'RA-1' }), '');
  assert.match(governance.validateChange({ ...map, mapChangeType: 'Change access' }), /AIG-INV-05 Change type/);
  assert.match(governance.validateChange({ ...map, mapState: 'Done' }), /Open, In review or Closed/);
  assert.match(governance.validateChange({ ...base, ucId: 'UC-1' }), /Clear the UC-ID/i);
  assert.equal(governance.validateChange({ ...base, useScope: 'UC-ID specific', ucId: 'UC-1' }), '');
});

test('all case-specific duty screening prompts are required for ready handover', () => {
  assert.deepEqual(governance.screenMissing({ equality: true, humanRights: false, privacy: true, other: true }), ['humanRights']);
  assert.deepEqual(governance.screenMissing({ equality: true, humanRights: true, privacy: true, other: true }), []);
  const csv = governance.exactCsv(governance.TARGETS.aims08Capa, [{ values: { 'Immediate correction': '=1+1' }, notes: ['n'] }]);
  assert.match(csv, /'=1\+1/);
  assert.match(governance.screeningNote({ equality: true }), /Human Rights Act 1998 section 6 screening — Not confirmed/);
});

test('AIG-OPS-02 handover requires identity, provenance, denominators and review signals', () => {
  const complete = {
    airId: 'AIR-0007', airIdVerified: true, system: 'Service', useScope: 'Unknown',
    category: 'Performance', metric: 'Accuracy',
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
  assert.match(governance.validateMonitoring({ ...complete, useScope: 'Shared system baseline', ucId: 'UC-1' }), /Clear the UC-ID/i);
  assert.equal(governance.validateMonitoring({ ...complete, useScope: 'Shared system baseline' }), '');
  assert.match(governance.validateMonitoring({ ...complete, useScope: 'Explicit shared system measure' }), /Shared system baseline/);
  assert.match(governance.validateMonitoring({ ...complete, airId: 'AIR-TEST-VALID' }), /AIG-INV-04 format/);
  assert.match(governance.validateMonitoring({ ...complete, selection: 'Random' }), /Selection Basis/);
  assert.match(governance.validateMonitoring({ ...complete, selection: 'Simple random', sampleMethod: 'n/a' }), /random-selection method/);
  assert.equal(governance.validateMonitoring({ ...complete, status: 'Closed' }), '');
  assert.match(governance.validateMonitoring({ ...complete, riskTier: 'Severe' }), /Risk tier/);
  assert.match(governance.validateMonitoring({ ...complete, trigger: 'Breach' }), /Appendix E.4/);
  assert.match(governance.validateMonitoring({ ...complete, useScope: 'UC-ID specific' }), /exact UC-ID/i);
  assert.equal(governance.validateMonitoring({ ...complete, useScope: 'UC-ID specific', ucId: 'UC-1' }), '');
  for (const field of ['airIdVerified', 'system', 'useScope', 'date', 'period', 'owner', 'metric', 'threshold',
    'evidence', 'evidenceVersion', 'checker', 'dataCut', 'denominator', 'controlFailure',
    'accessExpansion', 'reassessment', 'denominatorState', 'resultState']) {
    const incomplete = { ...complete, [field]: field === 'airIdVerified' ? false : '' };
    assert.notEqual(governance.validateMonitoring(incomplete), '', `${field} must block a handover`);
  }
  assert.match(governance.validateMonitoring({ ...complete, breach: 'Yes' }), /provisional severity/i);
  assert.match(governance.validateMonitoring({ ...complete, source: '' }), /For an AIG-OPS-02 handover/i);
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
    ...complete, selection: 'Stratified random', sampleMethod: 'Not applicable'
  }), /random-selection method/i);
  assert.match(governance.validateMonitoring({
    ...complete, action: 'Containment in progress'
  }), /provide its owner and due date/i);
});

test('CSV safely escapes delimiters, quotes, line breaks and filenames, and keeps numbers as values', () => {
  const csv = governance.exactCsv(governance.TARGETS.aims08Capa, [{ values: { 'Immediate correction': 'A,"B"\nC', 'Target date': '-3' } }]);
  assert.match(csv, /"A,""B""\nC"/);
  assert.match(csv, /,-3,/);
  assert.equal(governance.parseCsv(csv)[1][6], 'A,"B"\nC');
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
  assert.match(html, /AIG-AGT-04/);
  assert.match(html, /AIG-INV-04 is the Register and owns one permanent AIR-ID.*per system/i);
  assert.match(html, /system-level Approved baseline does not approve any UC-ID/i);
  assert.match(html, /Unknown is not shared scope/i);
  assert.match(html, /Proposed controlled AIG-INV-05 is a relationship map only.*decision, permission or approval source/i);
  assert.match(app, /current AIG-INV-04/);
  assert.match(app, /AIG-DEC-03.*native minutes/);
  assert.doesNotMatch(app, /PENDING OWNER VERIFICATION/);
  assert.match(app, /Use-specific decision reference/);
  assert.match(html + app, /Permitted purpose/);
  assert.match(html + app, /Use-specific operating conditions/);
  assert.match(html + app, /separate standalone draft workbooks/);
  assert.match(html, /suite v3\.9/);
  assert.match(html, /v19\.9\.10/);
  assert.doesNotMatch(html + app + read('README.md'), /field\/value drafts, not exact worksheet rows/);
  assert.doesNotMatch(html + app, /v1\.4\b.*AIG-OPS-02|AIG-OPS-02 v1\.4/);
  assert.doesNotMatch(html + app, /Westminster/i);
});

test('three distinct post-deployment workflows and exports are present', () => {
  const html = read('index.html');
  const app = read('src/app.js');
  for (const id of ['panel-incident', 'panel-change', 'panel-monitor']) assert.match(html, new RegExp(id));
  for (const artifact of ['AIG-OPS-03', 'AIG-AIMS-08', 'AIG-OPS-02', 'AIG-ASS-02', 'AIG-INV-04', 'AIG-DEC-04', 'AIG-DEC-03']) {
    assert.ok(app.includes(artifact), `expected handover route for ${artifact}`);
  }
  assert.match(app, /Existing verified Event ID/);
});

test('condition-only handoff is independent from decision export', () => {
  const app = read('src/app.js');
  assert.match(app, /if \(value\(\"e-type\"\)\) \{[\s\S]*?\n    \}\n    if \(conditionStarted\) \{/);
  assert.match(app, /AIG-DEC-04 Conditions row/);
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
  assert.match(app, /AIG-INV-05 Map changes row \(\.csv\)/);
  const row = governance.mapChangeRow({
    airId: 'AIR-0001', useScope: 'UC-ID specific', ucId: 'UC-REAL-1', changeDate: '2026-09-25',
    changeType: 'Expand access', previous: 'Read access', next: 'Write access', expansion: 'Yes',
    owner: 'Service Owner', reassessmentRef: 'RA-2026-14', eventId: '', state: 'Open'
  });
  const cells = governance.buildRow(governance.TARGETS.inv05MapChanges, row.values);
  const col = (name) => cells[targets.sheets.inv05MapChanges.headers.indexOf(name)];
  assert.equal(col('Map Change ID'), '');
  assert.equal(col('Map Edge ID'), '');
  assert.equal(col('Change type'), 'Expand access');
  assert.equal(col('Review / reassessment ref'), 'RA-2026-14');
  assert.equal(col('Gate Event ID (if needed)'), '');
  assert.equal(col('State'), 'Open');
  assert.ok(!cells.includes('UC-REAL-1'), 'Map changes has no UC-ID column; scope stays in guidance');
  assert.match(row.notes.join(' '), /UC-REAL-1/);
  assert.match(row.notes.join(' '), /never invent/);
  const linked = governance.mapChangeRow({ airId: 'AIR-0001', changeType: 'Add link', expansion: 'Yes', reassessmentRef: 'RA-14', eventId: 'GE-2026-004' });
  assert.equal(linked.values['Gate Event ID (if needed)'], 'GE-2026-004');
  assert.match(linked.notes.join(' '), /verify it against the dated event in AIG-DEC-04/);
});
test('monitoring unknowns match AIG-OPS-02 v1.5 values and are never recorded as No', () => {
  const html = read('index.html');
  const app = read('src/app.js');
  // Form options match the AIG-OPS-02 dropdowns exactly.
  assert.match(html, /id="m-trend">.*<option>New \/ Baseline<\/option><option>Not yet known<\/option><\/select>/);
  assert.doesNotMatch(html, /id="m-trend">[^\n]*<option>Unknown<\/option>/);
  for (const id of ['m-breach', 'm-material', 'm-escalation', 'm-reassessment']) {
    assert.match(html, new RegExp(`id="${id}">[^\\n]*<option>Unknown</option></select>`));
  }
  assert.deepEqual(governance.MONITORING_UNKNOWN_FIELDS.map((f) => f[1]),
    ['Trend', 'Threshold Breach?', 'Material Change?', 'Risk Reassessment Required?', 'Governance Escalation?']);
  assert.deepEqual(governance.monitoringUnknowns({ trend: 'Stable', breach: 'No', material: 'No', reassessment: 'No', escalation: 'No' }), []);
  assert.deepEqual(governance.monitoringUnknowns({ trend: 'Not yet known', breach: 'Unknown', material: 'No', reassessment: 'Yes', escalation: 'Unknown' }),
    ['Trend', 'Threshold Breach?', 'Governance Escalation?']);
  assert.match(app + read('src/logic.js'), /UNKNOWN TO RESOLVE/);
  assert.match(app, /Unknown — resolve /);
});

test('Gate Event options match AIG-DEC-04 controlled values', () => {
  const html = read('index.html');
  assert.deepEqual(governance.EVENT_TYPES, targets.sheets.dec04GateEvents.lists['Event type']);
  assert.deepEqual(governance.EVENT_OUTCOMES, targets.sheets.dec04GateEvents.lists.Outcome);
  const outcomes = [...html.match(/id="e-decision">(.*?)<\/select>/)[1].matchAll(/<option>([^<]+)<\/option>/g)].map((m) => m[1]);
  assert.deepEqual(outcomes, governance.EVENT_OUTCOMES);
  const types = [...html.match(/id="e-type">(.*?)<\/select>/)[1].matchAll(/<option>([^<]+)<\/option>/g)].map((m) => m[1]);
  assert.deepEqual(types, governance.EVENT_TYPES);
  assert.doesNotMatch(html, /<option>Noted<\/option>|<option>Escalation raised<\/option>/);
});

// ---- Suite v3.9 alignment: every download matches its target exactly ----

const SHEET_KEYS = ['ops02Monitoring', 'dec04GatePlan', 'dec04GateEvents', 'dec04Conditions', 'aims08Capa',
  'inv05MapChanges', 'inv04AssessmentSummary', 'ass02TriageImport'];
const FORM_KEYS = ['ops03PartA', 'ops03PartB8', 'dec03Reference'];

test('export targets carry the exact v3.9 headers, order, formula columns and versions', () => {
  for (const key of SHEET_KEYS) {
    const expected = targets.sheets[key];
    const target = governance.TARGETS[key];
    assert.equal(target.file, expected.file, key);
    assert.equal(target.sheet, expected.sheet, key);
    assert.equal(target.headerRow, expected.headerRow, key);
    assert.deepEqual(target.headers, expected.headers, `${key}: ${expected.file} / ${expected.sheet} row ${expected.headerRow}`);
    assert.deepEqual(target.formulaColumns, expected.formulaColumns, key);
  }
  for (const key of FORM_KEYS) {
    assert.deepEqual(governance.TARGETS[key].fields, targets.forms[key].fields, `${key}: ${targets.forms[key].file} / ${targets.forms[key].section}`);
  }
  assert.deepEqual(governance.ARTEFACT_VERSIONS, targets.versions);
  assert.deepEqual(governance.TRIAGE_IMPORT_ROWS, targets.sheets.ass02TriageImport.rows);
  assert.equal(governance.SUITE.release, 'v3.9');
});

test('every CSV starts with the exact headers, then a blank spacer and guidance columns only', () => {
  for (const key of [...SHEET_KEYS, ...FORM_KEYS]) {
    const target = governance.TARGETS[key];
    const cols = target.headers || target.fields;
    const rows = key === 'ass02TriageImport' ? governance.triageImportRows({}, null) : [{ values: {}, notes: ['note'] }];
    const parsed = governance.parseCsv(governance.exactCsv(target, rows));
    assert.deepEqual(parsed[0].slice(0, cols.length), cols, `${key} header row`);
    assert.equal(parsed[0][cols.length], '', `${key} spacer`);
    assert.deepEqual(parsed[0].slice(cols.length + 1), governance.GUIDANCE_HEADERS);
    assert.ok(governance.GUIDANCE_HEADERS.every((h) => /^Guidance only, do not paste/.test(h)));
    parsed.slice(1).forEach((row) => {
      assert.equal(row.length, cols.length + 3, `${key} row width`);
      assert.equal(row[cols.length], '', `${key} spacer stays blank`);
    });
    for (const name of target.formulaColumns || []) {
      parsed.slice(1).forEach((row) => assert.equal(row[cols.indexOf(name)], '', `${key} formula column ${name} left blank`));
    }
  }
  assert.throws(() => governance.buildRow(governance.TARGETS.ops02Monitoring, { 'Gate Log Ref': 'x' }), /Not a AIG-OPS-02 column/);
  const triage = governance.parseCsv(governance.exactCsv(governance.TARGETS.ass02TriageImport, governance.triageImportRows({
    airId: 'AIR-0001', system: 'Svc', impacts: ['5', '1', '2', '4', '1'], likelihood: '4', control: '3',
    useScope: 'UC-ID specific', ucId: 'UC-9'
  }, governance.calculateRisk([5, 1, 2, 4, 1], 4, 3))));
  const value = (field) => triage.find((row) => row[0] === field)[1];
  assert.equal(triage.length, 60);
  assert.equal(value('AIR-ID'), 'AIR-0001');
  assert.equal(value('Inherent Risk Score'), '20');
  assert.equal(value('Inherent Risk Tier'), 'Critical');
  assert.equal(value('Residual Risk Score'), '12');
  assert.equal(value('Residual Risk Tier'), 'High');
  assert.equal(value('UC-ID (blank only for explicit system baseline)'), 'UC-9');
  assert.equal(value('Triage / assessment scope'), 'UC-ID specific');
  assert.equal(value('Mandatory Risk Floor'), '', 'trigger floors are not inferred');
  assert.equal(value('Effective Governance Tier'), '', 'governing tier is not calculated');
});

test('app values land only in real target columns', () => {
  const app = read('src/app.js');
  const keysIn = (block) => [...block.matchAll(/^\s*"([^"]+)":/gm)].map((m) => m[1]);
  const blockAfter = (start, end) => {
    const i = app.indexOf(start);
    assert.ok(i >= 0, start);
    return app.slice(i, app.indexOf(end, i));
  };
  const check = (key, block) => {
    const cols = governance.TARGETS[key].headers || governance.TARGETS[key].fields;
    const keys = keysIn(block);
    assert.ok(keys.length > 0, key);
    keys.forEach((k) => assert.ok(cols.includes(k), `${key}: "${k}" is not a target column`));
  };
  check('ops03PartA', blockAfter('const partAValues = {', '};'));
  check('ops02Monitoring', blockAfter('const row = {', '};'));
  for (const key of ['ops03PartB8', 'aims08Capa', 'inv04AssessmentSummary', 'dec04GatePlan', 'dec04GateEvents', 'dec03Reference', 'dec04Conditions']) {
    check(key, blockAfter(`csvDownload("${key}"`, 'notes:'));
  }
  const logic = read('src/logic.js');
  const start = logic.indexOf('function mapChangeRow');
  check('inv05MapChanges', logic.slice(start, logic.indexOf('notes:', start)));
  for (const key of [...SHEET_KEYS, ...FORM_KEYS]) assert.ok(app.includes(`csvDownload("${key}"`), `${key} has a download`);
});

test('controlled lists and form options match the v3.9 data validations', () => {
  const html = read('index.html');
  const L = governance.LISTS;
  const ops = targets.sheets.ops02Monitoring.lists;
  assert.deepEqual(L.ops02MetricCategory, ops['Metric Category']);
  assert.deepEqual(L.ops02Trend, ops.Trend);
  assert.deepEqual(L.yesNoUnknown, ops['Threshold Breach?']);
  assert.deepEqual(L.riskTier, ops.Severity);
  assert.deepEqual(L.riskTier, ops['Risk tier (UC-ID, AIG-ASS-02)']);
  assert.deepEqual(L.ops02ReviewStatus, ops['Review Status']);
  assert.deepEqual(L.ops02SelectionBasis, ops['Selection Basis']);
  assert.deepEqual(L.scope, ops['Measure scope (UC-ID specific / Shared system baseline)']);
  assert.deepEqual(L.ops02Triggers, ops['Reassessment trigger (Appendix E.4)']);
  assert.deepEqual(L.ops02Triggers, targets.sheets.ops02Lists.reassessmentTriggers);
  const plan = targets.sheets.dec04GatePlan.lists;
  assert.deepEqual(L.dec04Requirement, plan.Requirement);
  assert.deepEqual(L.dec04PlanState, plan['Plan state']);
  assert.deepEqual(L.dec04Gates, plan['Gate / forum']);
  assert.deepEqual(L.dec04Gates, targets.sheets.dec04Lists.gates);
  const ev = targets.sheets.dec04GateEvents.lists;
  assert.deepEqual(L.dec04EventTypes, ev['Event type']);
  assert.deepEqual(L.dec04Outcomes, ev.Outcome);
  assert.deepEqual(L.dec04Lifecycle, ev['Event-time lifecycle stage']);
  const cond = targets.sheets.dec04Conditions.lists;
  assert.deepEqual(L.dec04ConditionStates, cond.State);
  assert.deepEqual(L.yesNo, cond['Monitoring condition? (Yes / No)']);
  const capa = targets.sheets.aims08Capa.lists;
  assert.ok(capa.Source.includes('Incident'));
  assert.deepEqual(L.aims08Source, capa.Source);
  const map = targets.sheets.inv05MapChanges.lists;
  assert.deepEqual(L.inv05ChangeType, map['Change type']);
  assert.deepEqual(L.inv05Expansion, map['Access expansion?']);
  assert.deepEqual(L.inv05State, map.State);
  assert.deepEqual(L.agpiPriority, targets.sheets.inv04AssessmentSummary.lists['Effective Governance Priority (AIG-ASS-01, after any authorised override)']);
  assert.deepEqual(L.ops03Affected, targets.forms.ops03PartA.tickBoxes);
  // Form selects offer exactly the controlled values.
  const pairs = {
    'm-category': null, 'm-trend': L.ops02Trend, 'm-breach': null, 'm-severity': L.riskTier,
    'm-material': null, 'm-escalation': null, 'm-reassessment': L.yesNoUnknown, 'm-status': L.ops02ReviewStatus,
    'm-selection': L.ops02SelectionBasis, 'm-risk-tier': L.riskTier, 'm-trigger': L.ops02Triggers,
    'p-requirement': L.dec04Requirement, 'p-state': L.dec04PlanState, 'p-gate': L.dec04Gates,
    'e-type': L.dec04EventTypes, 'e-decision': L.dec04Outcomes, 'e-forum': L.dec04Gates, 'e-lifecycle': L.dec04Lifecycle,
    'e-condition-state': L.dec04ConditionStates, 'e-condition-monitoring': L.yesNo,
    'e-priority-before': L.agpiPriority, 'e-priority-after': L.agpiPriority,
    'map-change-type': L.inv05ChangeType, 'map-expansion': ['No', 'Yes', 'Unsure'], 'map-state': L.inv05State
  };
  for (const [id, list] of Object.entries(pairs)) {
    const options = optionsOf(html, id);
    if (list) assert.deepEqual(options, list, id);
    else options.forEach((o) => assert.ok(L.ops02MetricCategory.includes(o) || L.yesNoUnknown.includes(o), `${id}: ${o}`));
  }
  for (const id of ['m-breach', 'm-material', 'm-escalation']) assert.deepEqual([...optionsOf(html, id)].sort(), [...L.yesNoUnknown].sort(), id);
  // Tool-only scope option Unknown is never written to a scope column.
  assert.equal(governance.scopeValue('Unknown'), '');
  assert.equal(governance.scopeValue('Shared system baseline'), 'Shared system baseline');
});

test('AIG-OPS-02 closure check, cadence and minimum sample match the recalculated v3.9 workbook', () => {
  const fixture = JSON.parse(read('fixtures/ops02-closure-check-cases.json'));
  assert.ok(fixture.cases.length >= 40);
  const seen = new Set();
  fixture.cases.forEach((c, i) => {
    const tier = c.row['Risk tier (UC-ID, AIG-ASS-02)'];
    assert.equal(governance.ops02ClosureCheck(c.row), c.AH, `case ${i} AH`);
    assert.equal(governance.ops02Cadence(tier), c.AJ, `case ${i} AJ`);
    assert.equal(governance.ops02MinimumSample(tier, c.row['Population Size']), c.AK, `case ${i} AK`);
    seen.add(c.AH);
  });
  for (const outcome of ['AIR-ID REQUIRED', 'INVALID VALUE — use the dropdown list', 'UC-ID REQUIRED', 'UNKNOWN TO RESOLVE',
    'BREACH ACTION INCOMPLETE', 'TRIGGER NOT RECORDED — select the E.4 trigger', 'REASSESSMENT / CONSIDERATION REF REQUIRED',
    'GATE LOG EVENT ID REQUIRED', 'SAMPLE EXCEEDS POPULATION', 'SAMPLE BELOW TIER MINIMUM', 'NEXT REVIEW EXCEEDS TIER CADENCE',
    'CLOSURE EVIDENCE MISSING', 'Closure ready for independent review', 'Open / review']) {
    assert.ok(seen.has(outcome), `fixture covers ${outcome}`);
  }
});

test('AIG-DEC-03 pointer maps gate outcomes with the AIG-DEC-04 Lists mapping', () => {
  const mapping = targets.sheets.dec04Lists.outcomeMapping;
  for (const [gate, dec03, types] of mapping) {
    const outcome = gate.replace(' (or blank)', '');
    const mapped = governance.DEC04_OUTCOME_MAP[outcome];
    assert.ok(mapped, outcome);
    mapped.eventTypes.forEach((t) => assert.ok(types.includes(t), `${outcome} allows ${t}`));
    const single = dec03.replace(/ \([^)]*\)$/, '');
    if (!/ \/ | or /.test(dec03) && governance.LISTS.dec03Outcomes.includes(single)) {
      assert.equal(mapped.dec03, single, outcome);
    } else {
      assert.equal(mapped.dec03, '', `${outcome} needs the decision-maker to choose`);
    }
  }
  assert.equal(governance.dec03Outcome('Re-authorise', true).value, 'Approved with conditions');
  assert.equal(governance.dec03Outcome('Re-authorise', false).value, 'Approved');
  assert.equal(governance.dec03Outcome('Pause', false).value, '');
  governance.LISTS.dec04Outcomes.forEach((o) => {
    const v = governance.dec03Outcome(o, false).value;
    assert.ok(v === '' || governance.LISTS.dec03Outcomes.includes(v), `${o} → ${v}`);
  });
});
