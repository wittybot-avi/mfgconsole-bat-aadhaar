# Patch P43: ASSURE Routing & Menu Stabilization (HOTFIX)

## Summary
This hotfix addresses critical routing regressions where ASSURE/EOL module links resulted in "Unknown Coordinates". It stabilizes the navigation menu by defining canonical paths and adding explicit registry validation.

## Key Fixes

### 1. Canonical Routing Strategy
Defined and registered stabilized paths for the ASSURE module:
- `/eol`: EOL QA Queue (Primary entry)
- `/assure/eol-setup`: EOL Station Configuration
- `/assure/eol-review`: EOL Quality Review Hub
- `/assure/eol-details/:id`: EOL Detailed Analysis

### 2. Redirects & Aliases
Added redirects in `App.tsx` to ensure legacy paths (e.g., `/assure/eol`, `/eol/details/:id`) seamlessly land on canonical routes without breaking deep links.

### 3. EOL Details Restoration
Implemented `EolDetails.tsx` as a standard SOP-guided screen for post-assembly pack verification. Wired the "Analyze" action in the QA Queue to this new route.

### 4. Sidebar Stabilization
- Updated `Layout.tsx` to prevent sidebar items from disappearing due to path mismatches.
- Added a Diagnostic Mode warning (Alert icon) for menu items pointing to unregistered routes.
- Ensured `EOL_QA_DETAIL` is hidden from the main sidebar but accessible via row actions.

### 5. RBAC Policy Check
Confirmed that Screen IDs `EOL_QA_STATION`, `EOL_QA_DETAIL`, `EOL_QA_STATION_SETUP`, and `EOL_QA_REVIEW` are correctly assigned to the QA (C3) and Super Admin (CS) clusters.

## Validation Checklist
- [x] Login as System Admin -> Sidebar ASSURE group shows all 3 primary workstations.
- [x] Click EOL Station Setup -> Page renders correctly.
- [x] Click EOL Review -> Page renders correctly.
- [x] QA Queue "Analyze" -> Navigates to `/assure/eol-details/:id`.
- [x] Diagnostic Mode -> No "Unknown Coordinates" for ASSURE paths.
- [x] Battery Identity & Provisioning remain visible and functional.

## Rollback Instructions
1. Revert to git branch/tag `checkpoint/v1.8.9c-P43`.
2. Reset `src/app/patchInfo.ts` version to `1.8.9c`.
