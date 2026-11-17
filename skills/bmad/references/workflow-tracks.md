# BMAD Workflow Tracks & Interoperability Matrix

Decision guide for right-sizing the BMAD development and documentation flow inside ShaAgent.

---

## 1. Track Selection Matrix (Orchestrator Triage)

| Signal                                       | Trivial Bypass (No Subagents)          | BMAD Quick Flow (`quick`)        | BMAD Method (`method`)                    | BMAD Enterprise (`enterprise`)                       | BMAD Doc Flow (`doc-only`)                  |
| :------------------------------------------- | :------------------------------------- | :------------------------------- | :---------------------------------------- | :--------------------------------------------------- | :------------------------------------------ |
| **Files Touched**                            | 1 file, few lines (typo/constant/copy) | 1–3 files within a single module | 3+ files or new module slice              | Cross-service, shared contracts, or DB migration     | Markdown / OpenAPI / ADR / config docs only |
| **Design Ambiguity**                         | Zero                                   | Low — pattern already exists     | Medium — requires FR/NFR + design choices | High — architectural, security, or compliance impact | Documentation structure & accuracy          |
| **`docs/project-context.md`**                | Read if present                        | Read if present                  | Read (bootstrap if missing)               | Read + mandatory post-commit update                  | Create / refresh                            |
| **`docs/prd/{id}-prd.md`**                   | Skip                                   | Skip                             | **Create / Update**                       | **Create / Update**                                  | Optional                                    |
| **`docs/architecture/{id}-architecture.md`** | Skip                                   | Skip                             | **Create / Update**                       | **Create / Update + ADR**                            | Create / Update                             |
| **`{planDir}/{id}-plan.md`**                 | Skip                                   | Quick Tech-Spec                  | Full Story-Driven Plan + Readiness Gate   | Full Story-Driven Plan + Readiness Gate + Runbook    | Doc Plan (if multi-doc)                     |
| **Specialist Reviews**                       | Build + Tests                          | Standard `REVIEWER`              | Standard `REVIEWER` (+ doc-drift check)   | `REVIEWER` + `SECURITY` + `ARCHITECTURE-REVIEWER`    | `REVIEWER` (technical accuracy)             |

---

## 2. Runtime Prompt Triggers

Users can steer BMAD track selection directly in their prompt to Orchestrator:

| User Phrase                                             | Resolved Track                                                              |
| :------------------------------------------------------ | :-------------------------------------------------------------------------- |
| `"bmad quick"`, `"quick-spec"`, `"small feature"`       | **Quick Flow (`quick`)**                                                    |
| `"bmad"`, `"bmad method"`, `"with prd"`                 | **BMAD Method (`method`)**                                                  |
| `"bmad enterprise"`, `"bmad full"`                      | **Enterprise (`enterprise`)**                                               |
| `"with docs"`, `"doc flow"`, `"update project context"` | Forces full living documentation sync (`docs/project-context.md` + `docs/`) |

---

## 3. External BMAD-METHOD Compatibility Bridge

ShaAgent's `bmad` skill works standalone out of the box **and** coexists cleanly with repositories that also use `bmad-method` (v6 `_bmad/` / `_bmad-output/` or v7 `bmad-*` skills):

1. **Artifact Path Resolution**:
   - If `_bmad-output/planning-artifacts/` and `_bmad-output/implementation-artifacts/` already exist in the repo, agents read existing PRDs, Architecture docs, and `project-context.md` from `_bmad-output/` and keep new artifacts in the established folder convention.
   - Otherwise, default to clean repository-standard `docs/project-context.md`, `docs/prd/`, `docs/architecture/`, `docs/decisions/`, and `{planDir}/`.
2. **Companion Skill Detection**:
   - If specialized skills such as `bmad-create-prd`, `bmad-create-architecture`, `bmad-create-story`, `bmad-check-implementation-readiness`, `bmad-dev-story`, `bmad-code-review`, or `bmad-correct-course` are installed in `<available_skills>`, subagents may load them alongside `use skill bmad` for deeper templates while always honoring ShaAgent's output files, mandatory review skills (`review`, `solid-dev`, `security-scan`, `arch-review`), and user approval gates (Gate 1 & Gate 2).
