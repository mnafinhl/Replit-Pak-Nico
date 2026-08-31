---
name: Zod codegen compatibility
description: Orval may emit a Zod 4-only integer helper while this workspace still resolves Zod 3.
---

When regenerating API validators, check the resolved Zod version before trusting the generated output; the current workspace pins Zod 3, so generated `zod.int()` calls need the equivalent `zod.number().int()` form unless the workspace catalog is upgraded.

**Why:** Code generation can succeed while the chained library typecheck fails because the generator and installed validator version disagree.

**How to apply:** After OpenAPI codegen, run the library typecheck before building routes or frontend consumers, and resolve any version mismatch at the generated boundary.