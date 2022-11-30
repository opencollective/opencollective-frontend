import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Elements } from '@stripe/react-stripe-js';
import { themeGet } from '@styled-system/theme-get';
import { get, isEmpty, pick } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { Account, Host, Individual, PaymentMethodLegacyType } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { getStripe } from '../../lib/stripe';

import { Box, Flex } from '../Grid';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import NewCreditCardForm from '../NewCreditCardForm';
import StyledRadioList from '../StyledRadioList';
import { P } from '../Text';

import { PayWithStripeForm } from './PayWithStripe';
import { generatePaymentMethodOptions, NEW_CREDIT_CARD_KEY, STRIPE_PAYMENT_ELEMENT_KEY } from './utils';

const createPaymentIntentMutation = gql`
  mutation CreatePaymentIntent($paymentIntent: PaymentIntentInput!) {
    createPaymentIntent(paymentIntent: $paymentIntent) {
      id
      paymentIntentClientSecret
      stripeAccount
      stripeAccountPublishableSecret
    }
  }
`;

const paymentMethodsQuery = gql`
  query ContributionFlowPaymentMethods($slug: String) {
    account(slug: $slug) {
      id
      paymentMethods(
        enumType: [CREDITCARD, US_BANK_ACCOUNT, SEPA_DEBIT, GIFTCARD, PREPAID, COLLECTIVE]
        includeExpired: true
      ) {
        id
        name
        data
        service
        type
        expiryDate
        providerType
        sourcePaymentMethod {
          id
          name
          data
          service
          type
          expiryDate
          providerType
          balance {
            currency
          }
          limitedToHosts {
            id
            legacyId
            slug
          }
        }
        balance {
          valueInCents
          currency
        }
        account {
          id
          slug
          type
          name
          imageUrl
        }
        limitedToHosts {
          id
          legacyId
          slug
        }
      }
    }
  }
`;

const PaymentMethodBox = styled.div<{ index: number; disabled: boolean }>`
  display: flex;
  flex-direction: column;
  background: #ffffff;
  padding: 16px;

  ${props =>
    props.index &&
    css`
      border-top: 1px solid ${themeGet('colors.black.200')};
    `}
`;

type PaymentMethodListProps = {
  host: Host;
  toAccount: Account;
  fromAccount?: Individual;
  disabledPaymentMethodTypes: string[];
  stepSummary: object;
  stepDetails: { amount: number; currency: string };
  stepPayment: { key: string };
  isEmbed: boolean;
  isSubmitting: boolean;
  hideCreditCardPostalCode: boolean;
  onNewCardFormReady: () => void;
  onChange: (any) => void;
};

