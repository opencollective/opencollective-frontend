import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { CardElement } from '@stripe/react-stripe-js';
import { Lock } from '@styled-icons/boxicons-regular/Lock';
import { themeGet } from '@styled-system/theme-get';
import { first, get, merge, pick, uniqBy } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { PAYMENT_METHOD_SERVICE } from '../../lib/constants/payment-methods';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { getPaymentMethodName } from '../../lib/payment_method_label';
import { getPaymentMethodIcon, getPaymentMethodMetadata } from '../../lib/payment-method-utils';
import { getStripe, stripeTokenToPaymentMethod } from '../../lib/stripe';

import { Box, Flex } from '../Grid';
import I18nFormatters from '../I18nFormatters';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { withStripeLoader } from '../StripeProvider';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledRadioList from '../StyledRadioList';
import StyledRoundButton from '../StyledRoundButton';
import { P } from '../Text';
import { useToast } from '../ui/useToast';

import { managedOrderFragment, paymentMethodFragment } from './graphql/queries';
import AddPaymentMethod from './AddPaymentMethod';

const PaymentMethodBox = styled(Flex)`
  border-top: 1px solid ${themeGet('colors.black.300')};
`;

const messages = defineMessages({
  updatePaymentMethod: {
    id: 'subscription.menu.editPaymentMethod',
    defaultMessage: 'Update payment method',
  },
  addPaymentMethod: {
    id: 'subscription.menu.addPaymentMethod',
    defaultMessage: 'Add new payment method',
  },
});

const paymentMethodsQuery = gql`
  query UpdatePaymentMethodPopUpPaymentMethod($accountSlug: String!, $orderId: String!) {
    account(slug: $accountSlug) {
      id
      paymentMethods(type: [CREDITCARD, US_BANK_ACCOUNT, SEPA_DEBIT, BACS_DEBIT, GIFTCARD, PREPAID, COLLECTIVE]) {
        id
        ...UpdatePaymentMethodFragment
      }
    }
    order(order: { id: $orderId }) {
      ...ManagedOrderFields
    }
  }
  ${managedOrderFragment}
  ${paymentMethodFragment}
`;

const updatePaymentMethodMutation = gql`
  mutation UpdatePaymentMethod(
    $order: OrderReferenceInput!
    $paymentMethod: PaymentMethodReferenceInput
    $paypalSubscriptionId: String
  ) {
    updateOrder(order: $order, paymentMethod: $paymentMethod, paypalSubscriptionId: $paypalSubscriptionId) {
      ...ManagedOrderFields
    }
  }
  ${managedOrderFragment}
`;

const paymentMethodResponseFragment = gql`
  fragment paymentMethodResponseFragment on CreditCardWithStripeError {
    paymentMethod {
      id
    }
    stripeError {
      message
      response
    }
  }
`;

export const addCreditCardMutation = gql`
  mutation AddCreditCardRecurringContributions(
    $creditCardInfo: CreditCardCreateInput!
    $name: String!
    $account: AccountReferenceInput!
  ) {
    addCreditCard(creditCardInfo: $creditCardInfo, name: $name, account: $account) {
      ...paymentMethodResponseFragment
    }
  }
  ${paymentMethodResponseFragment}
`;

export const confirmCreditCardMutation = gql`
  mutation ConfirmCreditCardRecurringContributions($paymentMethod: PaymentMethodReferenceInput!) {
    confirmCreditCard(paymentMethod: $paymentMethod) {
      ...paymentMethodResponseFragment
    }
  }
  ${paymentMethodResponseFragment}
`;

const mutationOptions = { context: API_V2_CONTEXT };

const sortAndFilterPaymentMethods = (paymentMethods, contribution, addedPaymentMethod, existingPaymentMethod) => {
  if (!paymentMethods) {
    return null;
  }

  const minBalance = contribution.amount.valueInCents;
  const uniquePMs = uniqBy(paymentMethods, 'id');
  const getIsDisabled = pm => pm.balance.valueInCents < minBalance;

  // Make sure we always include the current payment method
  if (existingPaymentMethod && !uniquePMs.some(pm => pm.id === existingPaymentMethod.id)) {
    uniquePMs.unshift(existingPaymentMethod);
  }

  uniquePMs.sort((pm1, pm2) => {
    // Put disabled PMs at the end
    if (getIsDisabled(pm1) && !getIsDisabled(pm2)) {
      return 1;
    } else if (getIsDisabled(pm2) && !getIsDisabled(pm1)) {
      return -1;
    }

    // If we've just added a PM, put it at the top of the list
    if (addedPaymentMethod) {
      if (addedPaymentMethod.id === pm1.id) {
        return -1;
      } else if (addedPaymentMethod.id === pm2.id) {
        return 1;
      }
    }

    // Put the PM that matches this recurring contribution just after the newly added
    if (existingPaymentMethod) {
      if (existingPaymentMethod.id === pm1.id) {
        return -1;
      } else if (existingPaymentMethod.id === pm2.id) {
        return 1;
      }
    }

    return 0;
  });

  return uniquePMs.map(pm => ({
    key: `pm-${pm.id}`,
    title: getPaymentMethodName(pm),
    subtitle: getPaymentMethodMetadata(pm),
    icon: getPaymentMethodIcon(pm),
    paymentMethod: pm,
    disabled: getIsDisabled(pm),
    id: pm.id,
    CollectiveId: pm.account?.id,
  }));
};

