# BMAD Artifact Templates

Canonical, token-efficient Markdown templates produced during the BMAD progressive context chain.

---

## 1. Project Constitution — `docs/project-context.md`

> If `_bmad-output/project-context.md` already exists in the repository, read and maintain that file instead of creating a duplicate.

```markdown
# Project Context — {projectName}

> Living constitution for AI agents and developers. Read before planning or implementing changes.
> Last updated: {YYYY-MM-DD}

## 1. System Overview & Tech Stack

- **Purpose:** {1-2 sentences}
- **Languages & Frameworks:** {exact versions}
- **Infrastructure & CI/CD:** {runtime, cloud, pipeline}

## 2. Architecture & Module Boundaries

- **Architecture Style:** {Clean Architecture / Vertical Slice / Modular Monolith / Microservices}
- **Directory Topology:**
  - `{path}` — {responsibility}
- **Dependency Rules:** {e.g., Domain has zero infrastructure imports; cross-service via contracts only}

## 3. Coding & Naming Conventions

- **Folders / Files:** {kebab-case / PascalCase / snake_case}
- **Symbols:** {classes, functions, interfaces, constants}
- **Error Handling & Logging:** {Result<T> / structured errors / correlation IDs}

## 4. Testing & Verification Commands

- **Build:** `{build command}`
- **Test:** `{test command}`
- **Lint / Typecheck:** `{lint/typecheck command}`

## 5. Domain Glossary & Critical Invariants

- **{Term}:** {definition + non-negotiable business rule}
```

---

## 2. Lean PRD — `docs/prd/{ticketNumber}-prd.md` (`method` & `enterprise` tracks)

```markdown
# PRD — {ticketNumber}: {Title}

**Track:** BMAD Method | Enterprise
**Date:** {YYYY-MM-DD}
**Status:** Draft | Approved

## 1. Problem & User Value

- **Problem:** {what pain or gap exists today}
- **Target User / Consumer:** {who interacts with or depends on this}
- **Outcome:** {measurable result when complete}

## 2. Scope Boundaries

- **In Scope:** {explicit deliverables}
- **Out of Scope:** {explicit non-goals to prevent scope creep}

## 3. Functional Requirements

| ID   | Requirement                   | Priority | Acceptance Signal    |
| ---- | ----------------------------- | -------- | -------------------- |
| FR-1 | {observable system behaviour} | Must     | {verifiable outcome} |
| FR-2 | {observable system behaviour} | Must     | {verifiable outcome} |

## 4. Non-Functional Requirements

| ID    | Category                                             | Constraint / Target     |
| ----- | ---------------------------------------------------- | ----------------------- |
| NFR-1 | Performance / Security / Reliability / Compatibility | {measurable constraint} |

## 5. Documentation Deliverables

- [ ] {README / API spec / Architecture doc / Runbook updates required}
```

---

## 3. Solution Architecture — `docs/architecture/{ticketNumber}-architecture.md` (`method` & `enterprise` tracks)

```markdown
# Architecture — {ticketNumber}: {Title}

**PRD Reference:** `docs/prd/{ticketNumber}-prd.md`
**Project Context:** `docs/project-context.md`

## 1. Component & Boundary Impact

| Module / Service | Change Type    | Responsibility | Boundary Check          |
| ---------------- | -------------- | -------------- | ----------------------- |
| {module}         | New / Modified | {role}         | {Clean / Contract-only} |

## 2. Data Flow & Interaction Sequence
```

{Caller} ──▶ {Handler/Service} ──▶ {Domain} ──▶ {Repository/Event}

````

## 3. Explicit Contracts (Interfaces / DTOs / Events / Schemas)
```{language}
// Exact type/interface signatures — Dev implements without guessing
````

## 4. Architecture Decisions (ADRs)

| Decision | Rationale | Rejected Alternative | ADR File                                              |
| -------- | --------- | -------------------- | ----------------------------------------------------- |
| {choice} | {why}     | {alternative}        | `docs/decisions/ADR-{NNNN}-{slug}.md` (if structural) |

## 5. Risks, Security & Rollout

- **Security / Privacy Surface:** {auth, PII, input validation, secrets}
- **Migration / Compatibility:** {backward compatibility, feature flag, rollback}

````

---

## 4. Story-Driven Plan Header & Readiness Block (inside `{planDir}/{ticketNumber}-plan.md`)

Include these sections inside `{planDir}/{ticketNumber}-plan.md` when `bmad` is active:

```markdown
## BMAD Context Chain
- **Track:** {Quick Flow | BMAD Method | Enterprise}
- **Project Context:** `docs/project-context.md`
- **PRD:** `docs/prd/{ticketNumber}-prd.md` (N/A on Quick Flow)
- **Architecture:** `docs/architecture/{ticketNumber}-architecture.md` (N/A on Quick Flow)

## Requirement-to-Story Traceability
| Req ID | Story AC | Implementation Step | Planned Test |
|--------|----------|---------------------|--------------|
| FR-1 | AC-1 | Step 1 | {unit/integration test name} |
| NFR-1 | AC-2 | Step 2 | {validation/perf/security test} |

## Documentation Tasks
- [ ] Update affected user/API/CLI docs (`README.md`, `docs/`, OpenAPI/JSON schema)
- [ ] Sync `docs/project-context.md` / ADR if conventions or architecture changed

## Implementation Readiness Check
- **Verdict:** `PASS` | `CONCERNS` | `FAIL`
- **FR/NFR Coverage:** {100% mapped / list gaps}
- **Contract Completeness:** {All interfaces & DTOs defined}
- **Open Concerns:** {None / explicit items requiring Gate 1 confirmation}
````

---

## 5. Quick Flow Tech-Spec (`quick` track inside `{planDir}/{ticketNumber}-plan.md`)

For `Quick Flow`, skip standalone `docs/prd/` and `docs/architecture/` files and keep `{planDir}/{ticketNumber}-plan.md` tight:

```markdown
# Quick Tech-Spec — {ticketNumber}: {Title}

**BMAD Track:** Quick Flow
**Project Context:** `docs/project-context.md`

## Intent & Scope

- **Change:** {1-2 sentences}
- **Out of Scope:** {boundaries}

## Files & Contracts

| File     | Action          | Exact Change          |
| -------- | --------------- | --------------------- |
| `{path}` | Modify / Create | {summary + signature} |

## Acceptance Criteria & Tests

- [ ] **AC-1:** {condition} → verified by `{test}`
- [ ] **AC-2:** {docs updated if public behaviour changed}

## Verification Commands

- Build: `{build command}`
- Test: `{test command}`
```
