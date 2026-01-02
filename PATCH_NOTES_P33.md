# Patch P33: Workflow Guardrails & Guidance

## Overview
This patch transitions the application from a "form-entry" tool to a governed "manufacturing console". It prevents invalid operations and guides users through correct workflow sequences.

## Key Features

### 1. Central Rule Engine
A new service `workflowGuardrails.ts` manages all valid state transitions and role-based permissions. All primary UI actions now consult this service before execution.

### 2. Gated Actions
The `GatedAction` component replaces standard buttons for primary workflow steps (e.g., Activating SKUs, Sealing Modules). 
- **Disabled State**: Buttons remain visible but are disabled if prerequisites aren't met.
- **Explainable UI**: Hovering over a disabled button shows a tooltip explaining exactly *why* it's locked (e.g., "Requires 16 cells, found 14").

### 3. Next Recommended Action
Major screens now feature a guidance panel that detects the current entity state and user role to suggest the most logical next step (e.g., "SKU is Active -> Create a Batch").

### 4. Status Standardization
Statuses have been normalized across the entire application for consistent visual cues:
- **DRAFT**: Planning phase.
- **ACTIVE**: Ready for use.
- **IN_PROGRESS**: Active assembly or test.
- **BLOCKED**: Quarantined or On-Hold.
- **COMPLETED**: Passed, Finalized, or Deployed.
- **FAILED**: Rejected or Scrapped.

### 5. Deep-Link Protection
Detail pages now validate their subjects on mount. If a user deep-links to a missing asset or an asset in an incompatible workflow state, they are safely redirected to the main queue with a notification.

## How to Extend
To add a new rule:
1. Open `src/services/workflowGuardrails.ts`.
2. Update the relevant `get{Entity}Guardrail` method.
3. Update the `getNextRecommendedStep` logic.
