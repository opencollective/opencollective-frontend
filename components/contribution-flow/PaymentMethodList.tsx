import React from 'react';
import { useQuery } from '@apollo/client';
import { Elements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { themeGet } from '@styled-system/theme-get';
import { get, isEmpty, pick, set } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { getGQLV2FrequencyFromInterval } from '../../lib/constants/intervals';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import type { Account, CaptchaInput, Host, Individual } from '../../lib/graphql/types/v2/schema';
import { PaymentMethodLegacyType } from '../../lib/graphql/types/v2/schema';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { getStripe } from '../../lib/stripe';
import usePaymentIntent from '../../lib/stripe/usePaymentIntent';

import Captcha from '../Captcha';
import { Box, Flex } from '../Grid';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import NewCreditCardForm from '../NewCreditCardForm';
import StyledRadioList from '../StyledRadioList';
import { P } from '../Text';

import { PayWithStripeForm } from './PayWithStripe';
import {
  generatePaymentMethodOptions,
  getGuestInfoFromStepProfile,
  NEW_CREDIT_CARD_KEY,
  STRIPE_PAYMENT_ELEMENT_KEY,
} from './utils';

const paymentMethodsQuery = gql`
  query ContributionFlowPaymentMethods($slug: String) {
    account(slug: $slug) {
      id
      paymentMethods(
        type: [CREDITCARD, US_BANK_ACCOUNT, SEPA_DEBIT, BACS_DEBIT, GIFTCARD, PREPAID, COLLECTIVE]
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
  stepProfile: Pick<Individual, 'name' | 'legalName' | 'email' | 'location' | 'slug' | 'id' | 'type'> & {
    isGuest?: boolean;
    captcha?: CaptchaInput;
  };
  disabledPaymentMethodTypes: string[];
  stepSummary: object;
  stepDetails: { amount: number; currency: string; interval?: string };
  stepPayment: { key: string; isKeyOnly?: boolean; chargeAttempt: number };
  isEmbed: boolean;
  isSubmitting: boolean;
  hideCreditCardPostalCode: boolean;
  onNewCardFormReady: () => void;
  onChange: (any) => void;
};

export default function PaymentMethodList(props: PaymentMethodListProps) {
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();

  const {
    loading: loadingPaymentMethods,
    data: paymentMethodsData,
    error: paymentMethodsError,
  } = useQuery(paymentMethodsQuery, {
    variables: { slug: props.stepProfile.slug },
    context: API_V2_CONTEXT,
    skip: !props.stepProfile.slug,
    fetchPolicy: 'no-cache',
  });

  const hostSupportedPaymentMethods = props.host?.supportedPaymentMethods ?? [];
  const [paymentIntent, stripe, loadingPaymentIntent, paymentIntentCreateError] = usePaymentIntent({
    chargeAttempt: props.stepPayment?.chargeAttempt,
    skip: !hostSupportedPaymentMethods.includes(PaymentMethodLegacyType.PAYMENT_INTENT),
    amount: { valueInCents: props.stepDetails.amount, currency: props.stepDetails.currency },
    fromAccount: props.stepProfile.isGuest
      ? undefined
      : typeof props.stepProfile.id === 'string'
        ? { id: props.stepProfile.id }
        : { legacyId: props.stepProfile.id },
    guestInfo: props.stepProfile.isGuest ? getGuestInfoFromStepProfile(props.stepProfile) : undefined,
    toAccount: pick(props.toAccount, 'id'),
    frequency: getGQLV2FrequencyFromInterval(props.stepDetails.interval as any) as any,
  });

  const paymentMethodOptions = React.useMemo(() => {
    return generatePaymentMethodOptions(
      intl,
      paymentMethodsData?.account?.paymentMethods ?? [],
      props.stepProfile,
      props.stepDetails,
      props.stepSummary,
      props.toAccount,
      props.isEmbed,
      props.disabledPaymentMethodTypes,
      paymentIntent,
    ) as any[];
  }, [
    paymentMethodsData?.account?.paymentMethods,
    props.stepProfile,
    props.stepDetails,
    props.stepSummary,
    props.toAccount,
    props.isEmbed,
    props.disabledPaymentMethodTypes,
    paymentIntent,
    intl,
  ]);

  const loading = loadingPaymentMethods || loadingPaymentIntent;
  const error = paymentMethodsError;

  const setNewPaymentMethod = React.useCallback(
    (key, paymentMethod) => {
      return props.onChange({
        stepPayment: {
          key,
          paymentMethod,
          stripeData: paymentIntent
            ? {
                stripe,
                paymentIntentClientSecret: paymentIntent.client_secret,
              }
            : undefined,
        },
      });
    },
    [props.onChange, stripe, paymentIntent],
  );

  React.useEffect(() => {
    if (loading) {
      return;
    } else if (isEmpty(paymentMethodOptions)) {
      return props.onChange({ stepPayment: null });
    }

    if (!props.stepPayment || props.stepPayment.isKeyOnly) {
      // Select the option given in URL if it's available, otherwise select the first available option
      const keyToSelect = props.stepPayment?.key;
      const newOption = paymentMethodOptions.find(pm => !pm.disabled && (!keyToSelect || pm.key === keyToSelect));
      if (newOption) {
        setNewPaymentMethod(newOption.key, { ...newOption.paymentMethod, paymentIntentId: paymentIntent?.id });
      } else if (props.stepPayment) {
        props.onChange({ stepPayment: null }); // Make sure we unselect the option if it's not available
      }
    }
  }, [paymentMethodOptions, props.stepPayment, loading, paymentIntent]);

  const onCaptchaResult = React.useCallback(
    result => {
      if (result) {
        props.onChange({ stepProfile: set({ ...props.stepProfile }, 'captcha', result) });
      }
    },
    [props.onChange, props.stepProfile],
  );

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  if (paymentIntentCreateError?.message?.toLowerCase().includes('captcha')) {
    return (
      <div>
        <MessageBox type="warning" withIcon>
          <FormattedMessage
            id="NewContribute.completeCaptchToContinue"
            defaultMessage="Complete the captcha form to continue"
          />
        </MessageBox>
        <Flex mt="18px" justifyContent="center">
          <Captcha onVerify={onCaptchaResult} />
        </Flex>
      </div>
    );
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
      onChange={option =>
        setNewPaymentMethod(option.key, { ...option.value.paymentMethod, paymentIntentId: paymentIntent?.id })
      }
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
                  profileType={props.stepProfile?.type}
                  hidePostalCode={props.hideCreditCardPostalCode}
                  onReady={props.onNewCardFormReady}
                  useLegacyCallback={false}
                  onChange={paymentMethod => setNewPaymentMethod(NEW_CREDIT_CARD_KEY, paymentMethod)}
                  error={get(props.stepPayment, 'paymentMethod?.stripeData?.error?.message')}
                  defaultIsSaved={!props.stepProfile?.isGuest}
                  hasSaveCheckBox={!props.stepProfile?.isGuest}
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
                  name: props.stepProfile?.name,
                  email: LoggedInUser?.email ?? props?.stepProfile?.email,
                }}
                paymentIntentId={paymentIntent.id}
                paymentIntentClientSecret={paymentIntent.client_secret}
                onChange={props.onChange}
                defaultIsSaved={!props.stepProfile?.isGuest}
                hasSaveCheckBox={!props.stepProfile?.isGuest}
              />
            </Box>
          )}
        </PaymentMethodBox>
      )}
    </StyledRadioList>
  );

  if (paymentIntent && stripe) {
    const options: StripeElementsOptions = {
      clientSecret: paymentIntent.client_secret,
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

    return (
      <Elements options={options} stripe={stripe}>
        {list}
      </Elements>
    );
  }

  return list;
}
