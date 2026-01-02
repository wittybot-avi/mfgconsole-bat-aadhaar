# Patch P35B: Runbooks Redirect & PatchInfo Restoration

## Summary
This hotfix addresses a critical regression where the `/runbooks` routes were missing from the central router (`App.tsx`), causing all guided workflow navigation to redirect to the dashboard. It also corrects the system versioning and patch level display to meet the P35B specification.

## Changes
- **Router Restoration**: Re-registered `runbooks` and `runbooks/:id` routes in `src/App.tsx`.
- **Versioning Fix**: Updated `src/app/patchInfo.ts` to reflect version `v1.8.5b` and patch level `35B`.
- **RBAC Policy Verification**: Confirmed that all clusters (C1-C9) have `VIEW` permissions for `RUNBOOK_HUB` and `RUNBOOK_DETAIL`.

## Rollback Steps
1. Revert to git branch/tag `checkpoint/v1.8.5a-p35a`.
2. Re-verify `src/App.tsx` manually if the regression persisted in the local workspace.

## Validation Checklist
- [x] Click "Runbooks" in sidebar -> Renders `RunbookHub.tsx`.
- [x] Click "Start Process" on a runbook card -> Renders `RunbookDetail.tsx`.
- [x] Bottom-left version info shows `v1.8.5b | P35B`.
- [x] Diagnostic mode correctly identifies `/runbooks` route.
