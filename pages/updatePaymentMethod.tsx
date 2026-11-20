import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { getIntervalFromContributionFrequency } from '../lib/date-utils';
import { gql } from '../lib/graphql/helpers';
import type {
  ManagedOrderFieldsFragment,
  UpdatePaymentMethodPageQuery,
  UpdatePaymentMethodPageQueryVariables,
} from '../lib/graphql/types/v2/graphql';

import AuthenticatedPage from '../components/AuthenticatedPage';
import EditOrderModal from '../components/EditOrderModal';
import FormattedMoneyAmount from '../components/FormattedMoneyAmount';
import Link from '../components/Link';
import LinkCollective from '../components/LinkCollective';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import MessageBoxGraphqlError from '../components/MessageBoxGraphqlError';
import { managedOrderFieldsFragment } from '../components/recurring-contributions/graphql/queries';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const updatePaymentMethodPageQuery = gql`
  query UpdatePaymentMethodPage($paymentMethod: PaymentMethodReferenceInput!) {
    paymentMethod(paymentMethod: $paymentMethod) {
      id
      account {
        id
        slug
      }
      orders(onlyActiveSubscriptions: true, status: [ACTIVE, ERROR]) {
        totalCount
        nodes {
          ...ManagedOrderFields
        }
      }
    }
  }
  ${managedOrderFieldsFragment}
`;

const UpdatePaymentMethodContent = ({ paymentMethodId }: { paymentMethodId: number }) => {
  const [editedOrder, setEditedOrder] = React.useState<ManagedOrderFieldsFragment | null>(null);
  const [hasUpdatedOrders, setHasUpdatedOrders] = React.useState(false);
  const { data, loading, error, refetch } = useQuery<
    UpdatePaymentMethodPageQuery,
    UpdatePaymentMethodPageQueryVariables
  >(updatePaymentMethodPageQuery, {
    variables: { paymentMethod: { legacyId: paymentMethodId } },
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  if (loading && !data) {
    return <Loading />;
  } else if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  const paymentMethod = data?.paymentMethod;
  const orders = paymentMethod?.orders.nodes || [];
  if (!orders.length) {
    return (
      <div className="flex flex-col items-center gap-4">
        <MessageBox type={hasUpdatedOrders ? 'success' : 'info'} withIcon>
          {hasUpdatedOrders ? (
            <FormattedMessage
              defaultMessage="All your recurring contributions now use a new payment method."
              id="updatePaymentMethod.allUpdated"
            />
          ) : !paymentMethod ? (
            <FormattedMessage
              defaultMessage="This payment method does not exist or has already been updated."
              id="RiYYFO"
            />
          ) : (
            <FormattedMessage
              defaultMessage="There are no active subscriptions linked to this payment method, it may have already been updated."
              id="jor/DD"
            />
          )}
        </MessageBox>
        {paymentMethod?.account && (
          <Link href={`/dashboard/${paymentMethod.account.slug}/outgoing-contributions`}>
            <Button variant="outline">
              <FormattedMessage defaultMessage="View your contributions" id="updatePaymentMethod.viewContributions" />
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-muted-foreground">
        <FormattedMessage
          id="updatePaymentMethod.subtitle.line"
          defaultMessage="Please add a new payment method for the following subscriptions before your current one expires."
        />
      </p>
      <ul className="flex flex-col gap-3" data-cy="update-payment-method-orders">
        {orders.map(order => (
          <li
            key={order.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"
            data-cy="update-payment-method-order"
          >
            <div className="flex flex-col gap-1">
              <LinkCollective collective={order.toAccount} className="font-medium" openInNewTab />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FormattedMoneyAmount
                  amount={order.totalAmount.valueInCents}
                  currency={order.totalAmount.currency}
                  interval={getIntervalFromContributionFrequency(order.frequency)}
                />
                {order.status === 'ERROR' && (
                  <Badge type="error" size="sm">
                    <FormattedMessage defaultMessage="Payment failed" id="qV+TFm" />
                  </Badge>
                )}
              </div>
            </div>
            <Button size="sm" onClick={() => setEditedOrder(order)} data-cy="update-payment-method-order-button">
              <FormattedMessage id="subscription.menu.editPaymentMethod" defaultMessage="Update payment method" />
            </Button>
          </li>
        ))}
      </ul>
      {editedOrder && (
        <EditOrderModal
          open
          setOpen={open => !open && setEditedOrder(null)}
          order={editedOrder}
          // The dashboard of the payment method owner, also for contributions made from its incognito profile
          accountSlug={paymentMethod.account?.slug || editedOrder.fromAccount.slug}
          action="editPaymentMethod"
          onSuccess={() => {
            setHasUpdatedOrders(true);
            refetch();
          }}
        />
      )}
    </div>
  );
};

type UpdatePaymentMethodPageProps = {
  paymentMethodId: number;
};

/**
 * Linked from the "credit card expiring" email (`payment.creditcard.expiring`): lists the active recurring contributions
 * that use a payment method and lets the contributor pick or add another one for each, card or not.
 */
const UpdatePaymentMethodPage = ({ paymentMethodId }: UpdatePaymentMethodPageProps) => {
  return (
    <AuthenticatedPage disableSignup>
      {() => (
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-12">
          <h1 className="text-center text-3xl font-bold">
            <FormattedMessage id="updatePaymentMethod.title" defaultMessage="Update Payment Method" />
          </h1>
          <UpdatePaymentMethodContent paymentMethodId={paymentMethodId} />
        </div>
      )}
    </AuthenticatedPage>
  );
};

UpdatePaymentMethodPage.getInitialProps = ({ query: { paymentMethodId } }) => {
  return { paymentMethodId: parseInt(paymentMethodId) };
};

// next.js export
// ts-unused-exports:disable-next-line
export default UpdatePaymentMethodPage;
