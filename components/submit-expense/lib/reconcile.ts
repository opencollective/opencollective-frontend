/**
 * Reconcile step: the rules that keep dependent fields of the Expense form consistent.
 *
 * Given the previous reconcile state, the current values, the form options and a context, it returns
 * a patch of values (and touched flags) plus the exchange rates the form needs. Rules are named and
 * run in an explicit order. Like effects, each rule declares its dependencies and only runs when they
 * changed since that rule last ran.
 */
import { setIn } from 'formik';
import { isEmpty, isEqual, pick, uniqBy } from 'lodash-es';

import dayjs from '../../../lib/dayjs';
import type { Currency, CurrencyExchangeRateRequest } from '../../../lib/graphql/types/v2/graphql';
import { AccountType, ExpenseLockableFields, ExpenseStatus, ExpenseType } from '../../../lib/graphql/types/v2/graphql';
import { NEW_PAYOUT_METHOD_ID } from '../../expenses/lib/constants';

import { getPayeeChoice, PayeeKind } from './payee-choice';
import type { ExpenseFormOptions, ExpenseFormStartOptions, ExpenseFormValues, ExpenseItem } from './types';
import { InviteeAccountType, YesNoOption } from './types';

export type ReconcileContext = {
  /** `loading` until the form query answered and, when editing, the expense values were loaded */
  phase: 'loading' | 'ready';
  /** Whether the expense values were already loaded into the form */
  hydrated: boolean;
  /** The submitter picked an item currency themselves */
  itemCurrencyChosen: boolean;
  /** The submitter edited the title */
  titleEdited: boolean;
  /** The submitter picked the paying account */
  accountChosen: boolean;
  startOptions: ExpenseFormStartOptions;
};

/** What the reconcile step remembers between runs */
export type ReconcileState = {
  options: ExpenseFormOptions;
  ruleDependencies: Record<string, unknown[]>;
  exchangeRateRequests: CurrencyExchangeRateRequest[];
};

type Touched = Partial<Record<keyof ExpenseFormValues, boolean>>;

type ReconcileResult = {
  /** The values that changed */
  patch: Partial<ExpenseFormValues>;
  /** The same changes, as the leaf paths to set (so they merge with concurrent updates) */
  updates: ValueUpdate[];
  touched: Touched;
  /** Set when the expense values were loaded into the form */
  hydrated: boolean;
  /** The exchange rates the items need */
  exchangeRateRequests: CurrencyExchangeRateRequest[];
  state: ReconcileState;
};

type RuleInput = {
  values: ExpenseFormValues;
  options: ExpenseFormOptions;
  previousOptions: ExpenseFormOptions | null;
  context: ReconcileContext;
};

type RuleOutput = {
  values?: ExpenseFormValues;
  touched?: Touched;
  hydrated?: boolean;
  exchangeRateRequests?: CurrencyExchangeRateRequest[];
};

type Rule = {
  name: string;
  dependencies: (input: RuleInput) => unknown[];
  run: (input: RuleInput) => RuleOutput | void;
};

const set = <V extends ExpenseFormValues>(values: V, path: string, value: unknown): V => setIn(values, path, value);

// ---- Helpers shared with the sections that display the same choices ----

function getLastSubmittedAccount(options: Pick<ExpenseFormOptions, 'recentlySubmittedExpenses'>) {
  return options.recentlySubmittedExpenses?.nodes?.at?.(0)?.account ?? null;
}

/** The most recent expense submitted to one of the submitter's profiles */
function getLastExpenseToMyProfiles(options: Pick<ExpenseFormOptions, 'recentlySubmittedExpenses' | 'payoutProfiles'>) {
  const myProfileSlugs = (options.payoutProfiles || []).map(p => p.slug);
  return options.recentlySubmittedExpenses?.nodes?.find(e => e?.payee?.slug && myProfileSlugs.includes(e.payee.slug));
}

/** The submitter's profile they most recently submitted an expense for */
export function getLastUsedPayoutProfile(
  options: Pick<ExpenseFormOptions, 'recentlySubmittedExpenses' | 'payoutProfiles'>,
) {
  const lastExpense = getLastExpenseToMyProfiles(options);
  return lastExpense ? (options.payoutProfiles?.find(p => p.id === lastExpense.payee.id) ?? null) : null;
}

