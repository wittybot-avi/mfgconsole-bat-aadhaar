# Patch P35C: Runbooks Router Wiring proof (HOTFIX_RUNBOOKS_ROUTER_WIRING_PROOF_V1)

## Summary
This hotfix resolves persistent routing issues where clicking "Runbooks" would redirect to the Dashboard. It introduces an explicit "Location Proof" in Diagnostic Mode and hardcodes the sidebar link to eliminate registry-based resolution errors.

## Changes
- **Diagnostics**: Added `Location: <pathname><search><hash>` to the `DiagnosticBanner` to verify the actual browser URL state independently of component logic.
- **Router**: Updated `App.tsx` to use `runbookId` as the parameter name and ensured the wildcard route `*` renders the `NotFound` component instead of an auto-redirecting `Navigate` component, which was obscuring the root cause.
- **Sidebar**: Hardcoded the `/runbooks` link in `src/components/Layout.tsx` to ensure absolute pathing and bypass any potential registry lookup failures.
- **Components**: Updated `RunbookDetail.tsx` to correctly consume the `runbookId` param.

## Rollback Instructions
1. Revert to branch/tag `checkpoint/v1.8.5b-p35b`.
2. Ensure `src/app/patchInfo.ts` is reset to `v1.8.5b`.

## Validation Checklist
- [ ] Click "Runbooks" in sidebar:
  - Location Proof shows `/runbooks`.
  - Content renders `RunbookHub.tsx`.
- [ ] Navigate to `#/runbooks/mfg-run`:
  - Location Proof shows `/runbooks/mfg-run`.
  - Content renders `RunbookDetail.tsx`.
- [ ] Unknown path `#/invalid`:
  - Content renders `NotFound` (Compass UI).
  - Diagnostic Mode shows `Route Mismatch` badge.
