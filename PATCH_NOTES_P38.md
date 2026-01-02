# Patch P38: S2 → S3 Planning Bridge (UI_PATCH_K4_S3_BATCH_PLANNING_BRIDGE_V1)

## Summary
This patch implements the critical "Operational Bridge" between Stage S2 (Inbound Material Receipt) and Stage S3 (Manufacturing Batch Planning). It ensures that once a cell lot is validated and published, the user is guided directly into the planning phase with relevant context preserved.

## Key Changes
- **Guided Navigation**: Updated `CellLotDetail.tsx` to include an explicit "Issue to Batch" action that carries the Lot ID to the batches page.
- **Context Preservation**: The Batches list page now detects `prefillLotId` in the query parameters. If present, it automatically opens the "Create Batch" modal and pre-fills it with data derived from the source lot (e.g., target quantity).
- **Role-Awareness**: Bridge actions are only visible to authorized production/supervisor roles, ensuring compliance with the RBAC policy.
- **Visual Feedback**: The batch creation modal now displays a "Bridged from Inbound Lot" indicator when pre-filled, providing clear provenance to the operator.

## Rollback Instructions
1. Revert to git branch/tag `checkpoint/v1.8.6-p36`.
2. Reset `src/app/patchInfo.ts` version to `1.8.6`.

## Validation Checklist
- [x] Navigate to a PUBLISHED Cell Lot in S2.
- [x] Click "Issue to Batch".
- [x] Confirm redirection to `/batches?prefillLotId=...`.
- [x] Confirm "Create Batch" modal opens automatically.
- [x] Confirm Lot context is visible in the modal.
- [x] Confirm successful batch creation preserves the link in the `supplierLots` record.

## Known Limitations
- SKU mapping from chemistry is currently manual; automatic SKU recommendation based on lot attributes planned for P39.
