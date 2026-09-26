(function (root) {
  "use strict";

  const SEVERITY_ORDER = ["Low", "Medium", "High", "Critical"];
  const SCREENING_KEYS = ["equality", "humanRights", "privacy", "other"];
  const ROUTES = {
    Low: {
      recipient: "Service Owner",
      target: "Service Owner review and local remediation."
    },
    Medium: {
      recipient: "AI Governance Lead",
      target: "Notify the AI Governance Lead and agree a documented remediation route."
    },
    High: {
      recipient: "AI Governance Working Group",
      target: "Formal governance review."
    },
    Critical: {
      recipient: "AI Assurance Board, Executive Sponsor and Executive Leadership",
      target: "Immediate escalation."
    }
  };

  function text(value) {
    return value == null ? "" : String(value).trim();
  }

  function severity(indicators, aggregate, uplift) {
    const selected = Array.isArray(indicators) ? indicators : [];
    let floor = "";
    selected.forEach(function (level) {
      if (SEVERITY_ORDER.indexOf(level) > SEVERITY_ORDER.indexOf(floor)) floor = level;
    });
    let aggregated = false;
    if (aggregate && floor) {
      const index = SEVERITY_ORDER.indexOf(floor);
      if (index < SEVERITY_ORDER.length - 1) {
        floor = SEVERITY_ORDER[index + 1];
        aggregated = true;
      }
    }
    const uplifted = SEVERITY_ORDER.indexOf(uplift) >= 0 &&
      (!floor || SEVERITY_ORDER.indexOf(uplift) > SEVERITY_ORDER.indexOf(floor));
    if (uplifted) floor = uplift;
    return { level: floor || "Unclassified", aggregated: aggregated, uplifted: uplifted };
  }

  function calculateRisk(impacts, likelihood, control) {
    if (!Array.isArray(impacts) || impacts.length !== 5) return null;
    const values = impacts.map(Number);
    const l = Number(likelihood);
    const c = Number(control);
    if (values.some((value) => !Number.isInteger(value) || value < 1 || value > 5) ||
      !Number.isInteger(l) || l < 1 || l > 5 ||
      !Number.isInteger(c) || c < 1 || c > 5) return null;
    const impact = Math.max.apply(null, values);
    const inherent = l * impact;
    // AIG-ASS-02 defines inherent as L × I, control factor as C ÷ 5, and
    // residual as inherent × control factor. Its residual tier bands are not
    // specified here, so do not infer a tier.
    const residual = Math.round(inherent * c / 5 * 10) / 10;
    return { impact, likelihood: l, control: c, inherent, residual, tier: null, authoritative: true };
  }

  function csvCell(value) {
    let result = text(value);
    if (/^[=+\-@]/.test(result)) result = "'" + result;
    if (/[",\r\n]/.test(result)) result = '"' + result.replace(/"/g, '""') + '"';
    return result;
  }

  function handoverCsv(artefact, entries) {
    const rows = [
      ["Draft handover only — not a workbook row", artefact, "Transfer only after owner verification"],
      ["Field / prompt", "Proposed value", "Verification / next action"]
    ].concat(entries);
    return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  }

  function mapChangeHandoverEntries(data) {
    const eventId = text(data.eventId);
    const reassessmentRef = text(data.reassessmentRef);
    return [
      ["Change ID", "", "Map owner assigns under the approved map rules; this tool never issues IDs"],
      ["AIR-ID", text(data.airId), "Existing permanent ID; user-confirmed against current AIG-INV-04, map owner rechecks"],
      ["Use scope", text(data.useScope) || "Unknown", "Exact UC-ID scope or explicit system baseline; Unknown is not shared or approved"],
      ["UC-ID", text(data.ucId), text(data.useScope) === "UC-ID specific" ?
        "Exact use identifier supplied for this scoped change; verify against the controlled use-case index" :
        "Blank unless the change is explicitly UC-ID specific"],
      ["Edge ID", "", "Map owner matches the exact edge in the current map; do not invent an ID"],
      ["Change date", text(data.changeDate), "Actual change/review date; confirm source evidence"],
      ["Change type", text(data.changeType), "Proposed classification; map owner confirms"],
      ["Previous link / access", text(data.previous), "Describe prior state; do not imply the access was authorised"],
      ["New link / access", text(data.next), "Describe proposed/current state; map entry grants no permission"],
      ["Access expansion?", text(data.expansion), "Owner confirms actual scope against authorised permissions in AIG-AGT-04 and derived paths in AIG-AGT-05"],
      ["Change owner", text(data.owner), "Confirm accountable owner"],
      ["Review / reassessment ref", reassessmentRef, reassessmentRef ?
        "User-entered pointer; verify the actual reassessment record and outcome" :
        "Blank; required by the map when access expansion is Yes or Unsure"],
      ["Gate Event ID (if needed)", eventId, eventId ?
        "User-entered existing Event ID; verify it against the dated event in AIG-DEC-04 and its formal decision record" :
        "Blank; if a Gate Event is appropriate, add its actual ID only after the AIG-DEC-04 owner logs it; never invent one"],
      ["Map change state", "Draft handover only", "Transfer to proposed controlled artefact AIG-INV-05 only after map-owner verification and approval/adoption; no live row is created"]
    ];
  }

  function screeningEntries(screening) {
    return SCREENING_KEYS.map(function (key) {
      const labels = {
        equality: "Equality Act 2010 section 149 screening",
        humanRights: "Human Rights Act 1998 section 6 screening",
        privacy: "Privacy / data protection screening",
        other: "Other case-specific duties"
      };
      return [labels[key], screening && screening[key] ? "Recorded or referred" : "Not confirmed",
        "No applicability or compliance finding is made by this tool"];
    });
  }

  function screenMissing(screening) {
    return SCREENING_KEYS.filter((key) => !screening || !screening[key]);
  }

  function validateMonitoring(data) {
    if (!text(data.airId) || !data.airIdVerified) {
      return "Enter an existing AIR-ID and confirm it was checked against the current AIG-INV-04. This tool cannot issue or verify identifiers.";
    }
    if (!text(data.metric)) {
      return "Enter the monitoring indicator; metric category is an optional classification.";
    }
    const required = [
      "system", "useScope", "period", "date", "owner", "threshold", "trend", "evidence",
      "evidenceVersion", "checker", "dataCut", "controlFailure", "accessExpansion", "reassessment",
      "source", "selection", "population", "sample", "window", "sampleMethod", "highImpact", "highImpactDetail",
      "denominatorState", "resultState"
    ];
    if (required.some((key) => !text(data[key]))) {
      return "For an AIG-OPS-02 handover, system identity, explicit UC-ID / shared-measure / unknown scope, period, actual review date, monitoring owner, indicator, approved threshold/tolerance, result state, evidence location and version, checker, data cut, observed-denominator state/context, control-failure review and access-expansion review are required.";
    }
    if (!["UC-ID specific", "Explicit shared system measure", "Unknown"].includes(text(data.useScope))) {
      return "Select UC-ID-specific, explicitly shared system measure, or Unknown. Blank scope is not shared.";
    }
    if (data.useScope === "UC-ID specific" && !text(data.ucId)) {
      return "Enter the exact UC-ID for a use-specific monitoring measure.";
    }
    if (data.useScope !== "UC-ID specific" && text(data.ucId)) {
      return "Clear the UC-ID unless the monitoring measure is explicitly UC-ID specific.";
    }
    if (!text(data.breach) || !text(data.material) || !text(data.escalation) || !text(data.status)) {
      return "Confirm threshold breach, material change, governance escalation and review status.";
    }
    if (!["Yes", "No", "Unknown"].includes(text(data.breach)) ||
      !["Yes", "No", "Unknown"].includes(text(data.material)) ||
      !["Yes", "No", "Unknown"].includes(text(data.escalation)) ||
      !["Yes", "No", "Unknown"].includes(text(data.reassessment))) {
      return "Select Yes, No or Unknown for breach, material change, governance escalation and risk reassessment.";
    }
    if (data.breach === "Yes" && !text(data.severity)) {
      return "Choose a provisional severity for the reported breach; an authorised owner confirms it.";
    }
    const denominatorState = text(data.denominatorState);
    const observedDenominator = text(data.observedDenominator);
    if (!["Observed positive", "Observed zero", "Blank / unknown", "Not applicable"].includes(denominatorState)) {
      return "Select the observed-denominator state separately from sample population and sample size.";
    }
    if (denominatorState === "Observed positive" &&
      (!/^\d+$/.test(observedDenominator) || Number(observedDenominator) < 1)) {
      return "An observed positive denominator must be a whole number greater than zero.";
    }
    if (denominatorState === "Observed zero" && observedDenominator !== "0") {
      return "An observed zero denominator must be entered explicitly as 0.";
    }
    if (["Blank / unknown", "Not applicable"].includes(denominatorState) && observedDenominator) {
      return "Clear the numeric denominator when its state is Blank / unknown or Not applicable.";
    }
    const resultState = text(data.resultState);
    const actual = text(data.actual);
    const numericActual = /^-?(?:\d+(?:\.\d*)?|\.\d+)%?$/.test(actual)
      ? Number(actual.replace(/%$/, "")) : null;
    if (resultState === "Observed zero" &&
      (numericActual === null || numericActual !== 0)) {
      return "For Observed zero, enter an actual numeric zero; do not leave the result blank.";
    }
    if (resultState === "Observed non-zero" && (!actual || numericActual === 0)) {
      return "For Observed non-zero, enter an observed value that is not zero.";
    }
    if (resultState === "Observed non-zero" &&
      /^(blank|unknown|not applicable|n\/?a|none|null)$/i.test(actual)) {
      return "For Observed non-zero, replace unknown/blank/not-applicable text with the observed value or select its actual state.";
    }
    if (["Blank / unknown", "Not applicable"].includes(resultState) && actual) {
      return "Clear Actual Result when its state is Blank / unknown or Not applicable; enter the reason separately.";
    }
    if (["Blank / unknown", "Not applicable"].includes(resultState) && !text(data.resultReason)) {
      return "Explain why the observed result is Blank / unknown or Not applicable.";
    }
    if (!["Observed non-zero", "Observed zero", "Blank / unknown", "Not applicable"].includes(resultState)) {
      return "Select an explicit observed-result state so zero, blank and not applicable cannot be confused.";
    }
    if (["Observed non-zero", "Observed zero"].includes(resultState) &&
      denominatorState === "Blank / unknown") {
      return "An observed result cannot use an unknown denominator. Enter the verified denominator, or select Not applicable and explain why this metric has no denominator.";
    }
    if (!text(data.denominator)) {
      return "Explain the observed denominator source, or why a denominator is unknown or not applicable.";
    }
    if (text(data.action) && (!text(data.actionOwner) || !text(data.dueDate))) {
      return "When an action/decision is recorded, provide its owner and due date; otherwise leave the action blank.";
    }
    if (data.controlFailure === "Yes" && !text(data.controlFailureDetail)) {
      return "Describe the control failure signal, or change the answer if no failure was observed.";
    }
    if (data.accessExpansion === "Yes" && !text(data.accessExpansionDetail)) {
      return "Describe the access-expansion signal, or change the answer if no expansion was observed.";
    }
    if (!["Yes", "No", "Unknown"].includes(text(data.controlFailure)) ||
      !["Yes", "No", "Unknown"].includes(text(data.accessExpansion))) {
      return "Select Yes, No or Unknown for control-failure and access-expansion review.";
    }
    if (!["Yes", "No", "Unknown"].includes(text(data.highImpact))) {
      return "Select Yes, No or Unknown for review of highest-impact decisions.";
    }
    if (["Simple random", "Stratified random"].includes(text(data.selection)) &&
      /^(n\/?a|not applicable)$/i.test(text(data.sampleMethod))) {
      return "Record the random-selection method, seed or draw date so the sample can be reproduced.";
    }
    const samples = ["source", "selection", "population", "sample", "window"].map((key) => text(data[key]));
    const sampleStarted = samples.some(Boolean);
    if (sampleStarted && samples.some((item) => !item)) {
      return "Complete all five AIG-OPS-02 sampling-frame fields for the monitoring result.";
    }
    if (sampleStarted && (!/^\d+$/.test(text(data.population)) || !/^\d+$/.test(text(data.sample)) ||
      Number(data.sample) > Number(data.population) ||
      (Number(data.population) > 0 && Number(data.sample) < 1))) {
      return "Population and sample sizes must be whole numbers; sample size must be zero only for an empty population and otherwise between one and the population size.";
    }
    if (text(data.selection) === "Full population (census)" &&
      Number(data.sample) !== Number(data.population)) {
      return "A full-population census must report the same population and sample sizes.";
    }
    if (Number(data.population) === 0 && text(data.selection) !== "Full population (census)") {
      return "An empty population must use the full-population census basis; record the zero population explicitly.";
    }
    return "";
  }

  function validateIncident(data) {
    const required = [
      "system", "reporter", "role", "email", "identifiedAt", "classification",
      "happened", "when", "discovery", "aiActivity", "affected", "impact",
      "dataImpact", "decisionImpact", "useScope"
    ];
    if (required.some((key) => !text(data[key]))) {
      return "Complete AIG-OPS-03 Part A reporter/contact, system, explicit use scope (or Unknown), identified time, classification, what/when/how discovered, AI activity, affected people/data/decisions and impact fields. State Unknown or not applicable where appropriate.";
    }
    if (!["UC-ID specific", "Shared system baseline", "Unknown"].includes(text(data.useScope))) {
      return "Select UC-ID-specific, Shared system baseline, or Unknown; unknown scope is not shared.";
    }
    if (data.useScope === "UC-ID specific" && !text(data.ucId)) {
      return "Enter the exact UC-ID for a UC-ID-specific incident.";
    }
    if (data.useScope !== "UC-ID specific" && text(data.ucId)) {
      return "Clear the UC-ID unless incident scope is explicitly UC-ID specific.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(data.email))) {
      return "Enter a valid reporter contact email for AIG-OPS-03 Part A.";
    }
    if (text(data.uplift) && !text(data.upliftReason)) {
      return "Provide the rationale for a manual severity uplift.";
    }
    if (!text(data.uplift) && text(data.upliftReason)) {
      return "Clear the uplift rationale when no manual severity uplift is selected.";
    }
    const partB = [
      "controllerAwareness", "rightsRisk", "rightsAssessor", "rightsAssessmentDate",
      "icoDecision", "decisionRationale", "decisionOwner", "dpoAdviceRef"
    ].map((key) => text(data[key]));
    if (partB.some(Boolean) && partB.some((item) => !item)) {
      return "For the optional Part B pointer, complete controller-awareness time, rights-risk assessment and its assessor/date, and the DPO-informed notifiability decision, rationale and owner; otherwise leave every Part B field blank.";
    }
    return "";
  }

  function validateChange(data) {
    if (!text(data.airId) || !data.airIdVerified || !text(data.system)) {
      return "Enter a system name and an existing AIR-ID confirmed against current AIG-INV-04; this tool cannot issue or verify identifiers.";
    }
    if (!["UC-ID specific", "Shared system baseline", "Unknown"].includes(text(data.useScope))) {
      return "Select UC-ID-specific, Shared system baseline, or Unknown for the change scope; blank is not shared.";
    }
    if (data.useScope === "UC-ID specific" && !text(data.ucId)) {
      return "Enter the exact UC-ID for a UC-ID-specific change assessment.";
    }
    if (data.useScope !== "UC-ID specific" && text(data.ucId)) {
      return "Clear the UC-ID unless the change assessment is explicitly UC-ID specific.";
    }
    const mapFields = ["mapChangeDate", "mapChangeType", "mapPrevious", "mapNext",
      "mapExpansion", "mapOwner", "mapReassessment", "mapEventId"].map((key) => text(data[key]));
    const mapStarted = mapFields.some(Boolean);
    if (mapStarted && (!mapFields[0] || !mapFields[1] || !mapFields[4] || !mapFields[5] ||
      (!mapFields[2] && !mapFields[3]))) {
      return "For a Capabilities and System Map change handoff, complete the change date, type, access-expansion status, change owner and at least one previous/new link or access value; otherwise leave all map-change fields blank.";
    }
    if (mapStarted && ["Yes", "Unsure"].includes(mapFields[4]) && !mapFields[6]) {
      return "A new or possibly expanded access edge needs a real reassessment reference before preparing the map-change handoff.";
    }
    const planKeys = ["planGate", "planTrigger", "planRequirement", "planDate", "planRole", "planState", "planSourceVersion"];
    const plan = planKeys.map((key) => text(data[key]));
    const planStarted = plan.some(Boolean) || text(data.planBasis) || text(data.planWaiver) ||
      text(data.planId) || text(data.planCriteria) || text(data.planUseScope) || text(data.planUcId);
    if (planStarted && !["UC-ID specific", "Shared system baseline", "Unknown"].includes(text(data.planUseScope))) {
      return "Select the Gate Plan's exact UC-ID-specific, shared system baseline, or Unknown scope.";
    }
    if (planStarted && data.planUseScope === "UC-ID specific" && !text(data.planUcId)) {
      return "Enter the exact UC-ID covered by a UC-ID-specific Gate Plan.";
    }
    if (planStarted && data.planUseScope !== "UC-ID specific" && text(data.planUcId)) {
      return "Clear the Gate Plan UC-ID unless its scope is explicitly UC-ID specific.";
    }
    if (planStarted && plan.some((item) => !item)) {
      return "Complete every Gate Plan prompt, including source version and any N-A/waiver rationale and authority, or leave the plan blank.";
    }
    if (planStarted && text(data.planRequirement) === "Required" && !text(data.planBasis)) {
      return "A Required Gate Plan needs a basis reference.";
    }
    if (planStarted && text(data.planRequirement) === "Not required" && !text(data.planWaiver)) {
      return "A Not required Gate Plan needs its rationale and authority reference.";
    }
    if (planStarted && !["Required", "Not required"].includes(text(data.planRequirement))) {
      return "Select the actual Gate Plan requirement status; do not infer it.";
    }
    if (text(data.planId) && !data.planIdVerified) {
      return "Only enter an existing Plan ID checked against current AIG-DEC-04.";
    }
    const conditionDraftStarted = [
      "condition", "conditionOwner", "conditionDue", "conditionState",
      "conditionResolved", "conditionEvidence"
    ].some((key) => text(data[key]));
    const eventStarted = [
      "decision", "eventDate", "eventForum", "eventLifecycle", "eventMaker", "eventRecord",
      "eventAuthority", "eventState", "assuranceOpinion", "nextGate", "eventNotes", "technicalSnapshot",
      "recordedBy", "evidenceSource", "planEventId", "priorityBefore", "priorityAfter", "priorityRef",
      "eventUseScope", "eventUcId", "permittedPurpose", "permittedUsers",
      "permittedData", "permittedActions", "exclusions", "permittedConditions"
    ].some((key) => text(data[key])) || (text(data.eventId) && !conditionDraftStarted);
    if (eventStarted && (!text(data.decision) || !text(data.eventDate) || !text(data.eventForum) ||
      !text(data.eventLifecycle) || !text(data.eventMaker) || !text(data.eventRecord) ||
      !text(data.eventAuthority) || !text(data.evidenceSource) || !text(data.eventState) || !data.eventConfirmed)) {
      return "A Gate Event transfer checklist requires an actual authorised decision, date, forum, lifecycle stage, decision-maker, decision-record/minutes reference, evidence source/URI, recorded state, checked authority reference and confirmation.";
    }
    if (eventStarted && !["UC-ID specific", "Shared system baseline", "Unknown"].includes(text(data.eventUseScope))) {
      return "Select the Gate Event decision scope as UC-ID specific, Shared system baseline, or Unknown; scope cannot be inferred.";
    }
    if (eventStarted && data.eventUseScope === "UC-ID specific" &&
      (!text(data.eventUcId) || !text(data.useDecisionRef) || !text(data.permittedPurpose) ||
       !text(data.permittedUsers) || !text(data.permittedData) || !text(data.permittedActions) ||
       !text(data.exclusions) || !text(data.permittedConditions))) {
      return "A UC-ID-specific Gate Event needs its exact UC-ID, verified per-UC decision reference, permitted purpose/users/data/actions, exclusions, and operating conditions; a system baseline cannot supply these.";
    }
    if (eventStarted && data.eventUseScope !== "UC-ID specific" &&
      [data.eventUcId, data.useDecisionRef, data.permittedPurpose, data.permittedUsers, data.permittedData,
        data.permittedActions, data.exclusions, data.permittedConditions].some((item) => text(item))) {
      return "Clear UC-specific decision details unless the Gate Event scope is explicitly UC-ID specific; Unknown or shared scope is not use approval.";
    }
    if (text(data.eventId) && !data.eventIdVerified) {
      return "Only enter an existing Event ID checked against current AIG-DEC-04; do not invent one.";
    }
    if (text(data.planEventId) && !data.planEventIdVerified) {
      return "Only enter an existing Plan ID checked against current AIG-DEC-04.";
    }
    const priority = ["priorityBefore", "priorityAfter", "priorityRef"].map((key) => text(data[key]));
    if (priority.some(Boolean) && (priority.some((item) => !item) || priority[0] === priority[1])) {
      return "Priority override fields must include before, after and the actual assurance priority update reference; the before and after values must differ.";
    }
    if (priority.some(Boolean) && text(data.decision) !== "Priority override") {
      return "Only complete priority override fields for an actual Priority override decision.";
    }
    if (text(data.decision) === "Priority override" && !priority.every(Boolean)) {
      return "A Priority override decision requires before/after priority values and the actual assurance priority update reference.";
    }
    const condition = ["condition", "conditionOwner", "conditionDue", "conditionState",
      "conditionResolved", "conditionEvidence"].map((key) => text(data[key]));
    if (condition.some(Boolean) && (!condition[0] || !condition[1] || !condition[2] || !condition[3] ||
      !text(data.eventId) || !data.eventIdVerified)) {
      return "A Gate Condition requires its action, owner, due date and an existing Event ID checked against current AIG-DEC-04.";
    }
    if (condition.some(Boolean) && !["UC-ID specific", "Shared system baseline", "Unknown"].includes(text(data.conditionUseScope))) {
      return "Select the Gate Condition scope as UC-ID specific, Shared system baseline, or Unknown.";
    }
    if (condition.some(Boolean) && data.conditionUseScope === "UC-ID specific" &&
      (!text(data.conditionUcId) || !text(data.useDecisionRef))) {
      return "Enter the exact UC-ID and per-UC decision reference covered by a UC-ID-specific Gate Condition.";
    }
    if (condition.some(Boolean) && data.conditionUseScope !== "UC-ID specific" && text(data.conditionUcId)) {
      return "Clear the Gate Condition UC-ID unless its scope is explicitly UC-ID specific.";
    }
    if (condition.some(Boolean) && eventStarted && (
      text(data.conditionUseScope) !== text(data.eventUseScope) ||
      (data.conditionUseScope === "UC-ID specific" && text(data.conditionUcId) !== text(data.eventUcId))
    )) {
      return "A Gate Condition prepared with a Gate Event must match the event's exact use scope and UC-ID.";
    }
    if (text(data.decision) === "Progress with condition" && !condition.some(Boolean)) {
      return "Progress with condition requires a Gate Condition handover linked to the existing Event ID.";
    }
    if (condition[3] === "Resolved" && (!condition[4] || !condition[5])) {
      return "A resolved Gate Condition needs its recorded resolution date and evidence reference.";
    }
    if (condition[3] === "Waived" && (!condition[4] || !condition[5])) {
      return "A waived Gate Condition needs its recorded waiver date and evidence/authority reference.";
    }
    return "";
  }

  function fileKey(value) {
    return text(value).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 48) || "unassigned";
  }

  function escapeHtml(value) {
    return text(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  const api = {
    ROUTES,
    SEVERITY_ORDER,
    calculateRisk,
    escapeHtml,
    fileKey,
    handoverCsv,
    mapChangeHandoverEntries,
    screenMissing,
    screeningEntries,
    severity,
    text,
    validateChange,
    validateIncident,
    validateMonitoring
  };
  root.GovernanceLogic = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
