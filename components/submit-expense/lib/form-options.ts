/**
 * Form options: derives what the Expense form offers (payout methods, currencies, Expense types,
 * flags...) from the form query result, the form values, the start options and the logged-in user.
 * Pure and synchronous: fetching is done by the hook.
 */
import { accountHasGST, accountHasVAT, TaxType } from '@opencollective/taxes';
import type { Account } from '@opencollective/taxes/dist/types/Accounts';

import { CollectiveType } from '../../../lib/constants/collectives';
import { getPayoutProfiles } from '../../../lib/expenses';
import type {
  Amount,
  ExpenseFormSchemaQuery,
  ExpenseVendorFieldsFragment,
} from '../../../lib/graphql/types/v2/graphql';
import {
  Currency,
  ExpenseLockableFields,
  ExpenseStatus,
  ExpenseType,
  PayoutMethodType,
} from '../../../lib/graphql/types/v2/graphql';
import type LoggedInUser from '../../../lib/LoggedInUser';
import { getArrayValuesMemoizer } from '../../../lib/utils';
import { userMustSetAccountingCategory } from '../../expenses/lib/accounting-categories';
import { NEW_PAYOUT_METHOD_ID } from '../../expenses/lib/constants';
import { getAvailablePayoutMethods, getSupportedPayoutMethods } from '../../expenses/lib/payout-methods';
import { computeExpenseAmounts } from '../../expenses/lib/utils';

import { supportsBaseExpenseTypes } from '../form/helper';

import { getPayeeChoice, PayeeKind } from './payee-choice';
import type { ExpenseFormOptions, ExpenseFormStartOptions, ExpenseFormValues } from './types';

const memoizeAvailableReferenceCurrencies = getArrayValuesMemoizer<Currency>();

export type ExpenseFormQueryResult = {
  data?: ExpenseFormSchemaQuery;
  loading?: boolean;
};

type DerivedExpenseFormOptions = Omit<ExpenseFormOptions, 'schema'>;

