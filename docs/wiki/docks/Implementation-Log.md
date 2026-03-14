# Implementation Log

Back to: [Wiki Home](../Home.md)

## 2026-03-15

### Shared Working Wiki Initialized

- Added a repo wiki structure under `docs/wiki`
- Added a maintenance rule in `AGENTS.md` so the wiki is kept current during substantial work
- Purpose: keep product thinking, architecture notes, and implementation history connected in one place

### Swish Plugin Architecture Exploration

- Branch: `swish-implementation`
- Commit: `0e4830364`
- Summary: introduced a registry-based receiving-money integration seam and added a Swish/plugin exploration note
- Main files:
  - `components/edit-collective/sections/ReceivingMoney.tsx`
  - `lib/plugins/receiving-money.tsx`
  - `docs/plugin-architecture.md`

## Logging Guidance

Add entries here when:

- a new branch is used for meaningful work
- a feature exploration turns into code
- a decision leads to a real implementation change
- the wiki should point to a specific commit, file, or RFC
