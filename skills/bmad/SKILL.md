---
name: bmad
description: BMAD (Breakthrough Method for Agile AI-Driven Development) skill for progressive context engineering, scale-adaptive planning tracks, story-driven implementation, and zero-drift living documentation across the multi-agent pipeline.
trigger: Load with `use skill bmad` or `/bmad`. Auto-activated by Orchestrator, Researcher, Planner, Dev, QA, Reviewer, and Project Memory Creator whenever `bmad` is installed.
---

# BMAD Skill — Agile AI-Driven Development & Progressive Documentation Flow (`bmad`)

Enhances ShaAgent's development and documentation lifecycle using the **BMAD Method**: progressive context engineering, scale-adaptive tracks, implementation readiness gating, self-contained story specs, and zero-drift living documentation.

---

## Quick Reference / Invocation

```bash
use skill bmad                      # Activate full BMAD development + documentation flow
/bmad --track quick                 # Quick Flow: streamlined Tech-Spec -> Dev -> QA -> Commit
/bmad --track method                # Standard BMAD Method: PRD -> Architecture -> Story Plan -> Dev -> Living Docs
/bmad --track enterprise            # Enterprise Track: PRD -> Architecture -> Security/Arch Gates -> Story -> Runbook & Docs
/bmad --readiness                   # Run Implementation Readiness Check (PASS / CONCERNS / FAIL)
/bmad --doc-sync                    # Synchronize docs/project-context.md, ADRs, and module/API docs
```

### External BMAD Ecosystem Interoperability

If external BMAD CLI / V6 / V7 skills (`bmad-help`, `bmad-create-prd`, `bmad-create-architecture`, `bmad-create-story`, `bmad-dev-story`, `bmad-code-review`, `bmad-quick-dev`, `bmad-correct-course`, or `_bmad/` / `_bmad-output/` folders) are also installed in the workspace:

- Reuse existing `_bmad-output/project-context.md` or `docs/project-context.md` without duplicating files.
- Delegate to or compose with installed `bmad-*` workflow skills seamlessly while preserving ShaAgent's quality gates (Gate 1, Gate 2, mandatory review skills).

---

## 1. Core Principle — Progressive Context Chain

Unstated assumptions cause agent drift. In BMAD flow, **every phase produces or updates a durable Markdown artifact** that serves as verified input context for the next agent:

```
docs/project-context.md (Constitution: stack, rules, boundaries, glossary)
        │
        ▼
docs/prd/{ticket}-prd.md (Analysis & Planning: FR-*, NFR-*, scope, user value)
        │
        ▼
docs/architecture/{ticket}-architecture.md + docs/decisions/ADR-*.md (Solutioning & Readiness Gate)
        │
        ▼
{planDir}/{ticket}-plan.md (Self-Contained Story Spec: embedded context, contracts, tasks, AC-*)
        │
        ▼
Implementation + Tests + Inline/API Docs (Dev & QA with FR-*/AC-* traceability)
        │
        ▼
Review + Living Documentation Sync (Zero doc-drift audit + docs/project-context.md update)
```

---

## 2. Scale-Adaptive Tracks (Right-Sized Process)

Match ceremony to complexity. Never force a 2-file enhancement through heavyweight enterprise docs, and never build a cross-service feature from a vague chat prompt.

| Track                         | When to Select                                                                                                            | Artifacts Produced                                                                                                                                             | Pipeline Flow                                                                                               |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| **Quick Flow (`quick`)**      | Small, well-understood features, isolated enhancements, or small fixes (1–3 files, clear scope, no new contracts/schemas) | `{planDir}/{ticket}-plan.md` (BMAD Quick Tech-Spec)                                                                                                            | Researcher (light) → Planner (Quick-Spec) → Gate 1 → Dev → QA → Reviewer → Gate 2                           |
| **BMAD Method (`method`)**    | Standard features, new endpoints/components, multi-file domain logic, non-trivial requirements                            | `docs/project-context.md` (if missing) + `docs/prd/{ticket}-prd.md` + `docs/architecture/{ticket}-architecture.md` + `{planDir}/{ticket}-plan.md` (Story Spec) | Researcher → Planner (PRD + Arch + Story + Readiness Gate) → Gate 1 → Dev → QA → Reviewer → Living Doc Sync |
| **Enterprise (`enterprise`)** | Cross-service contracts, DB migrations, auth/payments/PII, compliance, new microservice, or architectural refactors       | Full `method` artifacts + `docs/decisions/ADR-{NNNN}-{slug}.md` + Threat/Fitness audits + Migration/Rollout Runbook                                            | Full `method` flow + mandatory `SECURITY` & `ARCHITECTURE-REVIEWER` + `PROJECT-MEMORY-CREATOR` doc sync     |
| **Doc Flow (`doc-only`)**     | Documentation creation, architecture onboarding, brownfield context bootstrapping, API/ADR updates                        | `docs/project-context.md`, `docs/architecture/*.md`, `docs/decisions/ADR-*.md`, `README.md`                                                                    | Researcher → Planner/Memory Creator → Reviewer (doc accuracy audit) → Gate 2                                |

Detailed track selection rules are in [workflow-tracks.md](./references/workflow-tracks.md).

---

## 3. Implementation Readiness Gate (`PASS` / `CONCERNS` / `FAIL`)

Before presenting **Gate 1** to the user on `method` and `enterprise` tracks, the **Planner** runs an explicit **Implementation Readiness Check**:

