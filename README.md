# Aayatana Tech - Battery Manufacturer Console

A frontend-only React application for managing battery pack manufacturing, EOL testing, logistics, and telemetry.

## Architecture

This project is built with a focus on clean separation of concerns to allow easy backend integration.

- **`src/domain`**: Contains TypeScript interfaces and enums describing the data model.
- **`src/services`**: Contains the API Abstraction Layer.
    - `api.ts` exports singleton services (e.g., `batchService`).
    - Currently uses mock data generators inside `api.ts`.
    - **Integration Goal**: Create `HttpBatchService` implementing `IBatchService` and swap it in `src/services/api.ts`.
- **`src/features` / `src/pages`**: UI Logic grouped by business domain.
- **`src/components/ui`**: Reusable design system components (Button, Card, Input) styled with Tailwind.
- **`src/lib`**: Utilities and global state store (Zustand).

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run development server**:
    ```bash
    npm run dev
    ```

## Key Features Implemented (Demo)

1.  **Dashboard**: Mock API calls to fetch KPI data and Recharts integration.
2.  **Batches**: Data grid with mocked manufacturing batches. "Create Batch" form using `react-hook-form` and `zod` validation.
3.  **Telemetry**: Real-time simulation loop showing live charts for Voltage, Current, and Temp.
4.  **Role-Based Access**: Use the dropdown in the top right to switch between Admin, QA, and Logistics roles. This updates the Sidebar navigation.
5.  **Theme Support**: Toggle Light/Dark mode.

## Integration Guide (Backend Team)

To connect this frontend to the real Aayatana API:

1.  Go to `src/services/api.ts`.
2.  Create a new class `HttpBatchService implements IBatchService`.
3.  Use `axios` or `fetch` to call your endpoints (e.g., `GET /api/v1/batches`).
4.  Update the export at the bottom of the file:
    ```typescript
    // export const batchService = new MockBatchService(); // DELETE
    export const batchService = new HttpBatchService(); // ADD
    ```
5.  Ensure API responses match the interfaces in `src/domain/types.ts`.

## Tech Stack

-   React 18
-   TypeScript
-   Tailwind CSS
-   Zustand (State)
-   Recharts (Visualization)
-   React Hook Form (Forms)
-   Lucide React (Icons)