export function deriveFormOptions(
  query: ExpenseFormQueryResult,
  values: ExpenseFormValues,
  startOptions: ExpenseFormStartOptions,
  loggedInUser: LoggedInUser,
): DerivedExpenseFormOptions {
  const options: DerivedExpenseFormOptions = {};

  try {
    const expense = query.data?.expense;
    if (expense) {
      options.expense = query.data.expense;
    }

    const recentlySubmittedExpenses = query.data?.recentlySubmittedExpenses;
    const account = values.accountSlug ? query.data?.account : options.expense?.account;
    const expenseType = values.expenseTypeOption || options.expense?.type;
    const host = account && 'host' in account ? account.host : null;
    const payee =
      query.data?.payee ||
      (options.expense?.status === ExpenseStatus.DRAFT &&
      options.expense.payee &&
      options.expense.draft?.payee?.slug === options.expense.payee.slug
        ? options.expense.payee
        : null);

    const payeeHost = payee && 'host' in payee ? payee.host : null;
    const submitter = options.expense?.submitter || query.data?.submitter;

    if (account && options.expense?.status === ExpenseStatus.DRAFT) {
      options.canChangeAccount = false;
    } else {
      options.canChangeAccount = true;
    }

    if (recentlySubmittedExpenses) {
      options.recentlySubmittedExpenses = recentlySubmittedExpenses;
    }

    if (account) {
      options.account = account;
    }

    if (submitter) {
      options.submitter = submitter;
    }

    if (payee) {
      options.payee = payee;
    }

    if (query.data?.loggedInAccount) {
      options.loggedInAccount = query.data.loggedInAccount;
    }

    const payeeChoice = getPayeeChoice(values);
    if (payeeChoice.kind === PayeeKind.INVITE_NEW) {
      options.invitee = payeeChoice.invitee as ExpenseFormOptions['invitee'];
    } else if (
      options.expense?.status === ExpenseStatus.DRAFT &&
      options.expense.draft.payee &&
      !options.loggedInAccount
    ) {
      options.invitee = options.expense.draft.payee;
    }

    if (host) {
      options.isHostAdmin = loggedInUser?.isAdminOfCollective(host) ?? false;
      options.host = host;
      options.isPaypalConnectEnabled = host.features?.PAYPAL_CONNECT !== 'DISABLED';
      options.vendorsForAccount =
        'vendorsForAccount' in host ? (host.vendorsForAccount?.['nodes'] as ExpenseVendorFieldsFragment[]) || [] : [];
      const isInviteePayeeFlow = options.expense?.status === ExpenseStatus.DRAFT && !options.loggedInAccount;

      const userCanUseVendors = options.isHostAdmin || ('vendors' in host && host.vendors?.['totalCount'] > 0);
      options.showVendorsOption = isInviteePayeeFlow ? false : userCanUseVendors;
      options.expenseTags = host.expensesTags;
      options.isAccountingCategoryRequired = userMustSetAccountingCategory(loggedInUser, account, host);
      options.accountingCategories = host.accountingCategories.nodes;

      if (startOptions.duplicateExpense && expense?.payee?.type === CollectiveType.VENDOR) {
        options.vendorsForAccount = [...options.vendorsForAccount, expense.payee as ExpenseVendorFieldsFragment];
      }
    }

    options.supportedPayoutMethods = getSupportedPayoutMethods(host, payee);

    if (account?.supportedExpenseTypes) {
      options.supportedExpenseTypes = account.supportedExpenseTypes;
      if (!supportsBaseExpenseTypes(options.supportedExpenseTypes) && !query.loading) {
        options.hasInvalidAccount = true;
      }
    }

    if (query.data?.loggedInAccount) {
      options.payoutProfiles = getPayoutProfiles(query.data.loggedInAccount);
      options.isAdminOfPayee =
        options.payoutProfiles.some(p => p.slug === values.payeeSlug) || payeeChoice.isAdministeredAccountPicker;
      // Cross-host only: the submitter administers the recipient host (e.g. a host admin completing
      // an invited draft on behalf of a collective they don't directly administer).
      const isAdminOfPayeeHost = Boolean(
        payeeHost && host && payeeHost.id !== host.id && options.payoutProfiles.some(p => p.slug === payeeHost.slug),
      );
      options.isAdminOfPayeeHost = isAdminOfPayeeHost;
      if (payee && payee.type !== CollectiveType.VENDOR && (options.isAdminOfPayee || isAdminOfPayeeHost)) {
        options.payoutMethods = getAvailablePayoutMethods({
          host,
          payee,
          payoutMethods: options.payoutProfiles?.find(profile => profile.slug === payee.slug)?.payoutMethods,
          supportedPayoutMethods: options.supportedPayoutMethods,
        });
      } else if (payee && payee.type === CollectiveType.VENDOR) {
        options.payoutMethods = getAvailablePayoutMethods({
          host,
          payee,
          payoutMethods: payee.payoutMethods,
          supportedPayoutMethods: options.supportedPayoutMethods,
        });
      }

      // Filter out ACCOUNT_BALANCE from the list of payout methods, since we add it manually to the default list
      options.newPayoutMethodTypes = options.supportedPayoutMethods.filter(
        t => ![PayoutMethodType.ACCOUNT_BALANCE, PayoutMethodType.STRIPE].includes(t),
      );

      if (values.payoutMethodId && values.payoutMethodId !== NEW_PAYOUT_METHOD_ID) {
        options.payoutMethod = options.payoutMethods?.find(p => p.id === values.payoutMethodId);
      } else if (
        values.payoutMethodId === NEW_PAYOUT_METHOD_ID &&
        ((options.payee?.type === CollectiveType.VENDOR && options.isHostAdmin) ||
          options.isAdminOfPayee ||
          isAdminOfPayeeHost)
      ) {
        options.payoutMethod = values.newPayoutMethod;
      }
    } else {
      options.payoutMethod = values.newPayoutMethod;
      options.newPayoutMethodTypes = options.supportedPayoutMethods;
    }

    if (!startOptions.duplicateExpense && options.expense?.lockedFields?.length) {
      options.lockedFields = options.expense.lockedFields;
    }

    // Compute available reference currencies from all sources
    const availableCurrencies = new Set<Currency>();
    if (options.expense && options.lockedFields?.includes?.(ExpenseLockableFields.AMOUNT)) {
      availableCurrencies.add(options.expense.currency);
    } else if (expenseType === ExpenseType.GRANT && options.isHostAdmin !== true) {
      // Grants are always in the account currency
      availableCurrencies.add(options.account?.currency);
    } else {
      // For all other expenses one of the items currencies
      values.expenseItems?.forEach(item => {
        if (item.amount?.currency) {
          availableCurrencies.add(item.amount.currency as Currency);
        }
      });

      // If we didn't get any currency from the items, default to the account + payout method currencies
      if (availableCurrencies.size === 0) {
        if (options.account?.currency) {
          availableCurrencies.add(options.account.currency);
        }
        if (options.payoutMethod?.data?.currency) {
          availableCurrencies.add(options.payoutMethod.data.currency);
        }
      }
    }

    options.availableReferenceCurrencies = memoizeAvailableReferenceCurrencies(Array.from(availableCurrencies));

    if (options.availableReferenceCurrencies.length === 1) {
      options.expenseCurrency = options.availableReferenceCurrencies[0]; // If there's only one available currency, use it
    } else if (options.availableReferenceCurrencies.includes(values.referenceCurrency as Currency)) {
      options.expenseCurrency = values.referenceCurrency as Currency; // If the user provided a reference currency, use it
    } else if (options.expense?.currency) {
      options.expenseCurrency = options.expense.currency; // Use the expense currency if it's set
    }

    options.isLongFormItemDescription = false;
    options.allowDifferentItemCurrency = true;
    options.hasExpenseItemDate = true;
    options.canSetupRecurrence = true;

    if (expenseType === ExpenseType.GRANT) {
      options.isLongFormItemDescription = true;
      options.allowDifferentItemCurrency = Boolean(options.isHostAdmin);
      options.hasExpenseItemDate = false;
      options.canSetupRecurrence = false;
    }

    options.allowExpenseItemAttachment = expenseType === ExpenseType.RECEIPT || expenseType === ExpenseType.CHARGE;

    options.allowInvite = !startOptions.isInlineEdit && options.expense?.status !== ExpenseStatus.DRAFT;

    if (expenseType === ExpenseType.INVOICE) {
      // Preserve tax type from existing expense if it has taxes
      if (options.expense?.taxes?.length > 0) {
        options.taxType = options.expense.taxes[0].type;
      } else if (accountHasVAT(account as Account, host as Account)) {
        options.taxType = TaxType.VAT;
      } else if (accountHasGST(host || account)) {
        options.taxType = TaxType.GST;
      }
    }

    if (options.expenseCurrency && values.expenseItems?.length > 0) {
      const { totalInvoiced } = computeExpenseAmounts(
        options.expenseCurrency,
        (values.expenseItems || []).map(ei => ({
          description: ei.description,
          amountV2: ei.amount as Amount,
          incurredAt: typeof ei.incurredAt === 'string' ? new Date(ei.incurredAt) : ei.incurredAt,
        })),
        values.tax ? [{ ...values.tax, type: options.taxType }] : [],
      );

      options.totalInvoicedInExpenseCurrency = totalInvoiced;
    }

    return options;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return options;
  }
}
