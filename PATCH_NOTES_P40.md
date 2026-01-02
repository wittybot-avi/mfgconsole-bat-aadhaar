# Patch P40: EOL, Identity & Provisioning (UI_PATCH_K6_S7_S9_EOL_IDENTITY_PROVISIONING_V1)

## Summary
This patch completes the manufacturing handover loop. It transforms the post-assembly testing (S7), certification (S8), and provisioning (S9) phases into governed SOP stages. It ensures that an asset is only "Dispatch Ready" once it has cleared all digital gates.

## Stage Coverage

### 1. Stage S7: EOL Testing / QA Queue
- **Workstation UX**: `EolQaDetail.tsx` refactored to Stage S7.
- **Session Control**: Added "Start Test Cycle" action (QA-role gated).
- **Hard Gates**: Decision hub (PASS/FAIL) is locked until the test checklist is 100% complete.

### 2. Stage S8: Battery Create & Identity
- **Digital Twin**: Added logic to `eolQaService` to promote a PASS pack into a certified Battery identity.
- **Certification**: Assets gain a `certificateId` and `certificationStatus` upon S8 completion.
- **Guardrails**: Blocked battery creation if EOL status is not PASS.

### 3. Stage S9: Provisioning
- **BMS Pairing**: `ProvisioningConsole.tsx` refactored to Stage S9.
- **Guided Checklist**: Steps added for firmware verification, config profile application, and handshake diagnostics.
- **Handover Gate**: Completion of S9 transitions the asset to "DONE" status, enabling inventory movement.

## Data Model Updates (Mock)
- `PackInstance`: Added `eolStatus`, `eolPerformedBy`, `eolTimestamp`, `batteryRecordCreated`.
- `Battery`: Added `packId`, `certificationStatus`, `certificateId`, `provisioningStatus`.

## Rollback Safety
1. Revert to git branch/tag `checkpoint/v1.8.8-p39`.
2. Reset `src/app/patchInfo.ts` version to `1.8.8`.

## RBAC Validation Checklist
- [x] **QA (C3)**: Owns S7 disposition and S8 certification.
- [x] **BMS Engineer (C5)**: Authorized for S9 provisioning sequence.
- [x] **Operator (C2)**: Can view EOL details but cannot certify; can assist in S9.
- [x] **View-Only**: Sees all states; all action buttons show "Blocked: <Role> required".

## Diagnostics Validation
- `checkConsistency()` returns 0 warnings.
- `StageHeader` attributes correctly set for S7, S8, and S9.
- Context carry-forward verified in "Manufacturing Execution Run" runbook.

## Known Limitations
- Handshake and Diagnostics in S9 are currently simulated timer-based mockups.
- Certificate PDF download in S8 is a placeholder stub.
