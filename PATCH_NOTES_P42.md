# Patch P42: EOL-Provisioning Flow Stabilization (HOTFIX_P42_EOL_FLOW_STABILIZATION_V1)

## Summary
This patch completes the EOL → Provisioning operational spine by fixing route navigation gaps and wiring specific SOP approval steps between S7 (Testing), S8 (Certification), and S9 (Provisioning).

## Changes

### 1. Route Registration
Registered the following paths in the central registry:
- `/assure/eol`: EOL QA Queue.
- `/assure/eol/:id`: S7/S8 Testing & Certification detail.
- `/assure/eol-review/:id`: Read-only audit mode for certified assets.
- `/assure/provisioning/:batteryId`: S9 Provisioning workstation.

### 2. EOL Detail Page (S7/S8)
- Updated `EolQaDetail.tsx` to handle parameterized `id` correctly.
- Added **SOP Guidance**: Explicit "Approve for Provisioning" button (S8 bridge) and "Return to QA" secondary action.
- Implemented **Review Mode**: Detects `/assure/eol-review` to disable modifications.

### 3. Provisioning Handoff (S9)
- Wired the "Go to Provisioning" CTA in EolDetail to deep-link directly into the `ProvisioningConsole`.
- Ensure `ProvisioningConsole` accepts `batteryId` for immediate workstation authorization.

### 4. Navigation Visibility
- Implemented workstation-level visibility rules in `Layout.tsx`.
- "Provisioning" workstation is prioritized for `SYSTEM_ADMIN` and `PRODUCTION_MANAGER` roles.

## Rollback Safety
1. Revert to git branch/tag `checkpoint/v1.8.9-p41`.
2. Reset `src/app/patchInfo.ts` version to `1.8.9b`.

## Validation Checklist
- [x] Click "Analyze" in EOL Queue -> Opens Detail page at `/assure/eol/:id`.
- [x] Pass EOL Test -> Click "Approve for Provisioning" -> Battery identity created (S8).
- [x] Click "Go to Provisioning" -> Opens Provisioning workstation with pre-filled ID.
- [x] Diagnostic Mode banner shows matching routes for all Assure screens.
- [x] "Return to QA" button works to reset/exit detail view.