/** The payout method most recently used for the given payee, if still available */
export function getLastUsedPayoutMethod(
  options: Pick<ExpenseFormOptions, 'recentlySubmittedExpenses' | 'payoutMethods'>,
  payeeSlug: string,
) {
  const lastUsedPayoutMethodId = (options.recentlySubmittedExpenses?.nodes || []).find(
    e => e && e.payee.slug === payeeSlug && e.payoutMethod?.id,
  )?.payoutMethod?.id;
  return (lastUsedPayoutMethodId && (options.payoutMethods || []).find(p => p.id === lastUsedPayoutMethodId)) || null;
}

// ---- Value updates ----

export type ValueUpdate = { path: string; value: unknown };

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);

/**
 * The leaf paths that differ between two values. Applying them one by one (with Formik's
 * `setFieldValue`) merges with updates made in the meantime, unlike replacing all the values.
 */
export function getValueUpdates(before: unknown, after: unknown, path = ''): ValueUpdate[] {
  if (Object.is(before, after)) {
    return [];
  } else if (isPlainObject(before) && isPlainObject(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...keys].flatMap(key => getValueUpdates(before[key], after[key], path ? `${path}.${key}` : key));
  } else if (Array.isArray(before) && Array.isArray(after) && before.length === after.length) {
    return after.flatMap((item, i) => getValueUpdates(before[i], item, path ? `${path}.${i}` : `${i}`));
  } else if (isEqual(before, after)) {
    return [];
  } else {
    return [{ path, value: after }];
  }
}

// ---- Exchange rates ----

const needsExchangeRate = (expectedCurrency: string) => (ei: ExpenseItem) =>
  expectedCurrency &&
  ei.amount?.currency &&
  ei.amount.currency !== expectedCurrency &&
  (!ei.amount.exchangeRate ||
    !ei.amount.exchangeRate.source ||
    !ei.amount.exchangeRate.value ||
    ei.amount.exchangeRate.fromCurrency !== ei.amount.currency ||
    ei.amount.exchangeRate.toCurrency !== expectedCurrency ||
    (ei.amount.exchangeRate.source === 'OPENCOLLECTIVE' &&
      Math.abs(dayjs.utc(ei.amount.exchangeRate.date).diff(dayjs.utc(ei.incurredAt), 'days')) > 2));

type ExchangeRate = { value: number; source: string; fromCurrency: string; toCurrency: string; date: string };

/** The updates applying fetched exchange rates to the items that still need one */
export function getExchangeRateUpdates(
  values: ExpenseFormValues,
  expenseCurrency: Currency,
  rates: ExchangeRate[],
): ValueUpdate[] {
  return getValueUpdates(values, applyExchangeRates(values, expenseCurrency, rates));
}

/**
 * Applies fetched exchange rates to the items that still need one. Returns the values unchanged when
 * no rate applies.
 */
export function applyExchangeRates(
  values: ExpenseFormValues,
  expenseCurrency: Currency,
  rates: ExchangeRate[],
): ExpenseFormValues {
  if (isEmpty(rates)) {
    return values;
  }

  let result = values;
  (values.expenseItems || []).forEach((ei, i) => {
    if (needsExchangeRate(expenseCurrency)(ei)) {
      const exchangeRate =
        rates.find(
          rate =>
            rate.fromCurrency === ei.amount.currency &&
            rate.toCurrency === expenseCurrency &&
            (!ei.incurredAt || dayjs.utc(ei.incurredAt).isSame(dayjs.utc(rate.date), 'day')),
        ) || rates.find(rate => rate.fromCurrency === ei.amount.currency && rate.toCurrency === expenseCurrency);
      const rate = pick(exchangeRate, ['date', 'fromCurrency', 'toCurrency', 'value', 'source']);
      result = set(result, `expenseItems.${i}.amount.exchangeRate`, rate);
      result = set(result, `expenseItems.${i}.amount.referenceExchangeRate`, rate);
    }
  });
  return result;
}

// ---- Rules, in the order they run ----

