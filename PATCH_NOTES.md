# Patch Notes: UI Hardening & Safety Nets (L)

## Key Changes
- **Global Error Boundary**: The app now captures runtime crashes. Instead of a white screen, a detailed recovery UI appears.
- **Cache Management**: Added a "Hard Reset" feature in the Error Boundary to recover from corrupt scenario states.
- **Scenario Switching Guard**: Switching scenarios now includes a transition state, validation for the scenario ID, and a safe landing on the dashboard.
- **Diagnostic Bundles**: One-click "Copy Diagnostics" for troubleshooting.
- **Consistent Visuals**: Loading skeletons and descriptive empty states added to primary manufacturing modules.

## UI_PATCH_P48_CRITICAL_ROUTING_DEMO_HANDSHAKE (v1.8.9i)
- **Summary**: HOTFIX_ROUTING_REGISTRY + DEMO_HANDSHAKE_BYPASS.
- **Handshake Fix**: Detail pages (EOL Analysis, Run, Audit) now synthesize demo contexts if secure context handshake exceeds 3s, preventing permanent stalls on "Establishing secure context" screens.
- **Routing Stability**: Synchronized `:buildId` parameters across all EOL workflow pages and verified canonical route registration in `App.tsx` and `routeRegistry.ts`.
