import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { pick } from 'lodash';
import { PlusIcon } from 'lucide-react';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../../lib/errors';
import type {
  AdminAccountingCategoriesQuery,
  AdminAccountingCategoriesQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import type { AccountingCategory } from '../../../../lib/graphql/types/v2/schema';
import { AccountingCategoryKind } from '../../../../lib/graphql/types/v2/schema';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { FEATURES, requiresUpgrade } from '@/lib/allowed-features';

import { AccountingCategorySelectFieldsFragment } from '@/components/AccountingCategorySelect.tsx';

import ConfirmationModal, { CONFIRMATION_MODAL_TERMINATE } from '../../../ConfirmationModal';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { UpgradePlanCTA } from '../../../platform-subscriptions/UpgradePlanCTA.tsx';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/useToast';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { buildComboSelectFilter } from '../../filters/ComboSelectFilter';
import { Filterbar } from '../../filters/Filterbar';
import { buildOrderByFilter } from '../../filters/OrderFilter';
import { searchFilter } from '../../filters/SearchFilter';
import type { DashboardSectionProps } from '../../types';

import { AccountingCategoriesTable } from './AccountingCategoriesTable';
import type { EditableAccountingCategoryFields } from './AccountingCategoryForm';
import { AccountingCategoryKindI18n } from './AccountingCategoryForm';
import { CreateAccountingCategoryModal } from './CreateAccountingCategoryModal';

const accountingCategoriesQuery = gql`
  query AdminAccountingCategories($hostSlug: String!) {
    host(slug: $hostSlug) {
      id
      type
      slug
      accountingCategories {
        totalCount
        nodes {
          ...AccountingCategorySelectFields
        }
      }
    }
  }
  ${AccountingCategorySelectFieldsFragment}
`;

// TODO adapt for host types other than organization
const editAccountingCategoryMutation = gql`
  mutation EditAccountingCategories($hostSlug: String!, $categories: [AccountingCategoryInput!]!) {
    editAccountingCategories(account: { slug: $hostSlug }, categories: $categories) {
      id
      ... on Organization {
        host {
          id
          slug
          accountingCategories {
            totalCount
            nodes {
              ...AccountingCategorySelectFields
            }
          }
        }
      }
    }
  }
  ${AccountingCategorySelectFieldsFragment}
`;

function categoryToEditableFields(category: AccountingCategory) {
  const editableFields = [
    'kind',
    'code',
    'name',
    'friendlyName',
    'expensesTypes',
    'hostOnly',
    'instructions',
    'appliesTo',
  ];
  return pick(category, ['id', ...editableFields]);
}

const orderByCodeFilter = buildOrderByFilter(
  z.enum(['CODE,DESC', 'CODE,ASC', 'NAME,DESC', 'NAME,ASC']).default('CODE,ASC'),
  {
    'CODE,DESC': defineMessage({ defaultMessage: 'Code descending', id: 'WSOB2K' }),
    'CODE,ASC': defineMessage({ defaultMessage: 'Code ascending', id: 'XeM7ah' }),
    'NAME,DESC': defineMessage({ defaultMessage: 'Name descending', id: 'mKpwVr' }),
    'NAME,ASC': defineMessage({ defaultMessage: 'Name ascending', id: 'M5aWJU' }),
  },
);

const kindFilter = buildComboSelectFilter(
  z
    .array(
      z.enum([AccountingCategoryKind.ADDED_FUNDS, AccountingCategoryKind.CONTRIBUTION, AccountingCategoryKind.EXPENSE]),
    )
    .optional(),
  defineMessage({ defaultMessage: 'Kind', id: 'Transaction.Kind' }),
  AccountingCategoryKindI18n,
);

const hostOnlyFilter = buildComboSelectFilter(
  z.enum(['yes', 'no']).optional(),
  defineMessage({ defaultMessage: 'Visible only to host admins', id: 'NvBPFR' }),
  {
    ['yes']: defineMessage({ defaultMessage: 'Yes', id: 'a5msuh' }),
    ['no']: defineMessage({ defaultMessage: 'No', id: 'oUWADl' }),
  },
);

/**
 * The accounting sections lets host admins customize their chart of accounts.
 */
export const HostAdminAccountingSection = ({ accountSlug }: DashboardSectionProps) => {
  const { account } = React.useContext(DashboardContext);
  const isUpgradeRequired = requiresUpgrade(account, FEATURES.CHART_OF_ACCOUNTS);
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const { toast } = useToast();

  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = React.useState(false);
  const [deleteCategoryConfirmation, setDeleteCategoryConfirmation] = React.useState(null);

  const hasHosting = account.hasHosting;

  const queryFilter = useQueryFilter({
    schema: React.useMemo(
      () =>
        z.object({
          searchTerm: searchFilter.schema,
          orderBy: orderByCodeFilter.schema,
          kind: kindFilter.schema,
          ...(hasHosting ? { hostOnly: hostOnlyFilter.schema } : {}),
        }),
      [hasHosting],
    ),
    filters: {
      searchTerm: searchFilter.filter,
      orderBy: orderByCodeFilter.filter,
      kind: kindFilter.filter,
      ...(hasHosting ? { hostOnly: hostOnlyFilter.filter } : {}),
    },
    toVariables: {
      searchTerm: searchFilter.toVariables,
      orderBy: orderByCodeFilter.toVariables,
      kind: kindFilter.toVariables,
      ...(hasHosting ? { hostOnly: v => v === 'yes' } : {}),
    },
  });

  const query = useQuery<AdminAccountingCategoriesQuery, AdminAccountingCategoriesQueryVariables>(
    accountingCategoriesQuery,
    {
      variables: {
        hostSlug: accountSlug,
      },
    },
  );

  const categories = React.useMemo(
    () => query.data?.host?.accountingCategories?.nodes || [],
    [query.data?.host?.accountingCategories?.nodes],
  );

  const filterFn: (c: (typeof categories)[number]) => boolean = React.useMemo(() => {
    if (!queryFilter.values.searchTerm && !queryFilter.values.kind && !queryFilter.values.hostOnly) {
      return null;
    }

    const termRegExp = queryFilter.values.searchTerm && new RegExp(queryFilter.values.searchTerm, 'i');
    return c => {
      return (
        (!termRegExp || termRegExp.test(c.code) || termRegExp.test(c.name) || termRegExp.test(c.friendlyName)) &&
        (!queryFilter.values.kind || queryFilter.values.kind.includes(c.kind)) &&
        (!queryFilter.values.hostOnly || (queryFilter.values.hostOnly === 'yes') === c.hostOnly)
      );
    };
  }, [queryFilter.values]);

  const sortFn: (a: (typeof categories)[number], b: (typeof categories)[number]) => number = React.useMemo(() => {
    return (a, b) => {
      if (queryFilter.values.orderBy === 'CODE,ASC') {
        return a.code.localeCompare(b.code);
      } else if (queryFilter.values.orderBy === 'CODE,DESC') {
        return b.code.localeCompare(a.code);
      } else if (queryFilter.values.orderBy === 'NAME,ASC') {
        return a.name.localeCompare(b.name);
      } else if (queryFilter.values.orderBy === 'NAME,DESC') {
        return b.name.localeCompare(a.name);
      }
    };
  }, [queryFilter.values.orderBy]);

  const filteredCategories = React.useMemo(() => {
    let result = categories;

    if (filterFn) {
      result = result.filter(filterFn);
    }

    result = result.toSorted(sortFn);

    return result;
  }, [categories, sortFn, filterFn]);

  const isAdmin = Boolean(LoggedInUser?.isAdminOfCollective(query.data?.host)); // Accountants can't edit accounting categories

  const [editAccountingCategories] = useMutation(editAccountingCategoryMutation, {
    variables: {
      hostSlug: accountSlug,
    },
  });

  const updateCategories = React.useCallback(
    async (newCategories, onSuccess = null) => {
      try {
        const cleanCategories = newCategories.map(categoryToEditableFields);
        await editAccountingCategories({ variables: { categories: cleanCategories } });
        toast({ variant: 'success', message: intl.formatMessage({ id: 'saved', defaultMessage: 'Saved' }) });
        onSuccess?.();
      } catch (e) {
        toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        throw e;
      }
    },
    [intl, toast, editAccountingCategories],
  );

  const onDelete = React.useCallback(async toDelete => {
    setDeleteCategoryConfirmation(toDelete);
  }, []);

  const onConfirmDelete = React.useCallback(async () => {
    return await updateCategories(
      categories.filter(c => c.id !== deleteCategoryConfirmation.id),
      () => {
        setDeleteCategoryConfirmation(null);
      },
    );
  }, [updateCategories, categories, deleteCategoryConfirmation]);

  const onEdit = React.useCallback(
    async (edited: Pick<AccountingCategory, 'id' | EditableAccountingCategoryFields>) => {
      await updateCategories([...categories.filter(c => c.id !== edited.id), edited]);
    },
    [updateCategories, categories],
  );

  const onCreate = React.useCallback(
    async (created: Pick<AccountingCategory, EditableAccountingCategoryFields>) => {
      await updateCategories([...categories, created], () => setIsCreateCategoryModalOpen(false));
    },
    [updateCategories, categories],
  );

  return (
    <React.Fragment>
      <div className="flex flex-col gap-4">
        <DashboardHeader
          title={<FormattedMessage defaultMessage="Chart of Accounts" id="IzFWHI" />}
          description={
            <FormattedMessage
              defaultMessage="Manage your accounting categories, and use these categories to keep transactions organized."
              id="rPyk8i"
            />
          }
          actions={
            <Button
              disabled={isUpgradeRequired}
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => setIsCreateCategoryModalOpen(true)}
            >
              <span>
                <FormattedMessage defaultMessage="Create category" id="ZROXxK" />
              </span>
              <PlusIcon size={20} />
            </Button>
          }
        />

        {isUpgradeRequired ? (
          <UpgradePlanCTA featureKey="CHART_OF_ACCOUNTS" className="mt-4" />
        ) : (
          <React.Fragment>
            <Filterbar {...queryFilter} />

            {query.error && <MessageBoxGraphqlError error={query.error} />}

            <AccountingCategoriesTable
              hostSlug={accountSlug}
              accountingCategories={filteredCategories}
              isAdmin={isAdmin}
              loading={query.loading}
              isFiltered={!!queryFilter.values.searchTerm}
              onDelete={onDelete}
              onEdit={onEdit}
              hasHosting={hasHosting}
            />
          </React.Fragment>
        )}
      </div>
      {isCreateCategoryModalOpen && (
        <CreateAccountingCategoryModal
          hasHosting={hasHosting}
          onClose={() => setIsCreateCategoryModalOpen(false)}
          onCreate={onCreate}
        />
      )}
      {deleteCategoryConfirmation && (
        <ConfirmationModal
          isDanger
          type="delete"
          onClose={() => setDeleteCategoryConfirmation(null)}
          header={
            <FormattedMessage defaultMessage="Are you sure you want to delete this accounting category?" id="zbCUar" />
          }
          continueHandler={async () => {
            await onConfirmDelete();
            setDeleteCategoryConfirmation(null);
            return CONFIRMATION_MODAL_TERMINATE;
          }}
        >
          <div className="inline-block rounded-xl bg-slate-50 px-2 py-1 font-bold text-slate-800">
            {deleteCategoryConfirmation.name}
            {deleteCategoryConfirmation.friendlyName && (
              <span className="font-normal text-slate-700 italic">
                &nbsp;·&nbsp;{deleteCategoryConfirmation.friendlyName}
              </span>
            )}
          </div>
        </ConfirmationModal>
      )}
    </React.Fragment>
  );
};
