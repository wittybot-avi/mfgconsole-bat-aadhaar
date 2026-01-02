# Patch P35: Workflow Runbooks (UI_PATCH_K2_WORKFLOW_RUNBOOKS_V1)

## Summary
This patch introduces a "Operational Spine" via Guided Runbooks, allowing users to follow complex SOPs without manual navigation. It also hardens the Diagnostic Mode by resolving all missing route configuration warnings.

## Key Features
1. **Runbook Hub**: A central starting point for 4 major processes:
   - Manufacturing Execution Run
   - Material Receipt & Serialization
   - Dispatch & Custody Chain
   - Warranty Lifecycle Management
2. **Runbook detail spidnes**: Visual, step-by-step guides that map to real application routes with integrated RBAC and Guardrail awareness.
3. **Route Registry Hardening**: Every `ScreenId` defined in the system now correctly maps to a route path, ensuring the Diagnostic consistency check passes.

## Touched Files
- `src/app/patchInfo.ts`: Version bump v1.8.5.
- `src/rbac/screenIds.ts`: New screen IDs for runbooks.
- `src/app/routeRegistry.ts`: Fixed warnings by completing the mapping.
- `src/pages/RunbookHub.tsx`: New Hub page.
- `src/pages/RunbookDetail.tsx`: New Detail page.
- `App.tsx`: Registered new routes.
- `src/components/Layout.tsx`: Updated Sidebar.

## Rollback Instructions
1. Revert to git branch/tag `checkpoint-v1.8.4-p34`.
2. Ensure `src/app/patchInfo.ts` is reset to `v1.8.4`.

## RBAC Validation Checklist
- [x] **Production (C2)**: Can see "Manufacturing Run" enabled. Steps for QA are correctly shown as BLOCKED.
- [x] **QA (C3)**: Can see "Manufacturing Run". QA-specific steps are enabled.
- [x] **Logistics (C6)**: "Dispatch & Custody Chain" is fully accessible.
- [x] **External (C9)**: Can only start "Warranty Claims" intake; other runbooks show appropriate blocks.

## Diagnostics Validation
- Confirm `checkConsistency()` returns 0 warnings.
- Confirm "Guided Workflow" appears correctly in Diagnostic Identity section.

## Known Limitations
- Runbooks currently do not "auto-advance" steps; progress is manually tracked by navigation state.
- Deep linkage within runbooks (e.g., starting a run for a *specific* batch) planned for P36.