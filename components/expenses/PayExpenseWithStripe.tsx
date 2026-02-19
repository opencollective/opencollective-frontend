import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { Elements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { pick } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import type {
  AccountStripePaymentMethodsQuery,
  AccountStripePaymentMethodsQueryVariables,
  Expense,
  ExpenseReferenceInput,
  PaymentMethod,
} from '@/lib/graphql/types/v2/graphql';
import { ExpenseType, PaymentMethodService } from '@/lib/graphql/types/v2/graphql';
import { getPaymentMethodName } from '@/lib/payment_method_label';
import { getPaymentMethodIcon, getPaymentMethodMetadata } from '@/lib/payment-method-utils';
import { confirmPayment } from '@/lib/stripe/confirm-payment';
import { getStripePaymentMethodLabel } from '@/lib/stripe/payment-methods';
import type { StripePaymentIntent } from '@/lib/stripe/usePaymentIntent';
import usePaymentIntent from '@/lib/stripe/usePaymentIntent';

import { PayWithStripeForm } from '../contribution-flow/PayWithStripe';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { RadioGroup, RadioGroupCard } from '../ui/RadioGroup';
import { Skeleton } from '../ui/Skeleton';
import { toast } from '../ui/useToast';

type PayExpenseWithStripeProps = {
  expense: ExpenseReferenceInput & { type: Expense['type']; account: Pick<Expense['account'], 'slug'> };
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

  const [acknowledgeAdditionalUsage, setAcknowledgeAdditionalUsage] = React.useState(false);
  const [acknowledgeRenewal, setAcknowledgeRenewal] = React.useState(false);

  const {
    loading: loadingSavedPaymentMethods,
    data: paymentMethodsData,
    error: paymentMethodsQueryError,
  } = useQuery<AccountStripePaymentMethodsQuery, AccountStripePaymentMethodsQueryVariables>(paymentMethodsQuery, {
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

  let availableMethodLabels = (paymentIntent?.payment_method_types ?? []).map(method =>
    getStripePaymentMethodLabel(intl, method),
  );

  if (availableMethodLabels.length > 3) {
    availableMethodLabels = [...availableMethodLabels.slice(0, 3), 'etc'];
  }

  const needsPlatformBillingAcknowledges = props.expense.type === ExpenseType.PLATFORM_BILLING;

  const isPayButtonDisabled = React.useMemo(() => {
    const validPayoutMethod =
      selectedPaymentMethodId === 'new-payment-method'
        ? paymentElementData?.isCompleted
        : savedPaymentMethods.some(pm => pm.id === selectedPaymentMethodId);
    return (
      !validPayoutMethod || (needsPlatformBillingAcknowledges && (!acknowledgeAdditionalUsage || !acknowledgeRenewal))
    );
  }, [
    selectedPaymentMethodId,
    paymentElementData?.isCompleted,
    savedPaymentMethods,
    needsPlatformBillingAcknowledges,
    acknowledgeAdditionalUsage,
    acknowledgeRenewal,
  ]);

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

      {needsPlatformBillingAcknowledges && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="acknowledgeAdditionalUsage"
              checked={acknowledgeAdditionalUsage}
              disabled={isConfirmingPayment}
              onCheckedChange={checked => setAcknowledgeAdditionalUsage(Boolean(checked))}
            />
            <label
              htmlFor="acknowledgeAdditionalUsage"
              className="text-sm leading-none font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <FormattedMessage
                defaultMessage="I accept that additional charges may apply if I exceed plan limits."
                id="TK5atK"
              />
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="acknowledgeRenewal"
              disabled={isConfirmingPayment}
              checked={acknowledgeRenewal}
              onCheckedChange={checked => setAcknowledgeRenewal(Boolean(checked))}
            />
            <label
              htmlFor="acknowledgeRenewal"
              className="text-sm leading-none font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <FormattedMessage
                defaultMessage="I accept that my subscription will automatically renew unless I cancel before the renewal date."
                id="iB3QMn"
              />
            </label>
          </div>
        </div>
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
