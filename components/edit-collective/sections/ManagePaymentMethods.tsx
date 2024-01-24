import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import clsx from 'clsx';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { PAYMENT_METHOD_TYPE } from '../../../lib/constants/payment-methods';
import { i18nGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT, gql, gqlV1 } from '../../../lib/graphql/helpers';
import {
  Account,
  ConfirmOrderMutation,
  ManagePaymentMethodsQuery,
  ManagePaymentMethodsQueryVariables,
} from '../../../lib/graphql/types/v2/graphql';
import { getPaymentMethodName } from '../../../lib/payment_method_label';
import {
  getPaymentMethodIcon,
  getPaymentMethodMetadata,
  isPaymentMethodDisabled,
} from '../../../lib/payment-method-utils';
import { getStripe } from '../../../lib/stripe';

import ConfirmationModal from '../../ConfirmationModal';
import Loading from '../../Loading';
import MessageBox from '../../MessageBox';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import StyledButton from '../../StyledButton';
import StyledLink from '../../StyledLink';
import StyledTooltip from '../../StyledTooltip';
import { useToast } from '../../ui/useToast';

const managePaymentMethodsQuery = gql`
  query ManagePaymentMethods($accountSlug: String!) {
    account(slug: $accountSlug) {
      id
      legacyId
      type
      slug
      name
      currency
      isHost
      settings
      paymentMethods(type: [CREDITCARD, US_BANK_ACCOUNT, SEPA_DEBIT, BACS_DEBIT, GIFTCARD, PREPAID]) {
        id
        ...PaymentMethodFields
      }
    }
  }

  fragment PaymentMethodFields on PaymentMethod {
    id
    legacyId
    name
    data
    service
    type
    balance {
      valueInCents
      currency
    }
    expiryDate
    monthlyLimit {
      valueInCents
    }
    account {
      id
      slug
      name
    }
    recurringContributions: orders(
      onlyActiveSubscriptions: true
      status: [ACTIVE, ERROR, PENDING, REQUIRE_CLIENT_CONFIRMATION]
    ) {
      totalCount
      nodes {
        id
        legacyId
        needsConfirmation
      }
    }
  }
`;

type ManagePaymentMethodsProps = {
  account: Pick<Account, 'slug'>;
};

export default function ManagePaymentMethods(props: ManagePaymentMethodsProps) {
  const router = useRouter();
  const query = useQuery<ManagePaymentMethodsQuery, ManagePaymentMethodsQueryVariables>(managePaymentMethodsQuery, {
    context: API_V2_CONTEXT,
    variables: {
      accountSlug: props.account.slug,
    },
  });

  const [orderedPaymentMethods, hasPaymentMethodsToConfirm] = React.useMemo(() => {
    if (!query?.data?.account?.paymentMethods) {
      return [[], false];
    }

    let someNeedsConfirmation = false;
    const ordered = query.data.account.paymentMethods.toSorted((a, b) => {
      const aNeedsConfirmation = a.recurringContributions.nodes.some(a => a.needsConfirmation);
      const bNeedsConfirmation = b.recurringContributions.nodes.some(b => b.needsConfirmation);

      if (aNeedsConfirmation || bNeedsConfirmation) {
        someNeedsConfirmation = true;
      }

      if (aNeedsConfirmation && !bNeedsConfirmation) {
        return -1;
      } else if (!aNeedsConfirmation && bNeedsConfirmation) {
        return 1;
      }

      return a.legacyId - b.legacyId;
    });

    return [ordered, someNeedsConfirmation];
  }, [query.data?.account?.paymentMethods]);

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
    <div className="flex flex-col gap-3">
      {isOrderConfirmationRedirect && (
        <MessageBox type="success" display="flex" alignItems="center" withIcon mb={3}>
          <div className="flex items-center justify-between">
            <FormattedMessage
              id="Order.Confirm.Success"
              defaultMessage="Your payment method has now been confirmed and the payment successfully went through."
            />
            <StyledButton buttonSize="tiny" onClick={dismissOrderConfirmationMessage}>
              <FormattedMessage defaultMessage="Dismiss" />
            </StyledButton>
          </div>
        </MessageBox>
      )}
      {hasPaymentMethodsToConfirm && (
        <MessageBox type="warning" withIcon mb={3}>
          <FormattedMessage defaultMessage="You need to confirm at least one of your payment methods." />
        </MessageBox>
      )}
      {orderedPaymentMethods.map(pm => {
        return <PaymentMethodItem key={pm.id} account={props.account} paymentMethod={pm} />;
      })}

      {orderedPaymentMethods.length === 0 && (
        <MessageBox type="info" withIcon mb={3}>
          <FormattedMessage defaultMessage="No saved payment methods." />
        </MessageBox>
      )}
    </div>
  );
}

type PaymentMethodItemProps = {
  paymentMethod: ManagePaymentMethodsQuery['account']['paymentMethods'][number];
  account: Pick<Account, 'slug'>;
};