export const useUpdatePaymentMethod = contribution => {
  const { toast } = useToast();
  const [submitUpdatePaymentMethod, { loading }] = useMutation(updatePaymentMethodMutation, mutationOptions);

  return {
    isSubmitting: loading,
    updatePaymentMethod: async paymentMethod => {
      const hasUpdate =
        contribution.status === 'PAUSED' ||
        !contribution.paymentMethod ||
        paymentMethod.id !== contribution.paymentMethod.id;
      try {
        if (hasUpdate) {
          const variables = { order: { id: contribution.id } };
          if (paymentMethod.service === PAYMENT_METHOD_SERVICE.PAYPAL) {
            variables.paypalSubscriptionId = paymentMethod.paypalInfo.subscriptionId;
          } else {
            variables.paymentMethod = { id: paymentMethod.value ? paymentMethod.value.id : paymentMethod.id };
          }
          await submitUpdatePaymentMethod({ variables });
        }
        toast({
          variant: 'success',
          message: (
            <FormattedMessage
              id="subscription.createSuccessUpdated"
              defaultMessage="Your recurring contribution has been <strong>updated</strong>."
              values={I18nFormatters}
            />
          ),
        });
        return true;
      } catch (error) {
        const errorMsg = getErrorFromGraphqlException(error).message;
        toast({ variant: 'error', message: errorMsg });
        return false;
      }
    },
  };
};

const UpdatePaymentMethodPopUp = ({ contribution, onCloseEdit, loadStripe, account }) => {
  const intl = useIntl();
  const { toast } = useToast();

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
    variables: { accountSlug: account.slug, orderId: contribution.id },
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
    <Fragment>
      <Flex width={1} alignItems="center" justifyContent="center" minHeight={50} px={3}>
        <P my={2} fontSize="12px" textTransform="uppercase" color="black.700">
          {showAddPaymentMethod
            ? intl.formatMessage(messages.addPaymentMethod)
            : intl.formatMessage(messages.updatePaymentMethod)}
        </P>
        <Flex flexGrow={1} alignItems="center">
          <StyledHr width="100%" mx={2} />
        </Flex>
        {showAddPaymentMethod ? (
          <Lock size={20} />
        ) : (
          <StyledRoundButton
            size={24}
            onClick={() => setShowAddPaymentMethod(true)}
            data-cy="recurring-contribution-add-pm-button"
          >
            +
          </StyledRoundButton>
        )}
      </Flex>
      {showAddPaymentMethod ? (
        <Box px={1} pt={2} pb={3}>
          <AddPaymentMethod
            order={contribution}
            isSubmitting={isSubmitting}
            setNewPaymentMethodInfo={setNewPaymentMethodInfo}
            onStripeReady={({ stripe, stripeElements }) => {
              setStripe(stripe);
              setStripeElements(stripeElements);
            }}
            onPaypalSuccess={async paypalPaymentMethod => {
              const success = await updatePaymentMethod(paypalPaymentMethod);
              if (success) {
                onCloseEdit();
              }
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
            <PaymentMethodBox minHeight={50} py={2} bg="white.full" data-cy="recurring-contribution-pm-box" px={3}>
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
            </PaymentMethodBox>
          )}
        </StyledRadioList>
      )}
      <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center">
        <Flex flexGrow={1} alignItems="center">
          <StyledHr width="100%" />
        </Flex>
      </Flex>
      <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center" minHeight={50}>
        {showAddPaymentMethod ? (
          <Fragment>
            <StyledButton
              buttonSize="tiny"
              minWidth={75}
              onClick={() => {
                setNewPaymentMethodInfo(null);
                onCloseEdit();
              }}
            >
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </StyledButton>
            <StyledButton
              ml={2}
              minWidth={75}
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
          </Fragment>
        ) : (
          <Fragment>
            <StyledButton buttonSize="tiny" minWidth={75} onClick={onCloseEdit}>
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </StyledButton>
            <StyledButton
              ml={2}
              minWidth={75}
              buttonSize="tiny"
              buttonStyle="secondary"
              loading={isSubmitting}
              data-cy="recurring-contribution-update-pm-button"
              onClick={async () => {
                const success = await updatePaymentMethod(selectedPaymentMethod);
                if (success) {
                  onCloseEdit();
                }
              }}
            >
              <FormattedMessage id="actions.update" defaultMessage="Update" />
            </StyledButton>
          </Fragment>
        )}
      </Flex>
    </Fragment>
  );
};

UpdatePaymentMethodPopUp.propTypes = {
  data: PropTypes.object,
  contribution: PropTypes.object.isRequired,
  onCloseEdit: PropTypes.func,
  loadStripe: PropTypes.func.isRequired,
  account: PropTypes.object.isRequired,
};

export default withStripeLoader(UpdatePaymentMethodPopUp);
