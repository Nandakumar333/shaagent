---
name: solid-dev
description: Enforce architectural alignment, folder/file/function naming conventions, SOLID principles, and industry standards. Guides Planner and Dev agents to inspect existing architecture, follow codebase conventions, apply SOLID design, and make sound engineering decisions.
trigger: Load with `use skill solid-dev` or `/solid-dev` or `use skill dev-standards`. Auto-invoked by @planner and @dev agents.
---

# SOLID Development & Architecture Skill (`solid-dev`)

This skill provides a systematic engineering framework for AI agents (Planner, Dev, Researcher, Reviewer) and subagents to:

1. **Discover and adhere to existing architecture and naming conventions** (folders, files, classes, methods, functions, variables).
2. **Benchmark designs against industry standards** (SOLID principles, Clean/Hexagonal Architecture, enterprise design patterns).
3. **Execute a principled Decision Matrix** when reconciling existing code patterns with industry standards.
4. **Enforce clean, maintainable, and robust development** without introducing architectural drift or fragmentation.

---

## Quick Reference / Invocation

```bash
# Agents can reference or activate this skill when:
/solid-dev                      # Review architecture and naming compliance
/solid-dev --audit <path>       # Audit folder, file, and symbol naming for a directory
/solid-dev --decision           # Consult the Architecture Decision Matrix for conflict resolution
/solid-dev --solid-check        # Evaluate SOLID principles compliance for new code
```

---

## 1. The 4-Point Codebase Inspection Protocol (Reconnaissance)

**MANDATORY FIRST STEP BEFORE PLANNING OR CODING:**
Never assume naming conventions or directory layouts. Always run reconnaissance on the existing codebase.

### Step 1.1: Inspect Directory Topology & Architecture Style

Check how the repository organizes code:

- **Layered / Clean / Onion**: `domain/`, `application/`, `infrastructure/`, `presentation/` (or `api/`)
- **Vertical Slice / Feature-Driven**: `features/<feature-name>/`, `modules/<module-name>/`
- **Component-Driven (Frontend)**: `components/`, `hooks/`, `services/`, `pages/` (or `app/`)
- **Package Monorepo**: `packages/<pkg>/src/`

Command recipe to discover top-level topology:

```bash
# List top-level folders and immediate structure
ls -la src/ 2>/dev/null || ls -la packages/ 2>/dev/null || ls -la
```

### Step 1.2: Audit Naming Conventions Across Tiers

Sample 3-5 existing files in touched or adjacent folders to extract:

- **Folder Casing**: `kebab-case` (e.g. `order-processing/`), `camelCase` (e.g. `orderProcessing/`), or `snake_case` (e.g. `order_processing/`)?
- **File Casing & Suffixes**:
  - TS/JS: `kebab-case.ts` (e.g., `payment-service.ts`) vs `camelCase.ts` vs `PascalCase.tsx` (React components)
  - Suffix patterns: `.service.ts`, `.controller.ts`, `.model.ts`, `.dto.ts`, `.handler.ts`
  - C#/.NET: `PascalCase.cs` (e.g., `PaymentService.cs`, `IPaymentRepository.cs`)
  - Python: `snake_case.py` (e.g., `payment_service.py`, `test_payment.py`)
