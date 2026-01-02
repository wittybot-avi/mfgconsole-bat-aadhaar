# Patch P34: SOP Guided UX (UI_PATCH_K1_SOP_GUIDED_UX_V1)

## Summary
This patch introduces Standard Operating Procedure (SOP) primitives to the detail pages of core manufacturing entities. It ensures users are guided through stages S1 to S12 with consistent headers, recommended next steps, and gated actions.

## Key Primitives
1. **StageHeader**: Displays the current SOP stage (e.g., S3: Authorization), entity context, and role identity.
2. **NextStepsPanel**: Dynamically suggests the next logical action based on the state machine in `workflowGuardrails.ts`.
3. **ActionGuard**: Standardizes action buttons with tooltip-based rejection reasons and diagnostic logging.

## Touched Files
- `src/app/patchInfo.ts`: Version bump and patch ID update.
- `src/components/SopGuidedUX.tsx`: New component library for the primitives.
- `src/pages/SkuDetail.tsx`: Integrated Stage S1 (Design).
- `src/pages/BatchDetail.tsx`: Integrated Stage S3 (Authorization).
- `src/pages/ModuleAssemblyDetail.tsx`: Integrated Stage S5 (Assembly).
- `src/pages/PackAssemblyDetail.tsx`: Integrated Stage S6 (Final Assembly).
- `src/pages/BatteryDetail.tsx`: Integrated Stage S8 (Provisioning).
- `src/services/workflowGuardrails.ts`: Added battery-specific guardrails and next-step logic.

## Rollback Instructions
1. Revert to git branch/tag `checkpoint-v1.8.3-p33`.
2. Or delete `src/components/SopGuidedUX.tsx` and revert the modifications in the 5 detail pages.
3. Reset `src/app/patchInfo.ts` to `v1.8.3`.

## RBAC Validation Checklist
- [ ] **System Admin (CS)**: Bypasses all guards; can see "ALL ACTIONS ENABLED" diagnostics.
- [ ] **Operator (C2)**: Only S5/S6 primary actions enabled; S3 Release disabled.
- [ ] **Supervisor (C2_PROD_MGR)**: Can release batches (S3) but not sign-off QA (S7/S8).
- [ ] **QA (C3)**: Can perform test execution; cannot modify SKU designs (S1).
- [ ] **View Only**: All ActionGuards show "Blocked: <Role> permissions required".

## Diagnostic Notes
Components include `data-diagnostic-stage` and `data-diagnostic-id` attributes for automated test scrapers. All blocked actions log a `logger.warn` entry with the specific rejection reason.

## Known Limitations
- StageHeader icons are currently simplified; custom SVG per stage planned for P35.
- Deep-link protection in P33 is preserved but not yet integrated into the StageHeader breadcrumb path.