const hydrateFromExpense: Rule = {
  name: 'hydrateFromExpense',
  dependencies: ({ options }) => [options.expense, options.loggedInAccount],
  run: ({ values, options, context }) => {
    const expense = options.expense;
    if (!expense || context.hydrated) {
      return;
    }

    const isDuplicate = context.startOptions.duplicateExpense;
    const isDraft = expense.status === ExpenseStatus.DRAFT;
    let v: ExpenseFormValues = {
      ...values,
      accountingCategoryId: expense.accountingCategory?.id,
      accountSlug: expense.account.slug,
      expenseTypeOption: expense.type,
      payoutMethodId: expense.payoutMethod?.id,
      tags: expense.tags,
      title: expense.description,
      privateMessage: expense.privateMessage,
    };
    const touched: Touched = { title: true };

    const taxes = expense.taxes || [];
    v.hasTax = taxes.length > 0;
    if (taxes.length > 0) {
      v = set(v, 'tax.idNumber', taxes[0].idNumber);
      v = set(v, 'tax.rate', taxes[0].rate);
    }

    const draftPayee = expense.draft?.payee;
    const inviteeAccountType = draftPayee?.organization
      ? InviteeAccountType.ORGANIZATION
      : InviteeAccountType.INDIVIDUAL;
    if (isDraft && draftPayee) {
      if (options.loggedInAccount && draftPayee.slug && draftPayee.slug === options.loggedInAccount.slug) {
        v.payeeSlug = draftPayee.slug;
      } else {
        if (draftPayee.slug) {
          v.payeeSlug = draftPayee.slug;
        } else {
          v.inviteeAccountType = inviteeAccountType;
        }
        v.inviteeNewOrganization = draftPayee;
        v.inviteeNewIndividual = draftPayee;
        v.inviteNote = expense.longDescription;
      }
    } else if (expense.payee?.slug) {
      v.payeeSlug = expense.payee.slug;
    } else if (draftPayee) {
      v.inviteeAccountType = inviteeAccountType;
      v.inviteeNewOrganization = draftPayee;
      v.inviteeNewIndividual = draftPayee;
    }

    const attachedFiles = isDraft ? expense.draft?.attachedFiles : expense.attachedFiles;
    const invoiceFile = isDraft ? expense.draft?.invoiceFile : expense.invoiceFile;
    if (!isDuplicate) {
      if (invoiceFile) {
        v.invoiceFile = invoiceFile.url;
        v.hasInvoiceOption = YesNoOption.YES;
        v.invoiceNumber = expense.reference;
      } else {
        v.hasInvoiceOption = YesNoOption.NO;
      }
      if (attachedFiles) {
        v.additionalAttachments = attachedFiles.map(af => af.url);
      }
    }

    if (expense.invoiceInfo) {
      v.invoiceInfo = expense.invoiceInfo;
    }

    if (isDraft) {
      v.expenseItems = (expense.draft?.items ?? []).map(ei => ({
        id: !isDuplicate ? ei.id : undefined,
        key: ei.id,
        attachment: ei.url,
        description: ei.description ?? '',
        incurredAt: ei.incurredAt ? dayjs.utc(ei.incurredAt).toISOString().substring(0, 10) : null,
        amount: {
          valueInCents: ei.amountV2?.valueInCents ?? ei.amount,
          currency: ei.amountV2?.currency ?? ei.currency,
        },
      }));
    } else {
      v.expenseItems = (expense.items ?? []).map(ei => ({
        id: !isDuplicate ? ei.id : undefined,
        key: ei.id,
        attachment: !isDuplicate ? ei.url : null,
        description: ei.description ?? '',
        incurredAt: !isDuplicate ? dayjs.utc(ei.incurredAt).toISOString().substring(0, 10) : null,
        amount: {
          valueInCents: ei.amount.valueInCents,
          currency: ei.amount.currency,
          exchangeRate: !isDuplicate ? ei.amount.exchangeRate : null,
        },
      }));
      touched.expenseItems = true;
    }

    return { values: v, touched, hydrated: true };
  },
};

const defaultAccount: Rule = {
  name: 'defaultAccount',
  dependencies: ({ values, options, context }) => [
    getLastSubmittedAccount(options)?.slug,
    values.accountSlug,
    context.accountChosen,
  ],
  run: ({ values, options, context }) => {
    // Inline edits load the account of the expense
    const lastSubmittedAccount = getLastSubmittedAccount(options);
    if (lastSubmittedAccount && !values.accountSlug && !context.accountChosen && !context.startOptions.isInlineEdit) {
      return { values: { ...values, accountSlug: lastSubmittedAccount.slug } };
    }
  },
};

