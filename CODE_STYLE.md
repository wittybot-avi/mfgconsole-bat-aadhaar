# Code Style & Guidelines

## General

-   **TypeScript Strict Mode**: No `any` unless absolutely necessary during prototyping.
-   **Functional Components**: Use `const Component = () => {}` syntax.
-   **Imports**: Group imports by: React -> 3rd Party -> Local (Components) -> Local (Utils/Types).

## Directory Structure

-   `components/ui`: Generic, domain-agnostic components (Buttons, Inputs).
-   `features/*` or `pages/*`: Domain-specific logic.

## CSS / Styling

-   Use **Tailwind CSS** utility classes.
-   Avoid inline `style={{ ... }}` attributes.
-   Use `clsx` or `cn` helper for conditional classes.
-   Support Dark Mode using the `dark:` prefix.

## State Management

-   **Local State**: `useState` for form inputs, toggles, local UI visibility.
-   **Global State**: `Zustand` (`src/lib/store.ts`) for User Session, Theme, Notifications.
-   **Server State**: In a real app, use `TanStack Query`. For this mock, we use `useEffect` in pages.

## Error Handling

-   UI components should handle `loading` and `error` states gracefully.
-   Use the global Toast notification system for user feedback on actions.

## Comments

-   Use `// TODO: [INTEGRATION]` to mark lines that need backend connection.
-   JSDoc for complex service methods.
