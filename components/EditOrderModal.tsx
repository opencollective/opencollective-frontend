import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useFormik } from 'formik';
import { get, startCase } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { PAYMENT_METHOD_SERVICE } from '../lib/constants/payment-methods';
import { formatCurrency } from '../lib/currency-utils';
import { getIntervalFromContributionFrequency } from '../lib/date-utils';
import { getErrorFromGraphqlException, i18nGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT, gql } from '../lib/graphql/helpers';
import type {
  AccountReferenceInput,
  EditPaymentMethodModalQuery,
  PaymentMethod,
  SetupIntentInput,
} from '../lib/graphql/types/v2/graphql';
import { DEFAULT_MINIMUM_AMOUNT } from '../lib/tier-utils';

import type { PaymentMethodOption } from './orders/PaymentMethodPicker';
import PaymentMethodPicker from './orders/PaymentMethodPicker';
import { getSubscriptionStartDate } from './recurring-contributions/AddPaymentMethod';
import {
  ContributionInterval,
  tiersQuery,
  useContributeOptions,
  useUpdateOrder,
} from './recurring-contributions/UpdateOrderPopUp';
import { useUpdatePaymentMethod } from './recurring-contributions/UpdatePaymentMethodPopUp';
import { toast, useToast } from './ui/useToast';
import FormattedMoneyAmount from './FormattedMoneyAmount';
import { Box, Flex } from './Grid';
import I18nFormatters from './I18nFormatters';
import Loading from './Loading';
import LoadingPlaceholder from './LoadingPlaceholder';
import PayWithPaypalButton from './PayWithPaypalButton';
import StyledButton from './StyledButton';
import StyledInputAmount from './StyledInputAmount';
import StyledModal, { ModalBody, ModalHeader } from './StyledModal';
import StyledRadioList from './StyledRadioList';
import StyledSelect from './StyledSelect';
import StyledTextarea from './StyledTextarea';
import { H4, P, Span } from './Text';

const i18nReasons = defineMessages({
  NO_LONGER_WANT_TO_SUPPORT: {
    id: 'subscription.cancel.reason1',
    defaultMessage: 'No longer want to back the collective',
  },
  UPDATING_ORDER: { id: 'subscription.cancel.reason2', defaultMessage: 'Changing payment method or amount' },
  OTHER: { id: 'subscription.cancel.other', defaultMessage: 'Other' },
});

export type EditOrderActions = 'cancel' | 'editAmount' | 'editPaymentMethod';

type EditOrderModalProps = {
  onClose: () => void;
  order: any;
  accountSlug: string;
  action: EditOrderActions;
};

const cancelRecurringContributionMutation = gql`
  mutation CancelRecurringContribution($order: OrderReferenceInput!, $reason: String!, $reasonCode: String!) {
    cancelOrder(order: $order, reason: $reason, reasonCode: $reasonCode) {
      id
      status
    }
  }
`;

