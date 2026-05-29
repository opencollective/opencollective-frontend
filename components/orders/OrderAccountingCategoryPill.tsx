import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { ChevronDown } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import type { Account, AccountingCategory, Host, Order } from '../../lib/graphql/types/v2/graphql';
import { cn } from '../../lib/utils';

import AccountingCategorySelect from '../AccountingCategorySelect';
import Spinner from '../Spinner';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

const updateOrderAccountingCategoryMutation = gql /* GraphQL */ `
  mutation EditOrderAccountingCategory($order: OrderReferenceInput!, $category: AccountingCategoryReferenceInput) {
    updateOrderAccountingCategory(order: $order, accountingCategory: $category) {
      id
      accountingCategory {
        id
        name
        code
        friendlyName
      }
    }
  }
`;

type AccountingCategoryPillProps = {
  order: Pick<Order, 'id'> & { accountingCategory?: Pick<AccountingCategory, 'friendlyName' | 'name' | 'code' | 'id'> };
  canEdit: boolean;
  account: Pick<Account, 'id' | 'slug'>;
  host: Pick<Host, 'id' | 'slug' | 'type'> & {
    accountingCategories?: { nodes: Array<Pick<AccountingCategory, 'friendlyName' | 'name' | 'code' | 'id'>> };
  };
  /** Whether to allow the user to select "I don't know" */
  allowNone?: boolean;
  /** Whether to show the category code in the select */
  showCodeInSelect?: boolean;
  labelClassName?: string;
  buttonClassName?: string;
};

const BADGE_CLASS = cn('red rounded-lg bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-800');

const getCategoryLabel = (category: Pick<AccountingCategory, 'friendlyName' | 'name'>) => {
  if (!category) {
    return <FormattedMessage id="accountingCategory.doNotKnow" defaultMessage="Unknown category" />;
  } else if (category) {
    return category.friendlyName || category.name;
  }
};

export const OrderAdminAccountingCategoryPill = ({
  order,
  account,
  host,
  labelClassName,
  buttonClassName,
}: Omit<AccountingCategoryPillProps, 'canEdit'>) => {
  const intl = useIntl();
  const [updateOrder, { loading }] = useMutation(updateOrderAccountingCategoryMutation);
  const { toast } = useToast();
  return (
    <AccountingCategorySelect
      kind="CONTRIBUTION"
      host={host}
      account={account}
      selectedCategory={order.accountingCategory}
      allowNone={true}
      showCode={true}
      onChange={async selectedCategory => {
        try {
          await updateOrder({
            variables: {
              order: { id: order.id },
              category: selectedCategory ? { id: selectedCategory.id } : null,
            },
          });
        } catch (e) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        }
      }}
    >
      <Button className={cn(BADGE_CLASS, 'h-auto hover:bg-neutral-50 hover:opacity-90', buttonClassName)}>
        <span className={cn('mr-1', labelClassName)}>{getCategoryLabel(order.accountingCategory)}</span>
        {loading ? <Spinner size="1em" /> : <ChevronDown size="1em" />}
      </Button>
    </AccountingCategorySelect>
  );
};
