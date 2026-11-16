# Complete Naming Conventions & Placement Guide

This guide establishes strict naming conventions across languages, frameworks, and architecture tiers. AI agents must use this reference to eliminate naming drift and maintain professional code craftsmanship.

---

## 1. Universal Casing Terminology

| Style                  | Syntax                     | Primary Use Cases                                                                  |
| :--------------------- | :------------------------- | :--------------------------------------------------------------------------------- |
| `kebab-case`           | `order-processing-service` | Web URLs, TS/JS files & directories, CSS classes, CLI flags, package names         |
| `camelCase`            | `calculateTotalPrice`      | TS/JS functions, methods, variables, parameters; Java methods                      |
| `PascalCase`           | `OrderProcessingService`   | Classes, Interfaces, Types, Enums, C# methods, React components                    |
| `snake_case`           | `calculate_total_price`    | Python functions, variables, files, modules; Rust functions & modules; SQL columns |
| `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT`          | Global constants, environment variables, immutable static configuration            |

---

## 2. Cross-Language Naming Matrix

### 2.1 TypeScript & Modern JavaScript

```text
src/
├── services/                       # kebab-case directories
│   ├── payment-service.ts          # kebab-case files (or <name>.service.ts)
│   └── payment-service.test.ts     # <name>.test.ts for test suites
└── components/
    └── UserCard.tsx                # PascalCase.tsx for React components (or user-card.tsx if repo matches)
```

| Element                    | Convention        | Example                          | Bad Example                                       |
| :------------------------- | :---------------- | :------------------------------- | :------------------------------------------------ |
| **Directories**            | `kebab-case`      | `src/order-fulfillment/`         | `src/OrderFulfillment/`, `src/order_fulfillment/` |
| **Files**                  | `kebab-case.ts`   | `order-validator.ts`             | `OrderValidator.ts`, `order_validator.ts`         |
| **React Components**       | `PascalCase.tsx`  | `OrderSummary.tsx`               | `orderSummary.tsx`                                |
| **Classes**                | `PascalCase`      | `OrderFulfillmentService`        | `order_fulfillment_service`                       |
| **Interfaces / Types**     | `PascalCase`      | `OrderPayload`, `PaymentResult`  | `I_OrderPayload`, `orderPayload`                  |
| **Functions / Methods**    | `camelCase`       | `validateOrder()`, `fetchUser()` | `ValidateOrder()`, `validate_order()`             |
| **Variables / Properties** | `camelCase`       | `retryAttempts`, `customerEmail` | `RetryAttempts`, `customer_email`                 |
| **Constants**              | `SCREAMING_SNAKE` | `DEFAULT_TIMEOUT_MS`             | `default_timeout`, `defaultTimeoutMs`             |
| **Enums**                  | `PascalCase`      | `OrderStatus.Pending`            | `order_status.pending`                            |

_Note on `I` prefix for TypeScript interfaces_:
In modern TypeScript, the Hungarian `I` prefix (e.g. `IUser`) is considered an anti-pattern unless the target repository already strictly enforces it. Check sibling files!

---

### 2.2 C# / .NET (Clean Architecture & Enterprise)

```text
src/
├── OrderService.Domain/            # PascalCase project names
│   ├── Entities/
│   │   └── Order.cs                # PascalCase.cs matching class name
│   └── Interfaces/
│       └── IOrderRepository.cs     # PascalCase with 'I' prefix
├── OrderService.Application/
│   └── Orders/
│       └── Commands/
│           └── CreateOrderCommand.cs
```

| Element               | Convention                 | Example                         | Bad Example                              |
| :-------------------- | :------------------------- | :------------------------------ | :--------------------------------------- |
| **Directories**       | `PascalCase`               | `Features/Orders/Queries/`      | `features/orders/queries/`               |
| **Files**             | `PascalCase.cs`            | `PaymentProcessor.cs`           | `payment-processor.cs`                   |
| **Classes / Structs** | `PascalCase`               | `InvoiceGenerator`              | `invoiceGenerator`                       |
| **Interfaces**        | `IPascalCase` (`I` prefix) | `IInvoiceGenerator`             | `InvoiceGeneratorInterface`              |
| **Methods**           | `PascalCase`               | `GenerateInvoiceAsync()`        | `generateInvoice()`                      |
| **Async Methods**     | `PascalCaseAsync`          | `ProcessPaymentAsync()`         | `ProcessPayment()` (when returning Task) |
| **Properties**        | `PascalCase`               | `TotalAmount`, `IsActive`       | `totalAmount`, `total_amount`            |
| **Private Fields**    | `_camelCase`               | `_logger`, `_paymentRepository` | `m_logger`, `logger`                     |
| **Parameters**        | `camelCase`                | `cancellationToken`, `orderId`  | `CancellationToken`, `order_id`          |

