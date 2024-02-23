import React from 'react';
import { useQuery } from '@apollo/client';
import type {
  PaymentIntent,
  Stripe,
  StripeElements,
  StripePaymentElement,
  StripePaymentElementChangeEvent,
} from '@stripe/stripe-js';
import { CreditCard } from '@styled-icons/fa-solid/CreditCard';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import type {
  Account,
  Host,
  Order,
  PaymentMethod,
  PaymentMethodPickerQuery,
  PaymentMethodType,
} from '../../lib/graphql/types/v2/graphql';
import { PaymentMethodLegacyType, PaymentMethodService } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { getPaymentMethodName } from '../../lib/payment_method_label';
import {
  getPaymentMethodIcon,
  getPaymentMethodMetadata,
  isPaymentMethodDisabled,
} from '../../lib/payment-method-utils';
import { isStripePaymentMethodEnabledForCurrency, StripePaymentMethodsLabels } from '../../lib/stripe/payment-methods';
import type { StripeSetupIntent } from '../../lib/stripe/useSetupIntent';
import useSetupIntent from '../../lib/stripe/useSetupIntent';

import PayPal from '../icons/PayPal';
import Loading from '../Loading';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';

const paymentMethodPickerQuery = gql`
  query PaymentMethodPicker($accountSlug: String!, $hostSlug: String!) {
    account(slug: $accountSlug) {
      id
      name
      paymentMethods(type: [CREDITCARD, US_BANK_ACCOUNT, SEPA_DEBIT, BACS_DEBIT, GIFTCARD, PREPAID, COLLECTIVE]) {
        id
        name
        data
        service
        type
        account {
          id
          name
          slug
        }
        balance {
          value
          valueInCents
          currency
        }
        limitedToHosts {
          id
        }
        sourcePaymentMethod {
          id
          limitedToHosts {
            id
          }
        }
      }
    }
    host(slug: $hostSlug) {
      id
      paypalClientId
      supportedPaymentMethods
    }
  }
`;

type PaymentMethodPickerProps = {
  className?: string;
  value: PaymentMethodOption;
  onChange: (option: PaymentMethodOption) => void;
  host: Pick<Host, 'slug'>;
  account: Pick<Account, 'slug'>;
  order?: Pick<Order, 'id' | 'totalAmount'>;
};

export type PaymentMethodOption =
  | {
      id: 'stripe-payment-element';
      stripe?: Stripe;
      elements?: StripeElements;
      paymentElement?: StripePaymentElement;
      setupIntent?: StripeSetupIntent;
    }
  | {
      id: 'pay-with-paypal';
    }
  | {
      id: string;
      name?: string;
      type?: PaymentMethodType;
    };

export default function PaymentMethodPicker(props: PaymentMethodPickerProps) {
  const [error, setError] = React.useState();
  const query = useQuery<PaymentMethodPickerQuery>(paymentMethodPickerQuery, {
    context: API_V2_CONTEXT,
    variables: {
      hostSlug: props.host?.slug,
      accountSlug: props.account?.slug,
    },
    skip: !props.host || !props.account,
    fetchPolicy: 'network-only',
  });

  const hostHasStripe = query.data?.host?.supportedPaymentMethods?.includes(PaymentMethodLegacyType.CREDIT_CARD);

  const savedMethods = React.useMemo(() => {
    if (!query.data?.account?.paymentMethods) {
      return [];
    }

    return query.data.account.paymentMethods.filter(
      paymentMethodFilter({
        host: query.data.host,
        currency: props.order?.totalAmount?.currency,
      }),
    );
  }, [query?.data?.host, query?.data?.account?.paymentMethods]);

  const onChange = React.useCallback(
    (option: PaymentMethodOption) => {
      props.onChange(option);
    },
    [props.onChange],
  );

  if (query.loading) {
    return <Loading />;
  }

  if (query.error || error) {
    return <MessageBoxGraphqlError error={query.error || error} />;
  }

  return (
    <form action="#">
      <fieldset className={clsx(props.className)}>
        <div className="flex flex-col gap-3">
          {hostHasStripe && (
            <StripeSetupPaymentMethodOption
              amount={props.order?.totalAmount?.valueInCents}
              currency={props.order?.totalAmount?.currency}
              onChange={onChange}
              checked={props.value.id === 'stripe-payment-element'}
              host={props.host}
              account={props.account}
              onError={err => setError(err)}
            />
          )}
          {savedMethods.map(pm => {
            return (
              <div key={pm.id}>
                <label
                  className={clsx('flex items-center', {
                    grayscale: isPaymentMethodDisabled(pm, props.order?.totalAmount?.valueInCents ?? 0),
                  })}
                >
                  <input
                    onChange={() =>
                      onChange({
                        id: pm.id,
                        type: pm.type,
                        name: pm.name,
                      })
                    }
                    className="mr-3"
                    disabled={isPaymentMethodDisabled(pm, props.order?.totalAmount?.valueInCents ?? 0)}
                    type="radio"
                    name="paymentMethod"
                    value={pm.id}
                    checked={props.value.id === pm.id}
                  />
                  <div className="mr-3 w-7 text-center">{getPaymentMethodIcon(pm, pm.account, 24)}</div>
                  <div>
                    <p className="text-xs font-semibold leading-5 text-black">{getPaymentMethodName(pm as any)}</p>
                    {getPaymentMethodMetadata(pm, props.order?.totalAmount?.valueInCents) && (
                      <p className="text-xs font-normal leading-4 text-gray-400">
                        {getPaymentMethodMetadata(pm, props.order?.totalAmount?.valueInCents)}
                      </p>
                    )}
                  </div>
                </label>
              </div>
            );
          })}
          {props.order && query.data?.host?.paypalClientId && (
            <PayPalSetupOption onChange={onChange} checked={props.value.id === 'pay-with-paypal'} />
          )}
        </div>
      </fieldset>
    </form>
  );
}

