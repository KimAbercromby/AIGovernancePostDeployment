# AI Post-Deployment Governance Router

A public, static working aid for the operate-and-monitor part of the AI governance lifecycle. It preserves three user tasks: incident triage, change reassessment and monitoring review. It produces draft handovers only; it is not a system of record, legal decision, approval workflow or runtime control.

**Suite status:** the integrated Westminster AI governance suite referenced by this tool is a proposed draft for Council review, not an approved or live suite. This tool must not be described as Council-approved.

## Workflows

- **Report an incident** — provisionally classifies selected severity indicators, suggests an internal route and indicative deadline, highlights a suspected personal-data-breach referral, and prepares a field/value draft for WCC-AIG-19. A WCC-AIG-30 draft is optional and labelled for owner review; incident severity does not establish an AIMS nonconformity.
- **Assess a change** — collects reassessment triggers and optional inputs for an indicative residual-risk calculation. It prepares WCC-AIG-07 and, when relevant, current-state review handovers. It can separately prepare a prospective **Gate Plan**, a dated **Gate Event** handover only after the user confirms a real authorised decision, and an event-linked **Gate Condition** handover. The condition export does not invent an event ID; the 36 owner links it after logging the event.
- **Log monitoring** — requires an existing AIR-ID confirmed against the current register, review period/date and owner, indicator, approved threshold, observed result and evidence location. Metric category is optional. It hands breach, material change or deteriorating trend to the change workflow. Optional sampling fields must be completed together.

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

The automated checks cover incident severity floors and deadline arithmetic, residual-risk scoring, screening requirements, safe draft CSV handovers, file/HTML escaping, and static page governance boundaries.

## Limitations

- Draft handovers intentionally do not claim to match live or exact 05/36/39 worksheet headers. A controlled-record owner must verify the current integrated workbook and map fields before transfer.
- The user attests that an entered AIR-ID, decision and references are real; this static tool cannot verify a record or delegation.
- Business-day calculations exclude weekends but not bank holidays. Internal route labels and timescales need validation against current approved procedures.
- The application is an aid, not an assurance control, records-management system, case-management tool or legal advice.