const CancelModal = (props: Omit<EditOrderModalProps, 'action'>) => {
  const intl = useIntl();

  const [submitCancellation] = useMutation(cancelRecurringContributionMutation, {
    context: API_V2_CONTEXT,
  });

  const onSubmit = async values => {
    try {
      await submitCancellation({
        variables: values,
      });
      props.onClose();
      toast({
        message: (
          <FormattedMessage
            id="subscription.createSuccessCancel"
            defaultMessage="Your recurring contribution has been <strong>cancelled</strong>."
            values={I18nFormatters}
          />
        ),
      });
    } catch (error) {
      const errorMsg = getErrorFromGraphqlException(error).message;
      toast({ variant: 'error', message: errorMsg });
    }
  };
  const formik = useFormik({
    onSubmit,
    initialValues: { order: { id: props.order.id }, reason: '', reasonCode: 'NO_LONGER_WANT_TO_SUPPORT' },
  });

  return (
    <StyledModal onClose={props.onClose} maxWidth="420px">
      <ModalHeader onClose={props.onClose}>
        <H4 fontSize="20px" fontWeight="700">
          <FormattedMessage id="subscription.menu.cancelContribution" defaultMessage="Cancel contribution" />
        </H4>
      </ModalHeader>
      <ModalBody as="form" onSubmit={formik.handleSubmit as () => void} mb={0}>
        <P fontSize="15px" mb="10" lineHeight="20px">
          <FormattedMessage
            id="subscription.cancel.question"
            defaultMessage="Why are you cancelling your subscription today? 🥺"
          />
        </P>
        <StyledRadioList
          id="reasonCode"
          name="reasonCode"
          defaultValue="NO_LONGER_WANT_TO_SUPPORT"
          options={['NO_LONGER_WANT_TO_SUPPORT', 'UPDATING_ORDER', 'OTHER']}
          onChange={({ value, name }) => formik.setFieldValue(name, value)}
          value={formik.values.reasonCode}
          data-cy="cancel-reason"
        >
          {({ value, radio }) => (
            <Box data-cy={value} my={1} fontSize="13px" fontWeight={400}>
              <Span mx={2}>{radio}</Span>
              <Span>{intl.formatMessage(i18nReasons[value])}</Span>
            </Box>
          )}
        </StyledRadioList>
        {formik.values.reasonCode === 'OTHER' && (
          <StyledTextarea
            name="reason"
            fontSize="12px"
            placeholder={intl.formatMessage({ defaultMessage: 'Provide more details (optional)' })}
            height={70}
            width="100%"
            resize="none"
            onChange={formik.handleChange}
            value={formik.values.reason}
            mt={2}
          />
        )}

        <Flex flexWrap="wrap" justifyContent="space-evenly" mt={3}>
          <StyledButton width="100%" m={1} type="submit" loading={formik.isSubmitting}>
            <FormattedMessage id="submit" defaultMessage="Submit" />
          </StyledButton>
        </Flex>
      </ModalBody>
    </StyledModal>
  );
};

