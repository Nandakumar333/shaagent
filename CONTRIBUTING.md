# Contributing to shaagent

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Getting Started

```bash
# Clone the repository
git clone https://github.com/Nandakumar333/shaagent.git
cd shaagent

# Install dependencies
npm ci

# Build
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

## Project Structure

```
├── packages/cli/       # Main CLI package (shaagent)
│   ├── src/            # TypeScript source
│   │   ├── engine/     # Template engine
│   │   ├── platforms/  # Platform detection
│   │   ├── index.ts    # CLI entry point
│   │   └── init.ts     # Init command logic
│   ├── tests/          # Vitest test suites
│   └── scripts/        # Build scripts
├── skills/             # Built-in skills
├── templates/          # Agent templates
└── .github/            # CI/CD workflows
```

## Development Workflow

1. **Fork** the repository
2. **Create a branch** from `develop`: `git checkout -b feature/my-feature`
3. **Make changes** with tests
4. **Run checks locally**:
   ```bash
   npm run lint
   npm run build
   npm test
   ```
5. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add new template engine`
   - `fix: resolve path resolution on Windows`
   - `docs: update README examples`
   - `test: add platform detection tests`
6. **Push** and open a Pull Request against `develop`

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Purpose |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `test:` | Adding/updating tests |
| `refactor:` | Code change that neither fixes a bug nor adds a feature |
| `chore:` | Build process, tooling, dependencies |
| `ci:` | CI/CD changes |

## Pull Request Guidelines

- Keep PRs focused — one concern per PR
- Include tests for new functionality
- Update documentation if behavior changes
- Ensure CI passes before requesting review
- Link related issues using `Fixes #123` or `Closes #123`

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage --workspace=packages/cli

# Watch mode during development
npm run test:watch --workspace=packages/cli
```

## Adding a New Skill

1. Create a directory under `skills/your-skill-name/`
2. Add a `SKILL.md` with the skill metadata (name, description, instructions)
3. Add any supporting files (templates, configs)
4. Test with `shaagent install-skill ./skills/your-skill-name`

## Reporting Issues

- Use the [issue tracker](https://github.com/Nandakumar333/shaagent/issues)
- Include reproduction steps, expected behavior, and actual behavior
- Include your Node.js version and OS

## Code of Conduct

Be respectful. We follow the [Contributor Covenant](https://www.contributor-covenant.org/) code of conduct.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
