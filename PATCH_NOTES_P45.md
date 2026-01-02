# Patch P45: EOL → Provisioning Workflow Activation

## Summary
This patch transforms the ASSURE/EOL module from a static display into a working workflow mini-app. It wires state transitions between Testing (S7), Certification (S8), and the Provisioning Queue (S9).

## Operational Workflow Activated

1. **EOL QA Queue**: Analyze packs in `READY_FOR_EOL` status.
2. **EOL Session (S7)**: 
   - New `EolRunTest.tsx` page handles direct measurement input.
   - Operators can "Start Test Cycle" and toggle PASS/FAIL results for automated suites.
3. **Certification (S8)**:
   - PASS results enable "Approve for Provisioning" in `EolDetails.tsx`.
   - This action promotes the Pack into a certified Battery Identity and queues it for S9.
4. **Provisioning Queue (S9)**:
   - New `ProvisioningQueue.tsx` page centralizes all certified assets awaiting BMS firmware pairing.
   - Accessible via the "Operate" menu.

## Technical Details

### New Routes
- `/assure/eol/run/:id`: Execution workstation for active QA tests.
- `/assure/eol/audit/:id`: Immutable record vault for session results.
- `/manufacturing/provisioning/queue`: High-traffic staging area for BMS pairing.

### State Transitions
- Enhanced `eolQaService.ts` to handle:
  - `startEolTest()`
  - `finalizeDecision()` (PASS/FAIL/QUARANTINE logic)
  - `createBatteryFromPack()` (S8 Certification signature)
  - `listProvisioningQueue()`

## Validation
- [x] Click "Analyze" in EOL Queue -> Navigate to Details.
- [x] Click "Run EOL Test Session" -> Start session -> Measured values -> Finalize PASS.
- [x] Click "Approve for Provisioning" -> Success toast -> Navigate to Provisioning Queue.
- [x] Verify "Audit Details" in EOL Review displays the measurements captured in step 2.

## Rollback instructions
1. Revert to `checkpoint/v1.8.9e-p44`.
2. Reset `patchInfo.ts` to `v1.8.9e`.
