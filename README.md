# AI Post-Deployment Governance Router

A public, static working aid for the operate-and-monitor part of the AI governance lifecycle. It preserves three user tasks: incident triage, change reassessment and monitoring review. It produces draft handovers only; it is not a system of record, legal decision, approval workflow or runtime control.

**Suite status:** the standalone AI governance workbook drafts referenced by this tool are proposed for review, not approved or live. This tool must not be described as approved.

## Workflows

- **Report an incident** — validates the required AIG-OPS-03 Part A fields, records its exact UC-ID scope or explicit shared system baseline / Unknown, provisionally classifies selected severity indicators and suggests an internal route without inventing severity-based deadlines. It highlights a suspected personal-data-breach referral. A separate Part B pointer is optional and remains subject to controller/DPO owner review. An AIG-AIMS-08 draft is optional and labelled for owner review; incident severity does not establish an AIMS nonconformity.
- **Assess a change** — requires the reassessment scope to be an exact UC-ID, explicit shared system baseline or Unknown; it collects triggers and optional inputs for AIG-ASS-02 risk arithmetic without inferring undocumented residual-risk tiers. It prepares AIG-ASS-02 and, when relevant, a current-state review handover with no register update. A prospective **Gate Plan**, dated **Gate Event** transfer checklist and event-linked **Gate Condition** each carry applicable scope. A UC-ID-specific Gate Event requires a per-UC decision reference and its permitted purpose, users, data, actions, exclusions and operating conditions. Existing Plan/Event IDs must be confirmed; no identifiers are created.
- The change workflow can also prepare a separate **AIG-INV-05 Capabilities and System Map** change-log handoff with a reassessment reference and an optional existing AIG-DEC-04 Gate Event ID. A new or expanded access edge requires a reassessment reference; the proposed map is a controlled catalogue entry only upon adoption, never grants permission, and AIG-AGT-04/AIG-AGT-05 authority records remain authoritative.
- **Log monitoring** — requires an existing AIR-ID confirmed against the current register, exact UC-ID for a use-specific measure or explicit shared-system-measure scope (Unknown is an explicit, non-shared option), review period/date and owner, indicator, approved threshold, explicit observed-result and denominator states, evidence provenance, review signals and a sampling frame for every result. Metric category is optional. It hands breach, material change, deteriorating trend, control failure or access expansion to the change workflow with scope preserved.

## Governance boundaries

- **AIG-INV-04, AIG-DEC-04 and proposed AIG-INV-05 are separate workbooks, not approved or live records.** **AIG-INV-04** owns one permanent Council-issued AIR-ID per system and its system-baseline assurance state; multiple UC-IDs may be linked to that one AIR-ID. A system-level Approved baseline is not approval for any UC-ID. Verify each use-specific decision in AIG-DEC-03 / approved minutes and its dated AIG-DEC-04 event, including exact permitted purpose, users, data, actions, exclusions and conditions. Do not infer approval or operational permission from system status, monitoring, risk scores, plans or handovers. **AIG-DEC-04** separates prospective Gate Plans, dated Gate Events and event-linked Gate Conditions. **AIG-INV-05** is proposed as a controlled relationship catalogue, not a second register; only existing issued AIR-IDs belong in its System map, while proposed UC → CAP relationships may be prepared without one. Downloads from this tool are field/value drafts, not exact worksheet rows. Verify each draft's headers and controlled lists before transferring any values.
- The formal decision remains in AIG-DEC-03 or authorised native forum minutes; a Gate Event points to that record. AIG-AGT-04 governs agent authority and delegations. A role, score, forum label, handover or assurance opinion is not itself authority or approval.
- No workflow creates an AIR-ID, event ID, approval, permission, legal scope finding, FRIA completion, publication or ISO conformity. The tool never connects to or updates a Council workbook, does not persist form data, and has no telemetry, account or upload.
- AGPI is a prioritisation aid, not a waiver. Every tier requires case-specific screening for Equality Act 2010 section 149, Human Rights Act 1998 section 6, privacy/data protection and other applicable duties. The screening prompts confirm only that a matter was recorded or referred; they do not decide legal applicability or establish compliance.
- EU AI Act, ATRS and procurement requirements are conditional. A case-specific legal or procurement owner must confirm applicability. Suspected personal data breaches should be referred to the DPO / Information Governance owner; this tool does not determine reportability or make a notification.
- Risk arithmetic and incident routes are provisional. Review them against the current approved procedure, controlled assessment and competent owner before reliance; the tool does not assign a residual-risk tier or severity-based incident deadline.

Do not enter residents' names, case records, special-category data or other unnecessary personal information. Keep evidence in its native source and use approved, versioned pointers when recording evidence references.

## Static deployment

There are no runtime or build dependencies. Deploy **both** `index.html` and the `src/` directory at the same path on GitHub Pages (for example, the repository root on the Pages branch). The HTML loads the maintainable plain JavaScript modules at `src/logic.js` and `src/app.js`; keep those relative paths intact. No server, API, bundler or credentials are needed.

For local checks, run:

```sh
node --check src/logic.js
node --check src/app.js
node --test qa-smoke.test.cjs
```

The automated checks cover incident severity and routing, AIG-OPS-03 Part A/optional Part B validation, AIG-ASS-02 arithmetic, AIG-DEC-04 plan/event/condition barriers, monitoring provenance and zero/blank distinctions, the separate map handoff, safe draft CSV handovers, escaping, and static-page governance boundaries.

## Limitations

- Draft handovers intentionally do not claim to match live or exact worksheet headers. A controlled-record owner must verify each standalone draft workbook and map fields before transfer.
- The user attests that an entered AIR-ID, decision and references are real; this static tool cannot verify a record or delegation.
- Unknown use scope remains Unknown; it is never coerced to a shared baseline. A shared system measure or baseline is not use-specific approval. A use-specific operational claim must be verified against the exact UC-ID decision reference and permitted scope/conditions in the authoritative records; this aid never grants automatic approval.
- Business-day calculations exclude weekends but not bank holidays. Internal route labels and timescales need validation against current approved procedures.
- The application is an aid, not an assurance control, records-management system, case-management tool or legal advice.