type StripeSetupPaymentMethodOptionProps = {
  onChange: (option: PaymentMethodOption) => void;
  checked: boolean;
  host: Pick<Host, 'slug'>;
  account: Pick<Account, 'slug' | 'name'>;
  currency: string;
  amount: number;
  onError?: (err) => void;
};

function StripeSetupPaymentMethodOption(props: StripeSetupPaymentMethodOptionProps) {
  const elementContainer = React.useRef<HTMLDivElement>();
  const inputRef = React.useRef<HTMLInputElement>();
  const intl = useIntl();
  const [paymentMethodType, setPaymentMethodType] = React.useState<string>();
  const { LoggedInUser } = useLoggedInUser();
  const [setupIntent, stripe, setupIntentLoading, error] = useSetupIntent({
    host: {
      slug: props.host.slug,
    },
    account: {
      slug: props.account.slug,
    },
  });

  React.useEffect(() => {
    props?.onError?.(error);
  }, [error, props?.onError]);

  const [elements, paymentElement] = React.useMemo(() => {
    if (!stripe || !setupIntent) {
      return [null, null];
    }

    const elements = stripe.elements({
      mode: 'setup',
      paymentMethodConfiguration:
        (setupIntent as any).payment_method_configuration_details?.id ||
        (setupIntent as any).payment_method_configuration_details?.parent,
      currency: props.currency.toLowerCase(),
    });

    const paymentElement = elements.create('payment', {
      paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
      terms: {
        bancontact: 'always',
        card: 'always',
        ideal: 'always',
        sepaDebit: 'always',
        sofort: 'always',
        auBecsDebit: 'always',
        usBankAccount: 'always',
      },
    });

    return [elements, paymentElement];
  }, [stripe, setupIntent]);

  React.useEffect(() => {
    paymentElement?.update({
      defaultValues: {
        billingDetails: {
          name: props.account?.name,
          email: LoggedInUser?.email,
        },
      },
    });
  }, [paymentElement, props.account?.name, LoggedInUser?.email]);

  React.useEffect(() => {
    if (props.checked) {
      paymentElement?.mount(elementContainer.current);
    }
    return () => paymentElement?.unmount();
  }, [paymentElement, props.checked]);

  React.useEffect(() => {
    (inputRef.current as any).stripeElements = elements;
    (inputRef.current as any).paymentElement = paymentElement;
  }, [paymentElement, elements, inputRef.current]);

  React.useEffect(() => {
    function onChange(e: StripePaymentElementChangeEvent) {
      setPaymentMethodType(e.value.type);
      props.onChange({
        id: 'stripe-payment-element',
        type: e.value.type as PaymentMethodType,
        elements,
        paymentElement,
        stripe,
        setupIntent,
      });
    }

    paymentElement?.on('change', onChange);
    return () => {
      paymentElement?.off('change', onChange);
    };
  }, [stripe, paymentElement, elements, setupIntent, props.onChange]);

  const availableMethodLabels = React.useMemo(() => {
    if (!setupIntent?.payment_method_types) {
      return [];
    }

    let types = setupIntent.payment_method_types
      .filter(t => isStripePaymentMethodEnabledForCurrency(t, props.currency))
      .map(method => {
        return intl.formatMessage(StripePaymentMethodsLabels[method]);
      });

    if (types.length > 3) {
      types = [...types.slice(0, 3), 'etc'];
    }

    return types;
  }, [intl, setupIntent?.payment_method_types, props.currency]);

  return (
    <div>
      <label
        className={clsx('flex items-center', {
          grayscale: setupIntentLoading || !setupIntent,
        })}
      >
        <input
          ref={inputRef}
          onChange={() => {
            props.onChange({
              id: 'stripe-payment-element',
              elements,
              paymentElement,
            });
          }}
          className="mr-3"
          type="radio"
          name="paymentMethod"
          value="stripe-payment-element"
          checked={props.checked}
          disabled={setupIntentLoading || !setupIntent}
        />
        {props.checked && <input type="hidden" name="paymentMethodType" value={paymentMethodType} />}
        <div className="mr-3 w-7 text-center">
          <CreditCard color="#c9ced4" size={24} />
        </div>
        <div>
          <p className="text-xs font-semibold leading-5 text-black">
            <FormattedMessage defaultMessage="New payment method" />
          </p>
          <p className="text-xs font-normal leading-4 text-gray-400">
            {availableMethodLabels && availableMethodLabels.length > 0 ? (
              availableMethodLabels.join(', ')
            ) : (
              <LoadingPlaceholder height="14px" />
            )}
          </p>
        </div>
      </label>
      <div ref={elementContainer} className={clsx({ 'mt-3': props.checked })} />
    </div>
  );
}

