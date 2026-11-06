import React from 'react';
import type { FetchResult } from '@apollo/client';
import { gql, useApolloClient, useMutation } from '@apollo/client';
import dayjs from 'dayjs';
import type { Path, PathValue } from 'dot-path-value';
import type { FieldInputProps, FormikErrors, FormikHelpers } from 'formik';
import { useFormik } from 'formik';
import { debounce, isEmpty, isEqual, omit, pick, set, uniqBy } from 'lodash-es';
import { useIntl } from 'react-intl';
import { z } from 'zod';

import type {
  CreateExpenseFromDashboardMutation,
  CreateExpenseFromDashboardMutationVariables,
  EditExpenseFromDashboardMutation,
  EditExpenseFromDashboardMutationVariables,
  ExpenseFormExchangeRatesQuery,
  ExpenseFormExchangeRatesQueryVariables,
  ExpenseFormSchemaQuery,
  ExpenseFormSchemaQueryVariables,
  InviteExpenseFromDashboardMutation,
  InviteExpenseFromDashboardMutationVariables,
} from '../../lib/graphql/types/v2/graphql';
import { Currency, ExpenseLockableFields, ExpenseStatus, ExpenseType } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { NEW_PAYOUT_METHOD_ID, PAYEE_SLUG_VENDOR } from '../expenses/lib/constants';
import { type ExpenseSubmissionPlan, planExpenseSubmission } from './lib/expense-input';
import { deriveFormOptions, type ExpenseFormQueryResult } from './lib/form-options';
import { expenseFormSchemaQuery, getFormQueryVariables } from './lib/form-query';
import { buildFormSchema } from './lib/form-schema';
import type { ExpenseFormOptions, ExpenseFormStartOptions, ExpenseFormValues, ExpenseItem } from './lib/types';
import { InviteeAccountType, YesNoOption } from './lib/types';
import { AnalyticsEvent } from '@/lib/analytics/events';
import { track } from '@/lib/analytics/plausible';

import { validatePayoutMethod } from '../expenses/PayoutMethodForm';
import { getCustomZodErrorMap } from '../FormikZod';

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
  initialLoading: boolean;
  refresh: () => void;
};

const INITIAL_FORM_OPTIONS: ExpenseFormOptions = { schema: z.object({}) };