---

### 2.3 Python (PEP 8 & Clean Architecture)

```text
src/
└── order_service/                  # snake_case package directories
    ├── __init__.py
    ├── models.py                   # snake_case module files
    ├── payment_processor.py
    └── tests/
        └── test_payment_processor.py # test_<name>.py
```

| Element                 | Convention           | Example                     | Bad Example                             |
| :---------------------- | :------------------- | :-------------------------- | :-------------------------------------- |
| **Packages / Folders**  | `snake_case` (short) | `order_processing/`         | `OrderProcessing/`, `order-processing/` |
| **Modules / Files**     | `snake_case.py`      | `order_service.py`          | `OrderService.py`, `order-service.py`   |
| **Classes**             | `PascalCase`         | `OrderValidator`            | `order_validator`                       |
| **Functions / Methods** | `snake_case`         | `calculate_total()`         | `calculateTotal()`, `CalculateTotal()`  |
| **Variables**           | `snake_case`         | `retry_count`, `auth_token` | `retryCount`, `AuthToken`               |
| **Constants**           | `SCREAMING_SNAKE`    | `MAX_CONCURRENT_TASKS`      | `max_concurrent_tasks`                  |
| **Private Methods**     | `_snake_case`        | `_parse_headers()`          | `parseHeaders()`                        |

---

## 3. Semantic Function Naming: The Verb-Noun Rule

Functions perform actions. Their names must begin with a descriptive, intention-revealing verb:

### 3.1 Standard Action Verbs

| Verb                    | Meaning & Expected Return                                                                  | Examples                                       |
| :---------------------- | :----------------------------------------------------------------------------------------- | :--------------------------------------------- |
| `get`                   | Retrieves data immediately from memory or cache. Fast, no external network call expected.  | `getUserId()`, `getConfig()`                   |
| `fetch` / `find`        | Retrieves data via asynchronous I/O (Database, HTTP API, disk). May return null/undefined. | `fetchUserProfile()`, `findOrderById()`        |
| `calculate` / `compute` | Pure computation from inputs without external state side-effects.                          | `calculateTax()`, `computeHash()`              |
| `create` / `build`      | Instantiates and initializes a new object, entity, or aggregate.                           | `createOrder()`, `buildHttpRequest()`          |
| `validate`              | Validates data against rules. Returns validation result or throws validation error.        | `validatePayload()`, `validatePostalCode()`    |
| `parse`                 | Transforms raw unformatted data into a structured representation.                          | `parseJson()`, `parseJwtToken()`               |
| `convert` / `to`        | Type or representation conversion.                                                         | `toDto()`, `convertUtcToLocal()`               |
| `handle`                | Event or message listener responding to an external event.                                 | `handleOrderPaidEvent()`, `handleFormSubmit()` |

### 3.2 Boolean Accessors & Predicates

Always formulate questions that return `true` or `false`:

- `is` $\to$ State check (`isValid`, `isLoading`, `isCompleted`, `isEmpty`)
- `has` $\to$ Possession or capability (`hasPermission`, `hasExpired`, `hasChildren`)
- `can` $\to$ Permission or operational capability (`canExecute`, `canRefund`, `canCancel`)
- `should` $\to$ Conditional trigger (`shouldRetry`, `shouldNotifyUser`, `shouldAutoFlush`)

**Anti-Patterns to Avoid**:

- ❌ `valid()` $\to$ Ambiguous. Is it a verb ("make valid") or a boolean? Use `isValid` or `validate()`.
- ❌ `checkOrder()` $\to$ What does it do if invalid? Does it return a boolean? Use `isOrderValid()` or `assertOrderValid()`.

---

## 4. Symbol Placement & File Layout Conventions

When creating new files, follow standard structural layout from top to bottom:

```text
1. Imports (External / standard library first, then internal / local)
2. Type definitions & interfaces (exported or local)
3. Constants & configuration defaults
4. Main Class / Function export (Primary SUT or component)
5. Supporting private helper functions (pure, unexported)
```

### File Size & Cohesion Guardrails:

- **Max File Lines**: 300 lines (split into sub-modules if exceeded).
- **Max Function Lines**: 30 lines (extract private helper functions).
- **Max Parameters**: 3 parameters per function (if more are needed, pass an Options/Config object or DTO).
