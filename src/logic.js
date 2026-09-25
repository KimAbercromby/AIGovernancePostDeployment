(function (root) {
  "use strict";

  const SEVERITY_ORDER = ["Low", "Medium", "High", "Critical"];
  const SCREENING_KEYS = ["equality", "humanRights", "privacy", "other"];
  const ROUTES = {
    Low: {
      recipient: "Service Owner",
      target: "Routine management route; record and review under the current approved procedure.",
      deadline: "10 working days (indicative internal aid)"
    },
    Medium: {
      recipient: "AI Governance Lead",
      target: "Notify and agree a documented remediation / review route.",
      deadline: "5 working days (indicative internal aid)"
    },
    High: {
      recipient: "AI Governance Lead and relevant governance forum",
      target: "Escalate for documented review of impacts, controls and reassessment.",
      deadline: "2 working days (indicative internal aid)"
    },
    Critical: {
      recipient: "AI Governance Lead, relevant executive and assurance owners",
      target: "Immediate escalation and consideration of containment and specialist referrals.",
      deadline: "24 hours (indicative internal aid)"
    }
  };

  function text(value) {
    return value == null ? "" : String(value).trim();
  }

  function severity(indicators, aggregate, uplift) {
    let floor = "Low";
    const selected = Array.isArray(indicators) ? indicators : [];
    selected.forEach(function (level) {
      if (SEVERITY_ORDER.indexOf(level) > SEVERITY_ORDER.indexOf(floor)) floor = level;
    });
    let aggregated = false;
    if (aggregate) {
      const index = SEVERITY_ORDER.indexOf(floor);
      if (index < SEVERITY_ORDER.length - 1) {
        floor = SEVERITY_ORDER[index + 1];
        aggregated = true;
      }
    }
    const uplifted = SEVERITY_ORDER.indexOf(uplift) > SEVERITY_ORDER.indexOf(floor);
    if (uplifted) floor = uplift;
    return { level: floor, aggregated: aggregated, uplifted: uplifted };
  }

  function addWorkingDays(dateValue, count) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;
    let added = 0;
    while (added < count) {
      date.setDate(date.getDate() + 1);
      if (date.getDay() !== 0 && date.getDay() !== 6) added += 1;
    }
    return date;
  }

  function deadlineFor(level, identifiedAt) {
    const identified = new Date(identifiedAt);
    if (!identifiedAt || Number.isNaN(identified.getTime())) return null;
    if (level === "Critical") {
      return new Date(identified.getTime() + 24 * 60 * 60 * 1000);
    }
    const days = level === "High" ? 2 : level === "Medium" ? 5 : 10;
    return addWorkingDays(identified, days);
  }

  function tierFor(score) {
    if (score <= 5) return "Low";
    if (score <= 10) return "Medium";
    if (score <= 15) return "High";
    return "Critical";
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
    const residual = Math.round(inherent * c / 5 * 10) / 10;
    return { impact, likelihood: l, control: c, inherent, residual, tier: tierFor(residual) };
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
      return "Enter an existing AIR-ID and confirm it was checked against the current WCC-AIG-05. This tool cannot issue or verify identifiers.";
    }
    if (!text(data.metric)) {
      return "Enter the monitoring indicator; metric category is an optional classification.";
    }
    const required = ["period", "date", "owner", "threshold", "actual", "evidence"];
    if (required.some((key) => !text(data[key]))) {
      return "For a monitoring handover, period, actual review date, monitoring owner, indicator, approved threshold/tolerance, actual result and evidence location are all required.";
    }
    if (!text(data.breach) || !text(data.material) || !text(data.escalation) || !text(data.status)) {
      return "Confirm threshold breach, material change, governance escalation and review status.";
    }
    if (data.breach === "Yes" && !text(data.severity)) {
      return "Choose a provisional severity for the reported breach; an authorised owner confirms it.";
    }
    const samples = ["source", "selection", "population", "sample", "window"].map((key) => text(data[key]));
    const sampleStarted = samples.some(Boolean);
    if (sampleStarted && samples.some((item) => !item)) {
      return "Complete all five sampling fields or clear all five if no sample was taken.";
    }
    if (sampleStarted && (!/^\d+$/.test(text(data.population)) || !/^\d+$/.test(text(data.sample)) ||
      Number(data.sample) < 1 || Number(data.sample) > Number(data.population))) {
      return "Population and sample sizes must be whole numbers; sample size must be between one and the population size.";
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
    deadlineFor,
    escapeHtml,
    fileKey,
    handoverCsv,
    screenMissing,
    screeningEntries,
    severity,
    text,
    tierFor,
    validateMonitoring
  };
  root.GovernanceLogic = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);