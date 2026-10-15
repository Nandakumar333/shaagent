# SOLID Principles Implementation & Refactoring Guide

This guide provides AI agents with practical definitions, concrete violations, and refactoring patterns for implementing the SOLID principles in modern software development.

---

## 1. S — Single Responsibility Principle (SRP)

> **"A class or module should have one, and only one, reason to change."**

### Violation (God Class Anti-Pattern):

```typescript
// ❌ BAD: One class handles business rules, persistence, email, and PDF rendering
export class OrderService {
  async processOrder(orderId: string): Promise<void> {
    const order = await db.query("SELECT * FROM orders WHERE id = $1", [
      orderId,
    ]);
    if (order.total <= 0) throw new Error("Invalid order total");

    // DB persistence
    await db.query("UPDATE orders SET status = $1 WHERE id = $2", [
      "PROCESSED",
      orderId,
    ]);

    // PDF Generation
    const doc = new PDFDocument();
    doc.text(`Invoice for order ${orderId}`);
    doc.save(`./invoices/${orderId}.pdf`);

    // Email Notification
    await mailer.send({
      to: order.customerEmail,
      subject: "Order Processed",
      body: "...",
    });
  }
}
```

### Refactored (Separation of Concerns):

```typescript
// ✅ GOOD: Each class has a single responsibility and single reason to change
export class OrderService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly invoiceGenerator: IInvoiceGenerator,
    private readonly notificationService: INotificationService,
  ) {}

  async processOrder(orderId: string): Promise<OrderResult> {
    const order = await this.orderRepository.getById(orderId);
    order.validateForProcessing(); // Domain logic in entity

    order.markAsProcessed();
    await this.orderRepository.save(order);

    const invoice = await this.invoiceGenerator.generate(order);
    await this.notificationService.notifyCustomer(order, invoice);

    return OrderResult.success(order.id);
  }
}
```

### SRP Verification Checklist for Agents:

- [ ] Does this class have more than one actor/stakeholder driving its changes?
- [ ] Are persistence, presentation, formatting, and domain rules mixed together?
- [ ] Is the file length $> 300$ lines or function length $> 30$ lines?

---

## 2. O — Open / Closed Principle (OCP)

> **"Software entities should be open for extension, but closed for modification."**

### Violation (Cascading Branching):

```typescript
// ❌ BAD: Adding a new payment method requires modifying this function every time
export class PaymentProcessor {
  async process(method: string, amount: number): Promise<void> {
    if (method === "credit_card") {
      // 50 lines of Stripe integration
    } else if (method === "paypal") {
      // 40 lines of PayPal integration
    } else if (method === "crypto") {
      // 60 lines of Crypto integration
    } else {
      throw new Error(`Unsupported payment method: ${method}`);
    }
  }
}
```

### Refactored (Strategy Pattern / Polymorphic Dispatch):

```typescript
// ✅ GOOD: New payment methods implement IPaymentStrategy without altering existing code
export interface IPaymentStrategy {
  readonly supportedMethod: string;
  process(amount: number): Promise<PaymentReceipt>;
}

export class PaymentProcessor {
  private readonly strategies = new Map<string, IPaymentStrategy>();

  constructor(strategyList: IPaymentStrategy[]) {
    for (const strat of strategyList) {
      this.strategies.set(strat.supportedMethod, strat);
    }
  }

  async process(method: string, amount: number): Promise<PaymentReceipt> {
    const strategy = this.strategies.get(method);
    if (!strategy) {
      throw new UnsupportedPaymentMethodError(method);
    }
    return strategy.process(amount);
  }
}
```

---

## 3. L — Liskov Substitution Principle (LSP)

> **"Subtypes must be substitutable for their base types without altering program correctness."**

### Violation (Contract Breaking):

```typescript
// ❌ BAD: Subclass throws NotImplementedException or breaks expected contract
export interface IFileStorage {
  uploadFile(path: string, content: Buffer): Promise<string>;
  deleteFile(path: string): Promise<void>;
  generateSignedDownloadUrl(
    path: string,
    expireMinutes: number,
  ): Promise<string>;
}

export class LocalDiskStorage implements IFileStorage {
  async uploadFile(path: string, content: Buffer): Promise<string> {
    /* ... */
  }
  async deleteFile(path: string): Promise<void> {
    /* ... */
  }

  async generateSignedDownloadUrl(): Promise<string> {
    // Violates LSP: Callers expecting a signed URL will crash unexpectedly at runtime
    throw new Error("Signed URLs are not supported for Local Disk Storage!");
  }
}
```

### Refactored (Role Interfaces honoring LSP):

