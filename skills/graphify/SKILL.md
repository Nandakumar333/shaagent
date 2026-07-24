---
name: graphify
description: Turn any codebase into a queryable knowledge graph. Maps service dependencies, file relationships, and architectural communities. Primary discovery tool for all agents in the multi-agent pipeline.
trigger: Load with `use skill graphify`. Query with `/graphify query "question"`.
---

# Graphify Skill

Turn the codebase into a queryable knowledge graph. Every agent should use this as their **primary discovery tool** before falling back to grep/glob.

## Quick Reference

```
/graphify                           # build knowledge graph of current directory
/graphify .                         # same as above
/graphify src/OrderService/         # build for specific service
/graphify --update                  # incremental update (only changed files)
/graphify query "question"          # query existing graph
/graphify path "ServiceA" "ServiceB" # shortest path between two nodes
/graphify explain "OrderService"    # plain-language explanation of a node
```

## Why Graphify First?

In a 120+ microservice platform, grep/find is:
- **Slow** — scanning thousands of .cs files
- **Noisy** — returns all matches without context
- **Flat** — no understanding of relationships

Graphify provides:
- **Service dependency map** — who calls whom
- **Community detection** — which services form logical clusters
- **God nodes** — files/classes with outsized influence (risk indicators)
- **Path analysis** — trace data flow between any two points
- **Cross-service impact** — understand blast radius before changing anything

## Agent Integration

### Researcher Agent
```
# Start every research task with:
use skill graphify

# Then query:
/graphify query "How does authentication work across services?"
/graphify query "What services consume OrderCreatedEvent?"
/graphify path "UserController" "PaymentGateway"
```

### Planner Agent
```
# Understand dependency chains before planning:
/graphify query "What depends on Shared.Contracts.Orders?"
/graphify query "What is the fan-out of OrderService?"
```

### Developer Agent
```
# Before editing, check downstream impact:
/graphify query "What calls OrderService.CreateOrder?"
/graphify path "DiscountCalculator" "OrderTotal"
```

### Reviewer Agent
```
# Assess blast radius of changes:
/graphify query "What communities does OrderService belong to?"
/graphify query "What are the god nodes in the payment cluster?"
```

## Building the Graph

If `graphify-out/graph.json` does not exist, build it:

```bash
/graphify .
```

This will:
1. Detect all files (code, docs, configs)
2. Extract entities via AST (for .cs, .ts, .py files)
3. Extract relationships (imports, calls, inherits, implements)
4. Build graph with community detection
5. Output: `graphify-out/graph.html`, `graphify-out/graph.json`, `graphify-out/GRAPH_REPORT.md`

For this platform, the graph typically contains:
- **Nodes:** services, controllers, interfaces, domain entities, events, DTOs
- **Edges:** calls, implements, publishes, consumes, references, inherits
- **Communities:** logical service clusters (e.g., "Order processing", "Auth & Identity", "Notifications")

## Querying

### Natural Language Questions
```
/graphify query "How does the order flow from creation to payment?"
/graphify query "Which services will break if I change IOrderService interface?"
/graphify query "What shared contracts exist between OrderService and PaymentService?"
```

### Path Queries
```
/graphify path "OrderController" "PaymentGateway"
# Returns: OrderController → OrderService → IPaymentGateway → PaymentService → StripeClient
```

### Explain Queries
```
/graphify explain "MassTransitConsumerBase"
# Returns: Base class for all message consumers. Provides retry, error handling, logging.
#          Used by 47 consumers across 12 services. Community: "Messaging Infrastructure"
```

## Keeping the Graph Fresh

After significant code changes:
```
/graphify --update
```

This only re-extracts changed files (based on git diff), making it fast for incremental updates.

## Key Outputs

| File | Purpose |
|------|---------|
| `graphify-out/graph.json` | Raw graph data (nodes, edges, communities) |
| `graphify-out/graph.html` | Interactive visualization (open in browser) |
| `graphify-out/GRAPH_REPORT.md` | God nodes, surprising connections, suggested questions |

## Installation

```bash
pip install graphifyy
# or
uv tool install graphifyy
```

Requires Python 3.10+. No API key needed for code-only extraction (AST-based).

## Rules for Agents

1. **Always check `graphify-out/graph.json` first** — if it exists, query it. Don't rebuild.
2. **Use queries before grep** — graphify understands relationships, grep doesn't.
3. **Pass graph findings to downstream agents** — include relevant paths/communities in handoff.
4. **Update after implementation** — run `--update` so the graph reflects new code.
5. **Trust god nodes** — high-connectivity nodes are high-risk change targets.
