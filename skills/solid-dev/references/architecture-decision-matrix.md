# Architecture Decision Matrix & Tradeoff Resolution

This reference provides AI agents (Planner, Dev, Reviewer) with explicit decision heuristics when balancing existing codebase patterns against modern industry standards.

---

## 1. The Core Tension: Consistency vs Modernization

In real-world software engineering, projects often contain historical patterns, legacy conventions, or imperfect architectural decisions. AI agents face a common dilemma:

> **Should the agent copy existing (potentially outdated) code conventions, or introduce modern industry best practices?**

### The Guiding Principle:

> **"Local Consistency, Strategic Elevation."**
>
> - Within an existing component or module, **consistency is king**. Do not introduce jarring stylistic or architectural fragmentation.
> - At system boundaries or new module slices, **elevate to industry standards** while bridging smoothly to the legacy core.

---

## 2. The 4-Tier Decision Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               DECISION MATRIX AT A GLANCE                              │
├─────────┬──────────────────────┬───────────────────────────────┬───────────────────────┤
│ Tier    │ Scope of Change      │ Conflict Nature               │ Verdict               │
├─────────┼──────────────────────┼───────────────────────────────┼───────────────────────┤
│ Tier 1  │ Greenfield Slice     │ Blank canvas / new module     │ Use Industry Standard │
│ Tier 2  │ Brownfield Extension │ Adding to existing module     │ Match Existing Repo   │
│ Tier 3  │ Inconsistent Repo    │ Split / conflicting patterns  │ Anchor to Dominant    │
│ Tier 4  │ Toxic Anti-pattern   │ Existing code breaks security │ Isolate & Decouple    │
│         │                      │ or critical reliability       │ via Adapter / ADR     │
└─────────┴──────────────────────┴───────────────────────────────┴───────────────────────┘
```

### Tier 1: Greenfield Feature or New Subsystem

- **Context**: A brand new service, package, top-level directory, or isolated module is being created.
- **Decision**: **100% Industry Standard**.
- **Execution**:
  - Implement Clean Architecture / Ports and Adapters.
  - Enforce full SOLID principles from line 1.
  - Follow canonical naming conventions for the language (e.g., standard kebab-case in TS, PascalCase in C#, snake_case in Python).
  - Use modern dependency injection and interface-first contracts.

### Tier 2: Brownfield Extension (Modifying or Adding to Existing Module)

- **Context**: Adding a method, class, route, or file to an established subsystem.
- **Decision**: **Match Existing Conventions** unless it violates critical safety.
- **Rationale**: The Principle of Least Surprise. A codebase with uniform conventions is vastly easier to maintain than a codebase with four different file naming schemes and three different error handling mechanisms.
- **Execution**:
  - If existing files in the directory use `camelCase.ts` with suffix `.service.ts`, use `camelCase.ts` and `.service.ts`.
  - If the project uses raw promises instead of async/await, evaluate if async/await breaks caller signatures. If not, write clean async/await, but adhere to the return types expected by callers.
  - If existing methods return `Result<T, E>`, do not throw unhandled exceptions; return `Result<T, E>`.

### Tier 3: Inconsistent or Split Codebase (Brownfield Drift)

- **Context**: Half the files use `kebab-case.ts`, half use `camelCase.ts`; or some services use dependency injection while others use singletons.
- **Decision**: **Anchor to Dominant Modern Pattern**.
- **Execution Protocol**:
  1. Count occurrences in the immediate directory or sibling packages.
  2. Identify the most recent or modern pattern (e.g., git log or newest feature folder).
  3. Adopt that dominant modern pattern.
  4. **Strict Constraint**: Never introduce a _third_ pattern (e.g., do not introduce `snake_case` if the conflict is between `kebab-case` and `camelCase`).
  5. Document the anchor rationale in the plan:
     `"Notice mixed casing in src/services/. Anchoring to kebab-case as observed in 75% of sibling files."`

### Tier 4: Toxic Anti-Pattern in Existing Code

- **Context**: Existing code contains dangerous anti-patterns:
  - SQL queries constructed via string concatenation.
  - 2,000-line God class with tight coupling and zero tests.
  - Circular dependencies between modules.
  - Swallowed exceptions (`catch (Exception) { /* do nothing */ }`).
- **Decision**: **Isolate, Decouple, and Author an ADR**.
- **Execution Protocol**:
  1. **Do not compound the anti-pattern**: Never append more logic to a 2,000-line God class if you can avoid it.
  2. **Strangler Fig / Adapter Pattern**: Create a small, focused, single-responsibility class or interface for your new feature. Call it from or inject it into the existing class.
  3. **Preserve External API**: Ensure callers of the existing class experience zero breaking changes.
  4. **Document an Architecture Decision Record (ADR)** in the plan.

---

## 3. Architecture Decision Record (ADR) Template

When an AI agent chooses to deviate from existing legacy code or introduce a new architectural pattern, it must include an ADR in the Implementation Plan:

```markdown
### Architecture Decision Record (ADR)

- **Status**: [Proposed | Approved | Superseded]
- **Context**:
  [Describe the situation, existing pattern in the codebase, and the architectural challenge]
- **Decision**:
  [Describe the pattern or architecture selected and why]
- **Alternatives Considered**:
  1. [Alternative 1] — [Why rejected]
  2. [Alternative 2] — [Why rejected]
- **Consequences**:
  - Positive: [Improved testability, decoupled dependencies, reduced complexity]
  - Negative/Risks: [Need to maintain backwards compatibility bridge, slight indirection]
- **Compliance**:
  - [How this aligns with SOLID principles and project guidelines]
```

---

## 4. Conflict Resolution Quick Checklist

| Conflict             | Existing Code              | Industry Standard                 | Agent Action                                                                                                                            |
| :------------------- | :------------------------- | :-------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| **File Naming**      | `userService.ts`           | `user-service.ts`                 | If directory already has `*Service.ts`, follow `*Service.ts`. If creating a new directory/module, use `user-service.ts`.                |
| **Interface Naming** | `IUserRepository`          | `UserRepository`                  | In C#/.NET: Always `IUserRepository`. In TS: Follow existing repo convention (match whether existing interfaces use `I` prefix or not). |
| **Error Handling**   | Swallowed errors           | Typed Results / Custom Exceptions | Elevate immediately. Use structured error handling. Never swallow exceptions.                                                           |
| **DI vs New**        | `new Service()` in methods | Injected interfaces               | Refactor new code to accept dependency in constructor. Provide a backward-compatible default parameter if callers cannot be updated.    |
| **Function Length**  | 150-line methods           | Max 30 lines                      | Write new functions $< 30$ lines. Extract private helper functions.                                                                     |
