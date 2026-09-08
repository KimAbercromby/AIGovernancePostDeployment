# AI Post-Deployment Governance Router

A single-page decision aid that supports the **operate-and-monitor** half of the AI governance lifecycle for a local authority. It sits alongside the AI Governance Triage Calculator and Lifecycle Walkthrough and covers what happens *after* a system goes live.

It is a **working aid, not a system of record.** Nothing it produces is an assurance record until it is saved into the controlled artefacts.

## What it does

Three tasks, behind one tab bar:

- **Report an incident** — classifies an AI incident by severity, routes it to the right forum on the right deadline, applies the data-breach overlay, and drafts a Part A for the Incident Report Form plus a row for the CAPA log.
- **Assess a change** — tests whether a material change means a documented reassessment is required, recalculates residual risk and tier the same way the Risk Assessment Worksheet does, and produces a Gate Log event and a formula-safe Register update.
- **Log monitoring** — records a monitoring result against a system's AIR-ID for the Monitoring & Review Log, keeps within-tolerance results as negative-assurance evidence, and hands a breach or deteriorating drift straight to *Assess a change*.

## How it maps to the framework

- Incident classification and escalation: Playbook §6.8 and §5.10
- Reassessment triggers: Playbook §4.5.6 and the post-deployment reassessment triggers
- Residual risk and tiering: Likelihood × Impact × (Control ÷ 5), highest impact dimension, tiered per §4.4.8 (≤5 Low, ≤10 Medium, ≤15 High, else Critical)

It feeds these artefacts: Incident Report Form (WCC-AIG-19), CAPA log (WCC-AIG-30), AI Register (WCC-AIG-05), Gate Log (WCC-AIG-36) and the Monitoring & Review Log (WCC-AIG-39). All emitted values use those artefacts' own controlled lists.

## Deploying

It is a single `index.html` with no dependencies and no build step.

1. Upload `index.html` to the repository root.
2. Settings → Pages → Deploy from a branch → `main` → `/ (root)`.
3. The tool is then live at the repository's GitHub Pages URL.

To update, edit or re-upload `index.html`; Pages redeploys automatically.

## Limitations

- A decision aid, not an assurance control. Outputs must be recorded in the controlled artefacts to have any evidential value.
- Escalation deadlines exclude weekends and do not account for bank holidays.
- Residual risk is re-entered by the user, not read from the Register, so the "before" comparison depends on correct current values.
- Register updates paste into a row the user identifies by number; check the target row's AIR-ID before pasting.

Draft, for Council review. Clause references should be validated against the Council's licensed copy of the controlled documents.