- **Symbol & Function Casing**:
  - Classes / Types: `PascalCase`
  - Functions / Methods: `camelCase` (TS/JS, Java), `PascalCase` (C#), `snake_case` (Python, Rust)
  - Constants: `SCREAMING_SNAKE_CASE` or `PascalCase`
  - Interfaces: `IOrderService` (C# prefix) vs `OrderService` (TS/Go without prefix)

### Step 1.3: Verify Dependency Direction

Ensure high-level policies do not depend on low-level infrastructure details:

```
Presentation / UI ──▶ Application (Handlers / UseCases) ──▶ Domain (Entities / Interfaces)
                               ▲
Infrastructure (DB, HTTP) ─────┘ (Implements Domain Interfaces)
```

---

## 2. Architecture Decision Matrix (Codebase vs Industry Standard)

When planning or implementing, agents will encounter four distinct scenarios. Follow this decision matrix strictly:

```
                            ┌────────────────────────────┐
                            │ Is this greenfield or      │
                            │ existing code (brownfield)?│
                            └─────────────┬──────────────┘
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
         ┌───────────────────────┐                 ┌───────────────────────┐
         │      Greenfield       │                 │      Brownfield       │
         │ (New feature / slice) │                 │ (Modifying / adding)  │
         └───────────┬───────────┘                 └───────────┬───────────┘
                     │                                         │
                     ▼                                         ▼
       ┌───────────────────────────┐             ┌───────────────────────────┐
       │ Apply Industry Standards: │             │ Does existing code have a │
       │ • SOLID Principles        │             │ clear consistent pattern? │
       │ • Clean Architecture      │             └─────────────┬─────────────┘
       │ • Canonical Naming        │                           │
       └───────────────────────────┘             ┌─────────────┴─────────────┐
                                                 ▼                           ▼
                                          [YES: Consistent]           [NO: Inconsistent]
                                                 │                           │
                                                 ▼                           ▼
                                  ┌───────────────────────────┐ ┌───────────────────────────┐
                                  │ Follow Existing Pattern   │ │ Anchor to Dominant Modern │
                                  │ (Consistency > Preference)│ │ Pattern in Repo; Do Not   │
                                  │ Document any trade-off    │ │ Add a 3rd Variant         │
                                  └───────────────────────────┘ └───────────────────────────┘
```

### The 4 Scenario Rules:

| Scenario                          | Situation                                                                                           | Decision & Action                                                                                                                                                                                                                               |
| :-------------------------------- | :-------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tier 1: Greenfield Slice**      | Brand new service, new top-level package, or independent subsystem.                                 | **Apply Industry Standard**: Use Clean Architecture, strict SOLID principles, role-segregated interfaces, and canonical language naming conventions.                                                                                            |
| **Tier 2: Brownfield Extension**  | Adding a function, class, or endpoint to an existing service/module.                                | **Match Existing Conventions**: Strict adherence to existing file structure, casing, and design style (e.g. if the repo uses `camelCase.ts` and controller-service-repo layers, do not introduce `kebab-case` or CQRS slices into that folder). |
| **Tier 3: Inconsistent Codebase** | The codebase contains mixed styles (e.g., some `kebab-case`, some `camelCase`, or mixed DI styles). | **Anchor to Dominant Modern Pattern**: Identify the most prevalent modern pattern in adjacent modules. Use that pattern consistently. Never introduce a third competing convention.                                                             |
| **Tier 4: Flawed Legacy Pattern** | Existing code violates core SOLID (e.g., God class, circular dependency, direct SQL in controller). | **Surgical Decoupling**: Do NOT compound the anti-pattern. Introduce a clean interface or extracted service for the new functionality. If a structural shift is needed, author an **ADR** (Architecture Decision Record) note in the plan.      |

Detailed decision tables and ADR templates are documented in [architecture-decision-matrix.md](./references/architecture-decision-matrix.md).

---

## 3. SOLID Principles Enforcement for Agents

All new code written or planned by agents must adhere to the 5 SOLID principles:

### S — Single Responsibility Principle (SRP)

- Every class, module, and file must have **one reason to change**.
- **Thresholds**:
  - File / Class length: $\le 300$ lines (warning at 200, refactor at 350+).
  - Method / Function length: $\le 30$ lines (break down complex control flow).
  - Cyclomatic complexity: $\le 10$ per function.
- **Agent Action**: Never create multi-purpose "God" classes (e.g. `OrderManager` handling validation, DB access, email sending, and PDF generation). Split into `OrderValidator`, `OrderRepository`, `OrderNotificationService`.

### O — Open / Closed Principle (OCP)

- Modules must be **open for extension, closed for modification**.
- Use polymorphism, strategy patterns, or dependency injection rather than giant `switch` or cascading `if-else` blocks when adding new variants.
- **Agent Action**: When adding a new payment method, auth provider, or file exporter, implement a new strategy class implementing a common interface (`IPaymentProcessor`) instead of editing existing monolith conditionals.

### L — Liskov Substitution Principle (LSP)

- Subtypes must be substitutable for their base types without altering program correctness.
- **Rule**: Implementations must never throw `NotSupportedException` or `NotImplementedException` for interface methods.
- **Rule**: Derived classes must not strengthen preconditions or weaken postconditions.

### I — Interface Segregation Principle (ISP)

- Clients should not be forced to depend upon interfaces they do not use.
- **Rule**: Keep interfaces lean and role-focused (aim for 1 to 5 methods per interface).
- Prefer composing small interfaces (`IReader`, `IWriter`) over one monster interface (`IDatabaseHandler`).

### D — Dependency Inversion Principle (DIP)

- High-level modules should not depend on low-level modules; both should depend on abstractions.
- Abstractions should not depend on details; details depend on abstractions.
- **Rule**: Never use `new ConcreteService()` inside business logic. Inject dependencies via constructors or factories.

Detailed patterns and bad-vs-good code examples are in [solid-principles.md](./references/solid-principles.md).

---

## 4. Universal Naming & Directory Placement Standards

Agents must apply canonical naming rules matching the project ecosystem:

### 4.1 Folder Naming

| Tech Stack              | Convention                                | Example                                       |
| :---------------------- | :---------------------------------------- | :-------------------------------------------- |
| TypeScript / Node / Web | `kebab-case`                              | `src/order-processing/`, `src/auth-provider/` |
| C# / .NET               | `PascalCase`                              | `OrderProcessing/`, `Infrastructure/Data/`    |
| Python                  | `snake_case`                              | `order_processing/`, `user_auth/`             |
| Go                      | `lowercase` (single word, no underscores) | `order`, `auth`, `telemetry`                  |
| Java / Kotlin           | `lowercase` package names                 | `com.mycompany.orderprocessing`               |

### 4.2 File Naming

- **TypeScript/JavaScript**:
  - Utilities/Services: `kebab-case.ts` (e.g., `token-validator.ts`, `order.service.ts`)
  - React Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`) or `kebab-case.tsx` (if matching project convention)
  - Tests: `<name>.test.ts` or `<name>.spec.ts`
- **C# / .NET**:
  - One class per file, matching file name exactly: `OrderProcessor.cs`, `IOrderProcessor.cs`
- **Python**:
  - Modules: `snake_case.py` (e.g., `order_processor.py`)
  - Tests: `test_order_processor.py`

### 4.3 Function & Method Naming

- **Verb-Noun Pattern**: Functions describe actions:
  - ✅ `calculateTotalPrice()`, `fetchUserById()`, `validateOrderPayload()`, `isSubscriptionActive()`
  - ❌ `total()`, `user()`, `orderValidation()`, `check()`
- **Boolean Accessors**: Prefix with `is`, `has`, `can`, `should`:
  - `isEnabled`, `hasPermission`, `canRefund`, `shouldRetry`
- **Async Suffix**:
  - C#: Always append `Async` (e.g., `GetOrderByIdAsync(id, cancellationToken)`)
  - TS/JS: Do NOT append `Async` unless required to disambiguate synchronous and asynchronous variants (follow repo convention).

Detailed language-by-language guides and naming matrices are in [naming-conventions.md](./references/naming-conventions.md).

---

## 5. Directives for Specific AI Agents

### 5.1 Directives for PLANNER Agent

When creating an implementation plan (`{ticket}-plan.md`):

1. **Mandatory Section: Architectural & Naming Alignment**:
   Every plan must contain an explicit subsection evaluating:
   - Existing folder structure inspected
   - Casing and naming convention identified for files and functions
   - Dependency direction verified (Domain $\to$ Application $\to$ Infrastructure)
2. **Explicit File Paths**:
   Never write vague file paths like `create service file`. Specify exact paths adhering to repo conventions:
   - ✅ `packages/cli/src/engine/decision-matrix.ts`
   - ❌ `src/decision_matrix.ts` (wrong casing/path)
3. **Data Contracts First**:
   Define interfaces and DTOs before implementation classes. Verify ISP (lean interfaces) and DIP (injectable dependencies).
4. **Architecture Decision Record (ADR)**:
   If the plan introduces a new architectural pattern or deviates from legacy codebase conventions, include an ADR table in the plan.

### 5.2 Directives for DEV (Developer) Agent

When implementing code:

1. **Pre-Implementation Reconnaissance**:
   Before creating or editing any file:
   - Check the directory: `ls` or `list_dir` on the target directory.
   - Inspect 1-2 existing sibling files for naming, import style, and error handling patterns.
2. **Zero Naming Drift**:
   Strictly use the casing, extension, and suffix style detected in sibling files.
3. **Enforce SOLID in Code**:
   - Keep functions $< 30$ lines; extract pure helper functions.
   - Inject dependencies through constructors/parameters.
   - Guard clauses at the top (early returns), avoid nesting $> 3$ levels deep.
   - Propagate cancellation tokens or signals in asynchronous calls.
4. **Self-Validation Checklist**:
   Before declaring completion:
   - [ ] Do all new file and folder names match the repo casing convention?
   - [ ] Do all function names use verb-noun phrasing?
   - [ ] Are all classes under 300 lines and functions under 30 lines?
   - [ ] Are interfaces segregated and dependencies inverted?
   - [ ] Does the build compile cleanly without warnings?

### 5.3 Directives for RESEARCHER Agent

When producing the Research Report:

- Dedicate a section to **"Conventions & Patterns"**:
  - Detected folder casing
  - Detected file naming & suffix convention
  - Detected design patterns (DI, Repository, Event Bus, etc.)
  - Warnings about legacy anti-patterns to avoid repeating

### 5.4 Directives for REVIEWER Agent

In addition to general review checklists, verify:

- [ ] **Architecture Alignment**: Does the change respect service and layer boundaries?
- [ ] **Naming Compliance**: Do all new folders, files, methods, and variables strictly match repo convention?
- [ ] **SOLID Audit**: Check for SRP violations (bloated methods/classes), tight coupling, or missing abstractions.

---

## 6. Detailed Reference Guides

Refer to the accompanying reference guides for deep technical specifics:

- [Architecture Decision Matrix & Conflict Resolution](./references/architecture-decision-matrix.md)
- [Complete Naming Conventions Guide (All Languages)](./references/naming-conventions.md)
- [SOLID Principles Implementation & Refactoring Guide](./references/solid-principles.md)