const EditAmountModal = (props: Omit<EditOrderModalProps, 'action'>) => {
  const OTHER_LABEL = 'Other';
  // GraphQL mutations and queries
  const queryVariables = { slug: props.order.toAccount.slug };
  const { data, loading: tiersLoading } = useQuery(tiersQuery, { variables: queryVariables, context: API_V2_CONTEXT });

  // state management
  const { locale } = useIntl();
  const { isSubmittingOrder, updateOrder } = useUpdateOrder({ contribution: props.order, onSuccess: props.onClose });
  const tiers = get(data, 'account.tiers.nodes', null);
  const disableCustomContributions = get(data, 'account.settings.disableCustomContributions', false);
  const contributeOptionsState = useContributeOptions(props.order, tiers, tiersLoading, disableCustomContributions);
  const {
    amountOptions,
    inputAmountValue,
    contributeOptions,
    selectedContributeOption,
    selectedAmountOption,
    setInputAmountValue,
    setSelectedContributeOption,
  } = contributeOptionsState;
  const selectedTier = selectedContributeOption?.isCustom ? null : selectedContributeOption;
  const isPaypal = props.order.paymentMethod.service === PAYMENT_METHOD_SERVICE.PAYPAL;
  const tipAmount = props.order.platformTipAmount?.valueInCents || 0;
  const newAmount = selectedAmountOption?.label === OTHER_LABEL ? inputAmountValue : selectedAmountOption?.value;
  const newTotalAmount = newAmount + tipAmount; // For now tip can't be updated, we're just carrying it over

  // When we change the amount option (One of the presets or Other)
  const setSelectedAmountOption = ({ label, value }) => {
    // Always set "Other" input value to the last one selected
    // "Other" itself doesn't have a pre-defined value
    if (label !== OTHER_LABEL) {
      setInputAmountValue(value);
    }
    contributeOptionsState.setSelectedAmountOption({ label, value });
  };

  return (
    <StyledModal onClose={props.onClose} maxWidth="420px">
      <ModalHeader onClose={props.onClose}>
        <H4 fontSize="20px" fontWeight="700">
          <FormattedMessage id="subscription.menu.updateTier" defaultMessage="Update tier" />
        </H4>
      </ModalHeader>
      <ModalBody mb={0}>
        <P fontSize="15px" mb="10" lineHeight="20px">
          <FormattedMessage
            id="subscription.updateTier.subheader"
            defaultMessage="Pick an existing tier or enter a custom amount."
          />
        </P>
        {tiersLoading || contributeOptionsState.loading ? (
          <LoadingPlaceholder height={100} />
        ) : (
          <StyledRadioList
            id="ContributionTier"
            name={`${props.order.id}-ContributionTier`}
            keyGetter="key"
            options={contributeOptions}
            onChange={({ value }) => setSelectedContributeOption(value)}
            value={selectedContributeOption?.key}
          >
            {({
              radio,
              checked,
              value: { id, title, subtitle, amount, flexible, currency, interval, minimumAmount },
            }) => (
              <Flex my={2} bg="white.full" data-cy="recurring-contribution-tier-box">
                <Box as="span" mr={3} flexWrap="wrap">
                  {radio}
                </Box>
                <Flex flexDirection="column">
                  <P fontWeight={subtitle ? 600 : 400} color="black.900">
                    {startCase(title)}
                  </P>
                  {checked && flexible ? (
                    <React.Fragment>
                      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
                      <div onClick={e => e.preventDefault()}>
                        <StyledSelect
                          inputId={`tier-amount-select-${props.order.id}`}
                          data-cy="tier-amount-select"
                          onChange={setSelectedAmountOption}
                          value={selectedAmountOption}
                          options={amountOptions}
                          my={2}
                          minWidth={150}
                          isSearchable={false}
                        />
                      </div>
                      <ContributionInterval contribution={props.order} tier={{ id, interval }} />
                      {selectedAmountOption?.label === OTHER_LABEL && (
                        <Flex flexDirection="column">
                          <P fontSize="12px" fontWeight="600" my={2}>
                            <FormattedMessage id="RecurringContributions.customAmount" defaultMessage="Custom amount" />
                          </P>
                          <Box>
                            <StyledInputAmount
                              type="number"
                              data-cy="recurring-contribution-custom-amount-input"
                              currency={currency}
                              value={inputAmountValue}
                              onChange={setInputAmountValue}
                              min={DEFAULT_MINIMUM_AMOUNT}
                              px="2px"
                            />
                          </Box>
                          <P fontSize="12px" fontWeight="600" my={2}>
                            <FormattedMessage
                              defaultMessage="Min. amount: {minAmount}"
                              id="RecurringContributions.minAmount"
                              values={{
                                minAmount: formatCurrency(minimumAmount, currency, { locale }),
                              }}
                            />
                          </P>
                        </Flex>
                      )}
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      {flexible && (
                        <P fontSize="12px" fontWeight={400} lineHeight="18px" color="black.500">
                          <FormattedMessage id="ContributeTier.StartsAt" defaultMessage="Starts at" />
                        </P>
                      )}
                      <P fontWeight={400} color="black.900">
                        <FormattedMoneyAmount amount={amount} interval={interval.toLowerCase()} currency={currency} />
                      </P>
                    </React.Fragment>
                  )}
                </Flex>
              </Flex>
            )}
          </StyledRadioList>
        )}
        <Flex flexWrap="wrap" justifyContent="space-between" mt={4}>
          {isPaypal && selectedAmountOption ? (
            <PayWithPaypalButton
              isSubmitting={isSubmittingOrder}
              totalAmount={newTotalAmount}
              currency={props.order.amount.currency}
              interval={
                selectedContributeOption?.interval || getIntervalFromContributionFrequency(props.order.frequency)
              }
              host={props.order.toAccount.host}
              collective={props.order.toAccount}
              tier={selectedTier}
              style={{ height: 47, size: 'responsive' }}
              subscriptionStartDate={getSubscriptionStartDate(props.order)}
              onError={e => toast({ variant: 'error', title: e.message })}
              onSuccess={({ subscriptionId }) =>
                updateOrder(selectedTier, selectedAmountOption, inputAmountValue, subscriptionId)
              }
            />
          ) : (
            <StyledButton
              buttonStyle="secondary"
              loading={isSubmittingOrder}
              data-cy="recurring-contribution-update-order-button"
              onClick={() => updateOrder(selectedTier, selectedAmountOption, inputAmountValue)}
              width="100%"
            >
              <FormattedMessage id="actions.update" defaultMessage="Update" />
            </StyledButton>
          )}
        </Flex>
      </ModalBody>
    </StyledModal>
  );
};

