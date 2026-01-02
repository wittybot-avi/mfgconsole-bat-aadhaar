# Patch P40A: EOL Routing & Seeding Hotfix (HOTFIX_P40A_EOL_ROUTING_SEED_BATTERY_PROVISIONING_V1)

## Summary
This hotfix addresses critical routing regressions introduced in P40, specifically the "Unknown Coordinates" error when accessing EOL Station Setup and Review screens. It also enhances the demo experience by seeding the EOL queue and enabling the end-to-end flow from EOL PASS to Provisioning.

## Key Fixes

### 1. Routing & Router Wiring
- Fixed unregistered routes for `/eol`, `/assure/eol-setup`, and `/assure/eol-review`.
- Added path aliases to ensure sidebar links match registered routes exactly.
- Implemented deep-link support for Provisioning via `/provisioning/:batteryId`.

### 2. Demo Seeding (HAPPY_PATH)
- Updated seeder to populate the EOL queue with 3 Pending, 1 Passed, and 1 Failed pack.
- This allows immediate testing of the S7-S9 flow without requiring manual assembly steps.

### 3. Workflow Bridges
- **S7 -> S8**: EOL Detail now shows "Create Battery Record" only after a PASS disposition.
- **S8 -> S9**: Once a battery record exists, a primary CTA "Go to Provisioning" directs the user to the S9 workstation.

### 4. Permission Hardening
- Standardized camera permission requests: The browser prompt for `getUserMedia` now only triggers upon explicit "Scan QR" user interaction, preventing intrusive prompts on page load.

## Rollback Instructions
1. Revert to git branch/tag `checkpoint/v1.8.9-p40`.
2. Reset `src/app/patchInfo.ts` version to `1.8.9`.

## Validation Checklist
- [x] Click EOL Station Setup -> Renders correctly.
- [x] EOL QA Queue -> Shows 5 seeded packs in Happy Path.
- [x] EOL Pass -> Create Battery -> Navigate to Provisioning -> Link BMS: Works end-to-end.
- [x] No camera prompt on Dashboard load.
