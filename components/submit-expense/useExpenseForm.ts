import React from 'react';
import type { FetchResult } from '@apollo/client';
import { gql, useApolloClient, useMutation } from '@apollo/client';
import type { Path, PathValue } from 'dot-path-value';
import type { FieldInputProps, FormikErrors, FormikHelpers } from 'formik';
import { useFormik } from 'formik';
import { debounce, isEmpty, isEqual, omit, set } from 'lodash-es';
import { useIntl } from 'react-intl';
import { z } from 'zod';

import type {
  CreateExpenseFromDashboardMutation,
  CreateExpenseFromDashboardMutationVariables,
  CurrencyExchangeRateRequest,
  EditExpenseFromDashboardMutation,
  EditExpenseFromDashboardMutationVariables,
  ExpenseFormExchangeRatesQuery,
  ExpenseFormExchangeRatesQueryVariables,
  ExpenseFormSchemaQuery,
  ExpenseFormSchemaQueryVariables,
  InviteExpenseFromDashboardMutation,
  InviteExpenseFromDashboardMutationVariables,
} from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { NEW_PAYOUT_METHOD_ID } from '../expenses/lib/constants';
import { type ExpenseSubmissionPlan, planExpenseSubmission } from './lib/expense-input';
import { deriveFormOptions, type ExpenseFormQueryResult } from './lib/form-options';
import { expenseFormSchemaQuery, getFormQueryVariables } from './lib/form-query';
import { buildFormSchema } from './lib/form-schema';
import { getExchangeRateUpdates, reconcileExpenseForm, type ReconcileState, type ValueUpdate } from './lib/reconcile';
import type { ExpenseFormOptions, ExpenseFormStartOptions, ExpenseFormValues } from './lib/types';
import { AnalyticsEvent } from '@/lib/analytics/events';
import { track } from '@/lib/analytics/plausible';

import { validatePayoutMethod } from '../expenses/PayoutMethodForm';
import { getCustomZodErrorMap } from '../FormikZod';

import { type ExpenseFormActions, useExpenseFormActions } from './useExpenseFormActions';

export type { ExpenseFormValues } from './lib/types';
export { InviteeAccountType, RecurrenceFrequencyOption, YesNoOption } from './lib/types';

type ExpenseFormik = Omit<ReturnType<typeof useFormik<ExpenseFormValues>>, 'setFieldValue' | 'getFieldProps'> & {
  setFieldValue: <F extends Path<ExpenseFormValues>>(
    field: F,
    value: PathValue<ExpenseFormValues, F>,
  ) => Promise<void> | Promise<FormikErrors<ExpenseFormValues>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFieldProps: <F extends Path<ExpenseFormValues>>(field: F) => FieldInputProps<any>;
};

export type ExpenseForm = ExpenseFormik & {
  options: ExpenseFormOptions;
  startOptions: ExpenseFormStartOptions;
  /** True until the form query answered and, when editing, the expense values were loaded */
  initialLoading: boolean;
  refresh: () => void;
  /** Sets an item currency picked by the submitter: item currencies then stop following the payout method */
  setItemCurrency: (index: number, currency: string) => void;
  /** Mutations sections trigger, which resync and select their result */
  actions: ExpenseFormActions;
};

const expenseFormExchangeRatesQuery = gql`
  query ExpenseFormExchangeRates($exchangeRateRequests: [CurrencyExchangeRateRequest!]!) {
    currencyExchangeRate(requests: $exchangeRateRequests) {
      value
      source
      fromCurrency
      toCurrency
      date
      isApproximate
    }
  }
`;

const INITIAL_FORM_OPTIONS: ExpenseFormOptions = { schema: z.object({}) };

