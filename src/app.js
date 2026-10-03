(function () {
  "use strict";
  const G = window.GovernanceLogic;
  const byId = (id) => document.getElementById(id);
  const value = (id) => G.text(byId(id).value);
  const isChecked = (id) => byId(id).checked;
  const safe = G.escapeHtml;

  function getScreening(form) {
    const result = {};
    form.querySelectorAll("[data-screen]").forEach((input) => {
      result[input.dataset.screen] = input.checked;
    });
    return result;
  }

  function setError(id, message) {
    byId(id).textContent = message;
  }

  function clearOutput(id, errorId) {
    byId(id).replaceChildren();
    setError(errorId, "");
  }

  function download(filename, contents) {
    const blob = new Blob(["\uFEFF", contents], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function resultCard(targetId, title, body, downloads, actions) {
    const target = byId(targetId);
    target.replaceChildren();
    const article = document.createElement("article");
    article.className = "result";
    article.innerHTML = "<h2>" + safe(title) + "</h2>" + body;
    const downloadList = document.createElement("div");
    downloadList.className = "download-list";
    downloads.forEach((item) => {
      const button = document.createElement("button");
      button.className = "button secondary";
      button.type = "button";
      button.textContent = "Download " + item.label;
      button.addEventListener("click", () => download(item.filename, item.contents));
      downloadList.appendChild(button);
    });
    if (downloads.length) article.appendChild(downloadList);
    (actions || []).forEach((action) => {
      const button = document.createElement("button");
      button.className = "button primary";
      button.type = "button";
      button.textContent = action.label;
      button.addEventListener("click", action.run);
      article.appendChild(button);
    });
    target.appendChild(article);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function screeningError(screening) {
    const missing = G.screenMissing(screening);
    if (!missing.length) return "";
    const labels = {
      equality: "Equality Act s149",
      humanRights: "HRA s6",
      privacy: "privacy / data protection",
      other: "other case-specific duties"
    };
    return "Before preparing this handover, record or refer each screening prompt for every tier: " +
      missing.map((key) => labels[key]).join(", ") + ". This is not a legal applicability determination.";
  }

  function csvDownload(targetKey, label, filenameStem, rows, airId) {
    return {
      label: label,
      filename: filenameStem + "_" + G.fileKey(airId) + ".csv",
      contents: G.exactCsv(G.TARGETS[targetKey], rows)
    };
  }

  function todayIso() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
  }

  function incidentSubmit(event) {
    event.preventDefault();
    clearOutput("i-results", "i-error");
    if (!value("i-system") && !value("i-description")) {
      setError("i-error", "Enter a system name or a concise incident description.");
      return;
    }
    if (value("i-air") && !isChecked("i-air-verified")) {
      setError("i-error", "If you enter an AIR-ID, confirm it is an existing Council-issued identifier checked against the current AIG-INV-04 Register.");
      return;
    }
    const selectedIndicators = Array.from(byId("incident-form").querySelectorAll("[data-severity]:checked"));
    const breachIndicator = selectedIndicators.some((input) =>
      input.parentElement.textContent.toLowerCase().includes("data breach"));
    const partBKeys = ["i-controller-awareness", "i-rights-risk", "i-rights-assessor", "i-rights-date",
      "i-ico-decision", "i-ico-rationale", "i-ico-owner", "i-dpo-ref"];
    const incidentValidation = G.validateIncident({
      system: value("i-system"), reporter: value("i-reporter"), role: value("i-role"),
      airId: value("i-air"),
      useScope: value("i-use-scope"), ucId: value("i-uc-id"),
      email: value("i-email"), identifiedAt: value("i-date"), classification: value("i-kind"),
      ongoing: value("i-ongoing"),
      happened: value("i-description"), when: value("i-when"), discovery: value("i-discovery"),
      aiActivity: value("i-ai-activity"), affected: value("i-affected-details"), impact: value("i-impact"),
      dataImpact: value("i-data-impact"), decisionImpact: value("i-decision-impact"),
      suspectedBreach: value("i-breach"), breachIndicator: breachIndicator, dpoReferredAt: value("i-dpo-referred"),
      securityConcern: value("i-security"), externalNotification: value("i-external"),
      uplift: value("i-uplift"), upliftReason: value("i-uplift-reason"),
      controllerAwareness: value("i-controller-awareness"), rightsRisk: value("i-rights-risk"),
      rightsAssessor: value("i-rights-assessor"), rightsAssessmentDate: value("i-rights-date"),
      icoDecision: value("i-ico-decision"), decisionRationale: value("i-ico-rationale"),
      decisionOwner: value("i-ico-owner"), dpoAdviceRef: value("i-dpo-ref"),
      pauseApplied: value("i-pause"), pauseBy: value("i-pause-by"), pauseAt: value("i-pause-at"),
      pauseIncidentRef: value("i-incident-ref"), pauseFollowUpDue: value("i-pause-followup"),
      pauseEventId: value("i-pause-event"), pauseEventIdVerified: isChecked("i-pause-event-verified")
    });
    if (incidentValidation) {
      setError("i-error", incidentValidation);
      return;
    }
    const screening = getScreening(byId("incident-form"));
    const dutyError = screeningError(screening);
    if (dutyError) {
      setError("i-error", dutyError);
      return;
    }

    const indicatorLevels = selectedIndicators.map((input) => input.dataset.severity);
    const assessment = G.severity(indicatorLevels, isChecked("i-aggregate"), value("i-uplift"));
    const route = G.ROUTES[assessment.level] || {
      recipient: "Service Owner (pending provisional severity)",
      target: "Severity is unclassified: the Service Owner assesses provisional severity (where uncertain, apply the higher level until more is known) and sends Part A to the AI Governance Lead the same working day."
    };
    const dataBreach = ["Yes", "Uncertain"].includes(value("i-breach"));
    const mandatory = selectedIndicators.filter((input) => input.hasAttribute("data-mandatory"))
      .map((input) => input.parentElement.textContent.trim());
    const paused = value("i-pause") === "Yes";
    const indicators = selectedIndicators.map((input) => input.parentElement.textContent.trim());
    const ticked = new Set(Array.from(byId("incident-form").querySelectorAll("[data-affected]:checked"))
      .map((input) => input.parentElement.textContent.trim()));
    const html = [
      '<div class="positive"><strong>Provisional severity: ' + safe(assessment.level) + '</strong> · ' +
        safe(route.recipient) + '</div>',
      "<p>" + safe(route.target) + ". Report to your Service Owner without delay using Part A; the Service Owner sends Part A to the AI Governance Lead the same working day (immediately for a suspected High or Critical incident or any statutory route).</p>",
      indicators.length ? "<p><strong>Selected indicators:</strong> " + safe(indicators.join("; ")) + "</p>" :
        "<p>No severity indicator selected; the Provisional severity column is left blank for the Service Owner.</p>",
      assessment.aggregated ? "<p>Aggregation raised the provisional floor by one level.</p>" : "",
      mandatory.length ? '<div class="caution"><strong>Mandatory trigger (Playbook §4.7.17):</strong> ' + safe(mandatory.join("; ")) +
        ". Escalate to the AI Governance Lead immediately (the same working day), whatever the provisional severity, consider a precautionary pause, and classify the incident at least High.</div>" : "",
      paused ? '<div class="caution"><strong>Precautionary pause applied</strong> by ' + safe(value("i-pause-by")) +
        ". Log it in AIG-DEC-04 as Event type “Precautionary pause (containment)” with Outcome “Paused — pending decision” (a Gate events row is prepared below). Continued suspension, resumption or withdrawal is decided by the officer or forum with confirmed delegation (Playbook §4.7.17).</div>" : "",
      assessment.uplifted ? "<p>Manual uplift: " + safe(value("i-uplift")) + " — " +
        safe(value("i-uplift-reason") || "reason not entered") + ".</p>" : "",
      dataBreach ? '<div class="caution"><strong>Suspected personal data breach:</strong> refer to the DPO / Information Governance route now, before AI triage. Where notifiable, the ICO must be told without undue delay and, where feasible, not later than 72 hours after the Council becomes aware (UK GDPR Art 33). Only the responsible owner determines any notification duty; this tool does not decide breach status or notify anyone.</div>' : "",
      value("i-security") === "Yes" ? '<div class="caution"><strong>Security or safeguarding concern:</strong> refer now to the Information and Cyber Security lead or under the Council’s safeguarding procedures; those routes lead on their own duties (Playbook §6.8.6.5).</div>' : "",
      '<p class="small"><strong>AIG-OPS-03 v1.8 draft:</strong> the Part A download has one column per Part A field (sections 1–4), labelled exactly as the form. The timescales above are quoted from the form’s severity table; this tool calculates no deadline and creates no incident record or external notification.</p>',
      isChecked("i-capa") ? '<div class="caution"><strong>AIG-AIMS-08:</strong> the optional CAPA Log row carries only the source, AIR-ID and immediate correction. The AIMS owner determines the NC ID, nonconformity, severity, status and corrective action.</div>' : "",
      '<p class="small">The decision, assurance state and severity remain for the authorised Council owner. A severe incident can prompt reassessment; it does not itself approve suspension, restart or a risk-tier change.</p>'
    ].join("");

    const ucScope = value("i-use-scope");
    const affectedUcIds = ucScope === "UC-ID specific" ? value("i-uc-id") :
      ucScope === "Shared system baseline" ? "Shared system baseline — list each affected UC-ID when known" : "Unknown";
    const partAValues = {
      "Reported by": value("i-reporter"),
      "Role / team": value("i-role"),
      "Contact email": value("i-email"),
      "Date & time identified": G.formatDateTime(value("i-date")),
      "AI system / model name": value("i-system"),
      "AIR-ID": value("i-air"),
      "Affected UC-ID(s)": affectedUcIds,
      "Describe the incident: what occurred, when, how it came to light, and what the AI system was doing":
        "What occurred: " + value("i-description") + "\nWhen: " + value("i-when") +
        "\nHow it came to light: " + value("i-discovery") + "\nWhat the AI system was doing: " + value("i-ai-activity"),
      "How was it identified?": value("i-discovery"),
      "Is the incident ongoing?": value("i-ongoing"),
      "Event classification": value("i-kind"),
      "Describe the actual or potential impact and the approximate number of people affected":
        "Who / what affected (approximate number): " + value("i-affected-details") +
        "\nActual or potential impact: " + value("i-impact") +
        "\nAffected data and impact: " + value("i-data-impact") +
        "\nDecision impact: " + value("i-decision-impact"),
      "Provisional severity": G.SEVERITY_ORDER.includes(assessment.level) ? assessment.level : "",
      "Immediate action taken": value("i-action"),
      "Precautionary pause applied? Gate Log event ID": value("i-pause") === "Yes" ?
        "Yes. Applied by " + value("i-pause-by") + " on " + G.formatDateTime(value("i-pause-at")) +
        ". AIG-DEC-04 Gate events ID: " + (value("i-pause-event") || "to be logged (Precautionary pause (containment), Paused — pending decision)") :
        value("i-pause"),
      "Suspected personal data breach?": value("i-breach"),
      "Security or safeguarding concern?": value("i-security"),
      "External notification may be required?": value("i-external"),
      "Part A sent to AI Governance Lead (date)": value("i-sent")
    };
    G.LISTS.ops03Affected.forEach((label) => { partAValues[label] = ticked.has(label) ? "☒" : "☐"; });
    const partANotes = [
      "Section 3 tick boxes: ☒ ticked, ☐ not ticked",
      "Use scope: " + (ucScope || "Unknown") + ". Unknown is not shared scope or approval; a shared system identifier alone does not establish scope",
      value("i-air") ? "AIR-ID user-confirmed against current AIG-INV-04; never invent one" : "AIR-ID blank (not known); never invent one",
      "Provisional severity: " + assessment.level + (indicators.length ? " from indicators: " + indicators.join("; ") : " (no indicator selected)") +
        (assessment.aggregated ? "; aggregation raised it one level" : "") +
        (assessment.uplifted ? "; manual uplift to " + value("i-uplift") + " — " + value("i-uplift-reason") : "") +
        ". Draft triage only; the Service Owner assesses and the AI Governance Lead confirms",
      "Provisional internal route: " + route.recipient + " — " + route.target,
      value("i-dpo-referred") ? "DPO referral date and time (form: “Date and time referred”): " + G.formatDateTime(value("i-dpo-referred")) : "",
      "Review free text for unnecessary personal data before transfer",
      G.screeningNote(screening)
    ];
    if (mandatory.length) partANotes.push("§4.7.17 mandatory trigger selected (" + mandatory.join("; ") + "): escalate to the AI Governance Lead immediately, consider a precautionary pause, classify at least High");
    const outputs = [csvDownload("ops03PartA", "AIG-OPS-03 Part A (.csv)", "AIG-OPS-03_PartA",
      [{ values: partAValues, notes: partANotes }], value("i-air"))];
    // v3.9.2 (W-06): the precautionary pause as an AIG-DEC-04 v1.1 Gate events row.
    if (paused) {
      const pauseAt = value("i-pause-at");
      outputs.push(csvDownload("dec04GateEvents", "AIG-DEC-04 Gate events row: precautionary pause (.csv)", "AIG-DEC-04_Gate_events_precautionary_pause", [{
        values: {
          "Event ID": value("i-pause-event"),
          "AIR-ID": value("i-air"),
          "Gate / forum": "Gate 7 Operate, monitor, review & change",
          "Event type": G.PAUSE_EVENT,
          "Date": pauseAt ? pauseAt.slice(0, 10) : "",
          "Outcome": G.PAUSE_OUTCOME,
          "Decision-maker / role": value("i-pause-by"),
          "Next gate / action": "Follow-up decision by the officer or forum with confirmed delegation (continued suspension, resumption or withdrawal)",
          "UC-ID(s) covered by this dated event": ucScope === "UC-ID specific" ? value("i-uc-id") : "",
          "Decision scope (UC-ID specific / Shared system baseline)": G.scopeValue(ucScope),
          "Time (hh:mm)": pauseAt ? pauseAt.slice(11, 16) : "",
          "Source (minutes / decision record / system)": "AIG-OPS-03 incident report, Part A",
          "Event-time lifecycle stage": value("i-pause-lifecycle"),
          "Incident ref (AIG-OPS-03), precautionary pause": value("i-incident-ref"),
          "Follow-up decision due date (precautionary pause)": value("i-pause-followup")
        },
        notes: [
          "Precautionary pause (containment), not a decision: no AIG-DEC-03 reference is needed; the UC-ID keeps its recorded AIG-DEC-03 outcome until the follow-up decision (Playbook §4.7.17)",
          value("i-pause-event") ? "Event ID checked by the user against current AIG-DEC-04" : "Event ID blank: the AIG-DEC-04 owner assigns it; never invent one",
          value("i-incident-ref") ? "" : "Incident ref (column V) blank: add the AIG-OPS-03 incident reference once logged; the Gate Log row check requires it",
          value("i-pause-followup") ? "" : "Follow-up decision due date (column W) blank: the Gate Log row check requires it",
          G.scopeNote(ucScope, "Pause"),
          G.screeningNote(screening)
        ]
      }], value("i-air")));
    }
    const partBValues = partBKeys.map(value);
    if (partBValues.some(Boolean)) {
      outputs.push(csvDownload("ops03PartB8", "AIG-OPS-03 Part B §8 pointer (.csv)", "AIG-OPS-03_PartB_section8_pointer", [{
        values: {
          "Controller awareness date and time": G.formatDateTime(value("i-controller-awareness")),
          "Risk to individuals' rights and freedoms": value("i-rights-risk") + "; assessor: " + value("i-rights-assessor") +
            "; date: " + value("i-rights-date"),
          "ICO notifiability decision and DPO advice": value("i-ico-decision") + "; rationale: " + value("i-ico-rationale") +
            "; decision owner: " + value("i-ico-owner") + "; DPO advice reference: " + value("i-dpo-ref")
        },
        notes: [
          "AIG-OPS-03 optional Part B pointer — not a legal finding or incident record. Only the three rows supplied by the controller/DPO route are filled; the AI Governance Lead completes the rest of section 8",
          value("i-air") ? "AIR-ID (Part A section 1): " + value("i-air") : "",
          "No breach status, legal conclusion, notification deadline or notification is determined by this tool",
          G.screeningNote(screening)
        ]
      }], value("i-air")));
    }
    if (isChecked("i-capa")) {
      outputs.push(csvDownload("aims08Capa", "AIG-AIMS-08 CAPA Log row (.csv)", "AIG-AIMS-08_CAPA_Log", [{
        values: {
          "Source": "Incident",
          "Related AIR-ID (if system-level) / AIMS area": value("i-air"),
          "Immediate correction": value("i-action")
        },
        notes: [
          "NC ID, Date raised, Nonconformity, Severity (Major / Minor), Status and corrective action are left blank for the AIMS owner; assign no NC ID here",
          "Source ref: cite the AIG-OPS-03 incident reference once the AI Governance Lead has logged it",
          "Incident summary (context only; the AIMS owner determines whether a nonconformity exists): " + value("i-description"),
          "Incident use scope: " + (ucScope || "Unknown") + (value("i-uc-id") ? " (UC-ID " + value("i-uc-id") + ")" : ""),
          G.screeningNote(screening)
        ]
      }], value("i-air")));
    }
    const actions = [{
      label: "Prepare monitoring review",
      run: function () {
        byId("m-air").value = value("i-air");
        byId("m-system").value = value("i-system");
        byId("m-use-scope").value = ["UC-ID specific", "Shared system baseline"].includes(value("i-use-scope")) ?
          value("i-use-scope") : "Unknown";
        byId("m-uc-id").value = value("i-uc-id");
        byId("m-air-verified").checked = isChecked("i-air-verified");
        byId("m-metric").value = "Incident follow-up";
        byId("m-action").value = value("i-action");
        byId("m-trigger").value = "Material incident or near miss";
        selectTab("tab-monitor");
      }
    }];
    if (assessment.level === "High" || assessment.level === "Critical" || dataBreach || isChecked("i-aggregate") || mandatory.length || paused) {
      actions.push({
        label: "Assess this change / incident",
        run: function () {
          byId("c-air").value = value("i-air");
          byId("c-system").value = value("i-system");
          byId("c-use-scope").value = value("i-use-scope");
          byId("c-uc-id").value = value("i-uc-id");
          byId("c-description").value = "Incident follow-up: " + value("i-description");
          byId("panel-change").querySelector('[data-trigger]').checked = true;
          selectTab("tab-change");
        }
      });
    }
    resultCard("i-results", "Incident drafts prepared", html, outputs, actions);
  }

  function selectedImpacts() {
    return ["c-impact-res", "c-impact-legal", "c-impact-rep", "c-impact-op", "c-impact-fin"]
      .map(value);
  }

  function changeTriggerKeys() {
    return Array.from(byId("change-form").querySelectorAll("[data-trigger]:checked")).map((input) => input.dataset.trigger);
  }

  function triggerAnswers() {
    const answers = {};
    G.STEP4_TRIGGERS.forEach((t) => { answers[t[0]] = value("c-t-" + t[0]); });
    return answers;
  }

  function changeSubmit(event) {
    event.preventDefault();
    clearOutput("c-results", "c-error");
    const changeError = G.validateChange({
      changeTriggers: changeTriggerKeys(), triggerAnswers: triggerAnswers(),
      pauseIncidentRef: value("e-incident-ref"), pauseFollowUpDue: value("e-followup-due"),
      airId: value("c-air"), airIdVerified: isChecked("c-air-verified"), system: value("c-system"),
      useScope: value("c-use-scope"), ucId: value("c-uc-id"),
      mapChangeDate: value("map-change-date"), mapChangeType: value("map-change-type"),
      mapPrevious: value("map-previous"), mapNext: value("map-new"), mapExpansion: value("map-expansion"),
      mapOwner: value("map-owner"), mapReassessment: value("map-reassessment"), mapEventId: value("map-event"),
      mapState: value("map-state"),
      planGate: value("p-gate"), planTrigger: value("p-trigger"), planRequirement: value("p-requirement"),
      planBasis: value("p-basis"), planDate: value("p-date"), planRole: value("p-owner"),
      planState: value("p-state"), planWaiver: value("p-waiver"), planSourceVersion: value("p-source-version"),
      planCriteria: value("p-criteria"),
      planUseScope: value("p-use-scope"), planUcId: value("p-uc-id"),
      planId: value("p-planid"), planIdVerified: isChecked("p-planid-verified"),
      eventType: value("e-type"), escalated: value("e-escalated"), escalatedTo: value("e-escalated-to"),
      decision: value("e-decision"), eventId: value("e-eventid"), eventIdVerified: isChecked("e-eventid-verified"),
      eventDate: value("e-date"), eventTime: value("e-time"), eventForum: value("e-forum"), eventLifecycle: value("e-lifecycle"),
      eventMaker: value("e-maker"), eventRecord: value("e-record"), eventAuthority: value("e-authority"),
      eventConfirmed: isChecked("e-confirmed"), today: todayIso(),
      assuranceOpinion: value("e-opinion"), nextGate: value("e-next-gate"),
      eventNotes: value("e-notes"), technicalSnapshot: value("e-snapshot"),
      recordedBy: value("e-recorded-by"), eventSource: value("e-source"), evidenceIds: value("e-evidence"),
      planEventId: value("e-planid"), planEventIdVerified: isChecked("e-planid-verified"),
      condition: value("e-condition"), conditionOwner: value("e-condition-owner"),
      conditionDue: value("e-condition-due"), conditionState: value("e-condition-state"),
      conditionResolved: value("e-condition-resolved"), conditionEvidence: value("e-condition-evidence"),
      conditionVerified: value("e-condition-verified"), conditionMonitoring: value("e-condition-monitoring"),
      conditionOps02Ref: value("e-condition-ops02"),
      conditionUseScope: value("e-condition-scope"), conditionUcId: value("e-condition-uc-id"),
      eventUseScope: value("e-use-scope"), eventUcId: value("e-uc-id"),
      useDecisionRef: value("e-use-decision-ref"), permittedPurpose: value("e-permitted-purpose"),
      permittedUsers: value("e-permitted-users"), permittedData: value("e-permitted-data"),
      permittedActions: value("e-permitted-actions"), exclusions: value("e-exclusions"),
      permittedConditions: value("e-permitted-conditions"),
      priorityBefore: value("e-priority-before"), priorityAfter: value("e-priority-after"),
      priorityRef: value("e-priority-ref")
    });
    if (changeError) {
      setError("c-error", changeError);
      return;
    }
    const screening = getScreening(byId("change-form"));
    const dutyError = screeningError(screening);
    if (dutyError) {
      setError("c-error", dutyError);
      return;
    }
    const screenNote = G.screeningNote(screening);

    const decision = value("e-decision");
    const conditionIds = ["e-condition", "e-condition-owner", "e-condition-due", "e-condition-state",
      "e-condition-resolved", "e-condition-evidence", "e-condition-verified", "e-condition-monitoring", "e-condition-ops02"];
    const conditionStarted = conditionIds.some((id) => value(id));
    const triggers = Array.from(byId("change-form").querySelectorAll("[data-trigger]:checked"))
      .map((input) => input.parentElement.textContent.trim());
    const risk = G.calculateRisk(selectedImpacts(), value("c-likelihood"), value("c-control"));
    const planStarted = ["p-gate", "p-trigger", "p-requirement", "p-basis", "p-date", "p-owner",
      "p-state", "p-waiver", "p-source-version", "p-planid", "p-criteria", "p-use-scope", "p-uc-id"].some((id) => value(id));
    const mapChangeStarted = ["map-change-date", "map-change-type", "map-previous", "map-new",
      "map-expansion", "map-owner", "map-reassessment", "map-event", "map-state"].some((id) => value(id));
    const air = value("c-air");
    const downloads = [];

    // AIG-ASS-02 Triage Import (canonical field / value rows).
    const triageRows = G.triageImportRows({
      airId: air, system: value("c-system"), impacts: selectedImpacts(),
      likelihood: value("c-likelihood"), control: value("c-control"),
      useScope: value("c-use-scope"), ucId: value("c-uc-id"),
      changeTriggers: changeTriggerKeys(), triggerAnswers: triggerAnswers()
    }, risk);
    triageRows[0].notes.push("Reason for reassessment: " + (value("c-description") || "not entered"),
      "Reassessment triggers selected in this tool: " + (triggers.join("; ") || "none") +
        ". They carry into the Step 4 §4.4.6 trigger rows 34–40 (Material change; agentic Unsure where authority changed); the assessor confirms each answer in AIG-ASS-02", screenNote);
    downloads.push(csvDownload("ass02TriageImport", "AIG-ASS-02 Triage Import (.csv)", "AIG-ASS-02_Triage_Import", triageRows, air));

    if (triggers.length) {
      downloads.push(csvDownload("inv04AssessmentSummary", "AIG-INV-04 Assessment summary review row — no update (.csv)",
        "AIG-INV-04_Assessment_summary_review", [{
          values: {
            "AIR-ID": air,
            "Inherent risk score (L × I)": risk ? risk.inherent : "",
            "Control effectiveness (1–5)": risk ? risk.control : "",
            "Residual risk score": risk ? risk.residual : ""
          },
          notes: [
            "Review row only: no register update is performed or proposed by this tool; the authorised register owner decides any controlled update",
            "Risk values are system-level summaries: use them only if this assessment is the highest applicable UC-ID or baseline for the AIR-ID. Assessment scope: " +
              (value("c-use-scope") || "Unknown") + (value("c-uc-id") ? " (UC-ID " + value("c-uc-id") + ")" : ""),
            "Risk tier (AIG-ASS-02; highest applicable UC-ID or baseline) is left blank: it is the governing tier from AIG-ASS-02 (C43), not calculated here" +
              (risk ? ". Indicative inherent tier " + risk.inherentTier + ", residual tier " + risk.residualTier + (risk.impactFloor ? "; impact floor → at least Medium" : "") : ""),
            value("c-current-tier") ? "User-entered current tier for comparison only: " + value("c-current-tier") + "; verify in current AIG-INV-04" : "",
            "Change / reassessment context: " + (value("c-description") || "not entered") + ". Triggers: " + triggers.join("; "),
            "Current assurance state and approval status are not read, inferred or changed by this tool",
            screenNote
          ]
        }], air));
    }
    if (planStarted) {
      downloads.push(csvDownload("dec04GatePlan", "AIG-DEC-04 Gate plan row (.csv)", "AIG-DEC-04_Gate_plan", [{
        values: {
          "Plan ID": value("p-planid"),
          "AIR-ID": air,
          "Gate / forum": value("p-gate"),
          "Trigger / stage": value("p-trigger"),
          "Requirement": value("p-requirement"),
          "Basis / triage ref": value("p-basis"),
          "Target date": value("p-date"),
          "Responsible role": value("p-owner"),
          "Plan state": value("p-state"),
          "N-A / waiver rationale and authority ref": value("p-waiver"),
          "UC-ID scope(s) (blank only for explicit system baseline)": value("p-use-scope") === "UC-ID specific" ? value("p-uc-id") : "",
          "Decision scope (UC-ID specific / Shared system baseline)": G.scopeValue(value("p-use-scope"))
        },
        notes: [
          value("p-planid") ? "Existing Plan ID checked by the user against current AIG-DEC-04" : "Plan ID blank: the Council assigns it; never invent one",
          G.scopeNote(value("p-use-scope"), "Plan"),
          "Source version: " + value("p-source-version"),
          value("p-criteria") ? "Planned criteria / evidence to bring: " + value("p-criteria") : "",
          "A Gate plan row is prospective only: not a Gate Event, decision or approval",
          screenNote
        ]
      }], air));
    }
    if (mapChangeStarted) {
      const mapRow = G.mapChangeRow({
        airId: air, useScope: value("c-use-scope"), ucId: value("c-uc-id"),
        changeDate: value("map-change-date"), changeType: value("map-change-type"),
        previous: value("map-previous"), next: value("map-new"), expansion: value("map-expansion"),
        owner: value("map-owner"), reassessmentRef: value("map-reassessment"), eventId: value("map-event"),
        state: value("map-state")
      });
      mapRow.notes.push(screenNote);
      downloads.push(csvDownload("inv05MapChanges", "AIG-INV-05 Map changes row (.csv)", "AIG-INV-05_Map_changes", [mapRow], air));
    }
    if (value("e-type")) {
      const escalation = value("e-escalated") === "Yes" ? "Escalated to " + value("e-escalated-to") : "";
      const eventScope = value("e-use-scope");
      downloads.push(csvDownload("dec04GateEvents", "AIG-DEC-04 Gate events row (.csv)", "AIG-DEC-04_Gate_events", [{
        values: {
          "Event ID": value("e-eventid"),
          "AIR-ID": air,
          "Plan ID (if any)": value("e-planid"),
          "Gate / forum": value("e-forum"),
          "Event type": value("e-type"),
          "Date": value("e-date"),
          "Outcome": decision,
          "Decision-maker / role": value("e-maker"),
          "AIG-DEC-03 / minutes ref": value("e-record"),
          "Assurance opinion ref": value("e-opinion"),
          "Technical snapshot / as-at ref": value("e-snapshot"),
          "Next gate / action": [escalation, value("e-next-gate")].filter(Boolean).join("; "),
          "Recorded by": value("e-recorded-by"),
          "UC-ID(s) covered by this dated event": eventScope === "UC-ID specific" ? value("e-uc-id") : "",
          "Decision scope (UC-ID specific / Shared system baseline)": G.scopeValue(eventScope),
          "Time (hh:mm)": value("e-time"),
          "Source (minutes / decision record / system)": value("e-source"),
          "Evidence ID(s) (AIG-INV-04 Evidence index)": value("e-evidence"),
          "Event-time lifecycle stage": value("e-lifecycle"),
          "Incident ref (AIG-OPS-03), precautionary pause": value("e-incident-ref"),
          "Follow-up decision due date (precautionary pause)": value("e-followup-due")
        },
        notes: [
          "Transfer checklist only — not an authoritative event record. The formal decision remains in AIG-DEC-03 / authorised native minutes; this row points to it",
          value("e-eventid") ? "Event ID checked by the user against current AIG-DEC-04" : "Event ID blank: the AIG-DEC-04 owner assigns it (one row per UC-ID; suffix multi-use decisions, e.g. EVT-0012-a); never invent one",
          G.scopeNote(eventScope, "Decision"),
          escalation ? "Escalation recorded in Next gate / action, not as an Outcome" : "",
          value("e-type") === "Priority override" ? "Priority override: the priority before/after, reason and Assurance update reference belong in the AIG-DEC-03 record cited in AIG-DEC-03 / minutes ref" : "",
          value("e-type") === G.PAUSE_EVENT ? "Precautionary pause (containment): not a decision, so no AIG-DEC-03 reference is needed; columns V (incident ref) and W (follow-up decision due date) are required by the Gate Log row check; continued suspension, resumption or withdrawal is decided by the officer or forum with confirmed delegation (Playbook §4.7.17)" : "",
          value("e-notes") ? "Event notes (no AIG-DEC-04 column): " + value("e-notes") : "",
          "Decision authority / delegation reference (AIG-DEC-03 field, not an AIG-DEC-04 column): " + value("e-authority"),
          "A system Approved baseline is not UC-ID approval; only the authoritative per-UC decision and conditions can support a use-specific claim",
          screenNote
        ]
      }], air));
    }
    if (value("e-type") && value("e-type") !== G.PAUSE_EVENT) {
      const eventScope = value("e-use-scope");
      const record = value("e-record");
      const isGdr = /^GDR-/i.test(record);
      const outcome = G.dec03Outcome(decision, conditionStarted);
      const blank = (v) => v || "____";
      const scheduleScope = G.scopeValue(eventScope) || "____";
      downloads.push(csvDownload("dec03Reference", "AIG-DEC-03 decision record pointer (.csv)", "AIG-DEC-03_Decision_Reference", [{
        values: {
          "Decision record ID": isGdr ? record : "",
          "System identity": value("c-system"),
          "UC-ID(s) expressly covered": eventScope === "UC-ID specific" ? value("e-uc-id") : "",
          "AIR-ID": air,
          "Decision date": value("e-date"),
          "Decision-making body": value("e-maker"),
          "Decision authority / delegation reference": value("e-authority"),
          "Meeting / written-decision reference": isGdr ? "" : record,
          "UC-ID decision schedule (repeat for each use)": value("e-type") === "Decision" ?
            "UC-ID: " + blank(eventScope === "UC-ID specific" ? value("e-uc-id") : "") +
            " | decision scope: " + scheduleScope +
            " | decision date: " + blank(value("e-date")) +
            " | outcome: " + blank(outcome.value) +
            " | exact scope/exclusions: " + (eventScope === "UC-ID specific" ?
              "purpose: " + value("e-permitted-purpose") + "; users: " + value("e-permitted-users") + "; data: " +
              value("e-permitted-data") + "; actions: " + value("e-permitted-actions") + "; exclusions: " + value("e-exclusions") : "____") +
            " | assessment/risk: ____" +
            " | conditions: " + blank([value("e-permitted-conditions"), value("e-condition")].filter(Boolean).join("; ")) +
            " | delegated authority: " + blank(value("e-authority")) +
            " | effective/expiry/review: ____" +
            " | Gate Event ID: " + blank(value("e-eventid")) : "",
          "Priority override (only if this record authorises one)": value("e-type") === "Priority override" ?
            "AIR-ID / UC-ID: " + air + (value("e-uc-id") ? " / " + value("e-uc-id") : "") +
            " | AGPI priority before: " + blank(value("e-priority-before")) +
            " | priority after: " + blank(value("e-priority-after")) +
            " | reason: ____" +
            " | delegated authority: " + blank(value("e-authority")) +
            " | Assurance priority update reference: " + blank(value("e-priority-ref")) +
            " | Gate Event ID (Event type “Priority override”): " + blank(value("e-eventid")) : ""
        },
        notes: [
          "Pointer only — not the decision record. AIG-DEC-03 (or approved minutes) remains authoritative, one outcome per UC-ID; do not replace or copy it from this file",
          isGdr ? "" : "Decision record ID left blank: the governance secretariat issues GDR IDs; never invent one",
          "Decision is left blank: the form records no global/system outcome",
          "Risk classification is recorded per UC-ID in the schedule (assessment/risk); not inferred here",
          outcome.note,
          value("e-type") !== "Decision" && value("e-type") !== "Priority override" ? "Event type " + value("e-type") + " is not a decision: no UC-ID schedule outcome is proposed" : "",
          "Use-specific decision reference: " + (value("e-use-decision-ref") || "none entered"),
          "Uses ____ where the form expects a value this tool does not hold",
          screenNote
        ]
      }], air));
    }
    if (conditionStarted) {
      const condScope = value("e-condition-scope");
      downloads.push(csvDownload("dec04Conditions", "AIG-DEC-04 Conditions row (.csv)", "AIG-DEC-04_Conditions", [{
        values: {
          "Condition ID": "",
          "Event ID": value("e-eventid"),
          "AIR-ID": air,
          "Required action / condition": value("e-condition"),
          "Action owner": value("e-condition-owner"),
          "Due date": value("e-condition-due"),
          "State": value("e-condition-state"),
          "Closed / waived on": value("e-condition-resolved"),
          "Evidence / waiver authority ref": value("e-condition-evidence"),
          "UC-ID scope (blank only if shared system condition)": condScope === "UC-ID specific" ? value("e-condition-uc-id") : "",
          "Condition scope (UC-ID specific / shared system baseline)": G.scopeValue(condScope),
          "Verified by / date": value("e-condition-verified"),
          "Monitoring condition? (Yes / No)": value("e-condition-monitoring"),
          "AIG-OPS-02 evidence ref (monitoring conditions)": value("e-condition-ops02")
        },
        notes: [
          "Condition ID blank: the Council assigns it; never invent one",
          "Existing verified Event ID: the parent must be a dated Decision event with Outcome Progress with condition or Re-authorise",
          G.scopeNote(condScope, "Condition"),
          value("e-use-decision-ref") ? "Parent per-UC decision reference: " + value("e-use-decision-ref") : "",
          "Overdue is derived by the workbook Row check (Open and due date passed), never typed; this tool does not close a condition",
          screenNote
        ]
      }], air));
    }

    const mandatory = triggers.length > 0;
    const body = [
      '<div class="' + (mandatory ? "caution" : "positive") + '"><strong>' +
        (mandatory ? "Documented reassessment indicated" : "No selected trigger") + "</strong>" +
        (mandatory ? " · " + safe(triggers.join("; ")) : " · Owner still reviews this change; no trigger selected is not assurance of safety.") + "</div>",
      risk ? "<p>AIG-ASS-02 v1.10 draft arithmetic: inherent risk = L × highest confirmed impact = " + safe(risk.inherent) +
        " (<strong>" + safe(risk.inherentTier) + "</strong>); residual risk = inherent × (C ÷ 5) = " + safe(risk.residual) +
        " (<strong>" + safe(risk.residualTier) + "</strong>). Bands: Low 1–5, Medium 6–10, High 11–15, Critical 16–25. " +
        (risk.impactFloor ? "A confirmed Impact 5 sets the governing tier to at least Medium (impact floor, Proposed — for Council confirmation). " : "") +
        "The governing tier is set in AIG-ASS-02: inherent tier unless controls are evidenced (and independently verified for High or Critical), raised by the §4.4.6 trigger floors, the impact floor and the agentic floor. " +
        (value("c-current-tier") ? "Entered current tier for comparison only: " + safe(value("c-current-tier")) + ". " : "") +
        "No approval, permission, AGPI priority or legal applicability is inferred.</p>" :
        "<p>Risk arithmetic not calculated: complete all five impact dimensions, likelihood and control effectiveness.</p>",
      '<p><strong>Workbook boundaries:</strong> AIG-INV-04 Register, AIG-DEC-04 Gate Log and proposed controlled AIG-INV-05 Capabilities and System Map are separate standalone draft workbooks, not approved/live records. AIG-INV-04 keeps the permanent issued AIR-ID and current assurance state; AIG-DEC-04 separates prospective plan, dated event and event-linked conditions. The map is a relationship catalogue, not a second Register. Each download uses the exact v3.9.5 column headers of its target sheet or form; guidance columns after the blank spacer are never pasted.</p>',
      triggers.some((trigger) => trigger.toLowerCase().includes("authority")) ?
        '<div class="caution"><strong>Agent authority:</strong> confirm the exact authorised permissions / delegation in AIG-AGT-04. Gate 2 and Gate 6 are mandatory for every action-capable use; Gate 6 grants the permitted autonomy level. This tool does not set or change agent authority.</div>' : "",
      '<p class="small">AGPI priority sets urgency only; the route follows the governing tier. Equality Act s149, HRA s6, privacy and other case-specific duties need screening at every tier. Conditional EU AI Act, ATRS and procurement duties require confirmation by the case-specific legal / procurement owner.</p>'
    ].join("");
    resultCard("c-results", "Change drafts prepared", body, downloads);
  }

  function monitoringSubmit(event) {
    event.preventDefault();
    clearOutput("m-results", "m-error");
    const validationError = G.validateMonitoring({
      airId: value("m-air"), airIdVerified: isChecked("m-air-verified"),
      system: value("m-system"),
      useScope: value("m-use-scope"), ucId: value("m-uc-id"),
      category: value("m-category"), metric: value("m-metric"),
      period: value("m-period"), date: value("m-date"), owner: value("m-owner"),
      threshold: value("m-threshold"), actual: value("m-actual"), evidence: value("m-evidence"),
      resultState: value("m-result-state"), resultReason: value("m-result-reason"),
      evidenceVersion: value("m-evidence-version"), checker: value("m-checker"),
      dataCut: value("m-data-cut"), denominator: value("m-denominator"),
      observedDenominator: value("m-observed-denominator"), denominatorState: value("m-denominator-state"),
      breach: value("m-breach"), material: value("m-material"),
      escalation: value("m-escalation"), status: value("m-status"),
      reassessment: value("m-reassessment"),
      riskTier: value("m-risk-tier"), trigger: value("m-trigger"),
      reviewType: value("m-review-type"), agenticRaise: value("m-agentic-raise"),
      controlFailure: value("m-control-failure"), controlFailureDetail: value("m-control-failure-detail"),
      accessExpansion: value("m-access-expansion"), accessExpansionDetail: value("m-access-expansion-detail"),
      trend: value("m-trend"), sampleMethod: value("m-sample-method"),
      highImpact: value("m-high-impact"), highImpactDetail: value("m-high-impact-detail"),
      action: value("m-action"), actionOwner: value("m-action-owner"), dueDate: value("m-due-date"),
      severity: value("m-severity"), source: value("m-source"),
      selection: value("m-selection"), population: value("m-population"),
      sample: value("m-sample"), window: value("m-window")
    });
    if (validationError) {
      setError("m-error", validationError);
      return;
    }
    const screening = getScreening(byId("monitor-form"));
    const dutyError = screeningError(screening);
    if (dutyError) {
      setError("m-error", dutyError);
      return;
    }

    const reassessment = value("m-breach") === "Yes" || value("m-material") === "Yes" ||
      value("m-trend") === "Deteriorating" || value("m-reassessment") === "Yes" ||
      value("m-control-failure") === "Yes" || value("m-access-expansion") === "Yes";
    const unknowns = G.monitoringUnknowns({
      trend: value("m-trend"), breach: value("m-breach"), material: value("m-material"),
      reassessment: value("m-reassessment"), escalation: value("m-escalation")
    });
    const scope = value("m-use-scope");
    const row = {
      "AIR-ID": value("m-air"),
      "AI System / Service": value("m-system"),
      "Monitoring Period": value("m-period"),
      "Review Date": value("m-date"),
      "Monitoring Owner": value("m-owner"),
      "Metric Category": value("m-category"),
      "Metric / Indicator": value("m-metric"),
      "Approved Threshold / Tolerance": value("m-threshold"),
      "Actual Result": value("m-actual"),
      "Trend": value("m-trend"),
      "Threshold Breach?": value("m-breach"),
      "Severity": value("m-severity"),
      "Action / Decision": value("m-action"),
      "Action Owner": value("m-action-owner"),
      "Due Date": value("m-due-date"),
      "Incident / CAPA Ref": value("m-incident-ref"),
      "Material Change?": value("m-material"),
      "Risk Reassessment Required?": value("m-reassessment"),
      "Residual Risk After Review": value("m-residual-risk"),
      "Governance Escalation?": value("m-escalation"),
      "AIG-DEC-04 Event ID (Gate Log ref)": value("m-gate-ref"),
      "Complaints / Challenges": value("m-challenge"),
      "Human Override Rate / Trend": value("m-human-override"),
      "Evidence Location": value("m-evidence"),
      "Next Review Date": value("m-next-date"),
      "Review Status": value("m-status"),
      "Sample Source / Population of Record": value("m-source"),
      "Selection Basis": value("m-selection"),
      "Population Size": value("m-population"),
      "Sample Size Reviewed": value("m-sample"),
      "Sampling Window": value("m-window"),
      "UC-ID (blank only for an explicitly shared system measure)": scope === "UC-ID specific" ? value("m-uc-id") : "",
      "Measure scope (UC-ID specific / Shared system baseline)": G.scopeValue(scope),
      "Risk tier (UC-ID, AIG-ASS-02)": value("m-risk-tier"),
      "Reassessment trigger (Appendix E.4)": value("m-trigger"),
      "Reassessment / consideration ref (AIG-ASS-02)": value("m-reassessment-ref"),
      "AIG-DEC-04 Condition ID (if monitoring a condition)": value("m-condition-id"),
      "Review type (§6.4.4: operational / performance / formal)": value("m-review-type"),
      "Agentic cadence raise applied? (action-capable uses)": value("m-agentic-raise")
    };
    const check = G.ops02ClosureCheck(row);
    const cadence = G.ops02Cadence(value("m-risk-tier"), value("m-review-type"));
    const minimum = G.ops02MinimumSample(value("m-risk-tier"), value("m-population"));
    const notes = [
      "Closure and evidence check (AH) the workbook will show for this row: " + check,
      cadence ? "Required minimum cadence (AJ): " + cadence : "",
      minimum !== "" ? "Minimum sample (AK): " + minimum : "",
      G.scopeNote(scope, "Measure"),
      unknowns.length ? "Unknown answers kept as Unknown, never No: " + unknowns.join(", ") + " — the row shows UNKNOWN TO RESOLVE until each is answered" : "",
      "Observed-result state: " + value("m-result-state") + (value("m-result-reason") ? " — " + value("m-result-reason") : ""),
      "Observed metric denominator: " + (value("m-observed-denominator") || "(none)") + " (" + value("m-denominator-state") + "); context: " + value("m-denominator"),
      "Evidence version " + value("m-evidence-version") + "; checked by " + value("m-checker") + "; data cut / as-at " + G.formatDateTime(value("m-data-cut")),
      "Sample selection reproduction detail: " + value("m-sample-method"),
      "Highest-impact decisions reviewed in full: " + value("m-high-impact") + " — " + value("m-high-impact-detail"),
      "Control-failure review: " + value("m-control-failure") + (value("m-control-failure-detail") ? " — " + value("m-control-failure-detail") : ""),
      "Access-expansion review: " + value("m-access-expansion") + (value("m-access-expansion-detail") ? " — " + value("m-access-expansion-detail") : ""),
      "Reassessment handoff signal: " + (reassessment ? "Yes — owner assessment needed" :
        unknowns.length ? "Unknown — resolve " + unknowns.join(", ") + " before closure" : "No affirmative trigger selected"),
      "AIR-ID user-confirmed against current AIG-INV-04; Evidence Location should cite a versioned pointer (AIG-INV-04 Evidence ID where imported)",
      G.screeningNote(screening)
    ];
    const body = [
      '<div class="' + (reassessment ? "caution" : "positive") + '"><strong>' +
        (reassessment ? "Reassessment handover indicated" : "Monitoring draft prepared") +
        "</strong> · " + (reassessment ?
          "A breach, material change, deteriorating trend, control failure, access expansion or reassessment signal was selected. Open Assess a change; the change owner decides and documents reassessment." :
          "No automatic trigger was selected. The monitoring owner still reviews the result and controlled record.") + "</div>",
      "<p><strong>Workbook closure check (column AH):</strong> " + safe(check) +
        (cadence ? " · minimum cadence: " + safe(cadence) : "") + (minimum !== "" ? " · minimum sample: " + safe(minimum) : "") + "</p>",
      '<p class="small">The AIG-OPS-02 v1.6 draft download is one Monitoring Log row in the exact column order A–AP (AO review type and AP agentic cadence raise are new in v1.6). Columns AH, AJ and AK are workbook formulas and are left blank. Evidence version, checker, data cut, denominator and review signals appear only in the guidance columns. This is a draft, not a live row; evidence remains in its native source.</p>',
      value("m-challenge") ? '<div class="section-note"><strong>Challenge route:</strong> consider AIG-OPS-04 for contestability and redress. This tool does not decide a challenge.</div>' : ""
    ].join("");
    const downloads = [csvDownload("ops02Monitoring", "AIG-OPS-02 Monitoring Log row (.csv)", "AIG-OPS-02_Monitoring_Log",
      [{ values: row, notes: notes }], value("m-air"))];
    const actions = [];
    if (reassessment) {
      actions.push({
        label: "Carry context to Assess a change",
        run: function () {
          byId("c-air").value = value("m-air");
          byId("c-air-verified").checked = true;
          byId("c-system").value = value("m-system");
          byId("c-use-scope").value = scope === "UC-ID specific" || scope === "Shared system baseline" ? scope : "Unknown";
          byId("c-uc-id").value = value("m-uc-id");
          byId("c-description").value = "Monitoring signal: " + value("m-metric") + "; actual " +
            value("m-actual") + " vs approved threshold " + value("m-threshold") + "; " +
            [value("m-breach") === "Yes" ? "threshold breach" : "", value("m-material") === "Yes" ? "material change" : "",
              value("m-trend") === "Deteriorating" ? "deteriorating trend" : "",
              value("m-control-failure") === "Yes" ? "control failure" : "",
              value("m-access-expansion") === "Yes" ? "access expansion" : "",
              value("m-reassessment") === "Yes" ? "owner marked reassessment required" : ""].filter(Boolean).join(", ");
          byId("panel-change").querySelector('[data-trigger]').checked = true;
          selectTab("tab-change");
        }
      });
    }
    resultCard("m-results", "Monitoring draft prepared", body, downloads, actions);
  }

  function selectTab(tabId) {
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    tabs.forEach((tab) => {
      const selected = tab.id === tabId;
      tab.setAttribute("aria-selected", selected ? "true" : "false");
      byId(tab.getAttribute("aria-controls")).hidden = !selected;
    });
  }

  function init() {
    ["c-impact-res", "c-impact-legal", "c-impact-rep", "c-impact-op", "c-impact-fin", "c-likelihood", "c-control"]
      .forEach((id) => {
        byId(id).innerHTML = '<option value="">Select</option>' +
          [1, 2, 3, 4, 5].map((score) => '<option value="' + score + '">' + score + "</option>").join("");
      });
    document.querySelectorAll('[role="tab"]').forEach((tab, index, allTabs) => {
      tab.addEventListener("click", () => selectTab(tab.id));
      tab.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const next = allTabs[(index + direction + allTabs.length) % allTabs.length];
        selectTab(next.id);
        next.focus();
      });
    });
    byId("incident-form").addEventListener("submit", incidentSubmit);
    byId("change-form").addEventListener("submit", changeSubmit);
    byId("monitor-form").addEventListener("submit", monitoringSubmit);
    [
      ["incident-form", "i-results", "i-error"],
      ["change-form", "c-results", "c-error"],
      ["monitor-form", "m-results", "m-error"]
    ].forEach(([formId, outputId, errorId]) => {
      byId(formId).addEventListener("reset", () => {
        window.setTimeout(() => clearOutput(outputId, errorId), 0);
      });
      ["input", "change"].forEach((eventName) => {
        byId(formId).addEventListener(eventName, () => clearOutput(outputId, errorId));
      });
    });
    setupRecordLoader();
    setupLongNotes();
  }

  // Long introductions and section notes show their first two lines, with "Show more".
  // The full text stays in the page, so screen readers and print read all of it.
  function setupLongNotes() {
    document.querySelectorAll("p.intro, p.section-note").forEach((note) => {
      if (note.textContent.trim().length < 220) return;
      note.classList.add("is-clamped");
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "more-toggle";
      toggle.textContent = "Show more";
      toggle.setAttribute("aria-expanded", "false");
      toggle.addEventListener("click", () => {
        const open = note.classList.toggle("is-clamped") === false;
        toggle.setAttribute("aria-expanded", String(open));
        toggle.textContent = open ? "Show less" : "Show more";
      });
      note.insertAdjacentElement("afterend", toggle);
    });
  }

  // ---- Start from a triage record ---------------------------------------------
  // Values filled from the record, by field id, so they can be marked and removed.
  const loaded = new Map();

  function fieldLabel(id) {
    const label = byId(id).closest("label");
    const first = label && label.firstChild;
    return first && first.nodeType === Node.TEXT_NODE ? first.textContent.trim() : id;
  }

  function unmark(id) {
    const input = byId(id);
    input.classList.remove("from-record");
    const note = input.parentElement.querySelector('.record-note[data-for="' + id + '"]');
    if (note) note.remove();
    loaded.delete(id);
    if (!loaded.size) byId("record-clear").hidden = true;
  }

  function mark(id, value) {
    const input = byId(id);
    input.classList.add("from-record");
    const note = document.createElement("small");
    note.className = "record-note";
    note.dataset.for = id;
    note.textContent = "From triage record. Check it is right.";
    input.insertAdjacentElement("afterend", note);
    loaded.set(id, value);
  }

  function setFieldValue(id, value) {
    const input = byId(id);
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function showRecordStatus(kind, heading, items) {
    const box = byId("record-status");
    box.replaceChildren();
    const panel = document.createElement("div");
    panel.className = kind;
    const strong = document.createElement("strong");
    strong.textContent = heading;
    panel.appendChild(strong);
    if (items && items.length) {
      const list = document.createElement("ul");
      items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
      });
      panel.appendChild(list);
    }
    box.appendChild(panel);
  }

  function applyRecord(parsed) {
    const current = {};
    Object.values(G.RECORD_FIELD_TARGETS).flat().forEach((id) => {
      if (byId(id)) current[id] = byId(id).value;
    });
    const plan = G.planRecordFill(parsed.values, current);
    plan.fills.forEach(({ id, value }) => {
      if (loaded.has(id)) unmark(id);
      setFieldValue(id, value);
      if (byId(id).value === value) mark(id, value);
    });
    byId("record-clear").hidden = !loaded.size;
    const info = parsed.info;
    const items = [];
    items.push(plan.fills.length + " field" + (plan.fills.length === 1 ? "" : "s") + " filled across the three tabs (highlighted). Check each one.");
    if (info.provisionalTier) {
      items.push("Triage gave a provisional governing tier of " + info.provisionalTier +
        (info.priority ? " (" + info.priority + ")" : "") +
        ". Tier fields are not filled: enter the tier confirmed in the AI Risk Assessment Worksheet (AIG-ASS-02).");
    }
    items.push("Tick “checked against AIG-INV-04” only after you have checked the AIR-ID in the Register yourself.");
    plan.kept.forEach((k) => items.push("Kept what you typed in “" + fieldLabel(k.id) + "” (" + k.existing + "); the record says " + k.proposed + "."));
    parsed.warnings.forEach((w) => items.push(w));
    const who = parsed.values.systemName || "this use";
    const when = info.exportedAt ? " (record downloaded " + info.exportedAt.slice(0, 10) + ")" : "";
    showRecordStatus("positive", "Loaded the triage record for " + who + when + ".", items);
  }

  function setupRecordLoader() {
    const picker = byId("record-file");
    picker.addEventListener("change", () => {
      const file = picker.files && picker.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        showRecordStatus("caution", "This file is too large to be a triage record.");
        picker.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const parsed = G.parseTriageRecord(reader.result, file.size);
        if (!parsed.ok) showRecordStatus("caution", parsed.error);
        else applyRecord(parsed);
        picker.value = "";
      };
      reader.onerror = () => {
        showRecordStatus("caution", "The file could not be read.");
        picker.value = "";
      };
      reader.readAsText(file);
    });
    byId("record-clear").addEventListener("click", () => {
      [...loaded.entries()].forEach(([id, value]) => {
        if (byId(id).value === value) setFieldValue(id, "");
        unmark(id);
      });
      showRecordStatus("positive", "Loaded values removed. Anything you changed yourself was kept.");
    });
    // A person editing a filled field takes ownership of it.
    document.addEventListener("input", (event) => {
      if (event.isTrusted && event.target && loaded.has(event.target.id)) unmark(event.target.id);
    });
    document.addEventListener("change", (event) => {
      if (event.isTrusted && event.target && loaded.has(event.target.id)) unmark(event.target.id);
    });
    ["incident-form", "change-form", "monitor-form"].forEach((formId) => {
      byId(formId).addEventListener("reset", () => {
        [...loaded.keys()].forEach((id) => { if (byId(formId).contains(byId(id))) unmark(id); });
      });
    });
  }

  init();
})();