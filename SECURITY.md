# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.2.x   | ✅ Current |
| < 0.2   | ❌ No longer supported |

## Reporting a Vulnerability

**Do NOT open a public issue for security vulnerabilities.**

Instead, please report security issues via one of:

1. **GitHub Security Advisories**: [Create a private advisory](https://github.com/Nandakumar333/shaagent/security/advisories/new)
2. **Email**: Contact the maintainer directly

### What to include

- Description of the vulnerability
- Steps to reproduce
- Impact assessment
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix release**: Within 2 weeks for critical issues

## Security Practices

This project follows these security practices:

- **Dependency scanning**: Dependabot monitors for vulnerable dependencies weekly
- **Static analysis**: CodeQL runs on every push and PR
- **npm audit**: Automated audit for known vulnerabilities in CI
- **Minimal permissions**: CI workflows use least-privilege permissions
- **Provenance**: npm packages published with provenance attestation
- **No secrets in code**: All secrets managed via GitHub Secrets

## Scope

The following are in scope for security reports:

- Command injection via user input
- Path traversal in template/skill installation
- Dependency vulnerabilities (critical/high severity)
- Arbitrary code execution during scaffolding

The following are out of scope:

- Issues in generated/scaffolded code (user responsibility)
- Social engineering
- Denial of service against the CLI itself