function EditPaymentMethodModal(props: EditOrderModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const intl = useIntl();
  const [option, setOption] = React.useState<PaymentMethodOption>({
    id: props.order?.paymentMethod?.id,
    name: props.order?.paymentMethod?.name,
    type: props.order?.paymentMethod?.type,
  });

  const query = useQuery<EditPaymentMethodModalQuery>(
    gql`
      query EditPaymentMethodModal($order: OrderReferenceInput!) {
        order(order: $order) {
          id
          totalAmount {
            currency
            valueInCents
          }
          fromAccount {
            id
            slug
          }
          toAccount {
            id
            slug
            ... on AccountWithHost {
              host {
                id
                slug
                paypalClientId
                supportedPaymentMethods
              }
            }
            ... on Organization {
              host {
                id
                slug
                paypalClientId
                supportedPaymentMethods
              }
            }
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        order: {
          id: props.order.id,
        },
      },
      skip: !props.order.id,
    },
  );

  const order = query.data?.order;

  const [addStripePaymentMethodFromSetupIntent, { loading }] = useMutation<
    { addStripePaymentMethodFromSetupIntent: PaymentMethod },
    { account?: AccountReferenceInput; setupIntent?: SetupIntentInput }
  >(
    gql`
      mutation AddStripePaymentMethodFromSetupIntent(
        $setupIntent: SetupIntentInput!
        $account: AccountReferenceInput!
      ) {
        addStripePaymentMethodFromSetupIntent(setupIntent: $setupIntent, account: $account) {
          id
          type
          name
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        account: {
          slug: props.accountSlug,
        },
      },
    },
  );

  const { isSubmitting: isSubmittingUpdate, updatePaymentMethod } = useUpdatePaymentMethod(props.order);

  const isUpdatingPaymentMethod = isSubmittingUpdate || loading;

  const onSaveClick = React.useCallback(async () => {
    let paymentMethodId;

    if (option.id === 'stripe-payment-element' && 'stripe' in option) {
      const res = await option.elements.submit();
      if (res.error) {
        toast({ variant: 'error', message: res.error.message });
        props.onClose();
        return;
      }

      const returnUrl = new URL(`${window.location.origin}/${props.accountSlug}/admin/outgoing-contributions`);
      returnUrl.searchParams.set('orderId', props.order.id);
      returnUrl.searchParams.set('stripeAccount', option.setupIntent.stripeAccount);
      returnUrl.searchParams.set('action', 'editPaymentMethod');

      const setupResponse = await option.stripe.confirmSetup({
        clientSecret: option.setupIntent.client_secret,
        elements: option.elements,
        redirect: 'if_required',
        confirmParams: {
          expand: ['payment_method'],
          // eslint-disable-next-line camelcase
          return_url: returnUrl.href,
        },
      });
      if (setupResponse.error) {
        toast({ variant: 'error', message: setupResponse.error.message });
        props.onClose();
        return;
      }

      try {
        const paymentMethodResponse = await addStripePaymentMethodFromSetupIntent({
          variables: {
            setupIntent: {
              id: option.setupIntent.id,
              stripeAccount: option.setupIntent.stripeAccount,
            },
          },
        });
        paymentMethodId = paymentMethodResponse.data.addStripePaymentMethodFromSetupIntent.id;
      } catch (e) {
        toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        return;
      }
    } else {
      paymentMethodId = option.id;
    }

    await updatePaymentMethod({ id: paymentMethodId });
    props.onClose();
  }, [option, props.onClose, intl]);

  const onPaypalSubscription = React.useCallback(
    async paypalSubscriptionId => {
      await updatePaymentMethod({
        service: PAYMENT_METHOD_SERVICE.PAYPAL,
        paypalInfo: { subscriptionId: paypalSubscriptionId },
      });
      props.onClose();
    },
    [props.onClose],
  );

  React.useEffect(() => {
    async function onPaymentMethodSetup() {
      try {
        const response = await addStripePaymentMethodFromSetupIntent({
          variables: {
            setupIntent: {
              id: router.query.setup_intent as string,
              stripeAccount: router.query.stripeAccount as string,
            },
            account: {
              slug: props.accountSlug,
            },
          },
        });
        setOption({
          id: response.data.addStripePaymentMethodFromSetupIntent.id,
          name: response.data.addStripePaymentMethodFromSetupIntent.name,
          type: response.data.addStripePaymentMethodFromSetupIntent.type,
        });
      } catch (e) {
        toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        return;
      }
      // props.onClose();
    }

    if (
      router.query.orderId &&
      router.query.stripeAccount &&
      router.query.setup_intent &&
      router.query.redirect_status === 'succeeded'
    ) {
      onPaymentMethodSetup();
    }
  }, [router.query.orderId, router.query.stripeAccount, router.query.setup_intent, router.query.redirect_status]);

  return (
    <StyledModal onClose={props.onClose} maxWidth="480px" width="100%">
      <ModalHeader onClose={props.onClose}>
        <H4 fontSize="20px" fontWeight="700">
          <FormattedMessage id="subscription.menu.editPaymentMethod" defaultMessage="Update payment method" />
        </H4>
      </ModalHeader>
      <ModalBody mb={0}>
        <P fontSize="15px" mb="10" lineHeight="20px">
          <FormattedMessage
            id="subscription.updatePaymentMethod.subheader"
            defaultMessage="Pick an existing payment method or add a new one."
          />
        </P>
        {!order ? (
          <Loading />
        ) : (
          <PaymentMethodPicker
            className="mt-3"
            value={option}
            onChange={setOption}
            order={order}
            host={order.toAccount && 'host' in order.toAccount ? order.toAccount.host : null}
            account={order?.fromAccount}
          />
        )}
        <Flex flexWrap="wrap" justifyContent="space-between" mt={4}>
          {option.id === 'pay-with-paypal' ? (
            <PayWithPaypalButton
              totalAmount={props.order.totalAmount.valueInCents}
              currency={props.order.totalAmount.currency}
              interval={getIntervalFromContributionFrequency(props.order.frequency)}
              host={props.order.toAccount.host}
              collective={props.order.toAccount}
              tier={props.order.tier}
              style={{ height: 45, size: 'small' }}
              subscriptionStartDate={getSubscriptionStartDate(props.order)}
              isSubmitting={isUpdatingPaymentMethod}
              onError={e => toast({ variant: 'error', title: e.message })}
              onSuccess={({ subscriptionId }) => {
                onPaypalSubscription(subscriptionId);
              }}
            />
          ) : (
            <StyledButton
              buttonSize="tiny"
              buttonStyle="secondary"
              type="submit"
              data-cy="recurring-contribution-submit-pm-button"
              onClick={onSaveClick}
              loading={isUpdatingPaymentMethod}
            >
              <FormattedMessage id="save" defaultMessage="Save" />
            </StyledButton>
          )}
        </Flex>
      </ModalBody>
    </StyledModal>
  );
}

const EditOrderModal = (props: EditOrderModalProps) => {
  if (props.action === 'cancel') {
    return <CancelModal {...props} />;
  } else if (props.action === 'editAmount') {
    return <EditAmountModal {...props} />;
  } else if (props.action === 'editPaymentMethod') {
    return <EditPaymentMethodModal {...props} />;
  }
  return null;
};

export default EditOrderModal;
