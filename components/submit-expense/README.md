# Submit Expense Components Architecture

This document explains the architecture and patterns used in the submit-expense components and how they're reused in the submit-grant flow.

## Overview

The submit-expense system is built around a sophisticated form management architecture that handles complex expense creation, editing, and invitation workflows. The system is designed for reusability, with the submit-grant flow leveraging the same underlying patterns and components.

## Core Files

- **`useExpenseForm.ts`** - Central hook that manages form state, validation, data fetching, and submission
- **`SubmitExpenseFlow.tsx`** - Main container component that manages the dialog and form lifecycle
- **`SubmitExpenseFlowSteps.tsx`** - Step navigation and progress tracking
- **`SubmitExpenseFlowForm.tsx`** - Form layout and section orchestration
- **`form/`** - Individual form sections and components

## Validation

**Zod Schema Validation** (in `useExpenseForm`), where the core validation logic is implemented

- Dynamic schema generation based on form options (see `buildFormSchema`)
- Context-aware validation (e.g. different rules for different expense types)

**API Error Handling** (in `SubmitExpenseFlow`), where API errors from mutations are handled through callback functions (`onError`).

**Display logic**

- Each step has defined validation fields through the `StepValues` object
- Step indicators in the sidebar show error states with red coloring for incomplete/invalid steps
- This tells the validation system which section to highlight and to scroll to when an error is encountered
- The `FormField` component checks `(meta.touched || form.submitCount)` to display errors inline
- If an error is not attributed to a specific step, a toast notification is displayed
- API errors are displayed via toast notifications

## Submit/Mutation Patterns

The submission logic (in `useExpenseForm.ts`) handles three different scenarios:

1. **Edit existing expense**: Uses `editExpense` mutation
2. **Create new expense**: Uses `createExpense` mutation for direct submissions
3. **Invite user**: Uses `draftExpenseAndInviteUser` for invitation workflows

### Additional Mutations

- **Payout Method Creation/Editing/Deletion** is directly implemented in `PayoutMethodSection`.

## Data Fetching

The main data fetching happens through the `ExpenseFormSchema` query, in `useExpenseForm`, which uses GraphQL `@include` directives for conditional fields (only fetches data when needed based on form state).

The `useExpenseForm` hook also takes care of **Exchange Rate Fetching**, in `updateExchangeRates`, triggered when expense items use different currencies.

## Performance tweaks

- **Memoization**: Uses `memoizeOne` for caching and memoization of the query results
- **buildFormOptions**: Memoize the individual option fields (like `availableReferenceCurrencies`), to prevent unnecessary re-renders in the sections
- **Ref-based State**: Uses refs for values that don't need to trigger re-renders
  **Examples:**
  - `initialLoading.current` - Tracks loading state without triggering re-renders during initialization
  - `startOptions.current` - Stores initial configuration that doesn't change
  - `expenseFormValues.current` - Caches form values for comparison without re-rendering
  - `setInitialExpenseValues.current` - Boolean flag to prevent duplicate initialization
- **Effect Cleanup**: Proper cleanup of async operations (e.g. in `updateExchangeRates`, we stop the query if the component unmounts before completion using an `AbortController`)

## Reuse in Submit Grant

### Grant Flow Architecture

The submit-grant flow (`SubmitGrantFlow.tsx`) reuses the expense form infrastructure:

1. **Same Form Hook**: Uses `useExpenseForm` with `ExpenseType.GRANT`
2. **Reused Components**: Leverages form sections like `WhoIsGettingPaidForm`, `PayoutMethodFormContent`, `ExpenseItemsForm`
3. **Custom Steps**: Implements grant-specific step navigation (`SubmitGrantFlowSteps.tsx`)
4. **Grant-specific Sections**: Adds grant-specific sections like `GrantProviderSection`, `InstructionSection`

## Key Design Patterns

### 1. Form Props Pattern

Each form section uses a consistent pattern for prop extraction and memoization:

```typescript
function getFormProps(form: ExpenseForm) {
  return {
    setFieldValue: form.setFieldValue,
    initialLoading: form.initialLoading,
    ...pick(form.options, ['account', 'host']),
    ...pick(form.values, ['accountSlug']),
  };
}

export const ComponentName = memoWithGetFormProps(function ComponentName(props: ReturnType<typeof getFormProps>) {
  // Component implementation
}, getFormProps);
```

### 2. Step-based Navigation

The step system provides consistent navigation and validation:

```typescript
export enum Step {
  WHO_IS_PAYING = 'WHO_IS_PAYING',
  WHO_IS_GETTING_PAID = 'WHO_IS_GETTING_PAID',
  // ... more steps
}

export const StepValues: Record<Step, Path<ExpenseFormValues>[]> = {
  [Step.WHO_IS_PAYING]: ['accountSlug'],
  // ... step to field mapping
};
```
