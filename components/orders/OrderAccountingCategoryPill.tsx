import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { ChevronDown } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import type { Account, AccountingCategory, Host, Order } from '../../lib/graphql/types/v2/graphql';
import { cn } from '../../lib/utils';

import AccountingCategorySelect from '../AccountingCategorySelect';
import StyledSpinner from '../StyledSpinner';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

const updateOrderAccountingCategoryMutation = gql/* GraphQL */ `
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
  order: Order;
  canEdit: boolean;
  account: Account;
  host: Host;
  /** Whether to allow the user to select "I don't know" */
  allowNone?: boolean;
  /** Whether to show the category code in the select */
  showCodeInSelect?: boolean;
};

const BADGE_CLASS = cn('red rounded-lg bg-neutral-100 px-3 py-1  text-xs font-medium text-neutral-800');

const getCategoryLabel = (category: AccountingCategory) => {
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
}: Omit<AccountingCategoryPillProps, 'canEdit'>) => {
  const intl = useIntl();
  const [updateOrder, { loading }] = useMutation(updateOrderAccountingCategoryMutation, { context: API_V2_CONTEXT });
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
      <Button className={cn(BADGE_CLASS, 'h-auto hover:bg-neutral-50 hover:opacity-90')}>
        <span className="mr-1">{getCategoryLabel(order.accountingCategory)}</span>
        {loading ? <StyledSpinner size="1em" /> : <ChevronDown size="1em" />}
      </Button>
    </AccountingCategorySelect>
  );
};
