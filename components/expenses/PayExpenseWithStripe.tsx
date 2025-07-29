import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { Elements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { pick } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import type {
  AccountStripePaymentMethodsQuery,
  AccountStripePaymentMethodsQueryVariables,
} from '@/lib/graphql/types/v2/graphql';
import {
  type Expense,
  type ExpenseReferenceInput,
  type PaymentMethod,
  PaymentMethodService,
} from '@/lib/graphql/types/v2/schema';
import { getPaymentMethodName } from '@/lib/payment_method_label';
import { getPaymentMethodIcon, getPaymentMethodMetadata } from '@/lib/payment-method-utils';
import { confirmPayment } from '@/lib/stripe/confirm-payment';
import { StripePaymentMethodsLabels } from '@/lib/stripe/payment-methods';
import type { StripePaymentIntent } from '@/lib/stripe/usePaymentIntent';
import usePaymentIntent from '@/lib/stripe/usePaymentIntent';

import { PayWithStripeForm } from '../contribution-flow/PayWithStripe';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import { Button } from '../ui/Button';
import { RadioGroup, RadioGroupCard } from '../ui/RadioGroup';
import { Skeleton } from '../ui/Skeleton';
import { toast } from '../ui/useToast';

type PayExpenseWithStripeProps = {
  expense: ExpenseReferenceInput & { account: Pick<Expense['account'], 'slug'> };
  onSuccess: () => Promise<void>;
};

export function PayExpenseWithStripe(props: PayExpenseWithStripeProps) {
  const intl = useIntl();
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = React.useState(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = React.useState(false);
  const [isConfirmingExpenseStatus, setIsConfirmingExpenseStatus] = React.useState(false);
  const [paymentElementData, setPaymentElementData] = React.useState(null);
  const [paymentIntent, stripe, loadingPaymentIntent, paymentIntentCreateError] = usePaymentIntent({
    expense: pick(props.expense, ['id', 'legacyId']),
  });

  const {
    loading: loadingSavedPaymentMethods,
    data: paymentMethodsData,
    error: paymentMethodsQueryError,
  } = useQuery<AccountStripePaymentMethodsQuery, AccountStripePaymentMethodsQueryVariables>(paymentMethodsQuery, {
    context: API_V2_CONTEXT,
    variables: {
      slug: props.expense.account.slug,
    },
  });

  const loading = !paymentIntent || loadingPaymentIntent || loadingSavedPaymentMethods;
  const error = paymentIntentCreateError || paymentMethodsQueryError;

  const savedPaymentMethods = React.useMemo(() => {
    const filter = allowedPaymentMethodFilter(paymentIntent);
    return (paymentMethodsData?.account?.paymentMethods ?? []).filter(filter);
  }, [paymentIntent, paymentMethodsData?.account?.paymentMethods]);

  React.useEffect(() => {
    if (selectedPaymentMethodId || loading) {
      return;
    }

    setSelectedPaymentMethodId(savedPaymentMethods?.length ? savedPaymentMethods[0].id : 'new-payment-method');
  }, [savedPaymentMethods, selectedPaymentMethodId, loading]);

  const options: StripeElementsOptions = {
    clientSecret: paymentIntent?.client_secret,
    appearance: {
      theme: 'stripe',
      variables: {
        fontFamily: 'Inter, sans-serif',
      },
    },
    fonts: [
      {
        cssSrc: 'https://fonts.googleapis.com/css?family=Inter',
      },
    ],
  };

  let availableMethodLabels = (paymentIntent?.payment_method_types ?? []).map(method => {
    return StripePaymentMethodsLabels[method] ? intl.formatMessage(StripePaymentMethodsLabels[method]) : method;
  });

  if (availableMethodLabels.length > 3) {
    availableMethodLabels = [...availableMethodLabels.slice(0, 3), 'etc'];
  }

  const isPayButtonDisabled = React.useMemo(
    () =>
      selectedPaymentMethodId === 'new-payment-method'
        ? !paymentElementData?.isCompleted
        : !savedPaymentMethods.some(pm => pm.id === selectedPaymentMethodId),
    [selectedPaymentMethodId, savedPaymentMethods, paymentElementData],
  );

  const { onSuccess } = props;
  const onPayClick = React.useCallback(async () => {
    const returnUrl = new URL(
      `${window.location.origin}/${props.expense.account.slug}/expenses/${props.expense.legacyId}`,
    );

    const selectedPaymentMethod = savedPaymentMethods.find(pm => pm.id === selectedPaymentMethodId);
    try {
      setIsConfirmingPayment(true);
      await confirmPayment(
        stripe,
        paymentIntent?.client_secret,
        {
          returnUrl: returnUrl.href,
          elements: paymentElementData?.stripeData?.elements,
          type:
            selectedPaymentMethodId === 'new-payment-method'
              ? paymentElementData?.paymentMethod?.type
              : selectedPaymentMethod.type,
          paymentMethodId:
            selectedPaymentMethodId !== 'new-payment-method'
              ? selectedPaymentMethod?.data?.stripePaymentMethodId
              : undefined,
        },
        {
          redirect: 'if_required',
        },
      );
      setIsConfirmingExpenseStatus(true);
      await onSuccess();
    } catch (err) {
      toast({ variant: 'error', message: err.message });
    } finally {
      setIsConfirmingPayment(false);
      setIsConfirmingExpenseStatus(false);
    }
  }, [
    stripe,
    paymentIntent,
    paymentElementData,
    selectedPaymentMethodId,
    props.expense.legacyId,
    props.expense.account.slug,
    savedPaymentMethods,
    onSuccess,
  ]);

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  } else if (loading) {
    return <Skeleton className="h-6 w-full" />;
  }

  const stripeForm = (
    <PayWithStripeForm
      hasSaveCheckBox={false}
      defaultIsSaved={false}
      onChange={e => setPaymentElementData(e.stepPayment)}
      bilingDetails={{
        name: '',
        email: '',
      }}
      paymentIntentId={paymentIntent.id}
      paymentIntentClientSecret={paymentIntent.client_secret}
    />
  );

  return (
    <Elements key={stripe['_stripeObjId']} options={options} stripe={stripe}>
      {isConfirmingExpenseStatus ? (
        <Skeleton className="h-6 w-full" />
      ) : savedPaymentMethods?.length ? (
        <RadioGroup id="paymentMethod" value={selectedPaymentMethodId} onValueChange={setSelectedPaymentMethodId}>
          {savedPaymentMethods.map(pm => (
            <RadioGroupCard key={pm.id} value={pm.id}>
              <div>{getPaymentMethodIcon(pm)}</div>
              <div>
                <div className="text-sm">{getPaymentMethodName(pm as any)}</div>
                <div className="text-xs text-muted-foreground">{getPaymentMethodMetadata(pm)}</div>
              </div>
            </RadioGroupCard>
          ))}

          <RadioGroupCard
            value="new-payment-method"
            showSubcontent={selectedPaymentMethodId === 'new-payment-method'}
            subContent={stripeForm}
          >
            <FormattedMessage
              defaultMessage="New: {methods}"
              id="paymentMethods.new"
              values={{ methods: availableMethodLabels.join(', ') }}
            />
          </RadioGroupCard>
        </RadioGroup>
      ) : (
        stripeForm
      )}

      <Button
        onClick={onPayClick}
        variant="success"
        className="mt-4 w-full"
        loading={isConfirmingPayment}
        disabled={isPayButtonDisabled}
      >
        <FormattedMessage defaultMessage="Pay" id="lD3+8a" />
      </Button>
    </Elements>
  );
}

function allowedPaymentMethodFilter(paymentIntent?: StripePaymentIntent): (pm: PaymentMethod) => boolean {
  if (!paymentIntent) {
    return () => false;
  }

  const allowedStripeTypes = [...paymentIntent.payment_method_types];
  if (allowedStripeTypes.includes('card')) {
    allowedStripeTypes.push('creditcard'); // we store this type as creditcard
  }

  return pm => {
    if (pm.service !== PaymentMethodService.STRIPE) {
      return false;
    }

    return (
      allowedStripeTypes.includes(pm.type.toLowerCase()) &&
      (!pm.data?.stripeAccount || pm.data?.stripeAccount === paymentIntent.stripeAccount)
    );
  };
}

const paymentMethodsQuery = gql`
  query AccountStripePaymentMethods($slug: String) {
    account(slug: $slug) {
      id
      paymentMethods(type: [CREDITCARD, US_BANK_ACCOUNT, SEPA_DEBIT, BACS_DEBIT]) {
        id
        name
        data
        service
        type
        expiryDate
        providerType
        limitedToHosts {
          id
          legacyId
          slug
        }
      }
    }
  }
`;
