---
name: tdd
description: Enforce Red-Green-Refactor TDD cycle for .NET (xUnit), Python (pytest), and React (Vitest) development. Ensures tests are written before implementation code.
trigger: Load with `use skill tdd` or `/tdd`. Auto-suggested when plan has acceptance criteria.
---

# TDD Skill — Red-Green-Refactor

Enforce strict Test-Driven Development across the platform stack.

## The Cycle

```
  🔴 RED                    🟢 GREEN                  🔵 REFACTOR
  ┌────────────────┐       ┌────────────────┐       ┌────────────────┐
  │ Write ONE      │       │ Write MINIMUM  │       │ Clean up       │
  │ failing test   │──────▶│ code to pass   │──────▶│ without        │
  │                │       │                │       │ breaking tests │
  └────────────────┘       └────────────────┘       └────────────────┘
         ▲                                                  │
         └──────────────────────────────────────────────────┘
                          next behaviour
```

## Process

### RED Phase
1. Pick the next acceptance criterion from the plan.
2. Write ONE test that expresses that behaviour.
3. Run the test — it MUST fail (compile error or assertion failure).
4. If it passes without implementation → test has no value, rewrite it.

### GREEN Phase
1. Write the MINIMUM code to make the failing test pass.
2. No cleverness. No abstractions. Just make it pass.
3. Run ALL tests — new one passes, no regressions.

### REFACTOR Phase
1. Now clean up: extract methods, rename, remove duplication.
2. Run ALL tests — still passing.
3. Clean up the test if needed (readability only).

## .NET / xUnit Patterns

### Arrange-Act-Assert
```csharp
[Fact]
public async Task CalculateAsync_ValidPromo_ReturnsExpectedDiscount()
{
    // Arrange
    var sut = CreateSut();
    var context = new OrderContext(Guid.NewGuid(), 100m, "SAVE20");
    _promoRepo.Setup(r => r.GetByCodeAsync("SAVE20", It.IsAny<CancellationToken>()))
        .ReturnsAsync(new Promo { DiscountPercent = 20, IsActive = true });

    // Act
    var result = await sut.CalculateAsync(context, CancellationToken.None);

    // Assert
    result.IsSuccess.Should().BeTrue();
    result.Value.DiscountAmount.Should().Be(20m);
}
```

### Test Class Structure
```csharp
public class DiscountCalculatorTests
{
    // Shared mocks
    private readonly Mock<IPromoRepository> _promoRepo = new();
    private readonly Mock<ILogger<DiscountCalculator>> _logger = new();

    // SUT factory (System Under Test)
    private DiscountCalculator CreateSut() =>
        new(_promoRepo.Object, _logger.Object);

    // Tests grouped by method
    // Happy path first, then edge cases, then failure cases
}
```

### Theory for parameterised tests
```csharp
[Theory]
[InlineData(100, 20, 20)]    // 20% of 100 = 20
[InlineData(50, 10, 5)]      // 10% of 50 = 5
[InlineData(200, 50, 100)]   // 50% of 200 = 100
public async Task CalculateAsync_VariousAmounts_CalculatesCorrectly(
    decimal subtotal, int discountPercent, decimal expectedDiscount)
{
    // ...
}
```

### Integration Test (WebApplicationFactory)
```csharp
public class OrderEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public OrderEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PostOrder_WithDiscount_Returns201WithDiscountApplied()
    {
        // Arrange
        var request = new CreateOrderRequest { /* ... */ };

        // Act
        var response = await _client.PostAsJsonAsync("/api/orders", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var order = await response.Content.ReadFromJsonAsync<OrderResponse>();
        order!.DiscountApplied.Should().Be(20m);
    }
}
```

## Python / pytest Patterns

```python
class TestDiscountCalculator:
    """Tests for discount_calculator module."""

    def test_valid_promo_returns_discount(self, mock_promo_repo):
        """Valid promo code should return calculated discount."""
        # Arrange
        mock_promo_repo.get_by_code.return_value = Promo(discount_percent=20)
        calc = DiscountCalculator(promo_repo=mock_promo_repo)

        # Act
        result = calc.calculate(subtotal=100.0, promo_code="SAVE20")

        # Assert
        assert result.is_success
        assert result.value.amount == 20.0

    @pytest.mark.parametrize("promo_code", [None, "", "   "])
    def test_empty_promo_returns_zero(self, promo_code, mock_promo_repo):
        calc = DiscountCalculator(promo_repo=mock_promo_repo)
        result = calc.calculate(subtotal=100.0, promo_code=promo_code)
        assert result.value.amount == 0.0
```

## React / Vitest Patterns

```typescript
describe('useDiscount', () => {
  it('returns discount when valid promo applied', async () => {
    // Arrange
    server.use(
      http.post('/api/discounts/calculate', () =>
        HttpResponse.json({ amount: 20, rule: 'SAVE20' })
      )
    );

    // Act
    const { result } = renderHook(() => useDiscount('SAVE20', 100));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert
    expect(result.current.data?.amount).toBe(20);
  });
});
```

## Rules

- ONE failing test at a time. Never write two RED tests before going GREEN.
- GREEN phase = simplest possible code. No abstraction, no DI, just pass the test.
- REFACTOR only when all tests are green.
- Mock only at system boundaries (DB, HTTP, message broker, file system).
- Test names: `MethodName_Scenario_ExpectedBehaviour`
- Every acceptance criterion from the plan = at least one test.

## Reporting

After each cycle, report to Orchestrator (caveman-compressed):

```
🔴 CalculateAsync_ExpiredPromo_ReturnsFailure → FAIL ✓ (expected)
🟢 Added expiry check in CalculateAsync → PASS ✓
🔵 Extracted ValidatePromo() helper → all 4 tests PASS ✓
```
