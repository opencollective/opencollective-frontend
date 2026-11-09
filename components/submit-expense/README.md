# Submit Expense Components Architecture

This document explains the architecture of the Expense form, used to submit an Expense, submit a Grant
(`components/submit-grant`) and edit an existing Expense (`components/expenses/EditExpenseDialog.tsx`).

## Overview

`useExpenseForm` is the form's public interface: it returns the Formik form, plus the form `options`,
`actions`, `refresh`, `setItemCurrency` and `initialLoading`. Behind it, the form model is split into
pure modules in `lib/`, each with a table test next to it:

| Module                 | Responsibility                                                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/form-query.ts`    | The `ExpenseFormSchema` query, the form's only data fetch for options, and the variables it depends on.                                               |
| `lib/form-options.ts`  | `deriveFormOptions`: query result + values + start options + logged-in user → form options (payout methods, currencies, Expense types, flags...).     |
| `lib/form-schema.ts`   | `buildFormSchema`: the validation schema, built from the options only. Rules depending on other values read them from the value being validated.      |
| `lib/reconcile.ts`     | `reconcileExpenseForm`: the named, ordered rules that keep dependent fields consistent (defaults, hydration, currencies, attachments, tax...).        |
| `lib/payee-choice.ts`  | The only reader of the `payeeSlug` encoding (an Account slug or a `__` sentinel): kind of payee, slug to query, invitee and submission path.          |
| `lib/form-steps.ts`    | The steps of each flow (Expense, Grant, edit sub-forms) and the form values they own. Error attribution, scroll targets and partial validation.       |
| `lib/expense-input.ts` | `planExpenseSubmission`: form values → the mutation to run (create, invite or edit) and its variables. Edit sub-forms submit slices of the edit plan. |
| `lib/types.ts`         | Form values, options and start options types.                                                                                                         |

`useExpenseFormActions.ts` holds the mutations sections trigger (payout methods, payee Organization, legal
name, US-entity status). Each action owns mutate → resync → select.

## Data flow

1. **Fetch**: the hook runs the form query per instance (through the Apollo cache) when its variables
   change, or with `refresh()`. Only the result of the latest request is applied.
2. **Derive**: options are derived synchronously from the query result and the current values, and the
   schema from the options.
3. **Reconcile**: after each change of values or options, the reconcile step returns a patch, applied in a
   single update. A rule only runs when its dependencies changed since it last ran (like an effect). Context
   is explicit: the loading phase, whether the expense was loaded, and whether the submitter picked an item
   currency (`setItemCurrency`) or edited the title. The exchange rates it asks for are fetched by the hook
   and applied through the same update.
4. **Submit**: `planExpenseSubmission` builds the plan; the hook runs the matching mutation, or passes the
   plan to the caller's `onSubmit` (edit dialog sub-forms).

## Validation display

- The `FormField` component checks `(meta.touched || form.submitCount)` to display errors inline.
- Each step of a flow lists the form values it owns (`lib/form-steps.ts`). Step indicators show error
  states, and the form scrolls to the first incomplete step on submit. A test ensures every validated value
  belongs to exactly one Expense step.
- API errors are displayed via toast notifications (`onError`).

## Sections

Sections (`form/`) only keep presentation. They read what they need through the form props pattern and
trigger changes with `setFieldValue` or form actions:

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

The payout-method components are also reused outside the form (the edit dialog's payout-method form and
the payout methods settings): those build their own actions with `useExpenseFormActions`.

## Tests

- `useExpenseForm.characterization.test.tsx`: the hook through its public interface, against a real Apollo
  client answering operations from fixtures (`testing/`).
- `useExpenseForm.actions.test.tsx`: the form actions, with mocked mutations.
- `components/expenses/EditExpenseDialog.subforms.test.tsx`: the exact payload of each edit sub-form.
- `lib/*.test.ts`: table tests for each module.