/** Returns the previous value when the new one is deeply equal, to keep a stable identity */
function useDeepEqualMemo<T>(value: T): T {
  const ref = React.useRef<T>(value);
  if (!isEqual(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * The form does not always surface errors properly, this will help to troubleshoot.
 */
const logFormValidationError = debounce((...params) => {
  // eslint-disable-next-line no-console
  console.warn(...params);
}, 1000);

/**
 * Central hook for managing expense form state, validation, data fetching, and submission.
 *
 * This hook integrates Formik for form management, Zod for validation, Apollo Client for
 * data fetching/mutations, and handles complex initialization workflows for both expense
 * creation and editing scenarios.
 *
 * @param opts Configuration options including initial values, start options and callbacks
 * @returns ExpenseForm object with form state, options, actions and submission methods
 *
 * @see README.md for detailed architecture documentation
 */
export function useExpenseForm(opts: {
  /** Read once, when the hook mounts */
  initialValues: ExpenseFormValues;
  /** Read once, when the hook mounts */
  startOptions: ExpenseFormStartOptions;
  customData?: Record<string, unknown>;
  /** Called after the hook submitted the plan successfully (when `onSubmit` is not provided) */
  onSuccess?: (
    result: FetchResult<CreateExpenseFromDashboardMutation> | FetchResult<EditExpenseFromDashboardMutation>,
    type: 'new' | 'invite' | 'edit',
  ) => void;
  /** Called when submitting the plan failed (when `onSubmit` is not provided) */
  onError?: (err) => void;
  /** Replaces the hook's submission: receives the submission plan to execute */
  onSubmit?: (plan: ExpenseSubmissionPlan, formikHelpers: FormikHelpers<ExpenseFormValues>) => void | Promise<unknown>;
}): ExpenseForm {
  const intl = useIntl();
  const apolloClient = useApolloClient();
  const { LoggedInUser, refetchLoggedInUser } = useLoggedInUser();
  const [formQueryResult, setFormQueryResult] = React.useState<ExpenseFormQueryResult>(null);
  const startOptions = React.useRef(opts.startOptions);

  const initialValues = React.useRef(opts.initialValues);
  // The options derive from the form values, which Formik owns: callbacks given to Formik read the latest ones
  const formOptionsRef = React.useRef<ExpenseFormOptions>(INITIAL_FORM_OPTIONS);

  // GraphQL mutations for expense operations
  const [createExpense] = useMutation<CreateExpenseFromDashboardMutation, CreateExpenseFromDashboardMutationVariables>(
    gql`
      mutation CreateExpenseFromDashboard(
        $expenseCreateInput: ExpenseCreateInput!
        $account: AccountReferenceInput!
        $recurring: RecurringExpenseInput
      ) {
        expense: createExpense(expense: $expenseCreateInput, account: $account, recurring: $recurring) {
          id
          legacyId
        }
      }
    `,
    {
      context: {
        headers: {
          'x-is-new-expense-flow': 'true',
        },
      },
    },
  );

  const [draftExpenseAndInviteUser] = useMutation<
    InviteExpenseFromDashboardMutation,
    InviteExpenseFromDashboardMutationVariables
  >(
    gql`
      mutation InviteExpenseFromDashboard(
        $expenseInviteInput: ExpenseInviteDraftInput!
        $account: AccountReferenceInput!
      ) {
        expense: draftExpenseAndInviteUser(expense: $expenseInviteInput, account: $account) {
          id
          legacyId
        }
      }
    `,
    {
      context: {
        headers: {
          'x-is-new-expense-flow': 'true',
        },
      },
    },
  );

  const [editExpense] = useMutation<EditExpenseFromDashboardMutation, EditExpenseFromDashboardMutationVariables>(
    gql`
      mutation EditExpenseFromDashboard($expenseEditInput: ExpenseUpdateInput!, $draftKey: String) {
        expense: editExpense(expense: $expenseEditInput, draftKey: $draftKey) {
          id
          legacyId
        }
      }
    `,
    {
      context: {
        headers: {
          'x-is-new-expense-flow': 'true',
        },
      },
    },
  );

  const { onSubmit, onError, onSuccess } = opts;
  const onSubmitCallback = React.useCallback(
    async (values: ExpenseFormValues, formikHelpers: FormikHelpers<ExpenseFormValues>) => {
      const plan = planExpenseSubmission(values, formOptionsRef.current, startOptions.current, {
        customData: opts.customData,
      });
      if (onSubmit) {
        return onSubmit(plan, formikHelpers);
      }

      let result: FetchResult<CreateExpenseFromDashboardMutation> | FetchResult<EditExpenseFromDashboardMutation>;
      try {
        track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED);
        if (plan.kind === 'edit') {
          result = await editExpense({ variables: plan.variables });
          onSuccess(result, 'edit');
        } else if (plan.kind === 'create') {
          result = await createExpense({ variables: plan.variables });
          onSuccess(result, 'new');
        } else {
          result = await draftExpenseAndInviteUser({ variables: plan.variables });
          onSuccess(result, 'invite');
        }
        track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED_SUCCESS);
      } catch (err) {
        track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED_ERROR);
        onError(err);
      }
    },
    [opts.customData, onSubmit, editExpense, onSuccess, createExpense, draftExpenseAndInviteUser, onError],
  );

  const validate = React.useCallback(
    (values: ExpenseFormValues) => {
      const result = formOptionsRef.current.schema.safeParse(values, { errorMap: getCustomZodErrorMap(intl) });
      const newPayoutMethodErrors =
        values.payoutMethodId === NEW_PAYOUT_METHOD_ID &&
        omit(validatePayoutMethod(values.newPayoutMethod), ['data.currency', 'type']);
      if (result.success === false || !isEmpty(newPayoutMethodErrors)) {
        const errs = {};

        if (result.success === false) {
          for (const issue of result.error.issues) {
            set(errs, issue.path, issue.message);
          }
        }

        if (!isEmpty(newPayoutMethodErrors)) {
          errs['newPayoutMethod'] = {
            ...(errs['newPayoutMethod'] || {}),
            ...newPayoutMethodErrors,
          };
        }

        if (!isEmpty(errs)) {
          logFormValidationError('Form validation error', errs, values);
        }

        return errs;
      }
    },
    [intl],
  );

  const expenseForm: ExpenseFormik = useFormik<ExpenseFormValues>({
    initialValues: initialValues.current,
    validate,
    onSubmit: onSubmitCallback,
    validateOnBlur: false,
  });

  const queryVariables = useDeepEqualMemo(
    getFormQueryVariables(expenseForm.values, startOptions.current, LoggedInUser),
  );
  const latestFormQueryRequest = React.useRef(0);
  const fetchFormQuery = React.useCallback(
    async (variables: ExpenseFormSchemaQueryVariables, refresh = false) => {
      // Only the latest request's result is applied, so an outdated response cannot overwrite a newer one
      const requestId = ++latestFormQueryRequest.current;
      let result: ExpenseFormQueryResult;
      try {
        result = await apolloClient.query<ExpenseFormSchemaQuery, ExpenseFormSchemaQueryVariables>({
          query: expenseFormSchemaQuery,
          variables,
          errorPolicy: 'all',
          fetchPolicy: refresh ? 'network-only' : 'cache-first',
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        result = {};
      }

      if (requestId === latestFormQueryRequest.current) {
        setFormQueryResult(result);
      }
    },
    [apolloClient],
  );

  React.useEffect(() => {
    fetchFormQuery(queryVariables);
  }, [fetchFormQuery, queryVariables]);

  // Options keep their identity until their content changes, so the schema only changes with them
  const derivedOptions = useDeepEqualMemo(
    React.useMemo(
      () =>
        formQueryResult
          ? deriveFormOptions(formQueryResult, expenseForm.values, startOptions.current, LoggedInUser)
          : null,
      [formQueryResult, expenseForm.values, LoggedInUser],
    ),
  );
  const formOptions = React.useMemo<ExpenseFormOptions>(
    () =>
      !derivedOptions
        ? INITIAL_FORM_OPTIONS
        : { ...derivedOptions, schema: buildFormSchema(derivedOptions, intl, startOptions.current.pickSchemaFields) },
    [derivedOptions, intl],
  );
  formOptionsRef.current = formOptions;

  // The form is loading until the query answered and, when editing, the expense values were loaded
  const [hydrated, setHydrated] = React.useState(false);
  const isLoading = !formQueryResult || (Boolean(startOptions.current.expenseId) && !hydrated);
  const [itemCurrencyChosen, setItemCurrencyChosen] = React.useState(false);
  const [exchangeRateRequests, setExchangeRateRequests] = React.useState<CurrencyExchangeRateRequest[]>([]);

  // Apply the rules for dependent fields
  const reconcileState = React.useRef<ReconcileState>(null);
  // Updates are applied path by path, so they merge with changes made since this render (e.g. an
  // upload finishing). The form is then validated once, on the next render.
  const { setFieldValue, setFieldTouched, validateForm } = expenseForm;
  const pendingValidation = React.useRef(false);
  const applyUpdates = React.useCallback(
    (updates: ValueUpdate[]) => {
      // Formik's setFieldValue takes a `shouldValidate` flag, which the typed wrapper doesn't expose
      const setPath = setFieldValue as unknown as (field: string, value: unknown, shouldValidate: boolean) => void;
      updates.forEach(({ path, value }) => setPath(path, value, false));
      pendingValidation.current = pendingValidation.current || updates.length > 0;
    },
    [setFieldValue],
  );

  React.useEffect(() => {
    const result = reconcileExpenseForm(reconcileState.current, expenseForm.values, formOptions, {
      phase: isLoading ? 'loading' : 'ready',
      hydrated,
      itemCurrencyChosen,
      titleEdited: Boolean(expenseForm.touched.title),
      accountChosen: Boolean(expenseForm.touched.accountSlug),
      startOptions: startOptions.current,
    });
    reconcileState.current = result.state;
    Object.entries(result.touched).forEach(([field, isTouched]) => setFieldTouched(field, isTouched, false));
    applyUpdates(result.updates);
    if (!result.updates.length && pendingValidation.current) {
      pendingValidation.current = false;
      validateForm();
    }
    if (result.hydrated) {
      setHydrated(true);
    }
    setExchangeRateRequests(requests =>
      isEqual(requests, result.exchangeRateRequests) ? requests : result.exchangeRateRequests,
    );
  }, [
    expenseForm.values,
    expenseForm.touched,
    formOptions,
    isLoading,
    hydrated,
    itemCurrencyChosen,
    applyUpdates,
    setFieldTouched,
    validateForm,
  ]);

  // Fetch the exchange rates the rules asked for, and apply them through the same updates
  const latestValues = React.useRef(expenseForm.values);
  latestValues.current = expenseForm.values;
  const expenseCurrency = formOptions.expenseCurrency;
  React.useEffect(() => {
    if (isEmpty(exchangeRateRequests)) {
      return;
    }

    let cancelled = false;
    apolloClient
      .query<ExpenseFormExchangeRatesQuery, ExpenseFormExchangeRatesQueryVariables>({
        query: expenseFormExchangeRatesQuery,
        variables: { exchangeRateRequests },
      })
      .then(res => {
        if (!cancelled) {
          applyUpdates(getExchangeRateUpdates(latestValues.current, expenseCurrency, res.data?.currencyExchangeRate));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [apolloClient, exchangeRateRequests, expenseCurrency, applyUpdates]);

  // Revalidate when the options change
  React.useEffect(() => {
    validateForm();
  }, [formOptions.schema, validateForm]);

  const setItemCurrency = React.useCallback(
    (index: number, currency: string) => {
      setItemCurrencyChosen(true);
      setFieldValue(`expenseItems.${index}.amount.currency`, currency);
    },
    [setFieldValue],
  );

  const refresh = React.useCallback(() => fetchFormQuery(queryVariables, true), [fetchFormQuery, queryVariables]);

  // New payout methods belong to the payee, or to the recipient Host for cross-host payees
  const payeeHost = formOptions.payee && 'host' in formOptions.payee ? formOptions.payee.host : null;
  const isCrossHostPayee = Boolean(payeeHost && formOptions.host && payeeHost.id !== formOptions.host.id);
  const actions = useExpenseFormActions({
    resync: refresh,
    defaultPayoutMethodAccountSlug: isCrossHostPayee ? payeeHost.slug : expenseForm.values.payeeSlug,
    onPayoutMethodSaved: (payoutMethodId, { isNew }) => {
      setFieldValue('payoutMethodId', payoutMethodId);
      if (isNew) {
        setFieldValue('newPayoutMethod', { data: {} });
      }
    },
    onPayoutMethodRemoved: payoutMethodId => {
      if (payoutMethodId === latestValues.current.payoutMethodId) {
        setFieldValue('payoutMethodId', '');
      }
    },
    onProfilesChanged: refetchLoggedInUser,
    onPayeeOrganizationCreated: organization => {
      if (organization?.slug) {
        setFieldValue('payeeSlug', organization.slug);
        setFieldTouched('payeeSlug', true);
      }
    },
  });

  return Object.assign(expenseForm, {
    options: formOptions,
    startOptions: startOptions.current,
    initialLoading: isLoading,
    refresh,
    setItemCurrency,
    actions,
  });
}
