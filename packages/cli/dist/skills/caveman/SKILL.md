---
name: caveman
description: Token compression skill. Reduces agent output verbosity by 40-60% while preserving technical accuracy. All agents load this to minimize context window consumption.
trigger: Load with `use skill caveman`. Ultra mode via `/caveman ultra`.
---

# Caveman Skill

Compress all agent communication to minimum viable tokens while preserving full technical accuracy.

## Modes

### Standard Mode (`use skill caveman`)
Apply these compression rules to ALL output:
- Remove articles (a, an, the)
- Remove filler words (basically, essentially, simply, just, really)
- Use fragments instead of full sentences
- Abbreviate common terms: `fn` (function), `impl` (implementation), `cfg` (configuration), `repo` (repository), `svc` (service), `ctrl` (controller), `req` (request), `res` (response), `auth` (authentication), `authz` (authorization), `DB` (database), `msg` (message), `evt` (event), `dep` (dependency), `pkg` (package)
- Use symbols: `→` (leads to/calls), `←` (returns/from), `↔` (bidirectional), `✓` (pass/done), `✗` (fail), `⚠` (warning), `>` (greater than)
- Tables over prose
- Bullet points over paragraphs
- No transitions ("Next,", "Additionally,", "Furthermore,")

### Ultra Mode (`/caveman ultra`)
Everything in Standard plus:
- Single-letter vars in examples: `s` (service), `c` (controller), `r` (repository), `e` (event)
- Max 3 words per bullet point
- No code comments in examples
- Acronym everything possible

## What Stays Normal (NEVER compress)
- Code written to files (implementation code stays readable)
- XML doc comments
- Test names
- Plan files
- Review reports (those go into files, must be clear)
- Error messages and exceptions

## Examples

### Before (uncompressed)
```
The OrderService has a dependency on the PaymentService through the IPaymentGateway interface.
When a new order is created, the OrderController validates the request using FluentValidation,
then passes it to the OrderService which orchestrates the payment flow. If the payment fails,
the service returns a Result<T> failure with the appropriate error code.
```

### After (caveman standard)
```
OrderService → PaymentService via IPaymentGateway.
Flow: OrderController validates (FluentValidation) → OrderService orchestrates payment.
Payment fail → Result<T> failure + error code.
```

### After (caveman ultra)
```
OrderSvc→PaymentSvc (IPaymentGateway)
ctrl validates→svc orchestrates→fail=Result.Fail(code)
```

## Simplification (for explaining complex code)

When asked to simplify or explain complex code, use progressive layers:

### Layer 1 — Caveman Version (< 30 lines, no framework, no error handling)
Strip to absolute essence. What does this code DO in its simplest form?

### Layer 2 — Add error handling
Same code + Result pattern / exceptions.

### Layer 3 — Add DI and interfaces
Same code + proper abstractions.

### Layer 4 — Production version
Full production code with logging, validation, resilience.

## Usage in Multi-Agent Pipeline

| Agent | Compress What | Keep Normal |
|-------|--------------|-------------|
| Orchestrator | Status updates, summaries | Gate questions to user |
| Researcher | Research report (inter-agent) | — |
| Planner | Report to Orchestrator | Plan file content |
| Developer | Report to Orchestrator | Implementation code |
| QA | Report to Orchestrator | Test code |
| Reviewer | Report to Orchestrator | Review file content |
| Review-Fix | Report to Orchestrator | Fix implementations |

## Rules
- NEVER compress code written to actual project files
- NEVER compress user-facing plan or review documents
- ALWAYS compress inter-agent communication
- Use when context window > 50% consumed
- Switch to ultra when context window > 75% consumed