```typescript
// ✅ GOOD: Segregate capabilities so implementations only promise what they actually support
export interface IBasicFileStorage {
  uploadFile(path: string, content: Buffer): Promise<string>;
  deleteFile(path: string): Promise<void>;
}

export interface ISignedUrlCapableStorage extends IBasicFileStorage {
  generateSignedDownloadUrl(
    path: string,
    expireMinutes: number,
  ): Promise<string>;
}
```

---

## 4. I — Interface Segregation Principle (ISP)

> **"Clients should not be forced to depend upon interfaces that they do not use."**

### Violation (Fat Interface):

```csharp
// ❌ BAD: Massive interface forcing all implementations and consumers to handle unrelated methods
public interface IUserRepository
{
    Task<User> GetByIdAsync(Guid id);
    Task<IEnumerable<User>> GetAllActiveUsersAsync();
    Task CreateUserAsync(User user);
    Task UpdatePasswordHashAsync(Guid id, string hash);
    Task GenerateAuditLogExportAsync(DateTime from, DateTime to);
    Task SendWelcomeEmailAsync(Guid id); // Leaky concern: email in repository!
}
```

### Refactored (Segregated, Role-Focused Interfaces):

```csharp
// ✅ GOOD: Small, cohesive interfaces
public interface IUserReadRepository
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<User>> GetActiveUsersAsync(CancellationToken cancellationToken);
}

public interface IUserWriteRepository
{
    Task CreateUserAsync(User user, CancellationToken cancellationToken);
    Task UpdatePasswordHashAsync(Guid id, string hash, CancellationToken cancellationToken);
}
```

---

## 5. D — Dependency Inversion Principle (DIP)

> **"1. High-level modules should not depend on low-level modules. Both should depend on abstractions."**
> **"2. Abstractions should not depend on details. Details should depend on abstractions."**

### Violation (Direct Coupling to Infrastructure):

```typescript
// ❌ BAD: High-level business logic instantiates concrete Postgres client and AWS SDK
export class OrderFulfillmentUseCase {
  private pgClient = new PostgresClient(); // Direct concrete dependency
  private sesMailer = new AwsSesMailer();   // Hardcoded cloud provider

  async execute(orderId: string): Promise<void> {
    await this.pgClient.connect();
    // tightly bound to Postgres SQL syntax
    await this.sesMailer.sendEmail(...);
  }
}
```

### Refactored (Inversion of Control via Dependency Injection):

```typescript
// ✅ GOOD: Use case depends purely on domain/application abstractions
export interface IOrderStore {
  getOrder(id: string): Promise<Order>;
  updateOrder(order: Order): Promise<void>;
}

export interface IMessageDispatcher {
  dispatch(event: DomainEvent): Promise<void>;
}

export class OrderFulfillmentUseCase {
  constructor(
    private readonly orderStore: IOrderStore,
    private readonly messageDispatcher: IMessageDispatcher,
  ) {}

  async execute(orderId: string): Promise<void> {
    const order = await this.orderStore.getOrder(orderId);
    order.fulfill();
    await this.orderStore.updateOrder(order);
    await this.messageDispatcher.dispatch(new OrderFulfilledEvent(order.id));
  }
}
```

---

## 6. Layer Boundary Rules (Clean / Hexagonal Architecture)

```
        ┌──────────────────────────────────────────────┐
        │                 PRESENTATION                 │
        │   (Controllers, CLI, REST API, GraphQL, UI)   │
        └──────────────────────┬───────────────────────┘
                               │ depends on
                               ▼
        ┌──────────────────────────────────────────────┐
        │                 APPLICATION                  │
        │      (Use Cases, Commands, Queries, DTOs)     │
        └──────────────────────┬───────────────────────┘
                               │ depends on
                               ▼
        ┌──────────────────────────────────────────────┐
        │                    DOMAIN                    │
        │ (Entities, Value Objects, Domain Exceptions) │
        └──────────────────────────────────────────────┘
                               ▲ implements
                               │ interfaces
        ┌──────────────────────┴───────────────────────┐
        │                INFRASTRUCTURE                │
        │       (Databases, Message Queues, HTTP)       │
        └──────────────────────────────────────────────┘
```

1. **Domain Layer**: Zero dependencies on any external framework, database driver, HTTP library, or cloud SDK. Pure business logic.
2. **Application Layer**: Orchestrates use cases. Depends only on Domain. Exposes interfaces for external dependencies (Repositories, Notifiers, Gateways).
3. **Infrastructure Layer**: Implements interfaces defined in Application or Domain (e.g. `PostgresOrderRepository` implements `IOrderRepository`).
4. **Presentation Layer**: Consumes Application use cases. Converts HTTP/CLI inputs to Application requests.