type PayPalSetupOptionProps = {
  checked: boolean;
  onChange: (_: PaymentMethodOption) => void;
};

function PayPalSetupOption(props: PayPalSetupOptionProps) {
  return (
    <div>
      <label className="flex items-center">
        <input
          onChange={() =>
            props.onChange({
              id: 'pay-with-paypal',
            })
          }
          className="mr-3"
          type="radio"
          name="paymentMethod"
          value="pay-with-paypal"
          checked={props.checked}
        />
        <div className="mr-3 w-7 text-center">
          <PayPal size={24} />
        </div>
        <div>
          <p className="text-xs font-semibold leading-5 text-black">
            <FormattedMessage id="PayoutMethod.Type.Paypal" defaultMessage="PayPal" />
          </p>
        </div>
      </label>
    </div>
  );
}

type PaymentMethodFilterOptions = {
  host?: Pick<Host, 'id' | 'supportedPaymentMethods'>;
  paymentIntent?: Pick<PaymentIntent, 'payment_method_types'>;
  disabledMethodTypes?: PaymentMethodType[];
  currency?: string;
};

function paymentMethodFilter(options: PaymentMethodFilterOptions): (pm: PaymentMethod) => boolean {
  return (pm: PaymentMethod) => {
    const sourcePaymentMethod = pm.sourcePaymentMethod || pm;
    const limitedToHosts = sourcePaymentMethod.limitedToHosts || [];
    const disabledMethodTypes = options.disabledMethodTypes || [];

    if (options.host && limitedToHosts.length > 0 && !pm.limitedToHosts.some(host => host.id === options.host.id)) {
      return false;
    }

    if (
      options.host &&
      pm.service === PaymentMethodService.STRIPE &&
      !options.host.supportedPaymentMethods.includes(PaymentMethodLegacyType.CREDIT_CARD)
    ) {
      return false;
    }

    if (options.paymentIntent && pm.service === PaymentMethodService.STRIPE) {
      const stripeAllowedTypes = [...options.paymentIntent.payment_method_types];
      if (stripeAllowedTypes.includes('card')) {
        // we store this type with a different name
        stripeAllowedTypes.push('credit_card');
      }

      if (!stripeAllowedTypes.includes(pm.type.toLowerCase())) {
        return false;
      }
    }

    if (
      options.currency &&
      pm.service === PaymentMethodService.STRIPE &&
      !isStripePaymentMethodEnabledForCurrency(pm.type, options.currency)
    ) {
      return false;
    }

    if (disabledMethodTypes.length > 0) {
      if (!disabledMethodTypes.some(t => t.toLowerCase() === pm.type.toLowerCase())) {
        return false;
      }
    }

    return true;
  };
}
