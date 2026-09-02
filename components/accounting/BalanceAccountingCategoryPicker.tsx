import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { FEATURES, isFeatureEnabled } from '../../lib/allowed-features';
import { i18nGraphqlException } from '../../lib/errors';
import type { AccountingCategory } from '../../lib/graphql/types/v2/graphql';

import { DashboardContext } from '../dashboard/DashboardContext';
import StyledSelect from '../StyledSelect';
import { useToast } from '../ui/useToast';

export const balanceAccountingCategoryPickerQuery = gql`
  query BalanceAccountingCategoryPicker(
    $hostSlug: String!
    $account: AccountReferenceInput
    $order: OrderReferenceInput
    $expense: ExpenseReferenceInput
  ) {
    host(slug: $hostSlug) {
      id
      balanceAccountingCategories: accountingCategories(kind: [BALANCE_ACCOUNT, CLEARING_ACCOUNT]) {
        nodes {
          id
          code
          name
          friendlyName
          kind
        }
      }
      suggestedBalanceAccountingCategories(account: $account, order: $order, expense: $expense) {
        id
      }
    }
  }
`;

export type BalanceAccountingCategoryContext = {
  accountSlug?: string;
  orderId?: string;
  expenseId?: string;
};

type BalanceAccountingCategoryOption = { value: string; label: string };

type PickedCategory = Pick<AccountingCategory, 'id' | 'code' | 'name'>;

export const getBalanceAccountingCategoryOption = (
  category: PickedCategory | null | undefined,
): BalanceAccountingCategoryOption | null =>
  category ? { value: category.id, label: `${category.code} - ${category.name}` } : null;

export const useBalanceAccountingCategories = (
  hostSlug: string | undefined,
  context?: BalanceAccountingCategoryContext,
) => {
  const { account } = React.useContext(DashboardContext);
  const contextFeature = account ? isFeatureEnabled(account, FEATURES.CHART_OF_ACCOUNTS) : null;
  const { data, loading } = useQuery(balanceAccountingCategoryPickerQuery, {
    variables: {
      hostSlug,
      account: context?.accountSlug ? { slug: context.accountSlug } : null,
      order: context?.orderId ? { id: context.orderId } : null,
      expense: context?.expenseId ? { id: context.expenseId } : null,
    },
    skip: contextFeature === false || !hostSlug,
  });

  const options = React.useMemo(
    () => (data?.host?.balanceAccountingCategories?.nodes || []).map(getBalanceAccountingCategoryOption),
    [data],
  );

  const enabled = Boolean(hostSlug) && contextFeature !== false && (options.length > 0 || loading);
  const categories = data?.host?.balanceAccountingCategories?.nodes || [];
  const suggestedIds = (data?.host?.suggestedBalanceAccountingCategories || []).map(category => category.id);
  return { enabled, loading, options, categories, suggestedIds };
};

export const BalanceAccountingCategoryPicker = ({
  hostSlug,
  inputId,
  value,
  onChange,
  disabled = false,
  fontSize = undefined,
  styles = undefined,
  menuPortalTarget = undefined,
  context = undefined,
}: {
  hostSlug: string;
  inputId: string;
  value: BalanceAccountingCategoryOption | null | undefined;
  onChange: (option: BalanceAccountingCategoryOption | null) => void;
  disabled?: boolean;
  fontSize?: string;
  styles?: Record<string, unknown>;
  /** Pass null inside StyledModal-based forms, portaled menus break there */
  menuPortalTarget?: HTMLElement | null;
  /** Used to suggest categories from the rail used or the bank accounts assigned to the account */
  context?: BalanceAccountingCategoryContext;
}) => {
  const intl = useIntl();
  const { enabled, loading, options, suggestedIds } = useBalanceAccountingCategories(hostSlug, context);
  const groupedOptions = React.useMemo(() => {
    if (!suggestedIds.length) {
      return options;
    }
    return [
      {
        label: intl.formatMessage({ defaultMessage: 'Suggested', id: 'a0lFbM' }),
        options: options.filter(option => suggestedIds.includes(option.value)),
      },
      {
        label: intl.formatMessage({ defaultMessage: 'All Categories', id: '1X6HtI' }),
        options: options.filter(option => !suggestedIds.includes(option.value)),
      },
    ];
  }, [intl, options, suggestedIds]);

  if (!enabled) {
    return null;
  }

  return (
    <StyledSelect
      inputId={inputId}
      options={groupedOptions}
      value={value || null}
      isClearable
      isSearchable
      useSearchIcon
      isLoading={loading}
      disabled={disabled}
      fontSize={fontSize}
      styles={styles}
      menuPortalTarget={menuPortalTarget}
      menuPosition="fixed"
      placeholder={intl.formatMessage({
        defaultMessage: 'Select a balance or clearing account',
        id: '13dqX5',
      })}
      onChange={onChange}
    />
  );
};

const setConnectedAccountBalanceCategoryFromSettingsMutation = gql`
  mutation SetConnectedAccountBalanceAccountingCategoryFromSettings(
    $connectedAccount: ConnectedAccountReferenceInput!
    $accountingCategory: AccountingCategoryReferenceInput
  ) {
    setConnectedAccountBalanceAccountingCategory(
      connectedAccount: $connectedAccount
      accountingCategory: $accountingCategory
    ) {
      id
      balanceAccountingCategory {
        id
        code
        name
      }
    }
  }
`;

export const ConnectedAccountBalanceCategoryPicker = ({
  hostSlug,
  connectedAccount,
  disabled = false,
}: {
  hostSlug: string;
  connectedAccount: { id: string; balanceAccountingCategory?: PickedCategory | null };
  disabled?: boolean;
}) => {
  const intl = useIntl();
  const { toast } = useToast();
  const { account } = React.useContext(DashboardContext);
  const [setBalanceCategory, { loading: saving }] = useMutation(setConnectedAccountBalanceCategoryFromSettingsMutation);

  if (!isFeatureEnabled(account, FEATURES.CHART_OF_ACCOUNTS)) {
    return null;
  }

  return (
    <div>
      <label
        className="mb-1 block text-sm font-medium"
        htmlFor={`connected-account-balance-category-${connectedAccount.id}`}
      >
        <FormattedMessage defaultMessage="Balance / clearing account" id="7XkFoL" />
      </label>
      <p className="mb-2 text-sm text-muted-foreground">
        <FormattedMessage
          defaultMessage="Payments processed through this integration will be attributed to the selected account from your chart of accounts."
          id="3aoMDC"
        />
      </p>
      <div className="max-w-md">
        <BalanceAccountingCategoryPicker
          hostSlug={hostSlug}
          inputId={`connected-account-balance-category-${connectedAccount.id}`}
          value={getBalanceAccountingCategoryOption(connectedAccount.balanceAccountingCategory)}
          disabled={disabled || saving}
          onChange={async option => {
            try {
              await setBalanceCategory({
                variables: {
                  connectedAccount: { id: connectedAccount.id },
                  accountingCategory: option ? { id: option.value } : null,
                },
              });
              toast({ variant: 'success', message: intl.formatMessage({ id: 'saved', defaultMessage: 'Saved' }) });
            } catch (e) {
              toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
            }
          }}
        />
      </div>
    </div>
  );
};