const defaultPayee: Rule = {
  name: 'defaultPayee',
  dependencies: ({ values, options }) => [options.payoutProfiles, options.recentlySubmittedExpenses, values.payeeSlug],
  run: ({ values, options, context }) => {
    // Inline edits load the payee of the expense
    if (values.payeeSlug || context.startOptions.isInlineEdit) {
      return;
    }

    const personalProfile = options.payoutProfiles?.find(p => p.type === AccountType.INDIVIDUAL);
    const payeeSlug = getLastExpenseToMyProfiles(options)?.payee.slug ?? personalProfile?.slug;
    if (payeeSlug) {
      return { values: { ...values, payeeSlug } };
    }
  },
};

const keepPayeeConsistentWithHost: Rule = {
  name: 'keepPayeeConsistentWithHost',
  dependencies: ({ values, options }) => [options.host?.slug, options.vendorsForAccount, values.payeeSlug],
  run: ({ values, options, previousOptions }) => {
    if (previousOptions?.host?.slug === options.host?.slug) {
      return;
    }

    const wasVendor =
      getPayeeChoice(values).kind === PayeeKind.VENDOR_PICKER ||
      previousOptions?.vendorsForAccount?.some(v => v.slug === values.payeeSlug);
    if (wasVendor && !options.vendorsForAccount?.some(v => v.slug === values.payeeSlug)) {
      return { values: { ...values, payeeSlug: null } };
    }
  },
};

const resetUnsupportedExpenseType: Rule = {
  name: 'resetUnsupportedExpenseType',
  dependencies: ({ values, options, context }) => [
    options.supportedExpenseTypes,
    values.expenseTypeOption,
    options.expense?.id,
    context.phase,
  ],
  run: ({ values, options, context }) => {
    if (
      context.phase === 'ready' &&
      values.expenseTypeOption &&
      !options.expense?.id &&
      options.supportedExpenseTypes &&
      !options.supportedExpenseTypes.includes(values.expenseTypeOption)
    ) {
      return { values: { ...values, expenseTypeOption: null } };
    }
  },
};

/** Moves attachments to the matching place (invoice file or item receipts) when switching type */
const attachmentsFollowExpenseType: Rule = {
  name: 'attachmentsFollowExpenseType',
  dependencies: ({ values }) => [values.expenseTypeOption],
  run: ({ values, context }) => {
    // Only when the submitter switches type: loading an expense keeps its attachments where they are
    if (context.phase !== 'ready') {
      return;
    }

    let v = values;
    if (values.expenseTypeOption === ExpenseType.INVOICE) {
      if (values.expenseItems.length === 1 && values.expenseItems[0].attachment) {
        v = set(v, 'invoiceFile', values.expenseItems[0].attachment);
        v = set(v, 'expenseItems.0.attachment', null);
        v = set(v, 'hasInvoiceOption', YesNoOption.YES);
      } else {
        const movedAttachments = values.expenseItems.filter(item => item.attachment).map(item => item.attachment);
        if (movedAttachments.length) {
          v = set(v, 'additionalAttachments', [...(values.additionalAttachments ?? []), ...movedAttachments]);
          v = set(
            v,
            'expenseItems',
            values.expenseItems.map(item => (item.attachment ? { ...item, attachment: null } : item)),
          );
        }
      }
    } else if (values.expenseTypeOption === ExpenseType.RECEIPT && values.invoiceFile) {
      v = set(
        v,
        'expenseItems',
        values.expenseItems.map(item => ({ ...item, attachment: values.invoiceFile })),
      );
      v = set(v, 'invoiceFile', null);
    }
    return { values: v };
  },
};

const dropUnsupportedTax: Rule = {
  name: 'dropUnsupportedTax',
  dependencies: ({ options }) => [options.taxType],
  run: ({ values, options }) => {
    if (!options.taxType) {
      return { values: { ...values, hasTax: false, tax: null } };
    }
  },
};

const prefillVendorTax: Rule = {
  name: 'prefillVendorTax',
  dependencies: ({ values, options, context }) => [
    values.hasTax,
    values.tax,
    values.payeeSlug,
    options.vendorsForAccount,
    context.phase,
  ],
  run: ({ values, options, context }) => {
    if (context.phase !== 'ready') {
      return;
    } else if (!values.hasTax) {
      return { values: { ...values, tax: null } };
    } else if (!values.tax) {
      const selectedVendor = options.vendorsForAccount?.find(
        v => v.slug === values.payeeSlug && options.taxType === v.vendorInfo?.taxType,
      );
      if (selectedVendor) {
        return { values: { ...values, tax: { idNumber: selectedVendor.vendorInfo?.taxId, rate: 0 } } };
      }
    }
  },
};

