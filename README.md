# Opencode Analyzer

Monorepo for OpenCode hook-based telemetry and analysis.

## Getting started

```bash
bun install
bun run dev
```

---

## `packages/shared`（类型与常量）

### `packages/shared/package.json`
```json
{
  "name": "@opencode/shared",
  "version": "0.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}