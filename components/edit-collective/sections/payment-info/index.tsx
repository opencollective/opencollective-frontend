import React from 'react';
import { useQuery } from '@apollo/client';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type {
  ManagePaymentMethodsQuery,
  ManagePaymentMethodsQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import type { Account } from '../../../../lib/graphql/types/v2/schema';

import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';

import Loading from '../../../Loading';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';

import CreateCreditCardModal from './CreateCreditCardModal.legacy';
import CreatePayoutMethodModal from './CreatePayoutMethodModal';
import { managePaymentMethodsQuery } from './gql';
import PaymentMethodsTable from './PaymentMethodsTable';
import PayoutMethodsTable from './PayoutMethodsTable';

type ManagePaymentMethodsProps = {
  account: Pick<Account, 'slug'>;
};

enum Modals {
  CREATE_PAYOUT_METHOD = 'CREATE_PAYOUT_METHOD',
  CREATE_CREDIT_CARD = 'CREATE_CREDIT_CARD',
}

export default function PaymentInfoDashboard(props: ManagePaymentMethodsProps) {
  const router = useRouter();
  const query = useQuery<ManagePaymentMethodsQuery, ManagePaymentMethodsQueryVariables>(managePaymentMethodsQuery, {
    context: API_V2_CONTEXT,
    variables: {
      accountSlug: props.account.slug,
    },
    nextFetchPolicy: 'network-only',
  });
  const [activeModal, setActiveModal] = React.useState<Modals | null>(null);

  const isOrderConfirmationRedirect = router.query.successType === 'payment';
  const dismissOrderConfirmationMessage = React.useCallback(() => {
    const newUrl = new URL(router.asPath, window.location.origin);
    newUrl.searchParams.delete('successType');
    router.replace(newUrl.toString(), undefined, { shallow: true });
  }, [router]);

  if (query.loading) {
    return <Loading />;
  }

  if (query.error) {
    return <MessageBoxGraphqlError error={query.error} />;
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <div>
          <div className="mb-1 flex w-full items-center gap-2 text-lg font-semibold">
            <div className="shrink-0">
              <FormattedMessage defaultMessage="For Contributions" id="xf7EPu" />
            </div>
            <Separator className="shrink" />
            <Button
              onClick={() => setActiveModal(Modals.CREATE_CREDIT_CARD)}
              size="xs"
              variant="outline"
              className="shrink-0"
              data-cy="add-credit-card-button"
            >
              <Plus size={16} /> <FormattedMessage defaultMessage="Add credit card" id="9UZLrN" />
            </Button>
          </div>
          <p className="text-sm leading-none text-muted-foreground">
            <FormattedMessage
              defaultMessage="Account details that can be used to contribute and acquire tickets."
              id="t9ur/I"
            />
          </p>
        </div>

        {isOrderConfirmationRedirect && (
          <MessageBox type="success">
            <div className="flex items-center justify-between">
              <FormattedMessage
                id="Order.Confirm.Success"
                defaultMessage="Your payment method has now been confirmed and the payment successfully went through."
              />
              <Button size="xs" variant="outline" onClick={dismissOrderConfirmationMessage}>
                <FormattedMessage defaultMessage="Dismiss" id="TDaF6J" />
              </Button>
            </div>
          </MessageBox>
        )}

        <PaymentMethodsTable
          account={props.account}
          paymentMethods={query.data.account?.paymentMethods}
          loading={query.loading}
        />
      </div>
      <div className="flex flex-col gap-5">
        <div>
          <div className="mb-1 flex items-center gap-2 text-lg font-semibold">
            <div className="shrink-0">
              <FormattedMessage defaultMessage="For Expenses" id="RF+AgF" />
            </div>
            <Separator className="shrink" />
            <Button
              onClick={() => setActiveModal(Modals.CREATE_PAYOUT_METHOD)}
              size="xs"
              variant="outline"
              className="shrink-0"
            >
              <Plus size={16} /> <FormattedMessage defaultMessage="Add new" id="i2jZA1" />
            </Button>
          </div>
          <p className="text-sm leading-none text-muted-foreground">
            <FormattedMessage
              defaultMessage="Account details that can be used to get paid for reimbursements, invoices, and grants."
              id="/iIQqg"
            />
          </p>
        </div>
        <PayoutMethodsTable
          account={query.data.account}
          payoutMethods={query.data.account?.payoutMethods}
          loading={query.loading}
          onUpdate={query.refetch}
        />
      </div>
      {activeModal === Modals.CREATE_PAYOUT_METHOD && (
        <CreatePayoutMethodModal
          account={props.account}
          open
          onOpenChange={open => setActiveModal(open ? Modals.CREATE_PAYOUT_METHOD : null)}
          onUpdate={() => {
            query.refetch();
            setActiveModal(null);
          }}
        />
      )}
      {activeModal === Modals.CREATE_CREDIT_CARD && (
        <CreateCreditCardModal
          account={props.account}
          open
          onOpenChange={open => setActiveModal(open ? Modals.CREATE_PAYOUT_METHOD : null)}
          onUpdate={() => {
            query.refetch();
            setActiveModal(null);
          }}
        />
      )}
    </div>
  );
}
