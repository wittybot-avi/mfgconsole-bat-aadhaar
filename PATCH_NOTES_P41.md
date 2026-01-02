# Patch P41: EOL Routing & Review Stabilization (HOTFIX_P41_EOL_ROUTES_AND_DETAILS_V1)

## Summary
This patch resolves critical routing regressions in the ASSURE (EOL) module where station setup and review links resulted in "Unknown Coordinates". It also formalizes the EOL Details page as a sub-route of the Assure namespace.

## Key Fixes

### 1. Route Namespace Standardization
Standardized all EOL-related paths under the `/assure/` prefix:
- Queue: `/assure/eol` (alias `/eol` preserved for compatibility)
- Setup: `/assure/eol-setup`
- Review: `/assure/eol-review`
- Details: `/assure/eol/:id`

### 2. EOL Review Module
Implemented `EolReview.tsx` to provide a filtered view of packs that have completed the S7 test cycle (Passed, Quarantined, or Scrapped).

### 3. Diagnostic Mode Alignment
Updated the `APP_ROUTES` registry to match actual router paths exactly, eliminating "Route Mismatch" warnings for the Assure module.

### 4. RBAC Policy Update
Ensured `EOL_QA_STATION_SETUP` and `EOL_QA_REVIEW` are correctly assigned to the QA (C3) and Super Admin (CS) clusters.

## Touched Files
- `src/app/patchInfo.ts`: Version bump v1.8.9b.
- `src/app/routeRegistry.ts`: Updated canonical paths.
- `src/App.tsx`: Re-organized EOL routes and added backward-compat alias.
- `src/rbac/policy.ts`: Added missing EOL screen permissions.
- `src/pages/EolReview.tsx`: New review module.
- `PATCHLOG.md`: Updated history.

## Validation Checklist
- [x] Sidebar "EOL Station Setup" -> Renders `EolStationSetup.tsx`.
- [x] Sidebar "EOL Review" -> Renders `EolReview.tsx`.
- [x] Queue "Analyze" Button -> Renders `EolQaDetail.tsx` for specific ID.
- [x] Diagnostic Banner -> Shows 0 mismatches for all EOL routes.
- [x] Deep link `#/assure/eol/PB-PEND-001` directly opens the correct record.

## Rollback Instructions
1. Revert to git branch/tag `checkpoint/v1.8.9a-p40a`.
2. Reset `src/app/patchInfo.ts` to `v1.8.9a`.