/** Returns the previous value when the new one is deeply equal, to keep a stable identity */
function useDeepEqualMemo<T>(value: T): T {
  const ref = React.useRef<T>(value);
  if (!isEqual(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
}

function usePrevious<T>(value: T): T {
  const ref = React.useRef<T>(value);
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

const needExchangeRateFilter = (expectedCurrency: string) => (ei: ExpenseItem) =>
  expectedCurrency &&
  ei.amount.currency &&
  ei.amount.currency !== expectedCurrency &&
  (!ei.amount.exchangeRate ||
    !ei.amount.exchangeRate.source ||
    !ei.amount.exchangeRate.value ||
    ei.amount.exchangeRate.fromCurrency !== ei.amount.currency ||
    ei.amount.exchangeRate.toCurrency !== expectedCurrency ||
    (ei.amount.exchangeRate.source === 'OPENCOLLECTIVE' &&
      Math.abs(dayjs.utc(ei.amount.exchangeRate.date).diff(dayjs.utc(ei.incurredAt), 'days')) > 2));

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
 * @param opts Configuration options including form ref, initial values, and callbacks
 * @returns ExpenseForm object with form state, validation, and submission methods
 *
 * @see README.md for detailed architecture documentation
 */
export function useExpenseForm(opts: {
  formRef?: React.RefObject<HTMLFormElement>;
  initialValues: ExpenseFormValues;
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
  const { LoggedInUser } = useLoggedInUser();
  const [formQueryResult, setFormQueryResult] = React.useState<ExpenseFormQueryResult>(null);
  const startOptions = React.useRef(opts.startOptions);
  const [expenseLoaded, setExpenseLoaded] = React.useState(false);
  const setInitialExpenseValues = React.useRef(false);
  const initialLoading = React.useRef(true);

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

  const formOptions = React.useMemo<ExpenseFormOptions>(() => {
    if (!formQueryResult) {
      return INITIAL_FORM_OPTIONS;
    }

    const derivedOptions = deriveFormOptions(formQueryResult, expenseForm.values, startOptions.current, LoggedInUser);
    return { ...derivedOptions, schema: buildFormSchema(derivedOptions, intl, startOptions.current.pickSchemaFields) };
  }, [formQueryResult, expenseForm.values, LoggedInUser, intl]);
  formOptionsRef.current = formOptions;

  const prevFormOptions = usePrevious(formOptions);

  /* field dependencies */
  const setFieldValue = expenseForm.setFieldValue;
  const setFieldTouched = expenseForm.setFieldTouched;

  // Load initial values from expense
  React.useEffect(() => {
    if (!formOptions.expense || setInitialExpenseValues.current) {
      return;
    }

    setInitialExpenseValues.current = true;
    setFieldValue('accountingCategoryId', formOptions.expense.accountingCategory?.id);
    setFieldValue('accountSlug', formOptions.expense.account.slug);
    setFieldValue('expenseTypeOption', formOptions.expense.type);
    setFieldValue('payoutMethodId', formOptions.expense.payoutMethod?.id);
    setFieldValue('tags', formOptions.expense.tags);
    setFieldValue('title', formOptions.expense.description);
    setFieldTouched('title', true);
    setFieldValue('privateMessage', formOptions.expense.privateMessage);

    // Load taxes
    const taxes = formOptions.expense.taxes || [];
    setFieldValue('hasTax', taxes.length > 0);
    if (taxes?.length > 0) {
      setFieldValue('tax.idNumber', taxes[0].idNumber);
      setFieldValue('tax.rate', taxes[0].rate);
    }

    if (formOptions.expense.status === ExpenseStatus.DRAFT && formOptions.expense.draft?.payee) {
      if (
        formOptions.loggedInAccount &&
        formOptions.expense.draft.payee?.slug &&
        formOptions.expense.draft.payee?.slug === formOptions.loggedInAccount.slug
      ) {
        setFieldValue('payeeSlug', formOptions.expense.draft.payee?.slug);
      } else {
        if (formOptions.expense.draft?.payee?.slug) {
          setFieldValue('payeeSlug', formOptions.expense.draft?.payee?.slug);
        } else if (formOptions.expense?.draft?.payee?.organization) {
          setFieldValue('inviteeAccountType', InviteeAccountType.ORGANIZATION);
        } else {
          setFieldValue('inviteeAccountType', InviteeAccountType.INDIVIDUAL);
        }
        setFieldValue('inviteeNewOrganization', formOptions.expense?.draft?.payee);
        setFieldValue('inviteeNewIndividual', formOptions.expense?.draft?.payee);

        setFieldValue('inviteNote', formOptions.expense.longDescription);
      }
    } else if (formOptions.expense.payee?.slug) {
      setFieldValue('payeeSlug', formOptions.expense.payee?.slug);
    } else if (formOptions.expense.draft?.payee) {
      if (formOptions.expense?.draft?.payee?.organization) {
        setFieldValue('inviteeAccountType', InviteeAccountType.ORGANIZATION);
      } else {
        setFieldValue('inviteeAccountType', InviteeAccountType.INDIVIDUAL);
      }
      setFieldValue('inviteeNewOrganization', formOptions.expense?.draft?.payee);
      setFieldValue('inviteeNewIndividual', formOptions.expense?.draft?.payee);
    }

    const expenseAttachedFiles =
      formOptions.expense.status === ExpenseStatus.DRAFT
        ? formOptions.expense.draft?.attachedFiles
        : formOptions.expense.attachedFiles;
    const invoiceFile =
      formOptions.expense.status === ExpenseStatus.DRAFT
        ? formOptions.expense.draft?.invoiceFile
        : formOptions.expense.invoiceFile;
    const additionalAttachments = expenseAttachedFiles;

    if (!startOptions.current.duplicateExpense) {
      if (invoiceFile) {
        setFieldValue('invoiceFile', invoiceFile.url);
        setFieldValue('hasInvoiceOption', YesNoOption.YES);
        setFieldValue('invoiceNumber', formOptions.expense.reference);
      } else {
        setFieldValue('hasInvoiceOption', YesNoOption.NO);
      }
      if (additionalAttachments) {
        setFieldValue(
          'additionalAttachments',
          additionalAttachments.map(af => af.url),
        );
      }
    }

    if (formOptions.expense.invoiceInfo) {
      setFieldValue('invoiceInfo', formOptions.expense.invoiceInfo);
    }

    if (formOptions.expense.status === ExpenseStatus.DRAFT) {
      setFieldValue(
        'expenseItems',
        (formOptions.expense.draft?.items ?? []).map(ei => ({
          id: !startOptions.current.duplicateExpense ? ei.id : undefined,
          key: ei.id,
          attachment: ei.url,
          description: ei.description ?? '',
          incurredAt: ei.incurredAt ? dayjs.utc(ei.incurredAt).toISOString().substring(0, 10) : null,
          amount: {
            valueInCents: ei.amountV2?.valueInCents ?? ei.amount,
            currency: ei.amountV2?.currency ?? ei.currency,
          },
        })),
      );
    } else {
      setFieldValue(
        'expenseItems',
        (formOptions.expense.items ?? []).map(ei => ({
          id: !startOptions.current.duplicateExpense ? ei.id : undefined,
          key: ei.id,
          attachment: !startOptions.current.duplicateExpense ? ei.url : null,
          description: ei.description ?? '',
          incurredAt: !startOptions.current.duplicateExpense
            ? dayjs.utc(ei.incurredAt).toISOString().substring(0, 10)
            : null,
          amount: {
            valueInCents: ei.amount.valueInCents,
            currency: ei.amount.currency,
            exchangeRate: !startOptions.current.duplicateExpense ? ei.amount.exchangeRate : null,
          },
        })),
      );
      setFieldTouched('expenseItems', true);
      setExpenseLoaded(true);
    }
  }, [formOptions.expense, formOptions.loggedInAccount, setInitialExpenseValues, setFieldValue, setFieldTouched]);

  React.useEffect(() => {
    if (prevFormOptions?.host?.slug !== formOptions.host?.slug) {
      if (
        (expenseForm.values.payeeSlug === PAYEE_SLUG_VENDOR ||
          prevFormOptions.vendorsForAccount?.some(v => v.slug === expenseForm.values.payeeSlug)) &&
        !formOptions.vendorsForAccount?.some(v => v.slug === expenseForm.values.payeeSlug)
      ) {
        setFieldValue('payeeSlug', null);
      }
    }
  }, [
    prevFormOptions?.host?.slug,
    formOptions.host?.slug,
    prevFormOptions?.vendorsForAccount,
    formOptions.vendorsForAccount,
    expenseForm.values.payeeSlug,
    setFieldValue,
  ]);

  // Drop taxes when not supported
  React.useEffect(() => {
    if (!formOptions.taxType) {
      setFieldValue('hasTax', false);
      setFieldValue('tax', null);
    }
  }, [formOptions.taxType, setFieldValue]);

  // Move attachments when switching expense type
  React.useEffect(() => {
    if (expenseForm.values.expenseTypeOption === ExpenseType.INVOICE) {
      if (expenseForm.values.expenseItems.length === 1 && expenseForm.values.expenseItems[0].attachment) {
        setFieldValue('invoiceFile', expenseForm.values.expenseItems[0].attachment);
        setFieldValue('expenseItems.0.attachment', null);
        setFieldValue('hasInvoiceOption', YesNoOption.YES);
      } else {
        const numberOfAdditionalAttachments = expenseForm.values.additionalAttachments?.length ?? 0;
        let count = 0;

        expenseForm.values.expenseItems.forEach((item, i) => {
          if (item.attachment) {
            setFieldValue(`additionalAttachments.${numberOfAdditionalAttachments + count}`, item.attachment);
            setFieldValue(`expenseItems.${i}.attachment`, null);
            count++;
          }
        });
      }
    } else if (expenseForm.values.expenseTypeOption === ExpenseType.RECEIPT) {
      if (expenseForm.values.invoiceFile) {
        for (let i = 0; i < expenseForm.values.expenseItems.length; i++) {
          setFieldValue(`expenseItems.${i}.attachment`, expenseForm.values.invoiceFile);
        }
        setFieldValue('invoiceFile', null);
      }
    }
  }, [expenseForm.values.expenseTypeOption]);

  React.useEffect(() => {
    setFieldValue('payoutMethodNameDiscrepancyReason', '');
    setFieldTouched('payoutMethodNameDiscrepancyReason', false);
  }, [expenseForm.values.payoutMethodId, setFieldValue, setFieldTouched]);

  React.useEffect(() => {
    if (
      expenseForm.values.expenseItems.length === 1 &&
      !isEmpty(expenseForm.values.expenseItems[0].description) &&
      !expenseForm.touched.title &&
      !formOptions.lockedFields?.includes?.(ExpenseLockableFields.DESCRIPTION) &&
      expenseForm.values.expenseTypeOption !== ExpenseType.GRANT
    ) {
      setFieldValue('title', expenseForm.values.expenseItems[0].description);
    }
  }, [
    expenseForm.values.expenseItems,
    expenseForm.touched.title,
    setFieldValue,
    formOptions.lockedFields,
    expenseForm.values.expenseTypeOption,
  ]);

  React.useEffect(() => {
    if (initialLoading.current) {
      return;
    } else if (!expenseForm.values.hasTax) {
      setFieldValue('tax', null);
    } else if (!expenseForm.values.tax) {
      const selectedVendor = formOptions.vendorsForAccount?.find(
        v => v.slug === expenseForm.values.payeeSlug && formOptions?.taxType === v.vendorInfo?.taxType,
      );
      if (selectedVendor && !expenseForm.values.tax) {
        setFieldValue('tax', { idNumber: selectedVendor.vendorInfo?.taxId, rate: 0 });
      }
    }
  }, [
    expenseForm.values.hasTax,
    expenseForm.values.tax,
    expenseForm.values.payeeSlug,
    formOptions.vendorsForAccount,
    setFieldValue,
  ]);

  // Reset expense type if the account does not support it (unless we're editing an existing one)
  React.useEffect(() => {
    if (
      !initialLoading.current &&
      expenseForm.values.expenseTypeOption &&
      !formOptions.expense?.id &&
      formOptions.supportedExpenseTypes &&
      !formOptions.supportedExpenseTypes.includes(expenseForm.values.expenseTypeOption)
    ) {
      setFieldValue('expenseTypeOption', null);
    }
  }, [formOptions.supportedExpenseTypes, expenseForm.values.expenseTypeOption, formOptions.expense?.id, setFieldValue]);

  React.useEffect(() => {
    if (expenseForm.values.accountingCategoryId && (formOptions.accountingCategories || []).length === 0) {
      setFieldValue('accountingCategoryId', null);
    }
  }, [formOptions.accountingCategories, expenseForm.values.accountingCategoryId, setFieldValue]);

  // Reset reference currency if it's no longer in the available currencies
  React.useEffect(() => {
    if (
      !initialLoading.current &&
      formOptions.availableReferenceCurrencies &&
      expenseForm.values.referenceCurrency &&
      !formOptions.availableReferenceCurrencies.includes(expenseForm.values.referenceCurrency as Currency)
    ) {
      setFieldValue('referenceCurrency', null);
    }
  }, [expenseForm.values.referenceCurrency, formOptions.availableReferenceCurrencies, setFieldValue]);

  // Set item currency if we're done loading and there's a single available reference currency
  React.useEffect(() => {
    if (
      !initialLoading.current &&
      formOptions.availableReferenceCurrencies &&
      formOptions.availableReferenceCurrencies.length === 1 &&
      expenseForm.values.expenseItems.length === 1 &&
      !expenseForm.values.expenseItems[0].amount?.currency
    ) {
      setFieldValue('expenseItems.0.amount.currency', formOptions.availableReferenceCurrencies[0]);
    }
  }, [formOptions.availableReferenceCurrencies, setFieldValue, expenseForm.values.expenseItems]);

  // If there's an existing expense, assume that reference currency = expense currency
  React.useEffect(() => {
    if (
      formOptions.expense?.id &&
      formOptions.expense.currency &&
      !expenseForm.values.referenceCurrency &&
      formOptions.availableReferenceCurrencies?.length > 1
    ) {
      setFieldValue('referenceCurrency', formOptions.expense.currency);
    }
  }, [
    formOptions.expense,
    expenseForm.values.referenceCurrency,
    formOptions.availableReferenceCurrencies,
    setFieldValue,
  ]);

  React.useEffect(() => {
    if (isEmpty(expenseForm.values.expenseItems)) {
      return;
    }

    const exchangeRateRequests = uniqBy(
      expenseForm.values.expenseItems.filter(needExchangeRateFilter(formOptions.expenseCurrency)).map(ei => ({
        fromCurrency: ei.amount.currency as Currency,
        toCurrency: formOptions.expenseCurrency,
        date: dayjs.utc(ei.incurredAt).toDate(),
      })),
      ei => `${ei.fromCurrency}-${ei.toCurrency}-${ei.date}`,
    );

    expenseForm.values.expenseItems.forEach((ei, i) => {
      if (formOptions.expenseCurrency && ei.amount?.currency && ei.amount.currency === formOptions.expenseCurrency) {
        setFieldValue(`expenseItems.${i}.amount.exchangeRate`, null);
      }
    });

    if (isEmpty(exchangeRateRequests)) {
      return;
    }

    const ctrl = new AbortController();
    let queryComplete = false;

    /**
     * Fetches exchange rates for expense items with different currencies.
     * Uses AbortController to cancel in-flight requests on component unmount.
     */
    async function updateExchangeRates() {
      try {
        const res = await apolloClient.query<ExpenseFormExchangeRatesQuery, ExpenseFormExchangeRatesQueryVariables>({
          query: gql`
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
          `,
          context: {},
          variables: {
            exchangeRateRequests,
          },
        });

        if (ctrl.signal.aborted) {
          return;
        }

        queryComplete = true;
        if (!isEmpty(res.data?.currencyExchangeRate)) {
          expenseForm.values.expenseItems.forEach((ei, i) => {
            if (needExchangeRateFilter(formOptions.expenseCurrency)(ei)) {
              const exchangeRate =
                res.data.currencyExchangeRate.find(
                  rate =>
                    rate.fromCurrency === ei.amount.currency &&
                    rate.toCurrency === formOptions.expenseCurrency &&
                    (!ei.incurredAt || dayjs.utc(ei.incurredAt).isSame(dayjs.utc(rate.date), 'day')),
                ) ||
                res.data.currencyExchangeRate.find(
                  rate => rate.fromCurrency === ei.amount.currency && rate.toCurrency === formOptions.expenseCurrency,
                );
              setFieldValue(
                `expenseItems.${i}.amount.exchangeRate`,
                pick(exchangeRate, ['date', 'fromCurrency', 'toCurrency', 'value', 'source']),
              );
              setFieldValue(
                `expenseItems.${i}.amount.referenceExchangeRate`,
                pick(exchangeRate, ['date', 'fromCurrency', 'toCurrency', 'value', 'source']),
              );
            }
          });
        }
      } catch {
        return;
      }
    }

    updateExchangeRates();

    return () => {
      if (!queryComplete) {
        ctrl.abort();
      }
    };
  }, [
    apolloClient,
    formOptions.expenseCurrency,
    expenseForm.values.expenseItems,
    expenseForm.values.expenseTypeOption,
    setFieldValue,
  ]);

  // revalidate form
  const validateForm = expenseForm.validateForm;
  React.useEffect(() => {
    async function runValidation() {
      await validateForm();

      if (formQueryResult && !startOptions.current.expenseId) {
        initialLoading.current = false;
      } else if (formQueryResult && setInitialExpenseValues.current) {
        initialLoading.current = false;
      }
    }

    runValidation();
  }, [formOptions.schema, validateForm, formQueryResult]);
  React.useEffect(() => {
    if (startOptions.current.expenseId && !expenseLoaded) {
      return;
    }

    for (let i = 0; i < (expenseForm.values.expenseItems?.length ?? 0); i++) {
      const expenseItem = expenseForm.values.expenseItems[i];
      if (!expenseItem.amount?.currency) {
        setFieldValue(`expenseItems.${i}.amount.currency`, formOptions.expenseCurrency);
      }
    }
  }, [formOptions.expenseCurrency, expenseForm.values.expenseItems, setFieldValue, expenseLoaded]);

  React.useEffect(() => {
    // Reset selection if the payout method is not supported (only once payout methods have loaded)
    if (
      expenseForm.values.payoutMethodId &&
      !expenseForm.values.payoutMethodId.startsWith('__') &&
      formOptions.payoutMethods !== undefined &&
      !formOptions.payoutMethods.some(p => p.id === expenseForm.values.payoutMethodId)
    ) {
      setFieldValue('payoutMethodId', null);
    }

    // Select "New payout method" by default when confirming an invite
    if (
      formOptions.expense?.status === ExpenseStatus.DRAFT &&
      !formOptions.loggedInAccount &&
      !expenseForm.values.payoutMethodId
    ) {
      setFieldValue('payoutMethodId', NEW_PAYOUT_METHOD_ID);
    }

    // Set all items to payout method currency if not set
    const selectedPayoutMethod = formOptions.payoutMethods?.find(p => p.id === expenseForm.values.payoutMethodId);
    // When completing a draft that already carries an explicit currency (e.g. a recurring
    // expense draft), keep that currency instead of coercing it to the payout method's.
    const isCompletingDraftWithCurrency =
      formOptions.expense?.status === ExpenseStatus.DRAFT &&
      formOptions.expense.draft?.items?.some(i => i.amountV2?.currency ?? i.currency);
    if (
      selectedPayoutMethod &&
      selectedPayoutMethod.data?.currency &&
      formOptions.allowDifferentItemCurrency &&
      !expenseForm.touched.expenseItems &&
      !isCompletingDraftWithCurrency &&
      expenseForm.values.expenseItems[0]?.amount?.currency !== selectedPayoutMethod.data?.currency &&
      !startOptions.current.isInlineEdit // expenseItems will not be touched when editing the payout method, we don't want to update the expense items currency then
    ) {
      setFieldValue(
        'expenseItems',
        expenseForm.values.expenseItems.map(ei => ({
          ...ei,
          amount: {
            ...ei.amount,
            currency: selectedPayoutMethod.data?.currency,
          },
        })),
      );
    }
  }, [
    formOptions.allowDifferentItemCurrency,
    formOptions.payoutMethods,
    expenseForm.values.payoutMethodId,
    setFieldValue,
    expenseForm.touched.expenseItems,
    expenseForm.values.expenseItems,
    formOptions.expense?.status,
    formOptions.expense?.draft?.items,
    formOptions.loggedInAccount,
  ]);

  const refresh = React.useCallback(() => fetchFormQuery(queryVariables, true), [fetchFormQuery, queryVariables]);

  return Object.assign(expenseForm, {
    options: formOptions,
    startOptions: startOptions.current,
    initialLoading: initialLoading.current,
    refresh,
  });
}