- [ ] **Project Context Anchored**: Existing conventions from `docs/project-context.md` (or brownfield discovery) respected.
- [ ] **Requirements Numbered & Testable**: Every Functional Requirement (`FR-1`, `FR-2`, …) and Non-Functional Requirement (`NFR-1`, …) is unambiguous.
- [ ] **100% Requirement-to-Story Coverage**: Every `FR-*` and `NFR-*` maps to at least one design component, implementation step, and acceptance criterion (`AC-*`).
- [ ] **Contracts Explicit**: Interfaces, DTOs, events, and error shapes are fully specified — Dev never invents signatures.
- [ ] **Zero Open Blockers**: Any unresolved ambiguity sets status to `FAIL` (ask user to clarify) or `CONCERNS` (highlighted explicitly at Gate 1).

---

## 4. Self-Contained Story Execution & Mid-Sprint Course Correction (`correct-course`)

### Just-in-Time Story Context

`{planDir}/{ticket}-plan.md` acts as a **BMAD Story File**: it embeds the distilled architecture rules, affected file map, exact interfaces, ordered task checkboxes, and `AC-*` verification table so `DEV` and `QA` have complete context without hallucinating.

### Course Correction Protocol (`correct-course`)

If **Dev** or **QA** discovers an unstated technical constraint during implementation that invalidates a planned interface, schema, or boundary:

1. **STOP** — do NOT silently improvise an undocumented workaround.
2. Emit a **`BMAD Course Correction Trigger (`correct-course`)`** back to **Orchestrator** stating:
   - What assumption broke (with exact file/error evidence)
   - Impact on `FR-*` / `docs/architecture/{ticket}-architecture.md` / `{ticket}-plan.md`
   - Proposed options (A/B)
3. **Orchestrator** routes back to **Planner** (and **Gate 1** if scope/contract changes) so artifacts stay truthful before coding resumes.

---

## 5. Living Documentation & Zero Doc-Drift Rules

1. **Project Constitution (`docs/project-context.md`)**:
   - Single source of truth for tech stack, directory topology, naming rules, architectural boundaries, testing commands, and domain invariants.
   - Read by **Researcher**, **Planner**, **Dev**, and **Reviewer** at session start (also check `_bmad-output/project-context.md` if present).
   - Bootstrapped or updated post-commit whenever stack, conventions, or module boundaries evolve.
2. **Co-Evolving Code & Docs**:
   - **Dev** updates inline docstrings, OpenAPI/schema specs, `README.md`, and affected `docs/` guides in the same branch as the code change.
   - **Reviewer** performs a mandatory **Documentation Drift Check**: flags `Major` if public APIs, CLI flags, config schemas, or architecture boundaries changed without matching documentation updates.
3. **Traceable Artifacts**:
   - Cross-link artifacts cleanly: `{ticket}-plan.md` references `docs/prd/{ticket}-prd.md` and `docs/architecture/{ticket}-architecture.md`; `QA` and `Reviewer` verify `FR-*` and `AC-*` IDs end-to-end.

---

## 6. Agent-Specific BMAD Directives

| Agent                      | BMAD Responsibility When Skill Is Installed                                                                                                                                                                                                                                                                         |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Orchestrator**           | Detect `bmad` skill; load `docs/project-context.md`; select Scale-Adaptive Track (`Quick Flow` / `BMAD Method` / `Enterprise` / `Doc Flow`); enforce Implementation Readiness Gate at Gate 1; handle `correct-course` escalations; trigger post-commit Living Doc Sync.                                             |
| **Researcher**             | Read `docs/project-context.md` & `docs/architecture/` first; extract domain context, candidate `FR-*`/`NFR-*` constraints, brownfield conventions, and existing documentation gaps; flag if `docs/project-context.md` is missing.                                                                                   |
| **Planner**                | Load `use skill bmad` + `use skill solid-dev`; author track-appropriate artifacts (`docs/prd/{ticket}-prd.md`, `docs/architecture/{ticket}-architecture.md`, `docs/decisions/ADR-*.md`, and Story-structured `{planDir}/{ticket}-plan.md`); append **Implementation Readiness** verdict (`PASS`/`CONCERNS`/`FAIL`). |
| **Dev**                    | Load `use skill bmad` + `use skill solid-dev`; read `docs/project-context.md` + Story Plan + Architecture doc; execute story tasks sequentially; update public/API/README docs alongside code; raise `correct-course` if architecture assumptions break.                                                            |
| **QA**                     | Load `use skill bmad`; verify every `FR-*`, `NFR-*`, and `AC-*` in a **BMAD Requirement Traceability Matrix** in the QA Report.                                                                                                                                                                                     |
| **Reviewer**               | Load `use skill bmad` alongside mandatory review skills; audit `FR-*`/`AC-*` completeness, architecture adherence, and **Documentation Drift** (code vs `docs/`, `README.md`, schemas, ADRs); log `bmad` in `## Skills Applied`.                                                                                    |
| **Project Memory Creator** | Load `use skill bmad`; create/update `docs/project-context.md`, append `{{memoryFile}}`, index ADRs in `docs/decisions/`, and keep `docs/architecture/` synchronized with shipped code.                                                                                                                             |

---

## 7. Detailed Reference Guides

- [BMAD Artifact Templates (`project-context.md`, PRD, Architecture, Story Plan, Quick-Spec)](./references/artifact-templates.md)
- [BMAD Scale-Adaptive Workflow Tracks & External Interoperability](./references/workflow-tracks.md)
