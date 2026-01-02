# Patch P35A: Runbooks Routing Hotfix

## Summary
This hotfix resolves a routing regression where the "Runbooks" sidebar link incorrectly redirected to the Dashboard. The root cause was a partial truncation of the RBAC policy map in P35, which caused `RouteGuard` to default to an "Access Denied" state or trigger auto-recovery redirects for several roles.

## Fixes
1. **RBAC Policy Restoration**: Restored missing cluster definitions for Engineering (C4), BMS (C5), Warranty (C7), Compliance (C8), and External Partners (C9).
2. **Global Visibility**: Granted `VIEW` permission for Guided Runbooks to all roles, ensuring the "Operational Spine" is available as a reference even if specific actions within steps remain gated.
3. **Route Verification**: Re-verified that `/runbooks` correctly maps to `RunbookHub.tsx` and is not shadowed by the base Dashboard route.

## Rollback Instructions
1. Revert to git branch/tag `checkpoint/v1.8.5-p35`.
2. Reset `src/app/patchInfo.ts` version to `1.8.5`.

## Validation
- [x] Click "Runbooks" as System Admin -> Opens Runbook Hub.
- [x] Click "Runbooks" as OEM Partner (C9) -> Opens Runbook Hub (Previously failed).
- [x] Verified Diagnostic Mode shows Screen ID `RUNBOOK_HUB` at path `/runbooks`.
