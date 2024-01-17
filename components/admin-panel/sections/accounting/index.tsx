import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { pick } from 'lodash';
import { PlusIcon } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import {
  AccountingCategory,
  AdminAccountingCategoriesQuery,
  AdminAccountingCategoriesQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import DashboardHeader from '../../../dashboard/DashboardHeader';
import { Filterbar } from '../../../dashboard/filters/Filterbar';
import { orderByFilter } from '../../../dashboard/filters/OrderFilter';
import { searchFilter } from '../../../dashboard/filters/SearchFilter';
import { DashboardSectionProps } from '../../../dashboard/types';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/useToast';

import { AccountingCategoriesTable } from './AccountingCategoriesTable';
import { CreateAccountingCategoryModal } from './CreateAccountingCategoryModal';

const accountingCategoriesQuery = gql`
  query AdminAccountingCategories($hostSlug: String!) {
    host(slug: $hostSlug) {
      id
      slug
      accountingCategories {
        totalCount
        nodes {
          id
          kind
          code
          name
          friendlyName
          expensesTypes
          createdAt
        }
      }
    }
  }
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
              id
              kind
              code
              name
              friendlyName
              expensesTypes
              createdAt
            }
          }
        }
      }
    }
  }
`;

function categoryToEditableFields(category: AccountingCategory) {
  const editableFields = ['kind', 'code', 'name', 'friendlyName', 'expensesTypes'];
  return pick(category, ['id', ...editableFields]);
}

/**
 * The accounting sections lets host admins customize their chart of accounts.
 */
export const HostAdminAccountingSection = ({ accountSlug }: DashboardSectionProps) => {
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const { toast } = useToast();

  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = React.useState(false);

  const queryFilter = useQueryFilter({
    schema: z.object({
      searchTerm: searchFilter.schema,
      orderBy: orderByFilter.schema,
    }),
    filters: {
      searchTerm: searchFilter.filter,
      orderBy: orderByFilter.filter,
    },
    toVariables: {
      searchTerm: searchFilter.toVariables,
      orderBy: orderByFilter.toVariables,
    },
  });

  const query = useQuery<AdminAccountingCategoriesQuery, AdminAccountingCategoriesQueryVariables>(
    accountingCategoriesQuery,
    {
      context: API_V2_CONTEXT,
      variables: {
        hostSlug: accountSlug,
      },
    },
  );

  const categories = React.useMemo(
    () => query?.data?.host?.accountingCategories?.nodes || [],
    [query?.data?.host?.accountingCategories?.nodes],
  );

  const filteredCategories = React.useMemo(() => {
    let result = categories;

    if (queryFilter.values.searchTerm) {
      const termRegExp = new RegExp(queryFilter.values.searchTerm, 'i');
      result = result.filter(c => {
        return termRegExp.test(c.code) || termRegExp.test(c.name) || termRegExp.test(c.friendlyName);
      });
    }

    if (queryFilter.values.orderBy === 'CREATED_AT,DESC') {
      result = result.toSorted((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      result = result.toSorted((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    }

    return result;
  }, [categories, queryFilter.values.orderBy, queryFilter.values.searchTerm]);

  const isAdmin = Boolean(LoggedInUser?.isAdminOfCollective(query?.data?.host)); // Accountants can't edit accounting categories

  const [editAccountingCategories] = useMutation(editAccountingCategoryMutation, {
    context: API_V2_CONTEXT,
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
        onSuccess && onSuccess();
      } catch (e) {
        toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        throw e;
      }
    },
    [intl, toast, editAccountingCategories],
  );

  const onDelete = React.useCallback(
    async deleted => {
      await updateCategories(categories.filter(c => c.id !== deleted.id));
    },
    [updateCategories, categories],
  );

  const onEdit = React.useCallback(
    async (edited: Pick<AccountingCategory, 'id' | 'kind' | 'name' | 'friendlyName' | 'code' | 'expensesTypes'>) => {
      await updateCategories([...categories.filter(c => c.id !== edited.id), edited]);
    },
    [updateCategories, categories],
  );

  const onCreate = React.useCallback(
    async (
      created: Pick<AccountingCategory, 'kind' | 'name' | 'friendlyName' | 'code' | 'expensesTypes'> & { id: never },
    ) => {
      await updateCategories([...categories, created], () => setIsCreateCategoryModalOpen(false));
    },
    [updateCategories, categories],
  );

  return (
    <React.Fragment>
      <div className="flex max-w-screen-lg flex-col gap-4">
        <DashboardHeader
          title={<FormattedMessage defaultMessage="Chart of Accounts" />}
          description={
            <FormattedMessage defaultMessage="Manage your accounting categories, and use these categories to keep your Collectives’ expenses organized." />
          }
          actions={
            <Button size="sm" className="gap-1" onClick={() => setIsCreateCategoryModalOpen(true)}>
              <span>
                <FormattedMessage defaultMessage="Create category" />
              </span>
              <PlusIcon size={20} />
            </Button>
          }
        />

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
        />
      </div>
      {isCreateCategoryModalOpen && (
        <CreateAccountingCategoryModal onClose={() => setIsCreateCategoryModalOpen(false)} onCreate={onCreate} />
      )}
    </React.Fragment>
  );
};