const clearUnavailableCategory: Rule = {
  name: 'clearUnavailableCategory',
  dependencies: ({ values, options, context }) => [
    options.accountingCategories,
    values.accountingCategoryId,
    context.phase,
  ],
  run: ({ values, options, context }) => {
    // Wait for the categories to load
    if (context.phase !== 'ready') {
      return;
    } else if (values.accountingCategoryId && (options.accountingCategories || []).length === 0) {
      return { values: { ...values, accountingCategoryId: null } };
    }
  },
};

const clearUnavailableReferenceCurrency: Rule = {
  name: 'clearUnavailableReferenceCurrency',
  dependencies: ({ values, options, context }) => [
    values.referenceCurrency,
    options.availableReferenceCurrencies,
    context.phase,
  ],
  run: ({ values, options, context }) => {
    if (
      context.phase === 'ready' &&
      options.availableReferenceCurrencies &&
      values.referenceCurrency &&
      !options.availableReferenceCurrencies.includes(values.referenceCurrency)
    ) {
      return { values: { ...values, referenceCurrency: null } };
    }
  },
};

const useSingleAvailableCurrency: Rule = {
  name: 'useSingleAvailableCurrency',
  dependencies: ({ values, options, context }) => [
    options.availableReferenceCurrencies,
    values.expenseItems,
    context.phase,
  ],
  run: ({ values, options, context }) => {
    if (
      context.phase === 'ready' &&
      options.availableReferenceCurrencies?.length === 1 &&
      values.expenseItems.length === 1 &&
      !values.expenseItems[0].amount?.currency
    ) {
      return { values: set(values, 'expenseItems.0.amount.currency', options.availableReferenceCurrencies[0]) };
    }
  },
};

/** When editing an expense, assume that the reference currency is the expense currency */
const referenceCurrencyFromExpense: Rule = {
  name: 'referenceCurrencyFromExpense',
  dependencies: ({ values, options }) => [
    options.expense,
    values.referenceCurrency,
    options.availableReferenceCurrencies,
  ],
  run: ({ values, options }) => {
    if (
      options.expense?.id &&
      options.expense.currency &&
      !values.referenceCurrency &&
      options.availableReferenceCurrencies?.length > 1
    ) {
      return { values: { ...values, referenceCurrency: options.expense.currency } };
    }
  },
};

/** Fills the missing item currencies with the expense currency */
const defaultItemCurrencies: Rule = {
  name: 'defaultItemCurrencies',
  dependencies: ({ values, options, context }) => [
    options.expenseCurrency,
    values.expenseItems,
    context.hydrated,
    options.expense?.status,
  ],
  run: ({ values, options, context }) => {
    // Items of drafts keep their own currency
    const expenseValuesLoaded = context.hydrated && options.expense?.status !== ExpenseStatus.DRAFT;
    if (context.startOptions.expenseId && !expenseValuesLoaded) {
      return;
    }

    let v = values;
    (values.expenseItems ?? []).forEach((item, i) => {
      if (!item.amount?.currency) {
        v = set(v, `expenseItems.${i}.amount.currency`, options.expenseCurrency);
      }
    });
    return { values: v };
  },
};

const defaultPayoutMethod: Rule = {
  name: 'defaultPayoutMethod',
  dependencies: ({ values, options, context }) => [
    context.phase,
    context.startOptions.isInlineEdit,
    values.payeeSlug,
    options.recentlySubmittedExpenses,
    options.expense?.payee?.slug,
    options.expense?.payoutMethod?.id,
    values.payoutMethodId,
    options.payoutMethods,
  ],
  run: ({ values, options, context }) => {
    // Wait for the payout methods to load so that a valid selection isn't wiped meanwhile
    if (context.phase !== 'ready') {
      return;
    }

    const expensePayoutMethodId = options.expense?.payoutMethod?.id;
    const isEditingExistingExpensePayoutMethod =
      expensePayoutMethodId &&
      (values.payeeSlug === options.expense?.payee?.slug || (context.startOptions.isInlineEdit && !values.payeeSlug));
    if (isEditingExistingExpensePayoutMethod) {
      return;
    }

    const lastUsed = getLastUsedPayoutMethod(options, values.payeeSlug);
    const payoutMethods = lastUsed
      ? [lastUsed, ...(options.payoutMethods || []).filter(p => p.id !== lastUsed.id)]
      : options.payoutMethods || [];
    if (!values.payoutMethodId && lastUsed) {
      return { values: { ...values, payoutMethodId: lastUsed.id } };
    } else if (
      values.payoutMethodId !== NEW_PAYOUT_METHOD_ID &&
      (!values.payoutMethodId || !payoutMethods.some(p => p.id === values.payoutMethodId))
    ) {
      return { values: { ...values, payoutMethodId: payoutMethods.at(0)?.id ?? '' } };
    }
  },
};

