# Claude Code Instructions

This file contains critical rules and patterns for Claude Code when working on this project.

---

## 🚨 CRITICAL RULES - NEVER VIOLATE 🚨

### 1. GIT COMMIT POLICY

**NEVER create commits without explicit user permission.**

❌ **NEVER:**

- Run `git commit` unless user explicitly says "commit" or "create a commit"
- Assume user wants to commit because code is ready
- Commit after fixing lint/test errors automatically
- Commit "proactively" or "automatically"

✅ **ALWAYS:**

- Show changes with `git diff` or summary FIRST
- Then ASK: "Do you want me to commit these changes?"
- Wait for explicit confirmation before committing

**Only commit when user says:** "commit this", "create a commit", "git commit", "make a commit"

### 2. SCRIPT VERSION POLICY

**Increment `@version` in Tampermonkey script headers once per commit cycle.**

✅ **ALWAYS:**

- Before incrementing, check if version was already bumped since last commit: `git diff HEAD -- <file> | grep @version`
- Only increment if the version matches the last committed version (not already bumped)
- Use semantic versioning: `major.minor.patch` (e.g., `1.0.0` → `1.0.1` for fixes, `1.1.0` for features)

❌ **NEVER:**

- Increment version multiple times before a commit (one bump per commit cycle)

---

## 🤔 DEVELOPMENT METHODOLOGY

**CRITICAL PRIORITY: Code quality, maintainability, and best practices over speed.**

### Interaction Approach

- **Ask questions** when details are unclear or ambiguous
- **Challenge assumptions** - propose alternatives when better solutions exist
- **Think critically** - analyze requirements and make well-reasoned recommendations
- **Validate assumptions** before proceeding
- **Propose trade-offs** when multiple solutions exist

### Problem-Solving

- Think through edge cases and potential issues
- Suggest better approaches when identified
- Follow established patterns in the codebase

---

## 📚 COMMIT MESSAGE FORMAT

**Structure:**

```
<type>: <subject>

[optional body]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance, dependencies
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `style`: Code formatting

**Subject:** Clear, concise description in imperative mood

**Body (optional):**

- Add details only if needed for context
- Explain "why" if not obvious from subject
- Reference issues: `Fixes #123`, `Refs #456`

**Examples:**

```bash
feat: add product filtering to list view
fix: resolve mobile menu overlap with content
docs: update architecture documentation
refactor: extract validation logic to separate hook
test: add coverage for auth flow
chore: update dependencies to latest versions
```

---

## 🚫 DON'T DO

- ❌ Commit without explicit user permission (CRITICAL)
- ❌ Mix Spanish and English in code (English only)

---

## 💡 QUICK REFERENCE
