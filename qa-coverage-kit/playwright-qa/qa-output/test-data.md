# Test Data

> Domain-specific values the tests need. **Never write a secret here** — record the variable name from the suite's `.env` instead. Record IDs the tests rely on in `scripts/fixtures/test-data.json`.

| Data | Value or `.env` variable | Used by | Notes |
|---|---|---|---|
| QA login | `QA_EMAIL`, `QA_PASSWORD` | auth.setup.ts | Shared QA account |
