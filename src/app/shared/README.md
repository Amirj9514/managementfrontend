# Shared UI Patterns & Standards

To maintain a premium and consistent user experience, every data-driven page or component in this application MUST follow these standards for loading and empty states.

## The Skeleton & Empty State Rule

Every component that fetches data from an API MUST implement:
1.  **Skeleton Loader**: Shown while the data is being fetched (`loading` state is true).
2.  **Proper Empty State**: Shown when the data fetch is complete but the resulting dataset is empty.

### Standard Implementation Pattern

In your component template, use the following structure:

```html
<p-card>
  @if (loading()) {
    <!-- 1. Skeleton State -->
    <app-table-skeleton [columns]="5" [rows]="10" />
  } @else if (data().length === 0) {
    <!-- 2. Empty State -->
    <app-empty-state 
      title="No [Items] found" 
      description="Descriptive message helping the user understand why it's empty." 
      icon="lucide[IconName]"
      actionLabel="Create First [Item]"
      (actionClick)="openCreate()"
    />
  } @else {
    <!-- 3. Data State -->
    <p-table [value]="data()" [loading]="false">
      <!-- ... -->
    </p-table>
  }
</p-card>
```

### Components Used

- **`app-table-skeleton`**: Use this for all table-based layouts. 
    - `columns`: Number of columns to mimic.
    - `rows`: Number of skeleton rows to render.
- **`app-empty-state`**: Use this for all empty datasets.
    - `title`: Short headline.
    - `description`: Detailed explanation or guidance.
    - `icon`: Lucide icon name (e.g., `lucideInbox`, `lucideBuilding`).
    - `actionLabel`: (Optional) Text for a primary action button.
    - `actionClick`: (Optional) Event emitted when the action button is clicked.

## Why this matters?
- **Reduces Layout Shift**: Skeletons hold the space, preventing the UI from jumping when data arrives.
- **Improves Perceived Performance**: Users feel the app is faster when they see a "placeholder" immediately.
- **Guidance**: Empty states prevent the user from seeing a blank screen and guide them on what to do next.
