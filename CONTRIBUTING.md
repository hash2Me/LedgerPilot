# Contributing to LedgerPilot

Thank you for contributing to LedgerPilot! As an enterprise-grade FinTech project, we maintain strict code quality, schema integrity, and security standards.

## 📋 Development Principles

1. **Schema-First**: Never create an API endpoint or UI form without first having the corresponding schema defined in Prisma and validated with Zod.
2. **Type Safety**: Strictly avoid `any` or untyped data objects. Every API payload, database model, and React component prop must have full TypeScript coverage.
3. **Security by Default**: Never log PII, raw credentials, or sensitive tax IDs. Always validate data bounds and permissions before database writes.
4. **No Dead Code**: Remove unused imports, dead components, and obsolete mocks before opening a pull request.

## 🌿 Branching Strategy

- `main`: Production-ready, stable code.
- `develop`: Ongoing integration branch for Phase 1 modules.
- `feat/<feature-name>`: Dedicated feature branches (e.g., `feat/invoice-parser`, `feat/voice-notes`).
- `fix/<bug-name>`: Bug fixes and security patches.

## 📝 Commit Conventions

We follow the Conventional Commits specification:
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructuring without functional changes
- `chore:` Build process, dependency updates, or toolchain changes
- `docs:` Documentation improvements
- `test:` Unit or integration test additions

## 🧪 Verification Before Committing

Always ensure your changes pass linting and type-checking:
```bash
npm run lint
npm run build
```
