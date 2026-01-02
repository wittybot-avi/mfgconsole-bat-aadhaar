# Patch P46: EOL → Provisioning → Audit Routing Completion

## Summary
This patch finalizes the canonical routing structure for the ASSURE and MANUFACTURING modules, resolving all "Unknown Coordinates" errors reported in the EOL workflow transition.

## Key Changes

### 1. Canonical Route Alignment
The following canonical routes are now explicitly registered in `App.tsx` and `routeRegistry.ts`:
- **EOL Execution**: `/assure/eol/run/:buildId` (Stage S7-RUN)
- **EOL Audit Detail**: `/assure/eol/audit/:buildId` (Audit Node)
- **Provisioning Queue**: `/manufacturing/provisioning/queue` (Stage S9-QUEUE)
- **Provisioning Setup**: `/manufacturing/provisioning/setup` (Station Configuration)

### 2. Workflow Linkages
- Updated `EolDetails.tsx` to correctly link "Run EOL Test" and "Audit Vault" buttons.
- Updated `EolReview.tsx` to link "Audit Details" to the canonical audit route.
- Standardized `:buildId` parameter usage across all EOL detail/execution pages for better diagnostic traceability.

### 3. Redirect Restoration
- Added explicit redirects for `/eol` and `/provisioning` to their new canonical queue locations.
- Restored legacy `assure/eol-setup` and `assure/eol-review` redirects to maintain deep-link integrity.

### 4. Diagnostic Hardening
- Resolved all "Route Mismatch" warnings in Diagnostic Mode for the Assure module.
- Every registered `ScreenId` now maps exactly to a functional path.

## Validation Checklist
- [x] Click "Run EOL Test Session" -> Navigates to `/assure/eol/run/:id`.
- [x] Click "Open Audit Vault" -> Navigates to `/assure/eol/audit/:id`.
- [x] Click sidebar "Provisioning Setup" -> Navigates to `/manufacturing/provisioning/setup`.
- [x] Diagnostic mode location proof matches defined path structure.