const payoutMethodRules = ({ values, options, context }: RuleInput) => [
  options.allowDifferentItemCurrency,
  options.payoutMethods,
  values.payoutMethodId,
  context.itemCurrencyChosen,
  values.expenseItems,
  options.expense?.status,
  options.expense?.draft?.items,
  options.loggedInAccount,
];

/** Resets a payout method that isn't available for the payee, once payout methods have loaded */
const resetUnavailablePayoutMethod: Rule = {
  name: 'resetUnavailablePayoutMethod',
  dependencies: payoutMethodRules,
  run: ({ values, options }) => {
    if (
      values.payoutMethodId &&
      !values.payoutMethodId.startsWith('__') &&
      options.payoutMethods !== undefined &&
      !options.payoutMethods.some(p => p.id === values.payoutMethodId)
    ) {
      return { values: { ...values, payoutMethodId: null } };
    }
  },
};

/** Selects "New payout method" when an invited payee confirms a draft */
const newPayoutMethodForInvitee: Rule = {
  name: 'newPayoutMethodForInvitee',
  dependencies: payoutMethodRules,
  run: ({ values, options }) => {
    if (options.expense?.status === ExpenseStatus.DRAFT && !options.loggedInAccount && !values.payoutMethodId) {
      return { values: { ...values, payoutMethodId: NEW_PAYOUT_METHOD_ID } };
    }
  },
};

/** Item currencies follow the payout method currency, until the submitter picks one */
const itemCurrenciesFollowPayoutMethod: Rule = {
  name: 'itemCurrenciesFollowPayoutMethod',
  dependencies: payoutMethodRules,
  run: ({ values, options, context }) => {
    const selectedPayoutMethod = options.payoutMethods?.find(p => p.id === values.payoutMethodId);
    const payoutMethodCurrency = selectedPayoutMethod?.data?.currency;
    // Items loaded from an existing (non-draft) expense have a currency that was already chosen
    const isItemCurrencyChosen =
      context.itemCurrencyChosen || Boolean(options.expense && options.expense.status !== ExpenseStatus.DRAFT);
    // When completing a draft that already carries an explicit currency (e.g. a recurring expense
    // draft), keep that currency instead of coercing it to the payout method's.
    const isCompletingDraftWithCurrency =
      options.expense?.status === ExpenseStatus.DRAFT &&
      options.expense.draft?.items?.some(i => i.amountV2?.currency ?? i.currency);
    if (
      payoutMethodCurrency &&
      options.allowDifferentItemCurrency &&
      !isItemCurrencyChosen &&
      !isCompletingDraftWithCurrency &&
      values.expenseItems[0]?.amount?.currency !== payoutMethodCurrency &&
      // The items are not edited when editing the payout method inline
      !context.startOptions.isInlineEdit
    ) {
      return {
        values: {
          ...values,
          expenseItems: values.expenseItems.map(ei => ({
            ...ei,
            amount: { ...ei.amount, currency: payoutMethodCurrency },
          })),
        },
      };
    }
  },
};

/** The title defaults to the description of a single item, until the submitter edits it */
const titleFromSingleItem: Rule = {
  name: 'titleFromSingleItem',
  dependencies: ({ values, options, context }) => [
    values.expenseItems,
    context.titleEdited,
    options.lockedFields,
    values.expenseTypeOption,
  ],
  run: ({ values, options, context }) => {
    if (
      values.expenseItems.length === 1 &&
      !isEmpty(values.expenseItems[0].description) &&
      !context.titleEdited &&
      !options.lockedFields?.includes?.(ExpenseLockableFields.DESCRIPTION) &&
      values.expenseTypeOption !== ExpenseType.GRANT
    ) {
      return { values: { ...values, title: values.expenseItems[0].description } };
    }
  },
};

/** An explanation for a payout method name discrepancy doesn't apply to another payout method */
const resetNameDiscrepancyReason: Rule = {
  name: 'resetNameDiscrepancyReason',
  dependencies: ({ values }) => [values.payoutMethodId],
  run: ({ values }) => ({
    values: { ...values, payoutMethodNameDiscrepancyReason: '' },
    touched: { payoutMethodNameDiscrepancyReason: false },
  }),
};

