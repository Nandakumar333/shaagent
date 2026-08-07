---
name: security-scan
description: OWASP-aligned automated security scan for .NET microservices, React frontends, and Python services. Pattern-based detection of vulnerabilities in code changes.
trigger: Load with `use skill security-scan` or `/security-scan`. Auto-invoked by @security agent.
---

# Security Scan Skill

Perform a systematic security scan on code changes for a distributed .NET microservices platform.

## Quick Usage

```
/security-scan                        # scan all staged/changed files
/security-scan src/PaymentService/    # scan specific service
/security-scan --focus A03            # focus on OWASP A03 (Injection)
```

## Scan Engine

### Step 1 — Identify Scope
```bash
# Get changed files
git diff main...HEAD --name-only > .opencode/temp/scan-scope.txt
```

Classify each file by risk tier:
| Tier | Examples | Scan Depth |
|------|----------|-----------|
| 1 (Critical) | Auth middleware, payment handlers, crypto, shared secrets | Line-by-line |
| 2 (High) | Controllers, HTTP clients, message consumers, validators | Method-level |
| 3 (Medium) | Services, repositories, domain logic | Pattern-match |
| 4 (Low) | DTOs, config, UI components, tests | Quick scan |

### Step 2 — Pattern Detection

#### .NET Dangerous Patterns

```csharp
// 🚨 SQL Injection
$"SELECT * FROM Users WHERE Id = '{userId}'"          // string interpolation in SQL
string.Format("DELETE FROM {0}", tableName)            // format in SQL
FromSqlRaw($"SELECT * FROM Users WHERE Name = '{name}'")  // EF raw SQL with interpolation

// 🚨 Command Injection
Process.Start("cmd", $"/c {userInput}")
Process.Start(new ProcessStartInfo { Arguments = userInput })

// 🚨 Hardcoded Secrets
private const string ApiKey = "sk-..."
var connectionString = "Server=prod;Password=secret123"
[FromHeader] string token = "default-token"

// 🚨 Broken Auth
[HttpGet("{id}")] // missing [Authorize]
public Task<User> GetUser(Guid id) => _repo.GetById(id);  // no ownership check

// 🚨 Mass Assignment
public Task<IActionResult> Create([FromBody] UserEntity user)  // binding to domain entity

// 🚨 Insecure Crypto
MD5.Create().ComputeHash(...)
SHA1.Create().ComputeHash(...)
new Guid().ToString()  // as security token
new Random().Next()    // for security-sensitive randomness

// 🚨 Deserialization
JsonConvert.DeserializeObject<T>(input, new JsonSerializerSettings { TypeNameHandling = TypeNameHandling.All })
BinaryFormatter.Deserialize(stream)

// 🚨 Information Disclosure
app.UseDeveloperExceptionPage()  // in production
_logger.LogInformation("User {Email} with password {Password}", email, pass)
return StatusCode(500, exception.ToString())  // stack trace to client

// 🚨 Async Anti-Patterns (security-relevant)
async void HandleAuth(...)  // unobservable exceptions in auth flow
task.Result  // potential deadlock in auth middleware
```

#### React/TypeScript Dangerous Patterns

```typescript
// 🚨 XSS
dangerouslySetInnerHTML={{ __html: userInput }}
document.innerHTML = userContent
eval(userString)

// 🚨 Sensitive Data Exposure
localStorage.setItem('auth_token', token)  // XSS can steal it
console.log('Token:', authToken)  // token in console

// 🚨 Insecure Communication
fetch('http://api.example.com/...')  // HTTP not HTTPS
```

#### Python Dangerous Patterns

```python
# 🚨 Injection
cursor.execute(f"SELECT * FROM users WHERE id = '{user_id}'")
os.system(f"ping {user_input}")
eval(user_input)
subprocess.call(user_input, shell=True)

# 🚨 Insecure Deserialization
pickle.loads(user_data)
yaml.load(user_data)  # without Loader=SafeLoader
```

### Step 3 — Contextual Analysis

Beyond pattern matching, reason about:

| Question | What to Check |
|----------|--------------|
| Can an unauthenticated user reach this code? | Trace from controller → check `[Authorize]` chain |
| Can a user access another user's data? | Check if resource ownership is validated |
| What happens if the external service is malicious? | Check response validation/sanitisation |
| Is the error response safe? | No stack traces, no internal details in 4xx/5xx |
| Is logging safe? | No PII, tokens, passwords in log templates |
| Can this be replayed? | Idempotency keys, nonce validation |

### Step 4 — Dependency Check
```bash
# .NET: check for vulnerable packages
dotnet list package --vulnerable --include-transitive

# npm: check frontend vulnerabilities  
npm audit --production

# Python: check for known CVEs
pip-audit
```

## Output Format

```markdown
# Security Scan — {scope}

## Executive Summary
| Severity | Count | Categories |
|----------|-------|-----------|
| Critical | N | {categories} |
| High | N | {categories} |
| Medium | N | {categories} |
| Low | N | {categories} |

**Risk Level:** 🔴 Critical | 🟡 Elevated | 🟢 Acceptable

## Findings

### 🔴 [CRITICAL] C-001: {title}
**OWASP:** A03:2021 Injection | **CWE:** CWE-89
**File:** `src/UserService/Repositories/UserRepository.cs:45`
**Pattern detected:** String interpolation in SQL query
**Code:**
```csharp
var sql = $"SELECT * FROM Users WHERE Email = '{email}'";
```
**Attack vector:** Attacker submits `' OR '1'='1` as email → dumps all users
**Business impact:** Full database compromise, PII breach, GDPR violation
**Remediation:**
```csharp
var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
// OR if raw SQL needed:
var sql = "SELECT * FROM Users WHERE Email = @Email";
await _connection.QueryAsync(sql, new { Email = email });
```
**Verification:** Add test: `GetByEmail_SqlInjectionAttempt_ReturnsNoResults`

### 🟡 [HIGH] H-001: ...
### 🟠 [MEDIUM] M-001: ...

## Dependency Vulnerabilities
| Package | Version | CVE | Severity | Fix |
|---------|---------|-----|----------|-----|
| Newtonsoft.Json | 12.0.1 | CVE-2024-XXXX | High | Upgrade to 13.0.3+ |

## Passed Checks ✅
- [x] No hardcoded secrets in source
- [x] All controllers have [Authorize] where required
- [x] Structured logging (no PII in templates)
- [x] HTTPS enforced for external calls

## Recommendations (priority order)
1. {immediate action}
2. {short-term fix}
3. {long-term hardening}
```

## Rules
- NEVER produce false positives without evidence from the actual code
- ALWAYS provide a concrete, working fix (not just "validate input")
- ALWAYS include attack vector/scenario for High+ findings
- Mark confidence level if pattern match is ambiguous
- Do not scan test files for hardcoded credentials (test fixtures are expected)
