# Patch P44: ASSURE Routing & Sidebar Stabilization

## Summary
This patch stabilizes the ASSURE module by defining canonical routes and exhaustive redirects, preventing "Unknown Coordinates" errors. It also restores the EOL Details page and gates global camera permissions.

## Changes

### 1. Canonical Routing (Namespace: /assure/eol)
- Defined `/assure/eol/queue` as primary QA list.
- Defined `/assure/eol/setup` as station configuration.
- Defined `/assure/eol/review` as audit dashboard.
- Defined `/assure/eol/details/:id` as build-specific analysis.

### 2. Backward Compatibility
- Redirects added from `/eol`, `/eol-setup`, `/eol-review` to their canonical counterparts.
- Redirects added within namespace: `/assure/eol` -> `/assure/eol/queue`.

### 3. EOL Details Restoration
- Implemented `EolDetails.tsx` with full SOP Stage S7 compliance.
- Wired "Analyze" button in EOL Queue to open this page.

### 4. Privacy & Permissions
- Removed `camera` from `metadata.json` global permissions.
- Verified that scanning pages (like Provisioning) now only request camera permission upon user intent.

### 5. Diagnostic Hardening
- Updated `routeRegistry.ts` to exactly match router definitions.
- Resolved "Route Mismatch" warnings in Diagnostic Mode for all ASSURE pages.

## Rollback Instructions
1. Revert to git branch/tag `checkpoint/v1.8.9-p43`.
2. Reset `src/app/patchInfo.ts` to `1.8.9d`.

## Validation Checklist
- [x] Click sidebar "EOL / QA Queue" -> Opens `/assure/eol/queue`.
- [x] Click "Analyze" on row -> Opens `/assure/eol/details/:id`.
- [x] Direct navigate to `#/eol` -> Redirects to `#/assure/eol/queue`.
- [x] Diagnostic Banner -> 0 mismatches for Assure routes.