export default function PaymentMethodList(props: PaymentMethodListProps) {
  const { LoggedInUser } = useLoggedInUser();

  const {
    loading: loadingPaymentMethods,
    data: paymentMethodsData,
    error: paymentMethodsError,
  } = useQuery(paymentMethodsQuery, {
    variables: { slug: props.fromAccount.slug },
    context: API_V2_CONTEXT,
    skip: !props.fromAccount.slug,
    fetchPolicy: 'no-cache',
  });

  const [createPaymentIntent, { data: paymentIntentData, loading: loadingPaymentIntent, error: paymentIntentError }] =
    useMutation(createPaymentIntentMutation, {
      context: API_V2_CONTEXT,
      variables: {
        paymentIntent: {
          amount: { valueInCents: props.stepDetails.amount, currency: props.stepDetails.currency },
          fromAccount: props.fromAccount.isGuest
            ? undefined
            : typeof props.fromAccount.id === 'string'
            ? { id: props.fromAccount.id }
            : { legacyId: props.fromAccount.id },
          toAccount: pick(props.toAccount, 'id'),
        },
      },
      errorPolicy: 'all',
    });

  const {
    id: paymentIntentId,
    paymentIntentClientSecret,
    stripeAccountPublishableSecret,
    stripeAccount,
  } = paymentIntentData?.createPaymentIntent ?? {};

  const stripe = React.useMemo(() => {
    if (!stripeAccount) {
      return null;
    }

    return window.Stripe(stripeAccountPublishableSecret, stripeAccount ? { stripeAccount } : {});
  }, [stripeAccount]);

  const hostSupportedPaymentMethods = props.host?.supportedPaymentMethods ?? [];
  const hostHasStripe = hostSupportedPaymentMethods.includes(PaymentMethodLegacyType.CREDIT_CARD);
  const collectiveHasStripePaymentIntent = get(props.toAccount, 'settings.features.stripePaymentIntent', false)

  React.useEffect(() => {
    if (hostHasStripe && collectiveHasStripePaymentIntent) {
      createPaymentIntent();
    }
  }, [hostHasStripe]);

  const paymentMethodOptions = React.useMemo(() => {
    return generatePaymentMethodOptions(
      paymentMethodsData?.account?.paymentMethods ?? [],
      props.fromAccount,
      props.stepDetails,
      props.stepSummary,
      props.toAccount,
      props.isEmbed,
      props.disabledPaymentMethodTypes,
      stripeAccount,
    ) as any[];
  }, [
    paymentMethodsData?.account?.paymentMethods,
    props.fromAccount,
    props.stepDetails,
    props.stepSummary,
    props.toAccount,
    props.isEmbed,
    props.disabledPaymentMethodTypes,
    stripeAccount,
  ]);

  const loading = loadingPaymentMethods || (collectiveHasStripePaymentIntent && loadingPaymentIntent);
  const error = paymentMethodsError;

  const setNewPaymentMethod = React.useCallback(
    (key, paymentMethod) => {
      return props.onChange({
        stepPayment: {
          key,
          paymentMethod,
          stripeData: stripe
            ? {
                stripe,
                paymentIntentClientSecret,
              }
            : undefined,
        },
      });
    },
    [props.onChange, stripeAccount],
  );

  React.useEffect(() => {
    if (!loading && !props.stepPayment && !isEmpty(paymentMethodOptions)) {
      const firstOption = paymentMethodOptions.find(pm => !pm.disabled);
      if (firstOption) {
        setNewPaymentMethod(firstOption.key, { ...firstOption.paymentMethod, paymentIntentId });
      }
    }
  }, [paymentMethodOptions, props.stepPayment, loading]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  if (isEmpty(paymentMethodOptions)) {
    return (
      <MessageBox type="warning" withIcon>
        <FormattedMessage id="NewContribute.noPaymentMethodsAvailable" defaultMessage="No payment methods available." />
      </MessageBox>
    );
  }

  const list = (
    <StyledRadioList
      id="PaymentMethod"
      name="PaymentMethod"
      keyGetter="key"
      options={paymentMethodOptions}
      onChange={option => setNewPaymentMethod(option.key, { ...option.value.paymentMethod, paymentIntentId })}
      value={props.stepPayment?.key || null}
      disabled={props.isSubmitting}
      containerProps={undefined}
      labelProps={undefined}
      radioSize={undefined}
      data-cy="PaymentMethodList"
    >
      {({ radio, checked, index, value }) => (
        <PaymentMethodBox index={index} disabled={value.disabled}>
          <Flex alignItems="center" css={value.disabled ? 'filter: grayscale(1) opacity(50%);' : undefined}>
            <Box as="span" mr={3} flexWrap="wrap">
              {radio}
            </Box>
            <Flex mr={3} css={{ flexBasis: '26px' }}>
              {value.icon}
            </Flex>
            <Flex flexDirection="column">
              <P fontSize="15px" lineHeight="20px" fontWeight={400} color="black.900">
                {value.title}
              </P>
              {value.subtitle && (
                <P fontSize="12px" fontWeight={400} lineHeight="18px" color="black.500">
                  {value.subtitle}
                </P>
              )}
            </Flex>
          </Flex>
          {value.key === NEW_CREDIT_CARD_KEY && checked && (
            <Box my={3}>
              <Elements stripe={getStripe()}>
                <NewCreditCardForm
                  name={NEW_CREDIT_CARD_KEY}
                  profileType={props.fromAccount?.type}
                  hidePostalCode={props.hideCreditCardPostalCode}
                  onReady={props.onNewCardFormReady}
                  useLegacyCallback={false}
                  onChange={paymentMethod => setNewPaymentMethod(NEW_CREDIT_CARD_KEY, paymentMethod)}
                  error={get(props.stepPayment, 'paymentMethod?.stripeData?.error?.message')}
                  defaultIsSaved={!props.fromAccount?.isGuest}
                  hasSaveCheckBox={!props.fromAccount?.isGuest}
                />
              </Elements>
            </Box>
          )}
          {value.key === 'manual' && checked && value.instructions && (
            <Box my={3} color="black.600" fontSize="14px">
              {value.instructions}
            </Box>
          )}
          {value.key === STRIPE_PAYMENT_ELEMENT_KEY && checked && (
            <Box my={3}>
              <PayWithStripeForm
                bilingDetails={{
                  name: props.fromAccount?.name,
                  email: LoggedInUser?.email,
                }}
                paymentIntentId={paymentIntentId}
                paymentIntentClientSecret={paymentIntentClientSecret}
                onChange={props.onChange}
                defaultIsSaved={!props.fromAccount?.isGuest}
                hasSaveCheckBox={!props.fromAccount?.isGuest}
              />
            </Box>
          )}
        </PaymentMethodBox>
      )}
    </StyledRadioList>
  );

  const options = {
    clientSecret: paymentIntentClientSecret,
  };

  if (hostHasStripe && !paymentIntentError) {
    return (
      <Elements options={options} stripe={stripe}>
        {list}
      </Elements>
    );
  }

  return list;
}
