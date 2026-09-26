(function () {
  "use strict";
  const G = window.GovernanceLogic;
  const byId = (id) => document.getElementById(id);
  const value = (id) => G.text(byId(id).value);
  const isChecked = (id) => byId(id).checked;
  const safe = G.escapeHtml;
  const screenLabels = ["equality", "humanRights", "privacy", "other"];

  function getScreening(form) {
    const result = {};
    form.querySelectorAll("[data-screen]").forEach((input) => {
      result[input.dataset.screen] = input.checked;
    });
    return result;
  }

  function screeningRows(screening) {
    return G.screeningEntries(screening);
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

  function handoverEntries(entries, screening) {
    return entries.concat(screeningRows(screening));
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
    const partBKeys = ["i-controller-awareness", "i-rights-risk", "i-rights-assessor", "i-rights-date",
      "i-ico-decision", "i-ico-rationale", "i-ico-owner", "i-dpo-ref"];
    const incidentValidation = G.validateIncident({
      system: value("i-system"), reporter: value("i-reporter"), role: value("i-role"),
      email: value("i-email"), identifiedAt: value("i-date"), classification: value("i-kind"),
      happened: value("i-description"), when: value("i-when"), discovery: value("i-discovery"),
      aiActivity: value("i-ai-activity"), affected: value("i-affected-details"), impact: value("i-impact"),
      dataImpact: value("i-data-impact"), decisionImpact: value("i-decision-impact"),
      uplift: value("i-uplift"), upliftReason: value("i-uplift-reason"),
      controllerAwareness: value("i-controller-awareness"), rightsRisk: value("i-rights-risk"),
      rightsAssessor: value("i-rights-assessor"), rightsAssessmentDate: value("i-rights-date"),
      icoDecision: value("i-ico-decision"), decisionRationale: value("i-ico-rationale"),
      decisionOwner: value("i-ico-owner"), dpoAdviceRef: value("i-dpo-ref")
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

    const selectedIndicators = Array.from(byId("incident-form").querySelectorAll("[data-severity]:checked"));
    const indicatorLevels = selectedIndicators.map((input) => input.dataset.severity);
    const assessment = G.severity(indicatorLevels, isChecked("i-aggregate"), value("i-uplift"));
    const route = G.ROUTES[assessment.level] || {
      recipient: "Pending authorised owner review",
      target: "Severity is unclassified; follow current approved procedures."
    };
    const dataBreach = selectedIndicators.some((input) =>
      input.parentElement.textContent.toLowerCase().includes("data breach")
    );
    const indicators = selectedIndicators.map((input) => input.parentElement.textContent.trim());
    const affected = Array.from(byId("incident-form").querySelectorAll("[data-affected]:checked"))
      .map((input) => input.parentElement.textContent.trim());
    const html = [
      '<div class="positive"><strong>Provisional severity: ' + safe(assessment.level) + '</strong> · ' +
        safe(route.recipient) + '</div>',
      "<p>" + safe(route.target) + " Submit Part A to the AI Governance Lead as soon as the incident is identified. Follow current approved procedures for any additional routing.</p>",
      indicators.length ? "<p><strong>Selected indicators:</strong> " + safe(indicators.join("; ")) + "</p>" :
        "<p>No severity indicator selected; severity and route remain unclassified pending owner review.</p>",
      assessment.aggregated ? "<p>Aggregation raised the provisional floor by one level.</p>" : "",
      assessment.uplifted ? "<p>Manual uplift: " + safe(value("i-uplift")) + " — " +
        safe(value("i-uplift-reason") || "reason not entered") + ".</p>" : "",
      dataBreach ? '<div class="caution"><strong>Suspected personal data breach:</strong> refer promptly to the DPO / Information Governance owner. Record the controller-awareness time separately; only the responsible owner determines any UK GDPR notification duty and clock. This tool does not decide breach status or notify anyone.</div>' : "",
      '<p class="small"><strong>AIG-OPS-03:</strong> Part A is a draft text handover. Transfer only into the controlled form after review. The source says submit as soon as identified; this tool adds no severity-based deadlines and creates no incident record or external notification.</p>',
      isChecked("i-capa") ? '<div class="caution"><strong>AIG-AIMS-08:</strong> optional CAPA request is a draft field/value handover only. The AIMS owner must determine nonconformity classification, ID, corrective action and controlled workbook mapping.</div>' : "",
      '<p class="small">The decision, assurance state and severity remain for the authorised Council owner. A severe incident can prompt reassessment; it does not itself approve suspension, restart or a risk-tier change.</p>'
    ].join("");
    const partA = [
      ["Event classification", value("i-kind"), "Confirm in the controlled AIG-OPS-03 form"],
      ["Reported by", value("i-reporter"), "Verify"],
      ["Reporter role / service team", value("i-role"), "Verify"],
      ["Contact email", value("i-email"), "Verify contact details before transfer"],
      ["System / service", value("i-system"), "Confirm identity against current AIG-INV-04"],
      ["Existing AIR-ID", value("i-air"), "Optional; never invent. Confirm against current AIG-INV-04"],
      ["Date and time identified", value("i-date"), "Keep distinct from any controller-awareness time"],
      ["What occurred", value("i-description"), "Review for unnecessary personal data before transfer"],
      ["When it occurred", value("i-when"), "Reporter account; distinguish from identification time"],
      ["How it was identified / source", value("i-discovery"), "Reporter account"],
      ["What the AI system was doing", value("i-ai-activity"), "Reporter account; do not infer technical cause"],
      ["Potentially affected", affected.join("; "), "Avoid personal case details"],
      ["Who / what affected and approximate number", value("i-affected-details"), "Use non-identifying summary; Unknown is valid"],
      ["Affected data and impact", value("i-data-impact"), "Use non-identifying summary; Unknown / not applicable must be explicit"],
      ["Decision impact", value("i-decision-impact"), "Use non-identifying summary; Unknown / not applicable must be explicit"],
      ["Potential impact / approximate number", value("i-impact"), "Use non-identifying summary"],
      ["Ongoing", value("i-ongoing"), "Confirm in the controlled incident form"],
      ["Immediate containment / action", value("i-action"),
        value("i-action") ? "Reporter/owner account; confirm actual containment before transfer" : "Blank — no immediate containment/action recorded"],
      ["Provisional severity", assessment.level, "Draft triage only; authorised owner confirms; Unclassified is not a Low finding"],
      ["Selected severity indicators / triage rationale", indicators.join("; ") || "None selected",
        indicators.length ? "Review against current incident procedure; authorised owner confirms" :
          "None selected; severity remains unclassified absent a reasoned manual uplift"],
      ["Manual severity uplift", value("i-uplift") || "None", "Blank/None means no manual uplift selected"],
      ["Severity uplift rationale", value("i-uplift-reason"),
        value("i-uplift") ? "Required rationale for the selected manual uplift" : "Blank — no manual uplift selected"],
      ["Provisional internal route", route.recipient, "Confirm current approved routing; submit Part A as soon as the incident is identified"]
    ];
    const outputs = [{
      label: "AIG-OPS-03 Part A draft (.csv)",
      filename: "AIG-OPS-03_PartA_draft_" + G.fileKey(value("i-air")) + ".csv",
      contents: G.handoverCsv("AIG-OPS-03 Part A text handover", handoverEntries(partA, screening))
    }];
    const partBValues = partBKeys.map(value);
    if (partBValues.some(Boolean)) {
      outputs.push({
        label: "AIG-OPS-03 optional Part B pointer draft (.csv)",
        filename: "AIG-OPS-03_PartB_pointer_draft_" + G.fileKey(value("i-air")) + ".csv",
        contents: G.handoverCsv("AIG-OPS-03 optional Part B pointer — not a legal finding or incident record", handoverEntries([
          ["Existing AIR-ID", value("i-air"), "Optional; owner reconciles with 05"],
          ["Controller-awareness date and time", value("i-controller-awareness"), "Controller owner confirms the awareness record"],
          ["Rights and freedoms risk assessment", value("i-rights-risk"), "Pointer/assessment summary only; no risk or legal finding by this tool"],
          ["Rights-risk assessor", value("i-rights-assessor"), "Verify against competent owner record"],
          ["Rights-risk assessment date", value("i-rights-date"), "Verify against competent owner record"],
          ["DPO-informed ICO notifiability decision", value("i-ico-decision"), "Owner decision pointer only; not a decision made by this tool"],
          ["Decision rationale", value("i-ico-rationale"), "Pointer only; verify against competent owner record"],
          ["Decision owner", value("i-ico-owner"), "Verify authority and record"],
          ["DPO advice reference", value("i-dpo-ref"), "Reference only; advice remains in its source record"],
          ["Handover boundary", "Pointer only — transfer to controlled AIG-OPS-03 Part B", "No breach status, legal conclusion, notification deadline or notification is determined"]
        ], screening))
      });
    }
    if (isChecked("i-capa")) {
      outputs.push({
        label: "AIG-AIMS-08 CAPA draft (.csv)",
        filename: "AIG-AIMS-08_CAPA_draft_" + G.fileKey(value("i-air")) + ".csv",
        contents: G.handoverCsv("AIG-AIMS-08 CAPA field/value draft", handoverEntries([
          ["Related existing AIR-ID", value("i-air"), "Confirm in current AIG-INV-04; optional, do not invent"],
          ["Incident summary", value("i-description"), "AIMS owner determines whether a nonconformity exists"],
          ["Immediate correction", value("i-action"), "Owner validates"],
          ["Status", "Draft / owner review required", "Assign no NC ID and do not add a live row"]
        ], screening))
      });
    }
    const actions = [{
      label: "Prepare monitoring review",
      run: function () {
        byId("m-air").value = value("i-air");
        byId("m-system").value = value("i-system");
        byId("m-air-verified").checked = isChecked("i-air-verified");
        byId("m-metric").value = "Incident follow-up";
        byId("m-action").value = value("i-action");
        selectTab("tab-monitor");
      }
    }];
    if (assessment.level === "High" || assessment.level === "Critical" || dataBreach || isChecked("i-aggregate")) {
      actions.push({
        label: "Assess this change / incident",
        run: function () {
          byId("c-air").value = value("i-air");
          byId("c-system").value = value("i-system");
          byId("c-description").value = "Incident follow-up: " + value("i-description");
          byId("panel-change").querySelector('[data-trigger]').checked = true;
          selectTab("tab-change");
        }
      });
    }
    resultCard("i-results", "Incident handover prepared", html, outputs, actions);
  }

  function selectedImpacts() {
    return ["c-impact-res", "c-impact-legal", "c-impact-rep", "c-impact-op", "c-impact-fin"]
      .map(value);
  }

  function formatRiskEntries(risk) {
    return [
      ["AIR-ID", value("c-air"), "Recheck existing identifier against current AIG-INV-04"],
      ["System / model name", value("c-system"), "Reconcile identity with current AIG-INV-04"],
      ["Resident Impact", value("c-impact-res"), "Triage input only; assessor confirms or amends"],
      ["Legal & Regulatory Impact", value("c-impact-legal"), "Triage input only; assessor confirms or amends"],
      ["Reputational Impact", value("c-impact-rep"), "Triage input only; assessor confirms or amends"],
      ["Operational Impact", value("c-impact-op"), "Triage input only; assessor confirms or amends"],
      ["Financial Impact", value("c-impact-fin"), "Triage input only; assessor confirms or amends"],
      ["Impact score (I) — highest confirmed dimension", risk ? risk.impact : "", "Worksheet formula field; assessor confirms"],
      ["Likelihood (L)", value("c-likelihood"), "Triage input only; assessor confirms or amends"],
      ["Control Effectiveness (C)", value("c-control"), "AIG-ASS-02 scale: 1 very strong to 5 ineffective"],
      ["Inherent risk score (L × I)", risk ? risk.inherent : "", "Worksheet confirms L × I; assessor confirms inputs and record"],
      ["Residual risk score", risk ? risk.residual : "", "AIG-ASS-02 formula: inherent score × control factor (C ÷ 5); assessor confirms"],
      ["Residual risk tier", "", "Not calculated: residual-tier band thresholds are not specified in this worksheet"]
    ];
  }

  function addDownload(downloads, artefact, label, entries, airId) {
    downloads.push({
      label: label,
      filename: artefact.replace(/[^A-Za-z0-9_-]/g, "_") + "_draft_" + G.fileKey(airId) + ".csv",
      contents: G.handoverCsv(artefact, entries)
    });
  }

  function changeSubmit(event) {
    event.preventDefault();
    clearOutput("c-results", "c-error");
    const changeError = G.validateChange({
      airId: value("c-air"), airIdVerified: isChecked("c-air-verified"), system: value("c-system"),
      mapChangeDate: value("map-change-date"), mapChangeType: value("map-change-type"),
      mapPrevious: value("map-previous"), mapNext: value("map-new"), mapExpansion: value("map-expansion"),
      mapOwner: value("map-owner"), mapReassessment: value("map-reassessment"), mapEventId: value("map-event"),
      planGate: value("p-gate"), planTrigger: value("p-trigger"), planRequirement: value("p-requirement"),
      planBasis: value("p-basis"), planDate: value("p-date"), planRole: value("p-owner"),
      planState: value("p-state"), planWaiver: value("p-waiver"), planSourceVersion: value("p-source-version"),
      planCriteria: value("p-criteria"),
      planId: value("p-planid"), planIdVerified: isChecked("p-planid-verified"),
      decision: value("e-decision"), eventId: value("e-eventid"), eventIdVerified: isChecked("e-eventid-verified"),
      eventDate: value("e-date"), eventForum: value("e-forum"), eventLifecycle: value("e-lifecycle"),
      eventMaker: value("e-maker"), eventRecord: value("e-record"), eventAuthority: value("e-authority"),
      eventConfirmed: isChecked("e-confirmed"), eventState: value("e-record-state"),
      assuranceOpinion: value("e-opinion"), nextGate: value("e-next-gate"),
      eventNotes: value("e-notes"), technicalSnapshot: value("e-snapshot"),
      recordedBy: value("e-recorded-by"), evidenceSource: value("e-evidence"),
      planEventId: value("e-planid"), planEventIdVerified: isChecked("e-planid-verified"),
      condition: value("e-condition"), conditionOwner: value("e-condition-owner"),
      conditionDue: value("e-condition-due"), conditionState: value("e-condition-state"),
      conditionResolved: value("e-condition-resolved"), conditionEvidence: value("e-condition-evidence"),
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

    const decision = value("e-decision");
    const conditionValues = [value("e-condition"), value("e-condition-owner"), value("e-condition-due"), value("e-condition-state")];
    const conditionStarted = conditionValues.some(Boolean);
    const triggers = Array.from(byId("change-form").querySelectorAll("[data-trigger]:checked"))
      .map((input) => input.parentElement.textContent.trim());
    const risk = G.calculateRisk(selectedImpacts(), value("c-likelihood"), value("c-control"));
    const planEntries = [
      ["Plan ID", value("p-planid"), "Council-assigned only; blank if no existing Plan ID"],
      ["AIR-ID", value("c-air"), "Recheck existing identifier against current AIG-INV-04"],
      ["Gate / forum", value("p-gate"), "Prospective plan only; not a Gate Event or approval"],
      ["Trigger / lifecycle stage", value("p-trigger"), "Enter the actual lifecycle context"],
      ["Requirement", value("p-requirement"), "Use only after owner review"],
      ["Basis / triage ref", value("p-basis"), "Reference existing evidence; do not invent a reference"],
      ["Target date", value("p-date"), "Planned date only"],
      ["Responsible role", value("p-owner"), "Confirm assignment"],
      ["Plan state", value("p-state"), "Use the current controlled value"],
      ["N-A / waiver rationale and authority ref", value("p-waiver"), "Required where Requirement is Not required"],
      ["Source version", value("p-source-version"), "Enter actual source workbook version"],
      ["Planned criteria / evidence to bring", value("p-criteria"), "Planning note only; confirm against approved plan"]
    ];
    const planStarted = ["p-gate", "p-trigger", "p-requirement", "p-basis", "p-date", "p-owner",
      "p-state", "p-waiver", "p-source-version", "p-planid", "p-criteria"].some((id) => value(id));
    const mapFields = ["map-change-date", "map-change-type", "map-previous", "map-new",
      "map-expansion", "map-owner", "map-reassessment", "map-event"];
    const mapChangeStarted = mapFields.some((id) => value(id));

    const riskEntries = [
      ["Existing AIR-ID", value("c-air"), "Recheck current AIG-INV-04"],
      ["System / service", value("c-system"), "Reconcile to existing system record"],
      ["Reason for reassessment", value("c-description"), "Assessor records source evidence"],
      ["Reassessment triggers", triggers.join("; ") || "None selected", "Owner confirms against current procedure"]
    ].concat(formatRiskEntries(risk), screeningRows(screening));
    const currentStateEntries = [
      ["Existing AIR-ID", value("c-air"), "Permanent Council-issued identifier; retain as recorded in 05"],
      ["System / service name", value("c-system"), "System identity supplied for review; reconcile against current AIG-INV-04"],
      ["Current assurance state", "Not read or changed by this tool", "Verify directly in the current AIG-INV-04 record"],
      ["Change / reassessment context", value("c-description"), "Owner determines any current-state change"],
      ["Reassessment trigger(s)", triggers.join("; ") || "None selected", "Context only; owner records any reassessment outcome"],
      ["User-entered current tier for comparison", value("c-current-tier"), value("c-current-tier") ?
        "User-provided comparison only; verify directly in current AIG-INV-04" : "Blank — no current tier supplied"],
      ["Residual risk score", risk ? risk.residual : "", "AIG-ASS-02 formula mirrored; assessor confirms in the worksheet"],
      ["Residual risk tier", "", "Not calculated: tier bands are not specified here; verify directly in AIG-ASS-02"],
      ["Approval / operational status", "No value proposed", "Never inferred from a score or draft handover"],
      ["Current AIG-INV-04 update", "None — no register update performed or proposed by this tool",
        "Review handover only; the authorised register owner separately determines any controlled update"],
      ["Register field mapping", "Not supplied", "Map against exact current AIG-INV-04 headers; this file is not a worksheet row"]
    ].concat(screeningRows(screening));
    const downloads = [];
    addDownload(downloads, "AIG-ASS-02 risk assessment", "AIG-ASS-02 assessment draft (.csv)", riskEntries, value("c-air"));
    if (triggers.length) {
      addDownload(downloads, "AIG-INV-04 current-state review handover (no update)",
        "AIG-INV-04 review handover — no update (.csv)", currentStateEntries, value("c-air"));
    }
    if (planStarted) {
      addDownload(downloads, "AIG-DEC-04 prospective Gate Plan", "AIG-DEC-04 Gate Plan draft (.csv)",
        planEntries.concat(screeningRows(screening)), value("c-air"));
    }
    if (mapChangeStarted) {
      const mapChangeEntries = G.mapChangeHandoverEntries({
        airId: value("c-air"),
        changeDate: value("map-change-date"),
        changeType: value("map-change-type"),
        previous: value("map-previous"),
        next: value("map-new"),
        expansion: value("map-expansion"),
        owner: value("map-owner"),
        reassessmentRef: value("map-reassessment"),
        eventId: value("map-event")
      }).concat(screeningRows(screening));
      addDownload(downloads, "Capabilities and System Map change log", "Capabilities and System Map change handoff (.csv)",
        mapChangeEntries, value("c-air"));
    }
    if (decision) {
      const eventEntries = [
        ["Checklist boundary", "Transfer checklist only — not an authoritative event record",
          "Formal decision remains in AIG-DEC-03 / authorised native minutes; owner maps/transfers values to current AIG-DEC-04"],
        ["Decision/state controlled-value mapping", "PENDING OWNER VERIFICATION",
          "Confirm selected decision and transcribed event state against the current AIG-DEC-04 controlled vocabulary before transfer"],
        ["Event ID", value("e-eventid"), "Existing ID checked by user; blank means none was supplied, not a verified ID"],
        ["AIR-ID", value("c-air"), "Permanent ID; recheck against current AIG-INV-04"],
        ["Gate / forum", value("e-forum"), "Verify authority and forum remit"],
        ["Lifecycle stage", value("e-lifecycle"), "Enter actual lifecycle stage"],
        ["Decision date", value("e-date"), "Actual decision date; confirm"],
        ["Decision", decision, "Transcribed from formal record; exact current AIG-DEC-04 controlled value mapping remains pending owner confirmation"],
        ["Assurance opinion ref", value("e-opinion"), "Existing reference only; leave blank if none"],
        ["Decision-maker / role", value("e-maker"), "Verify in formal record"],
        ["Next gate", value("e-next-gate"), "Leave blank if not recorded"],
        ["Event notes", value("e-notes"), "Do not copy sensitive case details"],
        ["Decision record / minutes ref", value("e-record"), "Required, user-confirmed checked reference; authoritative decision remains in AIG-DEC-03 or native minutes"],
        ["Technical snapshot / as-at ref", value("e-snapshot"), "Existing technical snapshot reference only"],
        ["Event record state", value("e-record-state"), "Required transcribed state; exact current AIG-DEC-04 controlled value mapping remains pending owner confirmation"],
        ["Recorded by / role", value("e-recorded-by"), "Leave blank if not recorded"],
        ["Evidence source / URI", value("e-evidence"), "Required existing reference; the confirmation barrier rejects blank evidence"],
        ["Plan ID (optional join)", value("e-planid"), "Optional existing ID; do not invent"],
        ["Priority before override", value("e-priority-before"), "Complete only for an actual priority override"],
        ["Priority after override", value("e-priority-after"), "Complete only for an actual priority override"],
        ["Assurance priority update ref", value("e-priority-ref"), "Complete only for an actual priority override"]
      ];
      addDownload(downloads, "AIG-DEC-04 Gate Event transfer checklist", "AIG-DEC-04 Gate Event transfer checklist (.csv)", eventEntries, value("c-air"));
      addDownload(downloads, "AIG-DEC-03 decision record pointer", "Decision record pointer draft (.csv)", [
        ["Existing AIR-ID", value("c-air"), "Recheck current AIG-INV-04"],
        ["Decision date", value("e-date"), "Pointer only; date remains in the authoritative record"],
        ["Gate / forum", value("e-forum"), "Pointer only; forum remains in the authoritative record"],
        ["Decision-maker", value("e-maker"), "Pointer only; maker remains in the authoritative record"],
        ["Decision record / minutes ref", value("e-record"), "AIG-DEC-03 / native minutes remain the authoritative record"],
        ["Decision", decision, "Pointer only; verify against the authoritative record"],
        ["Authority / delegation reference", value("e-authority"), "AIG-AGT-04 reference; verify exact scope"],
        ["Handover boundary", "Pointer only — not the decision record", "Do not replace, copy or treat this handover as the authoritative record"]
      ], value("c-air"));
      if (conditionStarted) {
        addDownload(downloads, "AIG-DEC-04 event-linked Gate Condition", "AIG-DEC-04 Gate Condition draft (.csv)", [
          ["Condition ID", "", "Council assigns; do not invent"],
          ["Event ID", value("e-eventid"), "Existing verified Event ID; condition cannot be handed over without it"],
          ["AIR-ID derived", value("c-air"), "Derived from the verified parent system record"],
          ["action", value("e-condition"), "Copy only if present in the authorised decision"],
          ["owner", value("e-condition-owner"), "Confirm assignment"],
          ["due", value("e-condition-due"), "Confirm against the authorised decision"],
          ["state", value("e-condition-state"), "Use current controlled state; tool does not close a condition"],
          ["resolved/waived on", value("e-condition-resolved"), "Leave blank unless resolution/waiver is recorded"],
          ["resolution evidence/waiver authority", value("e-condition-evidence"), "Reference actual evidence or authority only"]
        ], value("c-air"));
      }
    }

    const mandatory = triggers.length > 0;
    const body = [
      '<div class="' + (mandatory ? "caution" : "positive") + '"><strong>' +
        (mandatory ? "Documented reassessment indicated" : "No selected trigger") + "</strong>" +
        (mandatory ? " · " + safe(triggers.join("; ")) : " · Owner still reviews this change; no trigger selected is not assurance of safety.") + "</div>",
      risk ? "<p>AIG-ASS-02 confirms inherent risk as L × highest confirmed impact = " +
        safe(risk.inherent) + " and residual risk as inherent × control factor (C ÷ 5) = " + safe(risk.residual) +
        ". Its control-effectiveness scale is 1 (very strong) to 5 (ineffective). A residual tier is <strong>not calculated</strong> because the worksheet does not specify its tier bands. " +
        (value("c-current-tier") ? "Entered current tier for comparison only: " + safe(value("c-current-tier")) + ". " : "") +
        "Assessor confirms directly in AIG-ASS-02; no tier, approval, permission, AGPI priority or legal applicability is inferred.</p>" :
        "<p>Risk arithmetic not calculated: complete all five impact dimensions, likelihood and control effectiveness. The residual score then follows AIG-ASS-02 arithmetic; residual tier bands remain unspecified and no tier will be inferred.</p>",
      '<p><strong>Workbook boundaries:</strong> AIG-INV-04 Register, AIG-DEC-04 Gate Log and proposed controlled AIG-INV-05 Capabilities and System Map are separate standalone draft workbooks, not approved/live records. AIG-INV-04 keeps the permanent issued AIR-ID and current assurance state; AIG-DEC-04 separates prospective plan, dated event and event-linked conditions. The map is a relationship catalogue, not a second Register. These downloads are draft field/value handovers, not exact worksheet rows.</p>',
      triggers.some((trigger) => trigger.toLowerCase().includes("authority")) ?
        '<div class="caution"><strong>Agent authority:</strong> confirm the exact authorised permissions / delegation in AIG-AGT-04. This tool does not set or change agent authority.</div>' : "",
      '<p class="small">AGPI is prioritisation only. Equality Act s149, HRA s6, privacy and other case-specific duties need screening at every tier. Conditional EU AI Act, ATRS and procurement duties require confirmation by the case-specific legal / procurement owner.</p>'
    ].join("");
    resultCard("c-results", "Change handovers prepared", body, downloads);
  }

  function monitoringSubmit(event) {
    event.preventDefault();
    clearOutput("m-results", "m-error");
    const validationError = G.validateMonitoring({
      airId: value("m-air"), airIdVerified: isChecked("m-air-verified"),
      system: value("m-system"),
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
    const resultEntries = [
      ["AIR-ID", value("m-air"), "User-confirmed against current AIG-INV-04; owner rechecks"],
      ["AI System / Service", value("m-system"), "Required system identity; reconcile to current AIG-INV-04"],
      ["Monitoring Period", value("m-period"), "Confirm"],
      ["Review Date", value("m-date"), "Enter actual review date"],
      ["Monitoring Owner", value("m-owner"), "Confirm responsibility"],
      ["Metric Category", value("m-category"), "Confirm controlled category if applicable"],
      ["Metric / Indicator", value("m-metric"), "Confirm monitoring plan"],
      ["Approved Threshold / Tolerance", value("m-threshold"), "Verify approved threshold source"],
      ["Actual Result", value("m-actual"), "Interpret only with the separate observed-result state"],
      ["Observed-result state", value("m-result-state"), "Explicitly distinguishes observed zero, non-zero, blank/unknown and not applicable"],
      ["Observed-result state note", value("m-result-reason"),
        value("m-result-reason") ? "Reason supplied for blank/unknown or not-applicable result" : "Blank — result is observed"],
      ["Trend", value("m-trend"), "Owner interprets; Unknown is distinct from Stable"],
      ["Threshold Breach?", value("m-breach"), "Owner confirms"],
      ["Severity", value("m-severity"), "Triage only; owner confirms"],
      ["Action / Decision", value("m-action"), "Confirm against controlled record"],
      ["Action Owner", value("m-action-owner"), "Confirm responsibility"],
      ["Due Date", value("m-due-date"), "Actual recorded due date; blank if none"],
      ["Incident / CAPA Ref", value("m-incident-ref"), "Existing reference only; do not invent"],
      ["Material Change?", value("m-material"), "Owner confirms"],
      ["Risk Reassessment Required?", value("m-reassessment"), "Owner disposition; tool separately raises review signals"],
      ["Residual Risk After Review", value("m-residual-risk"), "Owner-entered result only; no calculation by this tool"],
      ["Governance Escalation?", value("m-escalation"), "Owner confirms"],
      ["Gate Log Ref", value("m-gate-ref"), "Existing AIG-DEC-04 reference only"],
      ["Complaints / Challenges", value("m-challenge"), "Use AIG-OPS-04 where applicable; no outcome determined"],
      ["Human Override Rate / Trend", value("m-human-override"), "Observed value / trend; distinguish blank from zero"],
      ["Evidence Location", value("m-evidence"), "Native evidence remains at source; AIG-INV-04 Evidence Index holds a versioned pointer"],
      ["Next Review Date", value("m-next-date"), "Enter only a planned/recorded date"],
      ["Review status", value("m-status"), "Draft status only; no condition / approval is closed"],
      ["Sample Source / Population of Record", value("m-source"), "Required by AIG-OPS-02 for every result"],
      ["Selection Basis", value("m-selection"), "Required by AIG-OPS-02 for every result"],
      ["Population Size", value("m-population"), "Separate denominator; zero only for an empty population"],
      ["Sample Size Reviewed", value("m-sample"), "Separate numerator; blank is not zero"],
      ["Sampling Window", value("m-window"), "Required by AIG-OPS-02 for every result"],
      ["Sample selection reproduction detail", value("m-sample-method"), "Method/seed/draw date for random selection; explicit not-applicable otherwise"],
      ["Highest-impact decisions reviewed in full?", value("m-high-impact"), "AIG-OPS-02 sampling method requires full review of highest-impact decision types"],
      ["Highest-impact decision review note", value("m-high-impact-detail"), "Record reviewed types or explain the gap / unknown"],
      ["Evidence version", value("m-evidence-version"), "Supplemental provenance; verify against native evidence"],
      ["Evidence checked by", value("m-checker"), "Supplemental provenance; reviewer identity"],
      ["Evidence data cut / as-at", value("m-data-cut"), "Supplemental provenance; distinct from review date"],
      ["Observed metric denominator", value("m-observed-denominator"), "Separate metric denominator; not the sampling population"],
      ["Observed-denominator state", value("m-denominator-state"), "Explicitly distinguishes observed zero, positive, blank/unknown and not applicable"],
      ["Denominator context / source", value("m-denominator"), "Explain source; blank/unknown or not applicable requires a reason"],
      ["Control-failure review signal", value("m-control-failure") + (value("m-control-failure-detail") ? " — " + value("m-control-failure-detail") : ""), "Control failure triggers documented consideration of reassessment"],
      ["Access-expansion review signal", value("m-access-expansion") + (value("m-access-expansion-detail") ? " — " + value("m-access-expansion-detail") : ""), "Expanded access triggers documented consideration of reassessment"],
      ["Reassessment handoff signal", reassessment ? "Yes — owner assessment needed" : "No affirmative trigger selected",
        "Signals are not a decision; owner records rationale and disposition"]
    ].concat(screeningRows(screening));
    const body = [
      '<div class="' + (reassessment ? "caution" : "positive") + '"><strong>' +
        (reassessment ? "Reassessment handover indicated" : "Monitoring draft prepared") +
        "</strong> · " + (reassessment ?
          "A breach, material change, deteriorating trend, control failure, access expansion or reassessment signal was selected. Open Assess a change; the change owner decides and documents reassessment." :
          "No automatic trigger was selected. The monitoring owner still reviews the result and controlled record.") + "</div>",
      '<p class="small">AIG-OPS-02 output follows Monitoring Log fields and requires a sampling frame for every result. Population and sample remain separate. It separately identifies evidence version, checker, data cut, denominator/blank-vs-zero context and review signals. This is a draft handover, not a live row. Evidence remains in its native source; verify the current record and workbook version.</p>',
      value("m-challenge") ? '<div class="section-note"><strong>Challenge route:</strong> consider AIG-OPS-04 for contestability and redress. This tool does not decide a challenge.</div>' : ""
    ].join("");
    const downloads = [{
      label: "AIG-OPS-02 monitoring handover (.csv)",
      filename: "AIG-OPS-02_monitoring_draft_" + G.fileKey(value("m-air")) + ".csv",
      contents: G.handoverCsv("AIG-OPS-02 monitoring field/value handover", resultEntries)
    }];
    const actions = [];
    if (reassessment) {
      actions.push({
        label: "Carry context to Assess a change",
        run: function () {
          byId("c-air").value = value("m-air");
          byId("c-air-verified").checked = true;
          byId("c-system").value = value("m-system");
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
    resultCard("m-results", "Monitoring handover prepared", body, downloads, actions);
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
  }

  init();
})();