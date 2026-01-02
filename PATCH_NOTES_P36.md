# Patch P36: Inbound & Dispatch UX (UI_PATCH_K3_INBOUND_DISPATCH_UX_V1)

## Summary
This patch completes the Standard Operating Procedure (SOP) primitives for the Inbound (S2) and Outbound (S10-S12) lifecycle stages. It ensures that material receipt and asset dispatch are governed by compliance-grade checklists and role-based guardrails. Additionally, it addresses technical debt by fixing chart layout warnings.

## Key Changes

### 1. Stage S2: Inbound Material Receipt
- **Cell Lot Detail**: Transformed into a guided checklist focusing on S2 SOP completion.
- **Inbound Docs**: New fields for PO Number, Invoice, and GRN to establish procurement-ledger binding.
- **QC Gate**: Added explicit Incoming QC pass/fail requirement to lot records.
- **Guardrails**: "Release to Production" is now locked until documentation, serialization, and QC are complete.
- **Bridge to S3**: Added logic to bridge published lots directly to manufacturing batch creation.

### 2. Stages S10-S12: Inventory & Dispatch
- **Inventory Readiness**: Real-time evaluation of packs for dispatch eligibility (Provisioning + QA pass) visible in inventory logs.
- **Dispatch Checklist**: New panel in Dispatch Detail enforcing compliance across batteries, document preparation, and transport binding.
- **Execution Workflow**: Added transport detail fields (Vehicle #, Carrier) required for S12 "Confirm Dispatch" action.
- **ActionGuards**: Protected final dispatch with `workflowGuardrails.getDispatchGuardrail`.

### 3. Chart Stability
- Added explicit `min-height` containers and fixed parent sizing for all `ResponsiveContainer` instances in Dashboard, Telemetry, and Analytics. This resolves the `width(-1) height(-1)` warnings in the developer console.

### 4. Runbook Context Awareness
- **Context Selector**: The "Material Receipt" and "Dispatch" runbooks now allow users to select a specific Lot or Order to evaluate its readiness across the operational spine.

## Rollback Instructions
1. Revert to git branch/tag `checkpoint/v1.8.5c-p35c`.
2. Reset `src/app/patchInfo.ts` to `1.8.5c`.

## RBAC Validation Checklist
- [x] **Logistics (C6)**: Full access to S2 document capture and S11 dispatch authorization.
- [x] **Operator (C2)**: Access to S4 inbound scans; S11 actions remain blocked.
- [x] **QA (C3)**: Required for Incoming QC (S2) and EOL pass-through (S11).
- [x] **View-Only**: Sees all readiness states and spines; execution actions are locked with "Permissions Required" tooltips.

## Diagnostics Validation
- Verified `StageHeader` correctly reflects S2, S10, S11, and S12 stages.
- Verified ActionGuard rejections log to `logger.warn` with detailed reasons.
