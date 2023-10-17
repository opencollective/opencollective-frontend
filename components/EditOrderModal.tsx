import React, { useEffect, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { CardElement } from '@stripe/react-stripe-js';
import { useFormik } from 'formik';
import { first, get, merge, pick, startCase } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { PAYMENT_METHOD_SERVICE } from '../lib/constants/payment-methods';
import { formatCurrency } from '../lib/currency-utils';
import { getIntervalFromContributionFrequency } from '../lib/date-utils';
import { getErrorFromGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import { getStripe, stripeTokenToPaymentMethod } from '../lib/stripe';
import { DEFAULT_MINIMUM_AMOUNT } from '../lib/tier-utils';

import AddPaymentMethod, { getSubscriptionStartDate } from './recurring-contributions/AddPaymentMethod';
import {
  ContributionInterval,
  tiersQuery,
  useContributeOptions,
  useUpdateOrder,
} from './recurring-contributions/UpdateOrderPopUp';
import {
  addCreditCardMutation,
  confirmCreditCardMutation,
  paymentMethodsQuery,
  sortAndFilterPaymentMethods,
  useUpdatePaymentMethod,
} from './recurring-contributions/UpdatePaymentMethodPopUp';
import { toast } from './ui/useToast';
import FormattedMoneyAmount from './FormattedMoneyAmount';
import { Box, Flex } from './Grid';
import I18nFormatters from './I18nFormatters';
import LoadingPlaceholder from './LoadingPlaceholder';
import PayWithPaypalButton from './PayWithPaypalButton';
import { withStripeLoader } from './StripeProvider';
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
  account: any;
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
                              precision={2}
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

const EditPaymentMethodModal = withStripeLoader(
  ({
    account,
    order: contribution,
    loadStripe,
    ...props
  }: Omit<EditOrderModalProps, 'action'> & { loadStripe: any }) => {
    const mutationOptions = { context: API_V2_CONTEXT };
    // state management
    const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [loadingSelectedPaymentMethod, setLoadingSelectedPaymentMethod] = useState(true);
    const [stripe, setStripe] = useState(null);
    const [stripeElements, setStripeElements] = useState(null);
    const [newPaymentMethodInfo, setNewPaymentMethodInfo] = useState(null);
    const [addedPaymentMethod, setAddedPaymentMethod] = useState(null);
    const [addingPaymentMethod, setAddingPaymentMethod] = useState(false);
    const { isSubmitting, updatePaymentMethod } = useUpdatePaymentMethod(contribution);

    // GraphQL mutations and queries
    const { data, refetch } = useQuery(paymentMethodsQuery, {
      variables: { accountId: account.id, orderId: contribution.id },
      context: API_V2_CONTEXT,
      fetchPolicy: 'network-only',
    });
    const [submitAddPaymentMethod] = useMutation(addCreditCardMutation, mutationOptions);
    const [submitConfirmPaymentMethodMutation] = useMutation(confirmCreditCardMutation, mutationOptions);

    const handleAddPaymentMethodResponse = async response => {
      const { paymentMethod, stripeError } = response;
      if (stripeError) {
        return handleStripeError(paymentMethod, stripeError);
      } else {
        return handleSuccess(paymentMethod);
      }
    };

    const handleStripeError = async (paymentMethod, stripeError) => {
      const { message, response } = stripeError;

      if (!response) {
        toast({
          variant: 'error',
          message: message,
        });
        setAddingPaymentMethod(false);
        return false;
      }

      const stripe = await getStripe();
      const result = await stripe.handleCardSetup(response.setupIntent.client_secret);
      if (result.error) {
        toast({
          variant: 'error',
          message: result.error.message,
        });
        setAddingPaymentMethod(false);
        return false;
      } else {
        try {
          const response = await submitConfirmPaymentMethodMutation({
            variables: { paymentMethod: { id: paymentMethod.id } },
          });
          return handleSuccess(response.data.confirmCreditCard.paymentMethod);
        } catch (error) {
          toast({
            variant: 'error',
            message: error.message,
          });
          setAddingPaymentMethod(false);
          return false;
        }
      }
    };

    const handleSuccess = paymentMethod => {
      setAddingPaymentMethod(false);
      refetch();
      setAddedPaymentMethod(paymentMethod);
      setShowAddPaymentMethod(false);
      setLoadingSelectedPaymentMethod(true);
    };

    // load stripe on mount
    useEffect(() => {
      loadStripe();
    }, []);

    // data handling
    const paymentMethods = get(data, 'account.paymentMethods', null);
    const existingPaymentMethod = get(data, 'order.paymentMethod', null);
    const filterPaymentMethodsParams = [paymentMethods, contribution, addedPaymentMethod, existingPaymentMethod];
    const paymentOptions = React.useMemo(
      () => sortAndFilterPaymentMethods(...filterPaymentMethodsParams),
      filterPaymentMethodsParams,
    );

    useEffect(() => {
      if (!paymentOptions) {
        return;
      }
      if (selectedPaymentMethod === null && contribution.paymentMethod) {
        setSelectedPaymentMethod(first(paymentOptions.filter(option => option.id === contribution.paymentMethod.id)));
      } else if (addedPaymentMethod) {
        setSelectedPaymentMethod(paymentOptions.find(option => option.id === addedPaymentMethod.id));
      }
      setLoadingSelectedPaymentMethod(false);
    }, [paymentOptions, addedPaymentMethod]);

    return (
      <StyledModal onClose={props.onClose} maxWidth="420px">
        <ModalHeader onClose={props.onClose}>
          <H4 fontSize="20px" fontWeight="700">
            {showAddPaymentMethod ? (
              <FormattedMessage id="subscription.menu.addPaymentMethod" defaultMessage="Add new payment method" />
            ) : (
              <FormattedMessage id="subscription.menu.editPaymentMethod" defaultMessage="Update payment method" />
            )}
          </H4>
        </ModalHeader>
        <ModalBody mb={0}>
          <P fontSize="15px" mb="10" lineHeight="20px">
            <FormattedMessage
              id="subscription.updatePaymentMethod.subheader"
              defaultMessage="Pick an existing payment method or add a new one."
            />
          </P>
          {showAddPaymentMethod ? (
            <Box>
              <AddPaymentMethod
                order={contribution}
                isSubmitting={isSubmitting}
                setNewPaymentMethodInfo={setNewPaymentMethodInfo}
                onStripeReady={({ stripe, stripeElements }) => {
                  setStripe(stripe);
                  setStripeElements(stripeElements);
                }}
                onPaypalSuccess={async paypalPaymentMethod => {
                  await updatePaymentMethod(paypalPaymentMethod);
                  props.onClose();
                }}
              />
            </Box>
          ) : loadingSelectedPaymentMethod ? (
            <LoadingPlaceholder height={100} />
          ) : (
            <StyledRadioList
              id="PaymentMethod"
              name={`${contribution.id}-PaymentMethod`}
              keyGetter="key"
              options={paymentOptions}
              onChange={setSelectedPaymentMethod}
              value={selectedPaymentMethod?.key}
            >
              {({ radio, value: { title, subtitle, icon } }) => (
                <Flex minHeight={50} py={2} bg="white.full" data-cy="recurring-contribution-pm-box">
                  <Flex alignItems="center">
                    <Box as="span" mr={3} flexWrap="wrap">
                      {radio}
                    </Box>
                    <Flex mr={2} css={{ flexBasis: '26px' }}>
                      {icon}
                    </Flex>
                    <Flex flexDirection="column" width="100%">
                      <P fontSize="12px" fontWeight={subtitle ? 600 : 400} color="black.900" overflowWrap="anywhere">
                        {title}
                      </P>
                      {subtitle && (
                        <P fontSize="12px" fontWeight={400} lineHeight="18px" color="black.500" overflowWrap="anywhere">
                          {subtitle}
                        </P>
                      )}
                    </Flex>
                  </Flex>
                </Flex>
              )}
            </StyledRadioList>
          )}
          {!showAddPaymentMethod && (
            <StyledButton
              buttonSize="tiny"
              width="100%"
              mt={2}
              onClick={() => setShowAddPaymentMethod(true)}
              data-cy="recurring-contribution-add-pm-button"
            >
              <FormattedMessage id="subscription.menu.addPaymentMethod" defaultMessage="Add new payment method" />
            </StyledButton>
          )}
          {showAddPaymentMethod ? (
            <Flex flexWrap="wrap" justifyContent="space-between" mt={4}>
              <StyledButton
                onClick={() => {
                  setNewPaymentMethodInfo(null);
                  setShowAddPaymentMethod(false);
                }}
              >
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </StyledButton>
              <StyledButton
                buttonSize="tiny"
                buttonStyle="secondary"
                disabled={newPaymentMethodInfo ? !newPaymentMethodInfo.value?.complete : true}
                type="submit"
                loading={addingPaymentMethod}
                data-cy="recurring-contribution-submit-pm-button"
                onClick={async () => {
                  setAddingPaymentMethod(true);
                  if (!stripe) {
                    toast({
                      variant: 'error',
                      message: (
                        <FormattedMessage
                          id="Stripe.Initialization.Error"
                          defaultMessage="There was a problem initializing the payment form. Please reload the page and try again."
                        />
                      ),
                    });
                    setAddingPaymentMethod(false);
                    return false;
                  }
                  const cardElement = stripeElements.getElement(CardElement);
                  const { token, error } = await stripe.createToken(cardElement);

                  if (error) {
                    toast({ variant: 'error', message: error.message });
                    return false;
                  }
                  const newStripePaymentMethod = stripeTokenToPaymentMethod(token);
                  const newCreditCardInfo = merge(newStripePaymentMethod.data, pick(newStripePaymentMethod, ['token']));
                  try {
                    const res = await submitAddPaymentMethod({
                      variables: {
                        creditCardInfo: newCreditCardInfo,
                        name: get(newStripePaymentMethod, 'name'),
                        account: { id: account.id },
                      },
                    });
                    return handleAddPaymentMethodResponse(res.data.addCreditCard);
                  } catch (error) {
                    const errorMsg = getErrorFromGraphqlException(error).message;
                    toast({ variant: 'error', message: errorMsg });
                    setAddingPaymentMethod(false);
                    return false;
                  }
                }}
              >
                <FormattedMessage id="save" defaultMessage="Save" />
              </StyledButton>
            </Flex>
          ) : (
            <Flex mt={4}>
              <StyledButton
                buttonStyle="secondary"
                loading={isSubmitting}
                data-cy="recurring-contribution-update-pm-button"
                onClick={() => updatePaymentMethod(selectedPaymentMethod).then(props.onClose)}
                width="100%"
              >
                <FormattedMessage id="actions.update" defaultMessage="Update" />
              </StyledButton>
            </Flex>
          )}
        </ModalBody>
      </StyledModal>
    );
  },
);

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