/** Drops the exchange rates of items in the expense currency, and lists the rates to fetch */
const exchangeRates: Rule = {
  name: 'exchangeRates',
  dependencies: ({ values, options }) => [options.expenseCurrency, values.expenseItems, values.expenseTypeOption],
  run: ({ values, options }) => {
    if (isEmpty(values.expenseItems)) {
      return;
    }

    const expenseCurrency = options.expenseCurrency;
    const exchangeRateRequests = uniqBy(
      values.expenseItems.filter(needsExchangeRate(expenseCurrency)).map(ei => ({
        fromCurrency: ei.amount.currency as Currency,
        toCurrency: expenseCurrency,
        date: dayjs.utc(ei.incurredAt).toDate(),
      })),
      ei => `${ei.fromCurrency}-${ei.toCurrency}-${ei.date}`,
    );

    let v = values;
    values.expenseItems.forEach((ei, i) => {
      if (expenseCurrency && ei.amount?.currency === expenseCurrency) {
        v = set(v, `expenseItems.${i}.amount.exchangeRate`, null);
      }
    });

    return { values: v, exchangeRateRequests };
  },
};

const RECONCILE_RULES: readonly Rule[] = [
  hydrateFromExpense,
  defaultAccount,
  defaultPayee,
  keepPayeeConsistentWithHost,
  resetUnsupportedExpenseType,
  attachmentsFollowExpenseType,
  dropUnsupportedTax,
  prefillVendorTax,
  clearUnavailableCategory,
  clearUnavailableReferenceCurrency,
  useSingleAvailableCurrency,
  referenceCurrencyFromExpense,
  defaultItemCurrencies,
  defaultPayoutMethod,
  resetUnavailablePayoutMethod,
  newPayoutMethodForInvitee,
  itemCurrenciesFollowPayoutMethod,
  titleFromSingleItem,
  resetNameDiscrepancyReason,
  exchangeRates,
];

const dependenciesChanged = (previous: unknown[] | undefined, next: unknown[]) =>
  !previous || previous.length !== next.length || previous.some((dep, i) => !Object.is(dep, next[i]));

/**
 * Runs the rules whose dependencies changed and returns the resulting patch. Pure: the caller applies
 * the patch and passes the returned state to the next call.
 */
export function reconcileExpenseForm(
  previousState: ReconcileState | null,
  values: ExpenseFormValues,
  options: ExpenseFormOptions,
  context: ReconcileContext,
): ReconcileResult {
  const ruleDependencies = { ...previousState?.ruleDependencies };
  let working = values;
  let touched: Touched = {};
  let hydrated = false;
  let exchangeRateRequests = previousState?.exchangeRateRequests ?? [];

  for (const rule of RECONCILE_RULES) {
    const input: RuleInput = {
      values: working,
      options,
      previousOptions: previousState?.options ?? null,
      // Updates made earlier in this run count as already applied
      context: {
        ...context,
        hydrated: context.hydrated || hydrated,
        titleEdited: context.titleEdited || Boolean(touched.title),
        accountChosen: context.accountChosen || Boolean(touched.accountSlug),
      },
    };
    const dependencies = rule.dependencies(input);
    if (!dependenciesChanged(ruleDependencies[rule.name], dependencies)) {
      continue;
    }

    const output = rule.run(input);
    if (output) {
      working = output.values ?? working;
      touched = { ...touched, ...output.touched };
      hydrated = hydrated || Boolean(output.hydrated);
      exchangeRateRequests = output.exchangeRateRequests ?? exchangeRateRequests;
    }

    // Remember the dependencies as the rule left them, like an effect seeing its own updates on the next render
    ruleDependencies[rule.name] = rule.dependencies({ ...input, values: working });
  }

  const patch: Partial<ExpenseFormValues> = {};
  for (const key of Object.keys(working) as (keyof ExpenseFormValues)[]) {
    if (working[key] !== values[key] && !isEqual(working[key], values[key])) {
      (patch as Record<string, unknown>)[key] = working[key];
    }
  }

  return {
    patch,
    updates: getValueUpdates(values, working),
    touched,
    hydrated,
    exchangeRateRequests,
    state: { options, ruleDependencies, exchangeRateRequests },
  };
}
