(function (root) {
  "use strict";

  // Suite release the downloads are aligned to.
  const SUITE = {
    release: "v3.9.6",
    date: "3 October 2026",
    playbook: "AIG-GOV-02 AI Governance Playbook v19.9.15 draft"
  };

  // Generated from the v3.9.6 source workbooks and forms (see fixtures/suite-v3.9.6-targets.json,
  // written by scripts/generate-fixtures.py).
  // Column headers, order and formula columns are exact; do not edit by hand.
  const ARTEFACT_VERSIONS = {"AIG-OPS-02": "1.6 draft", "AIG-DEC-04": "1.1 draft", "AIG-AIMS-08": "1.2 draft", "AIG-ASS-02": "1.10 draft", "AIG-INV-05": "0.3 proposed design draft", "AIG-INV-04": "1.0 draft", "AIG-OPS-03": "1.8 draft", "AIG-DEC-03": "1.8 draft"};
  const TARGETS = {
    ops02Monitoring: {
      artefact: "AIG-OPS-02",
      file: "AIG-OPS-02_AI_Post_Deployment_Monitoring_and_Review_Log_Proposed.xlsx",
      sheet: "Monitoring Log",
      headerRow: 4,
      headers: [
        "AIR-ID",
        "AI System / Service",
        "Monitoring Period",
        "Review Date",
        "Monitoring Owner",
        "Metric Category",
        "Metric / Indicator",
        "Approved Threshold / Tolerance",
        "Actual Result",
        "Trend",
        "Threshold Breach?",
        "Severity",
        "Action / Decision",
        "Action Owner",
        "Due Date",
        "Incident / CAPA Ref",
        "Material Change?",
        "Risk Reassessment Required?",
        "Residual Risk After Review",
        "Governance Escalation?",
        "AIG-DEC-04 Event ID (Gate Log ref)",
        "Complaints / Challenges",
        "Human Override Rate / Trend",
        "Evidence Location",
        "Next Review Date",
        "Review Status",
        "Sample Source / Population of Record",
        "Selection Basis",
        "Population Size",
        "Sample Size Reviewed",
        "Sampling Window",
        "UC-ID (blank only for an explicitly shared system measure)",
        "Measure scope (UC-ID specific / Shared system baseline)",
        "Closure and evidence check",
        "Risk tier (UC-ID, AIG-ASS-02)",
        "Required minimum cadence (derived)",
        "Minimum sample (derived)",
        "Reassessment trigger (Appendix E.4)",
        "Reassessment / consideration ref (AIG-ASS-02)",
        "AIG-DEC-04 Condition ID (if monitoring a condition)",
        "Review type (§6.4.4: operational / performance / formal)",
        "Agentic cadence raise applied? (action-capable uses)"
      ],
      formulaColumns: ["Closure and evidence check", "Required minimum cadence (derived)", "Minimum sample (derived)"]
    },
    dec04GatePlan: {
      artefact: "AIG-DEC-04",
      file: "AIG-DEC-04_Gate_Log_Proposed.xlsx",
      sheet: "Gate plan",
      headerRow: 3,
      headers: [
        "Plan ID",
        "AIR-ID",
        "Gate / forum",
        "Trigger / stage",
        "Requirement",
        "Basis / triage ref",
        "Target date",
        "Responsible role",
        "Plan state",
        "N-A / waiver rationale and authority ref",
        "UC-ID scope(s) (blank only for explicit system baseline)",
        "Decision scope (UC-ID specific / Shared system baseline)",
        "Row check"
      ],
      formulaColumns: ["Row check"]
    },
    dec04GateEvents: {
      artefact: "AIG-DEC-04",
      file: "AIG-DEC-04_Gate_Log_Proposed.xlsx",
      sheet: "Gate events",
      headerRow: 3,
      headers: [
        "Event ID",
        "AIR-ID",
        "Plan ID (if any)",
        "Gate / forum",
        "Event type",
        "Date",
        "Outcome",
        "Decision-maker / role",
        "AIG-DEC-03 / minutes ref",
        "Assurance opinion ref",
        "Technical snapshot / as-at ref",
        "Next gate / action",
        "Recorded by",
        "Row check",
        "UC-ID(s) covered by this dated event",
        "Decision scope (UC-ID specific / Shared system baseline)",
        "Decision-scope completeness prompt",
        "Time (hh:mm)",
        "Source (minutes / decision record / system)",
        "Evidence ID(s) (AIG-INV-04 Evidence index)",
        "Event-time lifecycle stage",
        "Incident ref (AIG-OPS-03), precautionary pause",
        "Follow-up decision due date (precautionary pause)"
      ],
      formulaColumns: ["Row check", "Decision-scope completeness prompt"]
    },
    dec04Conditions: {
      artefact: "AIG-DEC-04",
      file: "AIG-DEC-04_Gate_Log_Proposed.xlsx",
      sheet: "Conditions",
      headerRow: 3,
      headers: [
        "Condition ID",
        "Event ID",
        "AIR-ID",
        "Required action / condition",
        "Action owner",
        "Due date",
        "State",
        "Closed / waived on",
        "Evidence / waiver authority ref",
        "Row check",
        "UC-ID scope (blank only if shared system condition)",
        "Condition scope (UC-ID specific / shared system baseline)",
        "Verified by / date",
        "Monitoring condition? (Yes / No)",
        "AIG-OPS-02 evidence ref (monitoring conditions)"
      ],
      formulaColumns: ["Row check"]
    },
    aims08Capa: {
      artefact: "AIG-AIMS-08",
      file: "AIG-AIMS-08_AIMS_Nonconformity_and_Corrective_Action_Proposed.xlsx",
      sheet: "CAPA Log",
      headerRow: 1,
      headers: [
        "NC ID",
        "Date raised",
        "Source",
        "Related AIR-ID (if system-level) / AIMS area",
        "Nonconformity (what fails, and the requirement)",
        "Severity",
        "Immediate correction",
        "Root cause",
        "Corrective action",
        "Owner",
        "Target date",
        "Effectiveness check",
        "Status",
        "Date closed",
        "Source ref (audit Finding ID / incident / review ref)",
        "Similar NCs checked (Y/N, refs)",
        "AIMS change needed / made (ref)"
      ],
      formulaColumns: []
    },
    inv05MapChanges: {
      artefact: "AIG-INV-05",
      file: "AIG-INV-05_Capabilities_and_System_Map_Proposed.xlsx",
      sheet: "Map changes",
      headerRow: 3,
      headers: [
        "Map Change ID",
        "AIR-ID",
        "Map Edge ID",
        "Change date",
        "Change type",
        "Previous link / access",
        "New link / access",
        "Access expansion?",
        "Change owner",
        "Review / reassessment ref",
        "Gate Event ID (if needed)",
        "State",
        "Change check"
      ],
      formulaColumns: ["Change check"]
    },
    inv04AssessmentSummary: {
      artefact: "AIG-INV-04",
      file: "AIG-INV-04_AI_Register_Proposed.xlsx",
      sheet: "Assessment summary",
      headerRow: 3,
      headers: [
        "AIR-ID",
        "Effective Governance Priority (AIG-ASS-01, after any authorised override)",
        "AIG-ASS-01 ref / date",
        "Risk tier (AIG-ASS-02; highest applicable UC-ID or baseline)",
        "AIG-ASS-02 ref / date",
        "Agency tier (AIG-AGT-02/AIG-AGT-03)",
        "AIG-AGT-02/AIG-AGT-03 ref / date",
        "Privacy / DPIA position",
        "Equality / EIA position",
        "Other specialist finding refs",
        "AIG-AGT-04 Agent Record ref",
        "AIG-AGT-05 Authority Graph ref",
        "AIG-OPS-02 Monitoring ref",
        "As-at date",
        "AGPI score (0–100, AIG-ASS-01)",
        "Inherent risk score (L × I)",
        "Control effectiveness (1–5)",
        "Residual risk score",
        "Decisions about individuals — Art 22A flag / AIG-OPS-04 tier",
        "Latest priority-override Event ID (AIG-DEC-04)",
        "Reconciled on",
        "Row check"
      ],
      formulaColumns: ["Row check"]
    },
    ass02TriageImport: {
      artefact: "AIG-ASS-02",
      file: "AIG-ASS-02_AI_Risk_Assessment_Worksheet_Proposed.xlsx",
      sheet: "Triage Import",
      headerRow: 4,
      headers: [
        "Canonical field",
        "Value",
        "Capture status",
        "Used in AIG-ASS-02",
        "Implementation note"
      ],
      formulaColumns: []
    },
    ops03PartA: {
      artefact: "AIG-OPS-03",
      file: "AIG-OPS-03_AI_Incident_Report_Form.docx",
      section: "PART A — INITIAL REPORT, sections 1–4 (form order)",
      fields: [
        "Reported by",
        "Role / team",
        "Contact email",
        "Date & time identified",
        "AI system / model name",
        "AIR-ID",
        "Affected UC-ID(s)",
        "Describe the incident: what occurred, when, how it came to light, and what the AI system was doing",
        "How was it identified?",
        "Is the incident ongoing?",
        "Event classification",
        "Residents / service users",
        "Staff",
        "A vulnerable group",
        "Personal / special category data",
        "Service availability",
        "Decision-making about individuals",
        "Supplier / third party",
        "Reputation",
        "Describe the actual or potential impact and the approximate number of people affected",
        "Provisional severity",
        "Immediate action taken",
        "Precautionary pause applied? Gate Log event ID",
        "Suspected personal data breach?",
        "Security or safeguarding concern?",
        "External notification may be required?",
        "Part A sent to AI Governance Lead (date)"
      ]
    },
    ops03PartB8: {
      artefact: "AIG-OPS-03",
      file: "AIG-OPS-03_AI_Incident_Report_Form.docx",
      section: "PART B — 8. Notification and Closure (form order)",
      fields: [
        "Personal data breach confirmed?",
        "Controller awareness date and time",
        "Risk to individuals' rights and freedoms",
        "ICO notifiability decision and DPO advice",
        "ICO deadline and notification reference",
        "Data-subject notification decision",
        "Other regulator, contractual or partner notifications",
        "Notifications made (dates)",
        "Specialist routes engaged (Playbook §6.8.6.5)",
        "AIG-OPS-02 monitoring record updated?",
        "Risk reassessment required?",
        "Residual risk / risk tier changed?",
        "Governance re-entry / Gate Log event required?",
        "Lessons learned captured?",
        "Incident closed (date)"
      ]
    },
    dec03Reference: {
      artefact: "AIG-DEC-03",
      file: "AIG-DEC-03_Governance_Decision_Record.docx",
      section: "1. Decision Reference and 2. Decision (form order)",
      fields: [
        "Decision record ID",
        "System identity",
        "UC-ID(s) expressly covered",
        "AIR-ID",
        "Decision date",
        "Decision-making body",
        "Risk classification",
        "Decision authority / delegation reference",
        "Meeting / written-decision reference",
        "Decision",
        "UC-ID decision schedule (repeat for each use)",
        "Priority override (only if this record authorises one)"
      ]
    }
  };

  // AIG-ASS-02 'Triage Import' rows 5–63: canonical field, value (blank), capture status, use, note.
  const TRIAGE_IMPORT_ROWS = [
    ["AIR-ID", "", "AUTO — current web triage", "Identity", "Direct profile field."],
    ["System / Model Name", "", "AUTO — current web triage", "Identity", "Direct profile field."],
    ["Purpose / Description", "", "AUTO — current web triage", "Identity", "Direct profile field."],
    ["Service Area", "", "AUTO — current web triage", "Identity", "Direct profile field."],
    ["Service Owner", "", "AUTO — current web triage", "Identity", "Direct profile field."],
    ["Supplier / Developer", "", "AUTO — current web triage", "Context", "Direct profile field; retained for traceability."],
    ["Source", "", "AUTO — current web triage", "Context", "Direct profile field."],
    ["AI Capability", "", "AUTO — current web triage", "Context / agentic gate", "Direct profile field."],
    ["Automated Action Authority", "", "AUTO — current web triage", "Agentic context", "Direct profile field."],
    ["Systems / Tools Accessed", "", "AUTO — current web triage", "Agentic context", "Direct profile field."],
    ["Lifecycle Stage", "", "AUTO — current web triage", "Context", "Direct profile field."],
    ["Personal / Special Category Data", "", "AUTO — current web triage", "Escalation context", "Direct profile field."],
    ["Triage Date", "", "DERIVED — current web triage", "Identity", "Generated at export."],
    ["AGPI Score (0-100)", "", "DERIVED — current web triage", "Triage context", "Calculated from the six AGPI dimensions."],
    ["Raw AGPI Priority", "", "DERIVED — current web triage", "Triage context", "Current results.priority.label."],
    ["Authorised Governance Priority Uplift", "", "MANUAL / GOVERNANCE — optional", "Triage context", "Optional formally authorised uplift to a stricter AGPI governance priority. Do not populate this from mandatory risk triggers or the risk-tier floor. The §3.9.6 trigger floor (a use meeting a §4.4.6 trigger is at least Priority 4 – Routine) is a rule already applied in the AIG-ASS-01 priority (B17, row 24), not an uplift, and needs no override record."],
    ["Effective Governance Priority", "", "DERIVED — raw AGPI + authorised uplift", "Triage context", "Stricter of Raw AGPI Priority (which already includes the AIG-ASS-01 priority and trigger floors) and any authorised governance-priority uplift only. Risk classification remains separate in Mandatory Risk Floor / Effective Governance Tier."],
    ["Resident Impact", "", "AUTO — current web triage", "Step 1", "Impact score 1–5."],
    ["Legal and Regulatory Impact", "", "AUTO — current web triage", "Step 1", "Impact score 1–5."],
    ["Reputational Impact", "", "AUTO — current web triage", "Step 1", "Impact score 1–5."],
    ["Operational Impact", "", "AUTO — current web triage", "Step 1", "Impact score 1–5."],
    ["Financial Impact", "", "AUTO — current web triage", "Step 1", "Impact score 1–5."],
    ["Likelihood", "", "AUTO — current web triage", "Step 2", "Risk likelihood score 1–5."],
    ["Control Effectiveness", "", "AUTO — current web triage", "Step 2", "1 Very Strong to 5 Ineffective."],
    ["Impact Score", "", "DERIVED — current web triage", "Step 3", "Maximum of the five impact dimensions."],
    ["Inherent Risk Score", "", "DERIVED — current web triage", "Step 3", "Likelihood × impact."],
    ["Inherent Risk Tier", "", "DERIVED — current web triage", "Step 3", "Tier from inherent score."],
    ["Residual Risk Score", "", "DERIVED — current web triage", "Step 3", "Inherent × control factor."],
    ["Residual Risk Tier", "", "DERIVED — current web triage", "Step 3", "Tier from residual score."],
    ["Trigger — Special Category Data", "", "AUTO — current web triage", "Step 4", "Yes/No."],
    ["Trigger — Vulnerable Residents", "", "AUTO — current web triage", "Step 4", "Yes/No."],
    ["Trigger — Housing/Care/Homelessness", "", "AUTO — current web triage", "Step 4", "Yes/No."],
    ["Trigger — Novel Deployment", "", "AUTO — current web triage", "Step 4", "Yes/No."],
    ["Trigger — Statutory Decisions", "", "AUTO — current web triage", "Step 4", "Yes/No."],
    ["Trigger — Material Change", "", "AUTO — current web triage", "Step 4", "Yes/No."],
    ["Trigger — Agentic Autonomous Action", "", "AUTO — current web triage", "Step 4", "Yes/No."],
    ["Mandatory Risk Floor", "", "DERIVED — current web triage", "Step 3 / 4", "Critical for statutory or agentic trigger; High for any other trigger; otherwise Low."],
    ["Effective Governance Tier", "", "DERIVED — current web triage", "Step 3 / 4", "Pre-control tier from web triage: highest of inherent tier, residual tier and mandatory risk floor (no control-based reduction). The confirmed tier in Risk Assessment C43 applies the Playbook §4.4.3 evidenced-control reduction, the impact floor (any confirmed Impact 5 → at least Medium) and the agentic floor."],
    ["Tier Floor Reason", "", "DERIVED — current web triage", "Step 3", "Explains inherent and/or mandatory uplift."],
    ["Assurance Intensity", "", "DERIVED — current web triage", "Step 3", "Comprehensive / Enhanced / Standard / Proportionate. Risk Assessment C45 derives it from the governing tier and triggers only; the AGPI priority does not raise assurance depth (v3.8, T1)."],
    ["Governance Status", "", "DERIVED — current web triage", "Assessment status", "Triage complete; formal approvals pending."],
    ["Is Agent", "", "DERIVED — current web triage", "Step 5", "Yes if it can act, including when a human approves each action, or its capability is Agentic AI."],
    ["Agentic Consequence", "", "AUTO — current Agentic Triage", "Step 5", "0–5."],
    ["Agentic Autonomy", "", "AUTO — current Agentic Triage", "Step 5", "0–5."],
    ["Agentic Authority", "", "AUTO — current Agentic Triage", "Step 5", "0–5."],
    ["Agentic Reach", "", "AUTO — current Agentic Triage", "Step 5", "0–5."],
    ["Agentic Controllability", "", "AUTO — current Agentic Triage", "Step 5", "0–5 reversed."],
    ["Autonomy Level", "", "DERIVED — current Agentic Triage", "Step 5", "A0–A5 label."],
    ["Agency Tier", "", "DERIVED — current Agentic Triage", "Step 5", "T0–T5 label."],
    ["Agentic Pathway", "", "DERIVED — current Agentic Triage", "Step 5", "Governance pathway."],
    ["Kill-switch Demonstrated", "", "AUTO — current Agentic Triage", "Step 5", "Yes/No from agentic controls."],
    ["Rollback Capability", "", "AUTO — current Agentic Triage", "Step 5", "Yes/No from agentic controls."],
    ["Boundaries Tested", "", "AUTO — current Agentic Triage", "Step 5", "Yes/No from agentic controls."],
    ["Agentic Flags", "", "DERIVED — current Agentic Triage", "Step 5", "Containment/control flags."],
    ["Agentic Escalations", "", "DERIVED — current Agentic Triage", "Step 5", "Escalation reasons."],
    ["Agentic Deployment Control", "", "DERIVED — current Agentic Triage", "Step 5 / final control", "Deployment constraint from agentic logic."],
    ["Agent Record (ASBOM) Ref", "", "AUTO — current Agentic Triage", "Step 5", "Reference entered by user."],
    ["UC-ID (blank only for explicit system baseline)", "", "Scope key", "Enter stable UC-ID when this triage / risk assessment is use-specific.", ""],
    ["Triage / assessment scope", "", "ASSESSOR INPUT", "Scope key", "Select UC-ID specific for a use assessment or Shared system baseline for shared controls. A shared baseline never approves a use."]
  ];

  // Controlled lists (data validations) of the v3.9.6 target sheets and forms.
  const LISTS = {
    yesNoUnknown: ["Yes", "No", "Unknown"],
    riskTier: ["Low", "Medium", "High", "Critical"],
    ops02MetricCategory: ["Performance", "Fairness / Bias", "Drift", "Error / Failure", "Human Oversight",
      "Complaints / Challenges", "Privacy", "Security", "Benefits / Outcomes", "Other"],
    ops02Trend: ["Improving", "Stable", "Deteriorating", "New / Baseline", "Not yet known"],
    ops02ReviewStatus: ["Open", "Reviewed", "Action Open", "Escalated", "Closed"],
    ops02SelectionBasis: ["Full population (census)", "Simple random", "Stratified random",
      "Risk-weighted / targeted", "Exception-based"],
    scope: ["UC-ID specific", "Shared system baseline"],
    ops02ReviewType: ["Operational monitoring", "Performance review", "Formal review"],
    ops02AgenticRaise: ["Raised per Monitoring and Review Plan", "Not action-capable", "Action-capable: raise not yet set"],
    ops02Triggers: ["None", "Threshold breach",
      "Material change (model, data, supplier, purpose, user population or autonomous authority)",
      "Significant complaint / challenge pattern", "Material incident or near miss",
      "Adverse human-override trend", "Control failure", "Legal / regulatory change"],
    dec04Requirement: ["Required", "Conditional", "Not applicable"],
    dec04PlanState: ["Planned", "Complete", "Superseded", "Cancelled"],
    dec04Gates: ["Gate 0 Intake / opportunity", "Gate 1 Strategic prioritisation", "Gate 2 Technical design review",
      "Gate 3 Case for change / strategic alignment", "Gate 4 Procurement", "Gate 5 Ethics assessment",
      "Gate 6 Deployment / go-live", "Gate 7 Operate, monitor, review & change", "Gate 8 Retirement / closure",
      "Other forum (name it in Decision-maker / role)"],
    dec04EventTypes: ["Decision", "Assurance opinion", "Review only", "Priority override", "Intake / registration",
      "Precautionary pause (containment)"],
    dec04Outcomes: ["Progress", "Progress with condition", "Return for evidence", "Pause", "Stop", "Suspend",
      "Decommission", "Re-authorise", "Opinion only", "No decision", "Paused — pending decision"],
    // AIG-ASS-02 Risk Assessment Step 4 (C50:C55 Yes/No; C56 also Unsure).
    ass02Trigger: ["Yes", "No"],
    ass02AgenticTrigger: ["Yes", "No", "Unsure"],
    dec04Lifecycle: ["Idea and Innovation", "Registration and Intake", "Risk Assessment and Review",
      "Approval and Assurance", "Deployment and Operation", "Monitoring and Review", "Retirement and Decommissioning"],
    dec04ConditionStates: ["Open", "Closed-verified", "Accepted-open", "Waived", "Unknown"],
    yesNo: ["Yes", "No"],
    agpiPriority: ["Priority 1 – Critical", "Priority 2 – High", "Priority 3 – Standard", "Priority 4 – Routine",
      "Priority 5 – Observe"],
    aims08Source: ["Internal audit", "Management review", "Incident", "Monitoring", "Complaint",
      "External / regulator", "Self-identified", "Other"],
    inv05ChangeType: ["Add link", "Expand access", "Reduce access", "Change scope", "Remove link"],
    inv05Expansion: ["Yes", "No", "Unsure"],
    inv05State: ["Open", "In review", "Closed"],
    ops03Classification: ["Incident", "Near miss", "Concern"],
    ops03Ongoing: ["Yes", "No"],
    ops03Severity: ["Low", "Medium", "High", "Critical"],
    ops03SuspectedBreach: ["Yes", "No", "Uncertain"],
    ops03Security: ["Yes", "No"],
    ops03External: ["Yes", "No", "Unsure"],
    ops03IcoDecision: ["Notifiable", "Not notifiable", "Further assessment"],
    ops03Affected: ["Residents / service users", "Staff", "A vulnerable group", "Personal / special category data",
      "Service availability", "Decision-making about individuals", "Supplier / third party", "Reputation"],
    dec03Outcomes: ["Approved", "Approved with conditions", "Deferred", "Rejected", "Suspended", "Retired"]
  };

  // AIG-DEC-04 Lists sheet: gate Outcome → AIG-DEC-03 outcome for the UC-ID, and allowed Event types.
  const DEC04_OUTCOME_MAP = {
    "Progress": { dec03: "Approved", eventTypes: ["Decision"] },
    "Progress with condition": { dec03: "Approved with conditions", eventTypes: ["Decision"] },
    "Return for evidence": { dec03: "Deferred", eventTypes: ["Decision"] },
    "Pause": { dec03: "", note: "Deferred (before go-live) / Suspended (in operation)", eventTypes: ["Decision"] },
    "Stop": { dec03: "Rejected", eventTypes: ["Decision"] },
    "Suspend": { dec03: "Suspended", eventTypes: ["Decision"] },
    "Decommission": { dec03: "Retired", eventTypes: ["Decision"] },
    "Re-authorise": { dec03: "", note: "Approved or Approved with conditions (after reassessment)", eventTypes: ["Decision"] },
    "Opinion only": { dec03: "", note: "None — assurance input, not a decision (Pending)", eventTypes: ["Assurance opinion", "Review only"] },
    "No decision": { dec03: "", note: "None (Pending)", eventTypes: ["Review only", "Priority override", "Intake / registration"] },
    // v3.9.2 (W-06): containment, not a decision; the UC-ID keeps its AIG-DEC-03 outcome.
    "Paused — pending decision": { dec03: "", note: "None: containment, not a decision (the UC-ID keeps its recorded AIG-DEC-03 outcome until the follow-up decision; Playbook §4.7.17)", eventTypes: ["Precautionary pause (containment)"] }
  };
  const PAUSE_EVENT = "Precautionary pause (containment)";
  const PAUSE_OUTCOME = "Paused — pending decision";
  const DECISION_OUTCOMES = ["Progress", "Progress with condition", "Return for evidence", "Pause", "Stop",
    "Suspend", "Decommission", "Re-authorise"];

  const SEVERITY_ORDER = ["Low", "Medium", "High", "Critical"];
  const SCREENING_KEYS = ["equality", "humanRights", "privacy", "other"];
  // Recipients and escalation wording from the AIG-OPS-03 v1.8 Part A §4 severity table.
  const ROUTES = {
    Low: {
      recipient: "Service Owner",
      target: "Service Owner review and local remediation; Part A to the AI Governance Lead the same working day; logged in the incident record and summarised in the AIG-OPS-02 monitoring log within 10 working days (the AI Register holds only a link/status)"
    },
    Medium: {
      recipient: "AI Governance Lead",
      target: "AI Governance Lead notified the same working day (Part A); documented remediation plan agreed within five working days"
    },
    High: {
      recipient: "AI Governance Working Group",
      target: "AI Governance Working Group within 2 working days; formal governance review"
    },
    Critical: {
      recipient: "AI Assurance Board, Executive Sponsor and Executive Leadership",
      target: "Immediate escalation, and within 24 hours at most, to AI Assurance Board, Executive Sponsor and Executive Leadership"
    }
  };

  // AIG-OPS-03 v1.8 Part A §4 "When it applies" wording, including the indicators for
  // each severity (v3.9.2, T-06: Low has its own indicators, so Low can be selected).
  const SEVERITY_WHEN = {
    "Low": "Limited operational impact; no significant legal, ethical or service consequences. Indicators: an isolated minor output inaccuracy (for example one wrong date or figure, corrected before harm), an isolated user complaint, a documentation error or a non-material process failure.",
    "Medium": "Moderate impact requiring management attention and corrective action. Indicators: repeated inaccurate outputs, policy non-compliance, control failures, minor service disruption or recurring user complaints.",
    "High": "Significant operational, legal, ethical or reputational impact. Indicators: material bias findings, significant model drift, operational disruption, security weaknesses, repeated control failures or significant service impacts.",
    "Critical": "Actual or potential harm to individuals, major legal/reputational exposure or statutory breach. Indicators: data breaches, unlawful automated decision-making, significant impacts on vulnerable individuals, major regulatory concerns, widespread service failure or substantial media scrutiny."
  };
  // AIG-OPS-03 v1.8 Part A §4 / Playbook §4.7.17 mandatory triggers (W-04): escalate to
  // the AI Governance Lead immediately, consider a precautionary pause, at least High.
  const MANDATORY_INCIDENT_TRIGGERS = [
    "Significant bias resulting in adverse outcomes",
    "Data protection breach involving AI-processed data",
    "Security incident affecting AI system integrity",
    "Governance failure indicating an inadequate control environment"
  ];

  function text(value) {
    return value == null ? "" : String(value).trim();
  }

  // AIG-INV-04 AI Register validation on AIR-ID: LEFT(A,4)="AIR-" and LEN(TRIM(A))=8.
  // AIG-AGT-04 v0.5 Agent Record uses the same rule (plus its AIR-EXAMPLE sample row), so
  // an AIR-ID accepted here is accepted by both workbooks (v3.9.2, T-10).
  function isAirId(value) {
    const id = text(value);
    return id.length === 8 && id.slice(0, 4).toUpperCase() === "AIR-";
  }
  const AIR_ID_MESSAGE = "AIR-ID must match the AIG-INV-04 format: AIR- followed by four characters (8 characters in total).";

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

  // AIG-ASS-02 v1.8 Risk Assessment tier bands (C38 and C41): Low 1–5, Medium 6–10,
  // High 11–15, Critical 16–25 (residual: >15 Critical, >10 High, >5 Medium).
  function tierFromScore(score) {
    if (typeof score !== "number" || !isFinite(score)) return "";
    if (score > 15) return "Critical";
    if (score > 10) return "High";
    if (score > 5) return "Medium";
    return "Low";
  }

  function calculateRisk(impacts, likelihood, control) {
    if (!Array.isArray(impacts) || impacts.length !== 5) return null;
    const values = impacts.map((value) => (text(value) === "" ? NaN : Number(value)));
    const l = text(likelihood) === "" ? NaN : Number(likelihood);
    const c = text(control) === "" ? NaN : Number(control);
    if (values.some((value) => !Number.isInteger(value) || value < 1 || value > 5) ||
      !Number.isInteger(l) || l < 1 || l > 5 ||
      !Number.isInteger(c) || c < 1 || c > 5) return null;
    const impact = Math.max.apply(null, values);
    // AIG-ASS-02 C37 = L × I; C39 = C ÷ 5; C40 = C37 × C39 (no rounding in the workbook).
    const inherent = l * impact;
    const residual = (inherent * c) / 5;
    return {
      impact,
      likelihood: l,
      control: c,
      inherent,
      inherentTier: tierFromScore(inherent),
      controlFactor: c / 5,
      residual,
      residualTier: tierFromScore(residual),
      // v3.8 impact floor (Proposed — for Council confirmation): any confirmed Impact 5 → governing tier at least Medium.
      impactFloor: impact === 5 ? "Medium" : ""
    };
  }

  function csvCell(value) {
    let result = text(value);
    // Neutralise spreadsheet formulas, but keep plain numbers (for example -3 or +2.5%) as values.
    if (/^[=+\-@]/.test(result) && !/^[-+]?\d+(\.\d+)?%?$/.test(result)) result = "'" + result;
    if (/[",\r\n]/.test(result)) result = '"' + result.replace(/"/g, '""') + '"';
    return result;
  }

  const GUIDANCE_HEADERS = [
    "Guidance only, do not paste: target and transfer rule",
    "Guidance only, do not paste: verification notes"
  ];

  function columnLetter(index) {
    let n = index + 1;
    let letters = "";
    while (n > 0) {
      const rem = (n - 1) % 26;
      letters = String.fromCharCode(65 + rem) + letters;
      n = Math.floor((n - 1) / 26);
    }
    return letters;
  }

  function targetColumns(target) {
    return target.headers || target.fields;
  }

  function transferRule(target) {
    const version = ARTEFACT_VERSIONS[target.artefact];
    const cols = targetColumns(target);
    if (target.sheet) {
      const formulas = (target.formulaColumns || []).map((name) =>
        columnLetter(cols.indexOf(name)) + " " + name).join("; ");
      return target.artefact + " v" + version + " · sheet “" + target.sheet + "” (header row " + target.headerRow +
        ", columns A–" + columnLetter(cols.length - 1) + "). The columns before the blank spacer match the workbook headers and controlled lists exactly, in order." +
        (formulas ? " Workbook formula columns left blank here (keep the workbook formula; do not paste over it): " + formulas + "." : "") +
        " Draft for owner verification (suite " + SUITE.release + "); not a live record.";
    }
    return target.artefact + " v" + version + " · " + target.section + ". One column per form field, labelled exactly as the form, in form order. Transcribe into the controlled form after owner verification (suite " +
      SUITE.release + "); not a live record.";
  }

  // Builds one row in exact target column order. Unknown keys are a programming error:
  // every value must land in a real target column.
  function buildRow(target, values) {
    const cols = targetColumns(target);
    Object.keys(values || {}).forEach(function (key) {
      if (cols.indexOf(key) < 0) throw new Error("Not a " + target.artefact + " column: " + key);
    });
    return cols.map(function (name) {
      const value = values ? values[name] : "";
      return value == null ? "" : value;
    });
  }

  // CSV: exact target headers, one blank spacer column, then guidance columns (never part of the workbook).
  function exactCsv(target, rows) {
    const header = targetColumns(target).concat([""], GUIDANCE_HEADERS);
    const lines = [header].concat(rows.map(function (row, index) {
      const notes = (row.notes || []).map(text).filter(Boolean).join(" | ");
      const cells = Array.isArray(row.cells) ? row.cells : buildRow(target, row.values);
      return cells.concat([""], [index === 0 ? transferRule(target) : "", notes]);
    }));
    return lines.map((line) => line.map(csvCell).join(",")).join("\r\n") + "\r\n";
  }

  function parseCsv(csv) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    const source = String(csv).replace(/^﻿/, "");
    for (let i = 0; i < source.length; i += 1) {
      const ch = source[i];
      if (quoted) {
        if (ch === '"' && source[i + 1] === '"') { cell += '"'; i += 1; }
        else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\r" && source[i + 1] === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; i += 1; }
      else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  function formatDateTime(value) {
    return text(value).replace("T", " ");
  }

  function scopeValue(scope) {
    return LISTS.scope.indexOf(text(scope)) >= 0 ? text(scope) : "";
  }

  function scopeNote(scope, label) {
    const value = text(scope);
    if (value === "Unknown") return label + " scope is Unknown, which is not a workbook value: the scope column is left blank. Resolve to UC-ID specific or Shared system baseline before transfer; Unknown is not shared scope or approval.";
    if (value === "Shared system baseline") return label + " scope is a shared system baseline; it is not approval of any UC-ID.";
    return "";
  }

  // Change triggers ticked in "Assess a change" (v3.9.2, T-05) and how they carry into
  // the AIG-ASS-02 Step 4 §4.4.6 triggers: a model, data, supplier, system, purpose,
  // population or deployment-scope change is a material change (row 39 Yes); a change to
  // autonomous action authority makes the use action-capable (Is Agent Yes) and, until
  // per-action human review is confirmed, the agentic trigger is Unsure (row 40; Unsure
  // counts as Yes, Critical floor). The other five triggers are answered by the user.
  const CHANGE_TRIGGERS = {
    modelDataSupplier: "Model, data, supplier or system change",
    purposeScope: "Purpose, population or deployment-scope change",
    authority: "Autonomous action authority changed",
    threshold: "Approved threshold breach",
    drift: "Material drift, performance or control failure",
    incident: "Incident, near miss or challenge pattern",
    legal: "Legal/regulatory change or assurance finding"
  };
  const STEP4_TRIGGERS = [
    ["specialData", "Trigger — Special Category Data", "Processing of special category personal data (UK GDPR)"],
    ["vulnerable", "Trigger — Vulnerable Residents", "Use in relation to vulnerable residents (children, adults with care/support needs, people experiencing homelessness)"],
    ["housingCare", "Trigger — Housing/Care/Homelessness", "Directly influences housing allocation, social care assessments or homelessness prevention decisions"],
    ["novel", "Trigger — Novel Deployment", "Novel or first-of-type AI deployment with no prior Council operational experience"],
    ["statutory", "Trigger — Statutory Decisions", "Produces or directly informs statutory decisions"],
    ["materialChange", "Trigger — Material Change", "Significant AI supplier or model changes that materially alter the risk profile of an existing deployment"],
    ["agentic", "Trigger — Agentic Autonomous Action", "Executes actions autonomously without human review of each individual action"]
  ];

  // The seven Step 4 answers for the Triage Import rows 34–40, plus Is Agent (row 46) and
  // Mandatory Risk Floor (row 41), exactly as AIG-ASS-02 C42 reads them.
  function step4Answers(changeTriggers, answers) {
    const ticked = new Set(changeTriggers || []);
    const a = answers || {};
    const out = {};
    STEP4_TRIGGERS.slice(0, 5).forEach(function (t) {
      out[t[0]] = inList(a[t[0]], LISTS.ass02Trigger) ? text(a[t[0]]) : "";
    });
    const material = ticked.has("modelDataSupplier") || ticked.has("purposeScope");
    out.materialChange = material ? "Yes" : (inList(a.materialChange, LISTS.ass02Trigger) ? text(a.materialChange) : "");
    const authority = ticked.has("authority");
    out.agentic = inList(a.agentic, LISTS.ass02AgenticTrigger) ? text(a.agentic) : (authority ? "Unsure" : "");
    const complete = STEP4_TRIGGERS.every(function (t) { return out[t[0]] !== ""; });
    let floor = "";
    if (complete) {
      if (out.statutory === "Yes" || out.agentic === "Yes" || out.agentic === "Unsure") floor = "Critical";
      else if (STEP4_TRIGGERS.some(function (t) { return out[t[0]] === "Yes"; })) floor = "High";
      else floor = "Low";
    }
    const isAgent = authority || out.agentic === "Yes" || out.agentic === "Unsure" ? "Yes" : "";
    return { values: out, complete: complete, mandatoryFloor: floor, isAgent: isAgent, material: material, authority: authority };
  }

  // AIG-ASS-02 Triage Import rows (canonical field / value) for a post-deployment reassessment.
  function triageImportRows(data, risk) {
    const step4 = step4Answers(data.changeTriggers, data.triggerAnswers);
    const values = {
      "AIR-ID": text(data.airId),
      "System / Model Name": text(data.system),
      "Resident Impact": text(data.impacts && data.impacts[0]),
      "Legal and Regulatory Impact": text(data.impacts && data.impacts[1]),
      "Reputational Impact": text(data.impacts && data.impacts[2]),
      "Operational Impact": text(data.impacts && data.impacts[3]),
      "Financial Impact": text(data.impacts && data.impacts[4]),
      "Likelihood": text(data.likelihood),
      "Control Effectiveness": text(data.control),
      "Impact Score": risk ? risk.impact : "",
      "Inherent Risk Score": risk ? risk.inherent : "",
      "Inherent Risk Tier": risk ? risk.inherentTier : "",
      "Residual Risk Score": risk ? risk.residual : "",
      "Residual Risk Tier": risk ? risk.residualTier : "",
      "UC-ID (blank only for explicit system baseline)": text(data.useScope) === "UC-ID specific" ? text(data.ucId) : "",
      "Triage / assessment scope": scopeValue(data.useScope),
      "Mandatory Risk Floor": step4.mandatoryFloor,
      "Is Agent": step4.isAgent
    };
    STEP4_TRIGGERS.forEach(function (t) { values[t[1]] = step4.values[t[0]]; });
    const notes = {
      "AIR-ID": "Existing AIR-ID confirmed by the user against current AIG-INV-04; the assessor rechecks",
      "Impact Score": "Mirrors AIG-ASS-02: highest of the five impact dimensions",
      "Inherent Risk Score": "Mirrors AIG-ASS-02 C37: L × I",
      "Inherent Risk Tier": "Mirrors AIG-ASS-02 C38 bands: Low 1–5, Medium 6–10, High 11–15, Critical 16–25",
      "Residual Risk Score": "Mirrors AIG-ASS-02 C40: inherent × (C ÷ 5), unrounded",
      "Residual Risk Tier": "Mirrors AIG-ASS-02 C41 bands. The governing tier (C43) also applies evidenced-control rules, trigger floors, the impact floor and the agentic floor; it is not calculated here",
      "Triage / assessment scope": scopeNote(data.useScope, "Assessment"),
      "Trigger — Material Change": step4.material ? "Yes: a model, data, supplier, system, purpose, population or deployment-scope change was ticked in this reassessment (§4.4.6)" : "",
      "Trigger — Agentic Autonomous Action": step4.authority && step4.values.agentic === "Unsure" ?
        "Unsure: autonomous action authority changed and per-action human review is not yet confirmed; Unsure counts as Yes (Critical floor) until confirmed" : "",
      "Mandatory Risk Floor": step4.complete ? "Mirrors AIG-ASS-02 C42: Critical for a statutory or agentic trigger (Unsure = Yes), High for any other trigger, otherwise Low" :
        "Left blank: answer all seven §4.4.6 triggers; AIG-ASS-02 C42 shows Incomplete until each is answered",
      "Is Agent": step4.isAgent ? "Yes: the use can act (authority changed or the agentic trigger is Yes / Unsure); complete Step 5 agentic scores in AIG-ASS-02" : ""
    };
    if (risk && risk.impactFloor) notes["Impact Score"] += ". Impact floor (Proposed — for Council confirmation): a confirmed Impact 5 sets the governing tier to at least Medium";
    return TRIAGE_IMPORT_ROWS.map(function (row) {
      const value = Object.prototype.hasOwnProperty.call(values, row[0]) ? values[row[0]] : "";
      return { cells: [row[0], value, row[2], row[3], row[4]], notes: [notes[row[0]] || ""] };
    });
  }

  // AIG-INV-05 Map changes row.
  function mapChangeRow(data) {
    const eventId = text(data.eventId);
    const reassessmentRef = text(data.reassessmentRef);
    return {
      values: {
        "Map Change ID": "",
        "AIR-ID": text(data.airId),
        "Map Edge ID": "",
        "Change date": text(data.changeDate),
        "Change type": text(data.changeType),
        "Previous link / access": text(data.previous),
        "New link / access": text(data.next),
        "Access expansion?": text(data.expansion),
        "Change owner": text(data.owner),
        "Review / reassessment ref": reassessmentRef,
        "Gate Event ID (if needed)": eventId,
        "State": text(data.state)
      },
      notes: [
        "Map Change ID and Map Edge ID are left blank: the map owner assigns the change ID and matches the exact edge in Relationships; this tool never issues IDs",
        "Use scope: " + (text(data.useScope) || "Unknown") + (text(data.useScope) === "UC-ID specific" && text(data.ucId) ? " (UC-ID " + text(data.ucId) + ")" : "") + ". Map changes has no UC-ID column; the scope is context for the map owner only",
        reassessmentRef ? "Review / reassessment ref is a user-entered pointer; verify the actual reassessment record and outcome" :
          "No reassessment ref: allowed only for Reduce access, Remove link or Change scope with Access expansion No",
        eventId ? "Gate Event ID is a user-entered existing Event ID; verify it against the dated event in AIG-DEC-04" :
          "Gate Event ID blank; if an event is needed add its actual ID only after the AIG-DEC-04 owner logs it; never invent one",
        "A map entry grants no permission: AIG-AGT-04 (authority) and AIG-AGT-05 (delegation paths) remain authoritative"
      ]
    };
  }

  function screeningEntries(screening) {
    const labels = {
      equality: "Equality Act 2010 section 149 screening",
      humanRights: "Human Rights Act 1998 section 6 screening",
      privacy: "Privacy / data protection screening",
      other: "Other case-specific duties"
    };
    return SCREENING_KEYS.map(function (key) {
      return [labels[key], screening && screening[key] ? "Recorded or referred" : "Not confirmed",
        "No applicability or compliance finding is made by this tool"];
    });
  }

  function screeningNote(screening) {
    return "Case-specific duty screening (not a workbook field): " + screeningEntries(screening)
      .map((entry) => entry[0] + " — " + entry[1]).join("; ") + ". No applicability or compliance finding is made by this tool";
  }

  function screenMissing(screening) {
    return SCREENING_KEYS.filter((key) => !screening || !screening[key]);
  }

  function inList(value, list) {
    return list.indexOf(text(value)) >= 0;
  }

  function validateMonitoring(data) {
    if (!text(data.airId) || !data.airIdVerified) {
      return "Enter an existing AIR-ID and confirm it was checked against the current AIG-INV-04. This tool cannot issue or verify identifiers.";
    }
    if (!isAirId(data.airId)) return AIR_ID_MESSAGE;
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
    if (!["UC-ID specific", "Shared system baseline", "Unknown"].includes(text(data.useScope))) {
      return "Select UC-ID specific, Shared system baseline, or Unknown. Blank scope is not shared.";
    }
    if (data.useScope === "UC-ID specific" && !text(data.ucId)) {
      return "Enter the exact UC-ID for a use-specific monitoring measure.";
    }
    if (data.useScope !== "UC-ID specific" && text(data.ucId)) {
      return "Clear the UC-ID unless the monitoring measure is explicitly UC-ID specific.";
    }
    if (/[,;]/.test(text(data.ucId))) {
      return "Enter one UC-ID per monitoring row; record a separate row for each use.";
    }
    if (!text(data.breach) || !text(data.material) || !text(data.escalation) || !text(data.status)) {
      return "Confirm threshold breach, material change, governance escalation and review status.";
    }
    if (!inList(data.breach, LISTS.yesNoUnknown) || !inList(data.material, LISTS.yesNoUnknown) ||
      !inList(data.escalation, LISTS.yesNoUnknown) || !inList(data.reassessment, LISTS.yesNoUnknown)) {
      return "Select Yes, No or Unknown for breach, material change, governance escalation and risk reassessment.";
    }
    if (!inList(data.trend, LISTS.ops02Trend)) return "Select an AIG-OPS-02 Trend value.";
    if (!inList(data.status, LISTS.ops02ReviewStatus)) return "Select an AIG-OPS-02 Review Status value.";
    if (text(data.category) && !inList(data.category, LISTS.ops02MetricCategory)) return "Select an AIG-OPS-02 Metric Category value.";
    if (text(data.severity) && !inList(data.severity, LISTS.riskTier)) return "Select an AIG-OPS-02 Severity value.";
    if (text(data.riskTier) && !inList(data.riskTier, LISTS.riskTier)) return "Select an AIG-OPS-02 Risk tier value.";
    if (text(data.trigger) && !inList(data.trigger, LISTS.ops02Triggers)) return "Select an Appendix E.4 reassessment trigger from the AIG-OPS-02 list.";
    if (text(data.reviewType) && !inList(data.reviewType, LISTS.ops02ReviewType)) return "Select the review type: Operational monitoring, Performance review or Formal review (§6.4.4).";
    if (text(data.agenticRaise) && !inList(data.agenticRaise, LISTS.ops02AgenticRaise)) return "Select an AIG-OPS-02 Agentic cadence raise value.";
    if (text(data.riskTier) && !text(data.reviewType)) return "Select the review type (operational monitoring, performance review or formal review): the AIG-OPS-02 v1.6 cadence check depends on it (§6.4.4).";
    if (!inList(data.selection, LISTS.ops02SelectionBasis)) return "Select an AIG-OPS-02 Selection Basis value.";
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
    if (!inList(data.controlFailure, LISTS.yesNoUnknown) || !inList(data.accessExpansion, LISTS.yesNoUnknown)) {
      return "Select Yes, No or Unknown for control-failure and access-expansion review.";
    }
    if (!inList(data.highImpact, LISTS.yesNoUnknown)) {
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

  // ---- AIG-OPS-02 Monitoring Log derived columns (AH, AJ, AK), mirrored from the v1.6 formulas ----
  function excelDate(value) {
    const t = text(value);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
    if (!m) return t === "" ? "" : NaN;
    const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const d = new Date(ms);
    if (d.getUTCMonth() !== Number(m[2]) - 1) return NaN;
    return ms / 86400000 + 25569;
  }

  function wholeNumber(value) {
    const t = text(value);
    return /^\d+$/.test(t) ? Number(t) : null;
  }

  // AIG-OPS-02 v1.6 AJ: minimum cadence by tier and review type (§6.4.4).
  function ops02Cadence(tier, reviewType) {
    const t = text(tier);
    const r = text(reviewType);
    if (!t) return "";
    if (r === "Operational monitoring") {
      return t === "Low" ? "Routine operational monitoring by the Service Owner" : t === "Medium" ? "Monthly" : "Continuous (logged at least monthly)";
    }
    if (r === "Performance review") {
      return t === "Critical" ? "At least monthly" : t === "High" ? "Monthly" : t === "Medium" ? "Quarterly" : "Annual";
    }
    if (t === "Critical") return "Continuous monitoring; formal review at least monthly";
    if (t === "High") return "Quarterly";
    return "Annual";
  }

  // AIG-OPS-02 v1.6 AH: the longest allowed gap (days) to the next review.
  function ops02MaxGap(tier, reviewType) {
    const t = text(tier);
    const r = text(reviewType);
    if (t === "Critical") return 31;
    if (t === "High") return r === "Operational monitoring" || r === "Performance review" ? 31 : 92;
    if (t === "Medium") return r === "Operational monitoring" ? 31 : r === "Performance review" ? 92 : 366;
    return 366;
  }

  function ops02MinimumSample(tier, population) {
    const t = text(tier);
    const pop = wholeNumber(population);
    if (!t || pop === null) return "";
    if (t === "Critical" || t === "High") return Math.min(pop, Math.max(30, Math.ceil(0.05 * pop)));
    if (t === "Medium") return Math.min(pop, 20);
    return Math.min(pop, 10);
  }

  // Row object keyed by the exact Monitoring Log headers.
  function ops02ClosureCheck(row) {
    const v = (name) => text(row[name]);
    const H = TARGETS.ops02Monitoring.headers;
    const counted = H.filter((name) => TARGETS.ops02Monitoring.formulaColumns.indexOf(name) < 0);
    if (counted.every((name) => v(name) === "")) return "";
    if (v("AIR-ID") === "") return "AIR-ID REQUIRED";
    const bad = (name, list) => v(name) !== "" && list.map((x) => x.toLowerCase()).indexOf(v(name).toLowerCase()) < 0;
    if (bad("Threshold Breach?", LISTS.yesNoUnknown) || bad("Material Change?", LISTS.yesNoUnknown) ||
      bad("Risk Reassessment Required?", LISTS.yesNoUnknown) || bad("Governance Escalation?", LISTS.yesNoUnknown) ||
      bad("Trend", LISTS.ops02Trend) || bad("Review Status", LISTS.ops02ReviewStatus) ||
      bad("Measure scope (UC-ID specific / Shared system baseline)", LISTS.scope) ||
      bad("Risk tier (UC-ID, AIG-ASS-02)", LISTS.riskTier) || bad("Reassessment trigger (Appendix E.4)", LISTS.ops02Triggers) ||
      bad("Review type (§6.4.4: operational / performance / formal)", LISTS.ops02ReviewType) ||
      bad("Agentic cadence raise applied? (action-capable uses)", LISTS.ops02AgenticRaise)) {
      return "INVALID VALUE — use the dropdown list";
    }
    const uc = v("UC-ID (blank only for an explicitly shared system measure)");
    if (v("Measure scope (UC-ID specific / Shared system baseline)") === "UC-ID specific" && (uc === "" || uc === "None")) return "UC-ID REQUIRED";
    const J = v("Trend"), K = v("Threshold Breach?"), Q = v("Material Change?"), R = v("Risk Reassessment Required?"),
      T = v("Governance Escalation?"), AL = v("Reassessment trigger (Appendix E.4)");
    if ([J, K, Q, R, T, AL].some((x) => x === "") || J === "Not yet known" || [K, Q, R, T].some((x) => x === "Unknown")) return "UNKNOWN TO RESOLVE";
    if (K === "Yes" && (["Approved Threshold / Tolerance", "Actual Result", "Action / Decision", "Action Owner", "Due Date",
      "Incident / CAPA Ref", "Evidence Location"].some((name) => v(name) === "") || v("Incident / CAPA Ref") === "None")) return "BREACH ACTION INCOMPLETE";
    if ((K === "Yes" || Q === "Yes") && AL === "None") return "TRIGGER NOT RECORDED — select the E.4 trigger";
    if (((AL !== "" && AL !== "None") || R === "Yes") && v("Reassessment / consideration ref (AIG-ASS-02)") === "") return "REASSESSMENT / CONSIDERATION REF REQUIRED";
    if ((R === "Yes" || T === "Yes") && v("AIG-DEC-04 Event ID (Gate Log ref)") === "") return "GATE LOG EVENT ID REQUIRED";
    const D = excelDate(row["Review Date"]), Y = excelDate(row["Next Review Date"]);
    const isNum = (x) => typeof x === "number" && !isNaN(x);
    if ((D !== "" && !isNum(D)) || (Y !== "" && !isNum(Y)) || (isNum(D) && isNum(Y) && Y <= D)) {
      return "DATE CHECK — Review and Next Review must be dates, Next after Review";
    }
    const AC = wholeNumber(row["Population Size"]), AD = wholeNumber(row["Sample Size Reviewed"]);
    const tier = v("Risk tier (UC-ID, AIG-ASS-02)");
    const AK = ops02MinimumSample(tier, row["Population Size"]);
    if (AC !== null && AD !== null && AD > AC) return "SAMPLE EXCEEDS POPULATION";
    if (AD !== null && typeof AK === "number" && AD < AK) return "SAMPLE BELOW TIER MINIMUM";
    const AO = v("Review type (§6.4.4: operational / performance / formal)");
    if (tier !== "" && isNum(Y) && AO === "") return "REVIEW TYPE REQUIRED: operational, performance or formal (§6.4.4)";
    if (isNum(D) && isNum(Y) && tier !== "" && Y - D > ops02MaxGap(tier, AO)) return "NEXT REVIEW EXCEEDS TIER CADENCE";
    // v3.9.2 follow-up (NEW-02): AP is required on every row; the log identifies an action-capable use only from AP, so blank = raise not yet set.
    const AP = v("Agentic cadence raise applied? (action-capable uses)");
    if (AP === "" || AP === "Action-capable: raise not yet set") return "AGENTIC CADENCE RAISE NOT SET (§6.4.4; size to be set by the Council)";
    const Z = v("Review Status");
    if (Z === "Closed" && (["Review Date", "Monitoring Owner", "Metric / Indicator", "Approved Threshold / Tolerance", "Actual Result",
      "Evidence Location", "Next Review Date", "Sample Source / Population of Record", "Selection Basis", "Sampling Window",
      "Measure scope (UC-ID specific / Shared system baseline)", "Risk tier (UC-ID, AIG-ASS-02)"].some((name) => v(name) === "") ||
      AC === null || AD === null || AC < 1 || AD < 1)) return "CLOSURE EVIDENCE MISSING";
    return Z === "Closed" ? "Closure ready for independent review" : "Open / review";
  }

  function validateIncident(data) {
    const required = [
      "system", "reporter", "role", "email", "identifiedAt", "classification",
      "happened", "when", "discovery", "aiActivity", "affected", "impact",
      "dataImpact", "decisionImpact", "useScope", "ongoing", "suspectedBreach", "securityConcern", "externalNotification"
    ];
    if (required.some((key) => !text(data[key]))) {
      return "Complete AIG-OPS-03 Part A reporter/contact, system, explicit use scope (or Unknown), identified time, classification, ongoing, what/when/how discovered, AI activity, affected people/data/decisions, impact, suspected personal data breach, security or safeguarding concern and external notification fields. State Unknown or not applicable in free text where appropriate.";
    }
    if (text(data.airId) && !isAirId(data.airId)) return AIR_ID_MESSAGE;
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
    if (!inList(data.classification, LISTS.ops03Classification)) return "Select an AIG-OPS-03 Event classification: Incident, Near miss or Concern.";
    if (!inList(data.ongoing, LISTS.ops03Ongoing)) return "Answer AIG-OPS-03 “Is the incident ongoing?” with Yes or No.";
    if (!inList(data.suspectedBreach, LISTS.ops03SuspectedBreach)) return "Answer “Suspected personal data breach?” with Yes, No or Uncertain.";
    if (!inList(data.securityConcern, LISTS.ops03Security)) return "Answer “Security or safeguarding concern?” with Yes or No.";
    if (!inList(data.externalNotification, LISTS.ops03External)) return "Answer “External notification may be required?” with Yes, No or Unsure.";
    if (data.breachIndicator && data.suspectedBreach === "No") {
      return "The suspected personal data breach indicator is selected: answer “Suspected personal data breach?” Yes or Uncertain and refer to the DPO now.";
    }
    if (text(data.dpoReferredAt) && data.suspectedBreach === "No") {
      return "Clear the DPO referral time unless a personal data breach is suspected (Yes or Uncertain).";
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
    if (partB[4] && !inList(partB[4], LISTS.ops03IcoDecision)) return "Select the ICO notifiability decision: Notifiable, Not notifiable or Further assessment.";
    // v3.9.2 (W-06): AIG-OPS-03 v1.6 Part A "Precautionary pause applied? Gate Log event ID".
    const pauseKeys = ["pauseBy", "pauseAt", "pauseIncidentRef", "pauseFollowUpDue", "pauseEventId"];
    if (text(data.pauseApplied) && !inList(data.pauseApplied, LISTS.yesNo)) return "Answer “Precautionary pause applied?” with Yes or No.";
    if (data.pauseApplied === "Yes" && (!text(data.pauseBy) || !text(data.pauseAt))) {
      return "Precautionary pause applied: record who applied it and the date and time (AIG-OPS-03 Part A).";
    }
    if (data.pauseApplied === "Yes" && text(data.pauseEventId) && !data.pauseEventIdVerified) {
      return "Only enter an existing AIG-DEC-04 Gate events ID checked against the Gate Log; do not invent one.";
    }
    if (data.pauseApplied !== "Yes" && pauseKeys.some((key) => text(data[key]))) {
      return "Clear the precautionary pause details unless a pause was applied.";
    }
    return "";
  }

  // AIG-DEC-04 Gate events controlled values (v1.0 draft).
  const EVENT_TYPES = LISTS.dec04EventTypes;
  const EVENT_OUTCOMES = LISTS.dec04Outcomes;

  function validateChange(data) {
    const changeTriggers = Array.isArray(data.changeTriggers) ? data.changeTriggers : [];
    if (!text(data.airId) || !data.airIdVerified || !text(data.system)) {
      return "Enter a system name and an existing AIR-ID confirmed against current AIG-INV-04; this tool cannot issue or verify identifiers.";
    }
    if (!isAirId(data.airId)) return AIR_ID_MESSAGE;
    if (!["UC-ID specific", "Shared system baseline", "Unknown"].includes(text(data.useScope))) {
      return "Select UC-ID-specific, Shared system baseline, or Unknown for the change scope; blank is not shared.";
    }
    if (data.useScope === "UC-ID specific" && !text(data.ucId)) {
      return "Enter the exact UC-ID for a UC-ID-specific change assessment.";
    }
    if (data.useScope !== "UC-ID specific" && text(data.ucId)) {
      return "Clear the UC-ID unless the change assessment is explicitly UC-ID specific.";
    }
    // v3.9.2 (T-05): a ticked change trigger means a documented reassessment, so every
    // §4.4.6 trigger must be answered for the AIG-ASS-02 import (C42 needs all seven).
    if (changeTriggers.length) {
      const step4 = step4Answers(changeTriggers, data.triggerAnswers);
      const missing = STEP4_TRIGGERS.filter((t) => step4.values[t[0]] === "").map((t) => t[2]);
      if (missing.length) {
        return "A change trigger is ticked, so answer every §4.4.6 mandatory escalation trigger for the changed use (AIG-ASS-02 Step 4): " + missing.join("; ") + ".";
      }
    }
    const mapFields = ["mapChangeDate", "mapChangeType", "mapPrevious", "mapNext",
      "mapExpansion", "mapOwner", "mapReassessment", "mapEventId", "mapState"].map((key) => text(data[key]));
    const mapStarted = mapFields.some(Boolean);
    if (mapStarted && (!mapFields[0] || !mapFields[1] || !mapFields[4] || !mapFields[5] ||
      (!mapFields[2] && !mapFields[3]))) {
      return "For a Capabilities and System Map change handoff, complete the change date, type, access-expansion status, change owner and at least one previous/new link or access value; otherwise leave all map-change fields blank.";
    }
    if (mapStarted && !inList(mapFields[1], LISTS.inv05ChangeType)) {
      return "Select an AIG-INV-05 Change type: Add link, Expand access, Reduce access, Change scope or Remove link.";
    }
    if (mapStarted && !inList(mapFields[4], LISTS.inv05Expansion)) return "Select Yes, No or Unsure for Access expansion?.";
    if (mapStarted && mapFields[8] && !inList(mapFields[8], LISTS.inv05State)) return "Select an AIG-INV-05 State: Open, In review or Closed.";
    if (mapStarted && (["Yes", "Unsure"].includes(mapFields[4]) || ["Expand access", "Add link"].includes(mapFields[1])) && !mapFields[6]) {
      return "A new or possibly expanded access edge needs a real reassessment reference before preparing the map-change handoff (‘Expand access’ and ‘Add link’ always count as access expansion).";
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
    if (planStarted && !inList(data.planGate, LISTS.dec04Gates)) return "Select the Gate Plan Gate / forum from the AIG-DEC-04 list.";
    if (planStarted && !inList(data.planState, LISTS.dec04PlanState)) return "Select the Plan state: Planned, Complete, Superseded or Cancelled.";
    if (planStarted && text(data.planRequirement) === "Required" && !text(data.planBasis)) {
      return "A Required Gate Plan needs a basis reference.";
    }
    if (planStarted && text(data.planRequirement) === "Not applicable" && !text(data.planWaiver)) {
      return "A Not applicable Gate Plan needs its rationale and authority reference.";
    }
    if (planStarted && !inList(data.planRequirement, LISTS.dec04Requirement)) {
      return "Select the actual Gate Plan requirement status; do not infer it.";
    }
    if (text(data.planId) && !data.planIdVerified) {
      return "Only enter an existing Plan ID checked against current AIG-DEC-04.";
    }
    const conditionKeys = ["condition", "conditionOwner", "conditionDue", "conditionState",
      "conditionResolved", "conditionEvidence", "conditionVerified", "conditionMonitoring", "conditionOps02Ref"];
    const conditionDraftStarted = conditionKeys.some((key) => text(data[key]));
    const eventStarted = [
      "eventType", "decision", "escalatedTo", "eventDate", "eventTime", "eventForum", "eventLifecycle", "eventMaker", "eventRecord",
      "eventAuthority", "assuranceOpinion", "nextGate", "eventNotes", "technicalSnapshot",
      "recordedBy", "eventSource", "evidenceIds", "planEventId", "priorityBefore", "priorityAfter", "priorityRef",
      "eventUseScope", "eventUcId", "permittedPurpose", "permittedUsers",
      "permittedData", "permittedActions", "exclusions", "permittedConditions"
    ].some((key) => text(data[key])) || (text(data.eventId) && !conditionDraftStarted);
    const type = text(data.eventType);
    const outcome = text(data.decision);
    const pause = type === PAUSE_EVENT;
    if (eventStarted && !EVENT_TYPES.includes(type)) {
      return "Select the AIG-DEC-04 Event type: Decision, Assurance opinion, Review only, Priority override, Intake / registration or Precautionary pause (containment).";
    }
    // v3.9.2 (W-06): AIG-DEC-04 v1.1 row check for a precautionary pause (containment).
    if (eventStarted && pause && outcome !== PAUSE_OUTCOME) {
      return "Precautionary pause: Outcome must be Paused — pending decision.";
    }
    if (eventStarted && !pause && outcome === PAUSE_OUTCOME) {
      return "Paused — pending decision is only for a Precautionary pause (containment) event.";
    }
    if (eventStarted && pause && !text(data.pauseIncidentRef)) {
      return "Precautionary pause: enter the AIG-OPS-03 incident reference.";
    }
    if (eventStarted && pause && !/^\d{4}-\d{2}-\d{2}$/.test(text(data.pauseFollowUpDue))) {
      return "Precautionary pause: enter the follow-up decision due date.";
    }
    if (eventStarted && !pause && (text(data.pauseIncidentRef) || text(data.pauseFollowUpDue))) {
      return "Clear the incident reference and follow-up decision due date unless the Event type is Precautionary pause (containment).";
    }
    if (eventStarted && outcome && !EVENT_OUTCOMES.includes(outcome)) {
      return "Select an AIG-DEC-04 Outcome: " + EVENT_OUTCOMES.join(", ") + ".";
    }
    if (eventStarted && type === "Priority override" && outcome && outcome !== "No decision") {
      return "A Priority override changes governance attention, not progress: leave Outcome blank or choose No decision.";
    }
    if (eventStarted && type !== "Decision" && DECISION_OUTCOMES.includes(outcome)) {
      return "Progress, Progress with condition, Return for evidence, Pause, Stop, Suspend, Decommission and Re-authorise are decisions: set Event type to Decision, or choose another Outcome.";
    }
    if (eventStarted && type === "Decision" && !DECISION_OUTCOMES.includes(outcome)) {
      return "A Decision event needs a decision Outcome (Progress, Progress with condition, Return for evidence, Pause, Stop, Suspend, Decommission or Re-authorise).";
    }
    if (eventStarted && outcome && DEC04_OUTCOME_MAP[outcome].eventTypes.indexOf(type) < 0) {
      return "AIG-DEC-04 Lists: Outcome “" + outcome + "” is allowed only with Event type " + DEC04_OUTCOME_MAP[outcome].eventTypes.join(" / ") + ".";
    }
    if (eventStarted && data.escalated === "Yes" && !text(data.escalatedTo)) {
      return "Name the forum the case was escalated to; it is recorded in Next gate / action.";
    }
    if (eventStarted && data.escalated !== "Yes" && text(data.escalatedTo)) {
      return "Clear the escalation forum unless the case was escalated.";
    }
    // A precautionary pause is containment, not a decision: no AIG-DEC-03 reference or
    // delegation reference is needed (Playbook §4.7.17), only who applied it and when.
    if (eventStarted && pause && (!text(data.eventDate) || !text(data.eventForum) ||
      !text(data.eventLifecycle) || !text(data.eventMaker) || !text(data.eventSource) || !data.eventConfirmed)) {
      return "A Precautionary pause event needs the actual date, gate / forum, event-time lifecycle stage, who applied the pause (Decision-maker / role), source and confirmation; no AIG-DEC-03 decision reference is needed.";
    }
    if (eventStarted && !pause && (!text(data.eventDate) || !text(data.eventForum) ||
      !text(data.eventLifecycle) || !text(data.eventMaker) || !text(data.eventRecord) ||
      !text(data.eventAuthority) || !text(data.eventSource) || !data.eventConfirmed)) {
      return "A Gate Event transfer checklist requires an actual date, gate / forum, event-time lifecycle stage, decision-maker, decision-record/minutes reference, source (minutes / decision record / system), checked authority reference and confirmation.";
    }
    if (eventStarted && !inList(data.eventForum, LISTS.dec04Gates)) return "Select the Gate Event Gate / forum from the AIG-DEC-04 list.";
    if (eventStarted && !inList(data.eventLifecycle, LISTS.dec04Lifecycle)) return "Select the Event-time lifecycle stage from the AIG-DEC-04 list.";
    if (eventStarted && text(data.eventTime) && !/^([01]\d|2[0-3]):[0-5]\d$/.test(text(data.eventTime))) return "Enter the event time as hh:mm.";
    if (eventStarted && text(data.today) && text(data.eventDate) > text(data.today)) {
      return "The Gate Event date cannot be in the future; a Gate Event records something that already happened.";
    }
    if (eventStarted && !["UC-ID specific", "Shared system baseline", "Unknown"].includes(text(data.eventUseScope))) {
      return "Select the Gate Event decision scope as UC-ID specific, Shared system baseline, or Unknown; scope cannot be inferred.";
    }
    if (eventStarted && /[,;]/.test(text(data.eventUcId))) {
      return "One UC-ID per Gate Event row: split a multi-use decision into suffixed Event IDs (for example EVT-0012-a, EVT-0012-b).";
    }
    if (eventStarted && pause && data.eventUseScope === "UC-ID specific" && !text(data.eventUcId)) {
      return "Enter the exact UC-ID of the paused use.";
    }
    if (eventStarted && !pause && data.eventUseScope === "UC-ID specific" &&
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
    if ((priority[0] && !inList(priority[0], LISTS.agpiPriority)) || (priority[1] && !inList(priority[1], LISTS.agpiPriority))) {
      return "Select AGPI priorities from the controlled list (Priority 1 – Critical to Priority 5 – Observe).";
    }
    if (priority.some(Boolean) && type !== "Priority override") {
      return "Only complete priority override fields for a Gate Event with Event type Priority override.";
    }
    if (type === "Priority override" && !priority.every(Boolean)) {
      return "A Priority override event requires before/after priority values and the actual assurance priority update reference, for the AIG-DEC-03 record.";
    }
    const condition = conditionKeys.map((key) => text(data[key]));
    const conditionStarted = condition.some(Boolean);
    if (conditionStarted && (!condition[0] || !condition[1] || !condition[2] || !condition[3] ||
      !text(data.eventId) || !data.eventIdVerified)) {
      return "A Gate Condition requires its action, owner, due date, state and an existing Event ID checked against current AIG-DEC-04.";
    }
    if (conditionStarted && !inList(condition[3], LISTS.dec04ConditionStates)) {
      return "Select a Gate Condition state: Open, Closed-verified, Accepted-open, Waived or Unknown (Overdue is derived, never typed; Superseded is closed as Waived).";
    }
    if (conditionStarted && condition[7] && !inList(condition[7], LISTS.yesNo)) return "Select Yes or No for Monitoring condition?.";
    if (conditionStarted && !["UC-ID specific", "Shared system baseline", "Unknown"].includes(text(data.conditionUseScope))) {
      return "Select the Gate Condition scope as UC-ID specific, Shared system baseline, or Unknown.";
    }
    if (conditionStarted && data.conditionUseScope === "UC-ID specific" &&
      (!text(data.conditionUcId) || !text(data.useDecisionRef))) {
      return "Enter the exact UC-ID and per-UC decision reference covered by a UC-ID-specific Gate Condition.";
    }
    if (conditionStarted && data.conditionUseScope !== "UC-ID specific" && text(data.conditionUcId)) {
      return "Clear the Gate Condition UC-ID unless its scope is explicitly UC-ID specific.";
    }
    if (conditionStarted && eventStarted && (
      text(data.conditionUseScope) !== text(data.eventUseScope) ||
      (data.conditionUseScope === "UC-ID specific" && text(data.conditionUcId) !== text(data.eventUcId))
    )) {
      return "A Gate Condition prepared with a Gate Event must match the event's exact use scope and UC-ID.";
    }
    if (conditionStarted && eventStarted && (type !== "Decision" || !["Progress with condition", "Re-authorise"].includes(outcome))) {
      return "A Gate Condition's parent event must be a Decision with Outcome Progress with condition or Re-authorise.";
    }
    if (conditionStarted && eventStarted && text(data.eventDate) &&
      ((condition[2] && condition[2] < text(data.eventDate)) || (condition[4] && condition[4] < text(data.eventDate)))) {
      return "Gate Condition due and closed / waived dates cannot be before the parent event date.";
    }
    if (outcome === "Progress with condition" && !conditionStarted) {
      return "Progress with condition requires a Gate Condition handover linked to the existing Event ID.";
    }
    if (["Closed-verified", "Accepted-open", "Waived"].includes(condition[3]) && (!condition[4] || !condition[5])) {
      return "A Closed-verified, Accepted-open or Waived condition needs its closed / waived date and evidence or waiver authority reference.";
    }
    if (condition[3] === "Closed-verified" && !condition[6]) {
      return "A Closed-verified condition needs Verified by / date.";
    }
    if (condition[3] === "Closed-verified" && condition[7] === "Yes" && !condition[8]) {
      return "A closed monitoring condition needs its AIG-OPS-02 evidence ref.";
    }
    return "";
  }

  // AIG-DEC-03 outcome for the UC-ID schedule, from the AIG-DEC-04 Lists mapping.
  function dec03Outcome(outcome, hasCondition) {
    const map = DEC04_OUTCOME_MAP[text(outcome)];
    if (!map) return { value: "", note: "No gate Outcome recorded: no AIG-DEC-03 outcome (None (Pending))" };
    if (text(outcome) === "Re-authorise") {
      return { value: hasCondition ? "Approved with conditions" : "Approved", note: "Re-authorise maps to Approved or Approved with conditions (after reassessment)" };
    }
    return { value: map.dec03, note: map.note ? "AIG-DEC-03 outcome: " + map.note + " — the decision-maker records the actual outcome" : "" };
  }

  // AIG-OPS-02 v1.5 accepts Unknown (Not yet known for Trend) in these columns. An
  // unknown is never recorded as No; the log shows UNKNOWN TO RESOLVE and blocks closure.
  const MONITORING_UNKNOWN_FIELDS = [
    ["trend", "Trend", "Not yet known"],
    ["breach", "Threshold Breach?", "Unknown"],
    ["material", "Material Change?", "Unknown"],
    ["reassessment", "Risk Reassessment Required?", "Unknown"],
    ["escalation", "Governance Escalation?", "Unknown"]
  ];

  function monitoringUnknowns(data) {
    return MONITORING_UNKNOWN_FIELDS
      .filter(function (field) { return text(data[field[0]]) === field[2]; })
      .map(function (field) { return field[1]; });
  }

  function fileKey(value) {
    return text(value).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 48) || "unassigned";
  }

  function escapeHtml(value) {
    return text(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  // ---- Start from a triage record (enter once, reuse) -------------------------
  // Reads the canonical record downloaded from the Multi-Board Triage tool and
  // proposes values for the identity fields this tool asks for more than once.
  // Deliberately NOT filled: the "checked against AIG-INV-04" confirmations (a
  // person must check the Register) and confirmed risk tiers (triage gives a
  // provisional tier; this tool asks for the tier confirmed in AIG-ASS-02).
  const RECORD_MAX_BYTES = 2 * 1024 * 1024;
  const RECORD_FIELD_TARGETS = {
    systemName: ["i-system", "c-system", "m-system"],
    registerId: ["i-air", "c-air", "m-air"],
    ucId: ["i-uc-id", "c-uc-id", "m-uc-id", "p-uc-id", "e-uc-id"],
    useScope: ["i-use-scope", "c-use-scope", "m-use-scope", "p-use-scope", "e-use-scope"]
  };

  function cleanRecordValue(value, max) {
    if (typeof value !== "string" && typeof value !== "number") return "";
    return text(String(value).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ")).slice(0, max);
  }

  function parseTriageRecord(raw, byteLength) {
    if (byteLength > RECORD_MAX_BYTES) return { ok: false, error: "This file is too large to be a triage record." };
    let data;
    try {
      data = JSON.parse(String(raw).replace(/^﻿/, ""));
    } catch (error) {
      return { ok: false, error: "This file is not a triage record (it could not be read as a record file)." };
    }
    if (!data || typeof data !== "object" || Array.isArray(data) || !data.profile || typeof data.profile !== "object" ||
        typeof data.schemaVersion !== "string" || !data.triageScope || typeof data.triageScope !== "object") {
      return { ok: false, error: "This file is not a canonical triage record. Use “Download canonical record” in the Multi-Board Triage tool." };
    }
    const profile = data.profile;
    const warnings = [];
    const systemName = cleanRecordValue(profile.systemName, 200);
    const ucId = cleanRecordValue(profile.ucId || data.triageScope.ucId, 80);
    let registerId = cleanRecordValue(profile.registerId, 40);
    if (registerId && !isAirId(registerId)) {
      warnings.push("The record’s AIR-ID “" + registerId + "” is not in the AIG-INV-04 format, so it was not filled. " + AIR_ID_MESSAGE);
      registerId = "";
    }
    if (!registerId) warnings.push("No AIR-ID was filled. Enter the Council-issued AIR-ID from the AIG-INV-04 Register.");
    if (!ucId) warnings.push("The record has no UC-ID, so use scope was left blank. Unknown scope is not shared scope: choose it yourself.");
    const risk = data.risk && typeof data.risk === "object" ? data.risk : {};
    const agpi = data.agpi && typeof data.agpi === "object" ? data.agpi : {};
    return {
      ok: true,
      values: { systemName, registerId, ucId, useScope: ucId ? "UC-ID specific" : "" },
      info: {
        exportedAt: cleanRecordValue(data.exportedAt, 40),
        suiteVersion: cleanRecordValue(data.suiteVersion, 200),
        provisionalTier: cleanRecordValue(risk.effectiveGovernanceTier, 20),
        priority: cleanRecordValue(agpi.effectiveGovernancePriority, 60)
      },
      warnings
    };
  }

  // current: { fieldId: existing value }. Never overwrites a value already entered.
  function planRecordFill(values, current) {
    const fills = [];
    const kept = [];
    Object.keys(RECORD_FIELD_TARGETS).forEach(function (key) {
      const proposed = text(values[key]);
      if (!proposed) return;
      RECORD_FIELD_TARGETS[key].forEach(function (id) {
        if (!(id in current)) return;
        const existing = text(current[id]);
        if (!existing) fills.push({ id: id, value: proposed });
        else if (existing !== proposed) kept.push({ id: id, existing: existing, proposed: proposed });
      });
    });
    return { fills, kept };
  }

  const api = {
    ARTEFACT_VERSIONS,
    RECORD_FIELD_TARGETS,
    parseTriageRecord,
    planRecordFill,
    DEC04_OUTCOME_MAP,
    EVENT_OUTCOMES,
    EVENT_TYPES,
    GUIDANCE_HEADERS,
    LISTS,
    MONITORING_UNKNOWN_FIELDS,
    ROUTES,
    SEVERITY_ORDER,
    SEVERITY_WHEN,
    MANDATORY_INCIDENT_TRIGGERS,
    CHANGE_TRIGGERS,
    STEP4_TRIGGERS,
    PAUSE_EVENT,
    PAUSE_OUTCOME,
    step4Answers,
    ops02MaxGap,
    SUITE,
    TARGETS,
    TRIAGE_IMPORT_ROWS,
    buildRow,
    calculateRisk,
    columnLetter,
    dec03Outcome,
    escapeHtml,
    exactCsv,
    fileKey,
    formatDateTime,
    isAirId,
    mapChangeRow,
    monitoringUnknowns,
    ops02Cadence,
    ops02ClosureCheck,
    ops02MinimumSample,
    parseCsv,
    scopeNote,
    scopeValue,
    screenMissing,
    screeningEntries,
    screeningNote,
    severity,
    text,
    tierFromScore,
    triageImportRows,
    validateChange,
    validateIncident,
    validateMonitoring
  };
  root.GovernanceLogic = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
