(function () {
  "use strict";
  const G = window.GovernanceLogic;
  const byId = (id) => document.getElementById(id);
  const value = (id) => G.text(byId(id).value);
  const isChecked = (id) => byId(id).checked;
  const safe = G.escapeHtml;
  const screenLabels = ["equality", "humanRights", "privacy", "other"];

  function formatDate(date) {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }).format(date);
  }

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
      setError("i-error", "If you enter an AIR-ID, confirm it is an existing Council-issued identifier checked against the current 05 register.");
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
    const route = G.ROUTES[assessment.level];
    const deadline = G.deadlineFor(assessment.level, value("i-date"));
    const dataBreach = selectedIndicators.some((input) =>
      input.parentElement.textContent.toLowerCase().includes("data breach")
    );
    const indicators = selectedIndicators.map((input) => input.parentElement.textContent.trim());
    const affected = Array.from(byId("incident-form").querySelectorAll("[data-affected]:checked"))
      .map((input) => input.parentElement.textContent.trim());
    const html = [
      '<div class="positive"><strong>Provisional severity: ' + safe(assessment.level) + '</strong> · ' +
        safe(route.recipient) + ' · Indicative route: ' + safe(route.deadline) + '</div>',
      "<p>" + safe(route.target) + (deadline ? " Target date calculation: " + safe(formatDate(deadline)) + "." : "") +
        " Confirm against the current approved procedure, named owner and holiday calendar before use.</p>",
      indicators.length ? "<p><strong>Selected indicators:</strong> " + safe(indicators.join("; ")) + "</p>" :
        "<p>No indicator selected; Low is the provisional starting point only.</p>",
      assessment.aggregated ? "<p>Aggregation raised the provisional floor by one level.</p>" : "",
      assessment.uplifted ? "<p>Manual uplift: " + safe(value("i-uplift")) + " — " +
        safe(value("i-uplift-reason") || "reason not entered") + ".</p>" : "",
      dataBreach ? '<div class="caution"><strong>Suspected personal data breach:</strong> refer promptly to the DPO / Information Governance owner. Record the controller-awareness time separately; only the responsible owner determines any UK GDPR notification duty and clock. This tool does not decide breach status or notify anyone.</div>' : "",
      '<p class="small"><strong>WCC-AIG-19:</strong> Part A is a draft text handover. Transfer only into the controlled form after review. This tool creates no incident record or external notification.</p>',
      isChecked("i-capa") ? '<div class="caution"><strong>WCC-AIG-30:</strong> optional CAPA request is a draft field/value handover only. The AIMS owner must determine nonconformity classification, ID, corrective action and controlled workbook mapping.</div>' : "",
      '<p class="small">The decision, assurance state and severity remain for the authorised Council owner. A severe incident can prompt reassessment; it does not itself approve suspension, restart or a risk-tier change.</p>'
    ].join("");
    const partA = [
      ["Event type", value("i-kind"), "Confirm in the controlled WCC-AIG-19 form"],
      ["Reported by / team", value("i-reporter"), "Verify"],
      ["Reporter role / service team", value("i-role"), "Verify"],
      ["System / service", value("i-system"), "Confirm identity against current 05"],
      ["Existing AIR-ID", value("i-air"), "Optional; never invent. Confirm against current 05"],
      ["Date / time identified", value("i-date"), "Confirm controller-awareness time separately where privacy breach is suspected"],
      ["Description", value("i-description"), "Review for unnecessary personal data before transfer"],
      ["Potentially affected", affected.join("; "), "Avoid personal case details"],
      ["Potential impact / approximate number", value("i-impact"), "Use non-identifying summary"],
      ["Ongoing", value("i-ongoing"), "Confirm in the controlled incident form"],
      ["Immediate action", value("i-action"), "Owner confirms and records actual containment"],
      ["Provisional severity", assessment.level, "Draft triage only; authorised owner confirms"],
      ["Selected severity indicators", indicators.join("; "), "Review against current incident procedure"],
      ["Provisional internal route", route.recipient + " — " + route.deadline, "Confirm current approved routing and deadline"]
    ];
    const outputs = [{
      label: "WCC-AIG-19 Part A draft (.csv)",
      filename: "WCC-AIG-19_PartA_draft_" + G.fileKey(value("i-air")) + ".csv",
      contents: G.handoverCsv("WCC-AIG-19 Part A text handover", handoverEntries(partA, screening))
    }];
    if (isChecked("i-capa")) {
      outputs.push({
        label: "WCC-AIG-30 CAPA draft (.csv)",
        filename: "WCC-AIG-30_CAPA_draft_" + G.fileKey(value("i-air")) + ".csv",
        contents: G.handoverCsv("WCC-AIG-30 CAPA field/value draft", handoverEntries([
          ["Related existing AIR-ID", value("i-air"), "Confirm in current 05; optional, do not invent"],
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
    if (!risk) return [["Indicative residual risk", "Not calculated", "Complete all five impact scores, likelihood and control effectiveness"]];
    return [
      ["Highest impact dimension score", risk.impact, "Indicative input; assessor verifies"],
      ["Likelihood", risk.likelihood, "Indicative input; assessor verifies"],
      ["Control effectiveness", risk.control, "Indicative input; assessor verifies"],
      ["Indicative inherent risk", risk.inherent, "Transfer to WCC-AIG-07 for assessor confirmation"],
      ["Indicative residual risk", risk.residual, "Not an assurance result"],
      ["Indicative residual tier", risk.tier, "Not AGPI, effective tier, legal screening or approval"]
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
    if (!value("c-air") || !isChecked("c-air-verified")) {
      setError("c-error", "Enter an existing AIR-ID and confirm it was checked against the current WCC-AIG-05. This tool cannot issue or verify identifiers.");
      return;
    }
    if (!value("c-system")) {
      setError("c-error", "Enter the system/service name so the owner can reconcile the handover.");
      return;
    }
    const screening = getScreening(byId("change-form"));
    const dutyError = screeningError(screening);
    if (dutyError) {
      setError("c-error", dutyError);
      return;
    }

    const decision = value("e-decision");
    const conditionValues = [value("e-condition"), value("e-condition-owner"), value("e-condition-due")];
    const conditionStarted = conditionValues.some(Boolean);
    if (conditionStarted && conditionValues.some((item) => !item)) {
      setError("c-error", "For a Gate Condition draft, complete condition text, owner and due date; otherwise leave all three blank.");
      return;
    }
    if (decision && (!value("e-date") || !value("e-forum") || !value("e-maker") ||
      !value("e-record") || !value("e-authority") || !isChecked("e-confirmed"))) {
      setError("c-error", "A dated Gate Event handover needs the actual decision date, forum, decision-maker, existing WCC-AIG-16/native minutes reference and WCC-AIG-45 authority reference, plus confirmation it is a real authorised decision. Otherwise leave the decision pending.");
      return;
    }
    if (conditionStarted && !decision) {
      setError("c-error", "A Gate Condition must link to an actual event. Complete the authorised Gate Event details first; no event ID is fabricated.");
      return;
    }

    const triggers = Array.from(byId("change-form").querySelectorAll("[data-trigger]:checked"))
      .map((input) => input.parentElement.textContent.trim());
    const risk = G.calculateRisk(selectedImpacts(), value("c-likelihood"), value("c-control"));
    const planEntries = [
      ["Existing AIR-ID", value("c-air"), "Confirmed by user against current 05; owner rechecks"],
      ["Planned gate / review point", value("p-gate"), "Prospective plan only; not a Gate Event or approval"],
      ["Target date", value("p-date"), "Planned date only"],
      ["Planning owner / role", value("p-owner"), "Confirm assignment"],
      ["Planned criteria / evidence", value("p-criteria"), "Confirm against approved plan"],
      ["Plan / event distinction", "Prospective Gate Plan", "No event ID, decision or condition status is created"]
    ];
    const planStarted = [value("p-gate"), value("p-date"), value("p-owner"), value("p-criteria")].some(Boolean);
    if (planStarted && [value("p-gate"), value("p-date"), value("p-owner"), value("p-criteria")].some((item) => !item)) {
      setError("c-error", "For a prospective Gate Plan handover, complete gate/review point, target date, planning owner and criteria; otherwise leave the plan fields blank.");
      return;
    }

    const riskEntries = [
      ["Existing AIR-ID", value("c-air"), "Recheck current WCC-AIG-05"],
      ["System / service", value("c-system"), "Reconcile to existing system record"],
      ["Reason for reassessment", value("c-description"), "Assessor records source evidence"],
      ["Reassessment triggers", triggers.join("; ") || "None selected", "Owner confirms against current procedure"]
    ].concat(formatRiskEntries(risk), screeningRows(screening));
    const currentStateEntries = [
      ["Existing AIR-ID", value("c-air"), "Permanent Council-issued identifier; retain as recorded in 05"],
      ["Current assurance state", "Not read or changed by this tool", "Verify directly in current integrated 05/36 workbook"],
      ["Change / reassessment context", value("c-description"), "Owner determines any current-state change"],
      ["Indicative residual score and tier", risk ? risk.residual + " / " + risk.tier : "Not calculated", "Draft assessment value only; do not treat as current 05 status"],
      ["Approval / operational status", "No value proposed", "Never inferred from a score or draft handover"],
      ["Register field mapping", "Not supplied", "Map against exact current 05 headers; this file is not a worksheet row"]
    ].concat(screeningRows(screening));
    const downloads = [];
    addDownload(downloads, "WCC-AIG-07 risk assessment", "WCC-AIG-07 assessment draft (.csv)", riskEntries, value("c-air"));
    if (triggers.length) {
      addDownload(downloads, "WCC-AIG-05 current-state review", "WCC-AIG-05 review handover (.csv)", currentStateEntries, value("c-air"));
    }
    if (planStarted) {
      addDownload(downloads, "WCC-AIG-36 prospective Gate Plan", "WCC-AIG-36 Gate Plan draft (.csv)",
        planEntries.concat(screeningRows(screening)), value("c-air"));
    }
    if (decision) {
      const eventEntries = [
        ["AIR-ID", value("c-air"), "Permanent ID; recheck against current 05"],
        ["System / service", value("c-system"), "Verify identity"],
        ["Event ID", "Not assigned", "Gate Log owner assigns in current WCC-AIG-36"],
        ["Gate Event date", value("e-date"), "Actual event date; confirm"],
        ["Forum / decision route", value("e-forum"), "Verify authority and forum remit"],
        ["Actual decision", decision, "Copy only from the formal WCC-AIG-16/native minutes record"],
        ["Decision-maker / role", value("e-maker"), "Verify in formal record"],
        ["Formal decision record reference", value("e-record"), "WCC-AIG-16 or authorised native minutes; decision remains there"],
        ["Authority / delegation reference", value("e-authority"), "Verify current authority in WCC-AIG-45"],
        ["Event status", "Draft handover only", "Do not treat as approval, approval evidence or a live Gate Event row"],
        ["Exact 36 field mapping", "Not supplied", "Transfer only after checking exact headers in the current integrated 05/36 workbook"]
      ].concat(screeningRows(screening));
      addDownload(downloads, "WCC-AIG-36 dated Gate Event", "WCC-AIG-36 Gate Event draft (.csv)", eventEntries, value("c-air"));
      addDownload(downloads, "WCC-AIG-16 decision record pointer", "Decision record pointer draft (.csv)", [
        ["Formal decision record", value("e-record"), "Authoritative decision remains in WCC-AIG-16 or authorised native minutes"],
        ["Decision", decision, "Verify against the signed / authorised record"],
        ["Authority / delegation", value("e-authority"), "WCC-AIG-45 permissions; verify exact scope"]
      ].concat(screeningRows(screening)), value("c-air"));
      if (conditionStarted) {
        addDownload(downloads, "WCC-AIG-36 event-linked Gate Condition", "WCC-AIG-36 Gate Condition draft (.csv)", [
          ["AIR-ID", value("c-air"), "Recheck against current 05"],
          ["Linked Event ID", "Owner to enter after event is logged", "Do not invent an event ID; link to the exact dated Gate Event"],
          ["Formal decision reference", value("e-record"), "This condition must remain linked to that event / 16 decision"],
          ["Condition", value("e-condition"), "Copy only if present in the authorised decision"],
          ["Condition owner", value("e-condition-owner"), "Confirm assignment"],
          ["Due date", value("e-condition-due"), "Confirm against the authorised decision"],
          ["Condition status", "Not assessed", "Owner updates against evidence; this tool does not close a condition"]
        ].concat(screeningRows(screening)), value("c-air"));
      }
    }

    const mandatory = triggers.length > 0;
    const body = [
      '<div class="' + (mandatory ? "caution" : "positive") + '"><strong>' +
        (mandatory ? "Documented reassessment indicated" : "No selected trigger") + "</strong>" +
        (mandatory ? " · " + safe(triggers.join("; ")) : " · Owner still reviews this change; no trigger selected is not assurance of safety.") + "</div>",
      risk ? "<p>Indicative calculation: residual <span class=\"tier\">" + safe(risk.residual) + " · " + safe(risk.tier) +
        "</span> (L " + risk.likelihood + " × highest impact " + risk.impact + " × C/5 " + (risk.control / 5) +
        "). " + (value("c-current-tier") ? "Current tier entered for comparison: " + safe(value("c-current-tier")) + ". " : "") +
        "Confirm in WCC-AIG-07. It does not set the effective tier, approval, permission, AGPI priority or legal applicability.</p>" :
        "<p>Residual score not calculated: enter all five impact dimensions, likelihood and control effectiveness to prepare that optional indicative calculation.</p>",
      '<p><strong>05/36 boundary:</strong> proposed 05/36 is one integrated workbook. 05 keeps the permanent issued AIR-ID and current assurance state; 36 separates prospective plan, dated event and event-linked conditions. These downloads are draft field/value handovers, not exact worksheet rows.</p>',
      triggers.some((trigger) => trigger.toLowerCase().includes("authority")) ?
        '<div class="caution"><strong>Agent authority:</strong> confirm the exact authorised permissions / delegation in WCC-AIG-45. This tool does not set or change agent authority.</div>' : "",
      '<p class="small">AGPI is prioritisation only. Equality Act s149, HRA s6, privacy and other case-specific duties need screening at every tier. Conditional EU AI Act, ATRS and procurement duties require confirmation by the case-specific legal / procurement owner.</p>'
    ].join("");
    resultCard("c-results", "Change handovers prepared", body, downloads);
  }

  function monitoringSubmit(event) {
    event.preventDefault();
    clearOutput("m-results", "m-error");
    const validationError = G.validateMonitoring({
      airId: value("m-air"), airIdVerified: isChecked("m-air-verified"),
      category: value("m-category"), metric: value("m-metric"),
      period: value("m-period"), date: value("m-date"), owner: value("m-owner"),
      threshold: value("m-threshold"), actual: value("m-actual"), evidence: value("m-evidence"),
      breach: value("m-breach"), material: value("m-material"),
      escalation: value("m-escalation"), status: value("m-status"),
      severity: value("m-severity"), source: value("m-source"),
      selection: value("m-selection"), population: value("m-population"),
      sample: value("m-sample"), window: value("m-window")
    });
    if (validationError) {
      setError("m-error", validationError);
      return;
    }
    const sampleStarted = ["m-source", "m-selection", "m-population", "m-sample", "m-window"]
      .some((id) => value(id));
    const screening = getScreening(byId("monitor-form"));
    const dutyError = screeningError(screening);
    if (dutyError) {
      setError("m-error", dutyError);
      return;
    }

    const reassessment = value("m-breach") === "Yes" || value("m-material") === "Yes" ||
      value("m-trend") === "Deteriorating";
    const resultEntries = [
      ["Existing AIR-ID", value("m-air"), "User-confirmed against current 05; owner rechecks"],
      ["System / service", value("m-system"), "Confirm identity"],
      ["Monitoring period", value("m-period"), "Confirm"],
      ["Review date", value("m-date"), "Enter actual review date"],
      ["Monitoring owner", value("m-owner"), "Confirm responsibility"],
      ["Metric category", value("m-category"), "Confirm controlled category if applicable"],
      ["Metric / indicator", value("m-metric"), "Confirm monitoring plan"],
      ["Approved threshold / tolerance", value("m-threshold"), "Verify approved threshold source"],
      ["Actual result", value("m-actual"), "Record observed result"],
      ["Trend", value("m-trend"), "Owner interprets"],
      ["Threshold breach", value("m-breach"), "Owner confirms"],
      ["Provisional severity", value("m-severity"), "Triage only; owner confirms"],
      ["Material change", value("m-material"), "Owner confirms"],
      ["Governance escalation", value("m-escalation"), "Owner confirms"],
      ["Review status", value("m-status"), "Draft status only; no condition / approval is closed"],
      ["Action / follow-up", value("m-action"), "Confirm owner and due date in controlled record"],
      ["Challenge / complaint signal", value("m-challenge"), "Use WCC-AIG-41 where applicable; no outcome determined"],
      ["Sampling source", value("m-source"), "Only if sampling performed"],
      ["Sampling basis", value("m-selection"), "Only if sampling performed"],
      ["Population / sample size", sampleStarted ? value("m-population") + " / " + value("m-sample") : "", "Validate evidence and methodology"],
      ["Sampling window", value("m-window"), "Only if sampling performed"],
      ["Evidence location", value("m-evidence"), "Native evidence remains at source; 05 Evidence Index holds a versioned pointer"],
      ["Reassessment indicated", reassessment ? "Yes — hand over for assessment" : "No selected automatic trigger",
        "Owner considers reassessment; tool does not close a signal"]
    ].concat(screeningRows(screening));
    const body = [
      '<div class="' + (reassessment ? "caution" : "positive") + '"><strong>' +
        (reassessment ? "Reassessment handover indicated" : "Monitoring draft prepared") +
        "</strong> · " + (reassessment ?
          "Breach, material change or deteriorating trend was selected. Open Assess a change; the change owner decides and documents reassessment." :
          "No automatic trigger was selected. The monitoring owner still reviews the result and controlled record.") + "</div>",
      '<p class="small">WCC-AIG-39 output is a draft field/value handover, not a live row. Check current headers and controlled lists before transfer. Evidence remains in its native source; record a versioned evidence pointer.</p>',
      value("m-challenge") ? '<div class="section-note"><strong>Challenge route:</strong> consider WCC-AIG-41 for contestability and redress. This tool does not decide a challenge.</div>' : ""
    ].join("");
    const downloads = [{
      label: "WCC-AIG-39 monitoring handover (.csv)",
      filename: "WCC-AIG-39_monitoring_draft_" + G.fileKey(value("m-air")) + ".csv",
      contents: G.handoverCsv("WCC-AIG-39 monitoring field/value handover", resultEntries)
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
              value("m-trend") === "Deteriorating" ? "deteriorating trend" : ""].filter(Boolean).join(", ");
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