function PaymentMethodItem(props: PaymentMethodItemProps) {
  const { toast } = useToast();
  const intl = useIntl();
  const hasRecurringContributions = props.paymentMethod.recurringContributions.totalCount > 0;
  const removable = props.paymentMethod.type !== PAYMENT_METHOD_TYPE.GIFTCARD;
  const needsConfirmation = React.useMemo(
    () => props.paymentMethod.recurringContributions.nodes.some(pm => pm.needsConfirmation),
    [props.paymentMethod.recurringContributions.nodes],
  );

  const [isConfirmingRemoval, setIsConfirmingRemoval] = React.useState(false);
  const [isConfirmingOrder, setIsConfirmingOrder] = React.useState(false);
  const [removePaymentMethod, { loading: loadingRemovalMutation }] = useMutation(
    gqlV1`
    mutation RemovePaymentMethod($paymentMethodId: Int!) {
      removePaymentMethod(id: $paymentMethodId) {
        id
      }
    }
  `,
    {
      variables: {
        paymentMethodId: props.paymentMethod.legacyId,
      },
      refetchQueries: ['ManagePaymentMethods'],
    },
  );

  const orderToConfirm = React.useMemo(() => {
    return props.paymentMethod?.recurringContributions?.nodes?.find(o => o.needsConfirmation);
  }, [props.paymentMethod?.recurringContributions?.nodes]);

  const [confirmOrder] = useMutation<ConfirmOrderMutation>(
    gql`
      mutation ConfirmOrder($order: OrderReferenceInput!) {
        confirmOrder(order: $order) {
          order {
            id
            status
            transactions {
              id
            }
            fromAccount {
              id
              slug
            }
          }
          stripeError {
            message
            account
            response
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        order: {
          id: orderToConfirm?.id,
        },
      },
      refetchQueries: ['ManagePaymentMethods'],
    },
  );

  const onConfirmOrder = React.useCallback(async () => {
    setIsConfirmingOrder(true);
    try {
      const response = await confirmOrder();
      const stripeError = response.data?.confirmOrder?.stripeError;
      if (stripeError) {
        const stripeResponse = stripeError.response;
        const stripe = await getStripe(null, stripeError.account);
        const confirmationResult = await stripe.handleCardAction(stripeResponse.paymentIntent.client_secret);
        if (confirmationResult.paymentIntent && confirmationResult.paymentIntent.status === 'requires_confirmation') {
          await confirmOrder();
        } else if (confirmationResult.error) {
          throw new Error(confirmationResult.error.message);
        }
      }

      toast({
        variant: 'success',
        message: (
          <FormattedMessage
            id="Order.Confirm.Success"
            defaultMessage="Your payment method has now been confirmed and the payment successfully went through."
          />
        ),
      });
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    } finally {
      setIsConfirmingOrder(false);
    }
  }, [confirmOrder, toast, intl]);

  return (
    <React.Fragment>
      <div className="flex grow justify-between rounded border p-3">
        <label
          className={clsx('flex items-center', {
            grayscale: isPaymentMethodDisabled(props.paymentMethod),
          })}
        >
          <div className="mr-3 w-7 text-center">
            {getPaymentMethodIcon(props.paymentMethod, props.paymentMethod.account, 24)}
          </div>
          <div>
            <p className="text-xs font-semibold leading-5 text-black">
              {getPaymentMethodName(props.paymentMethod as any)}
            </p>
            {getPaymentMethodMetadata(props.paymentMethod) && (
              <p className="text-xs font-normal leading-4 text-gray-400">
                {getPaymentMethodMetadata(props.paymentMethod)}
              </p>
            )}
            {hasRecurringContributions && (
              <StyledLink
                className="text-xs font-normal leading-4 text-gray-400"
                href={`/dashboard/${props.account.slug}/outgoing-contributions?status=ACTIVE&status=ERROR&type=RECURRING&paymentMethod=${props.paymentMethod.id}`}
              >
                <FormattedMessage
                  id="paymentMethod.activeSubscriptions"
                  defaultMessage="{n} active {n, plural, one {recurring financial contribution} other {recurring financial contributions}}"
                  values={{ n: props.paymentMethod.recurringContributions.totalCount }}
                />
              </StyledLink>
            )}
          </div>
        </label>
        <div className="flex w-56 justify-end gap-1">
          {removable && (
            <StyledTooltip
              noTooltip={!hasRecurringContributions}
              content={
                <FormattedMessage
                  id="errors.PM.Remove.HasActiveSubscriptions"
                  defaultMessage="This payment method cannot be removed because it has active recurring financial contributions."
                />
              }
            >
              <StyledButton
                className="flex items-center"
                buttonStyle="standard"
                buttonSize="medium"
                loading={loadingRemovalMutation}
                mx={1}
                onClick={() => setIsConfirmingRemoval(true)}
                disabled={hasRecurringContributions}
              >
                <FormattedMessage id="Remove" defaultMessage="Remove" />
              </StyledButton>
            </StyledTooltip>
          )}
          {needsConfirmation && (
            <StyledButton
              onClick={onConfirmOrder}
              loading={isConfirmingOrder}
              buttonStyle="warningSecondary"
              buttonSize="medium"
              mx={1}
            >
              <FormattedMessage id="paymentMethod.confirm" defaultMessage="Confirm" />
            </StyledButton>
          )}
        </div>
      </div>
      {isConfirmingRemoval && (
        <ConfirmationModal
          isDanger
          type="remove"
          header={
            <FormattedMessage
              id="paymentMethods.removeConfirm"
              defaultMessage="Do you really want to remove this payment method?"
            />
          }
          continueHandler={async () => {
            try {
              await removePaymentMethod();
            } catch (e) {
              toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
            }
            setIsConfirmingRemoval(false);
          }}
          onClose={() => setIsConfirmingRemoval(false)}
        ></ConfirmationModal>
      )}
    </React.Fragment>
  );
}
