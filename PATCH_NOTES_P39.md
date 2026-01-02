# Patch P39: Line Execution Guided (UI_PATCH_K5_S4_S6_LINE_EXECUTION_GUIDED_V1)

## Summary
This patch completes the guided operational loop for the assembly floor. It transforms Module Assembly (S4), Pack Assembly (S5), and Pack Review (S6) into standard-governed execution screens that are aware of the manufacturing Batch context.

## Key Changes

### 1. Stage S4: Module Assembly
- Refactored `ModuleAssemblyDetail.tsx` to follow the S4 SOP stage.
- Added visible **Batch Context** badge to the navigation header.
- Updated progress tracking to use target population vs. bound population.

### 2. Stage S5: Pack Assembly
- Refactored `PackAssemblyDetail.tsx` to follow the S5 SOP stage.
- Implemented **Build Manifest** tab for module linkage governed by SKU requirements.

### 3. Stage S6: Pack Review & Pre-EOL
- Enhanced the QC tab in `PackAssemblyDetail.tsx` into a formal **S6 Review Gate**.
- Added **BMS Hardware Binding** and **Final SN Assignment** as mandatory review steps.
- Final release to EOL now requires a PASSED assembly QC decision.

### 4. Batch Context Support
- Added `batchId` to `ModuleInstance` and `PackInstance` domain types.
- Updated assembly queues to support `batchId` query parameters for deep-linking from Batch detail pages.
- Standardized `ActionGuard` tooltips for assembly floor operators.

## Rollback Instructions
1. Revert to git branch/tag `checkpoint/v1.8.7-p38`.
2. Reset `src/app/patchInfo.ts` version to `1.8.7`.

## Validation Checklist
- [x] Create a Module Build -> Confirm it shows **Stage S4**.
- [x] Seal a Module -> Confirm it enables linkage in a Pack Build.
- [x] Create a Pack Build -> Confirm it shows **Stage S5**.
- [x] Navigate to QC Tab -> Confirm it shows **Stage S6**.
- [x] Finalize Pack -> Confirm it moves to EOL Queue.
