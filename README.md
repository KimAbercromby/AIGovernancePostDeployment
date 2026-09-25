# AI Post-Deployment Governance Router

A public, static working aid for the operate-and-monitor part of the AI governance lifecycle. It preserves three user tasks: incident triage, change reassessment and monitoring review. It produces draft handovers only; it is not a system of record, legal decision, approval workflow or runtime control.

**Suite status:** the integrated Westminster AI governance suite referenced by this tool is a proposed draft for Council review, not an approved or live suite. This tool must not be described as Council-approved.

## Workflows

- **Report an incident** — captures WCC-AIG-19 Part A contact, identification source, classification, what/when/how discovered, system activity, affected data/decision impact, immediate action, selected severity indicators and any manual-uplift rationale. Part A is to be submitted as soon as the incident is identified; no severity-based deadlines are added. An optional, separate Part B pointer captures controller-awareness and the competent owner’s rights-risk/DPO-informed notifiability assessment without making a legal finding. A WCC-AIG-30 draft remains optional and labelled for owner review.
- **Assess a change** — collects reassessment triggers and WCC-AIG-07 risk inputs. It mirrors the worksheet’s residual formula (inherent score × control factor C/5), but does not infer residual tier bands absent from the worksheet. It prepares WCC-AIG-07 and, when relevant, a contextual WCC-AIG-05 review handover that does not update the current register. Gate Plan, Gate Condition and Gate Event transfer-checklist downloads use the integrated WCC-AIG-36 fields; IDs are never invented. The Gate Event checklist requires actual decision, authority and evidence references, but its decision/state controlled-value mapping remains pending owner confirmation and it is not an authoritative event record.
- **Log monitoring** — requires a verified existing AIR-ID, system identity, review evidence and disposition, plus evidence version/checker/data cut. It keeps the observed metric denominator and observed-result state (including zero versus blank/unknown/not applicable) distinct from the sampling population and sample size, and includes reproducibility/high-impact review and control-failure/access-expansion signals.

## Governance boundaries

- The proposed 05/36 design is one integrated workbook. **05** owns the permanent Council-issued AIR-ID and current assurance state. **36** separates prospective Gate Plans, dated Gate Events and event-linked Gate Conditions. Downloads from this tool are field/value drafts, not exact worksheet rows. Verify the current workbook headers and controlled lists before transferring any values.
- The formal decision remains in WCC-AIG-16 or authorised native forum minutes; a Gate Event points to that record. WCC-AIG-45 governs agent authority and delegations. A role, score, forum label, handover or assurance opinion is not itself authority or approval.
- No workflow creates an AIR-ID, event ID, approval, permission, legal scope finding, FRIA completion, publication or ISO conformity. The tool never connects to or updates a Council workbook, does not persist form data, and has no telemetry, account or upload.
- AGPI is a prioritisation aid, not a waiver. Every tier requires case-specific screening for Equality Act 2010 section 149, Human Rights Act 1998 section 6, privacy/data protection and other applicable duties. The screening prompts confirm only that a matter was recorded or referred; they do not decide legal applicability or establish compliance.
- EU AI Act, ATRS and procurement requirements are conditional. A case-specific legal or procurement owner must confirm applicability. Suspected personal data breaches should be referred to the DPO / Information Governance owner; this tool does not determine reportability or make a notification.
- Risk calculations and incident routes are indicative. Review them against the current approved procedure, controlled assessment, competent owner and relevant holiday calendar before reliance.

Do not enter residents' names, case records, special-category data or other unnecessary personal information. Keep evidence in its native source and use approved, versioned pointers when recording evidence references.

## Static deployment

There are no runtime or build dependencies. Deploy **both** `index.html` and the `src/` directory at the same path on GitHub Pages (for example, the repository root on the Pages branch). The HTML loads the maintainable plain JavaScript modules at `src/logic.js` and `src/app.js`; keep those relative paths intact. No server, API, bundler or credentials are needed.

For local checks, run:

```sh
node --check src/logic.js
node --check src/app.js
node --test qa-smoke.test.cjs
```

The automated checks cover incident and optional Part B validation barriers, WCC-AIG-07 score arithmetic without unsupported tiers, Gate Plan/Event/Condition barriers and field names, WCC-AIG-39 identity/provenance/sampling validation, screening requirements, safe draft CSV handovers, file/HTML escaping, and static page governance boundaries.

## Limitations

- Draft handovers intentionally do not claim to match live or exact 05/36/39 worksheet headers. A controlled-record owner must verify the current integrated workbook and map fields before transfer.
- The user attests that an entered AIR-ID, decision, authority and evidence references are real; this static tool cannot verify a record, delegation or local controlled-value mapping.
- Business-day calculations exclude weekends but not bank holidays. Internal route labels and timescales need validation against current approved procedures.
- The application is an aid, not an assurance control, records-management system, case-management tool or legal advice.