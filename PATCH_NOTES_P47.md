# Patch P47: Routing Finalization & Workstation Reliability

## Summary
This patch completes the canonical routing structure for the entire console, resolving "Unknown Coordinates" errors for EOL and Provisioning sub-modules. It also introduces context-loading reliability improvements to prevent workflow stalls.

## Changes

### 1. Canonical Route Alignment
- **EOL Run**: `/assure/eol/run/:buildId` registered.
- **EOL Audit**: `/assure/eol/audit/:buildId` registered.
- **Provisioning Queue**: `/manufacturing/provisioning/queue` registered.
- **Provisioning Setup**: `/manufacturing/provisioning/setup` registered.
- **Legacy Support**: Redirects added for `/assure/eol-setup`, `/assure/eol-review`, and `/provisioning`.

### 2. Sidebar Stabilization
- Updated `Layout.tsx` to ensure sidebar links point to canonical paths.
- Removed "Auto-Hide" logic for unregistered routes; items now show a diagnostic "UNREGISTERED" badge instead of disappearing.
- Standardized ASSURE workstation paths.

### 3. Workstation Reliability
- **Timeout Fallback**: Added a 3-second timeout to "Establishing secure context" loaders in EOL Details, Run, and Audit pages.
- **Error Recovery**: If context fails to load within 3s, an explicit recovery UI is shown with retry options, preventing permanent stalls.

### 4. Development Hardening
- **Registry Self-Test**: Added `assertRegisteredPaths()` to `routeRegistry.ts`. This runs on app initialization and logs missing route configurations to the console.

## Validation
- [x] "Go to Run EOL Test" from Details -> Opens `/assure/eol/run/:id`.
- [x] "Audit Details" from Review -> Opens `/assure/eol/audit/:id`.
- [x] Sidebar "Provisioning Queue" -> Opens `/manufacturing/provisioning/queue`.
- [x] Simulated slow network -> Fallback UI shows after 3 seconds.

## Rollback instructions
1. Revert to `checkpoint/v1.8.9g-p46`.
2. Reset `patchInfo.ts` to `v1.8.9g`.
