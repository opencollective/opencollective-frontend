import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/react-hooks';
import { Lock } from '@styled-icons/boxicons-regular/Lock';
import { PlusCircle } from '@styled-icons/boxicons-regular/PlusCircle';
import themeGet from '@styled-system/theme-get';
import { first, get, pick, uniqBy } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { getPaymentMethodName } from '../../lib/payment_method_label';
import { getPaymentMethodIcon, getPaymentMethodMetadata } from '../../lib/payment-method-utils';
import { stripeTokenToPaymentMethod } from '../../lib/stripe';
import { recurringContributionsPageQuery } from '../../lib/graphql/queries';

import { Box, Flex } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';
import NewCreditCardForm from '../NewCreditCardForm';
import { withStripeLoader } from '../StripeProvider';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledRadioList from '../StyledRadioList';
import { P } from '../Text';

const PaymentMethodBox = styled(Flex)`
  border-top: 1px solid ${themeGet('colors.black.300')};
`;

const messages = defineMessages({
  cancel: {
    id: 'actions.cancel',
    defaultMessage: 'Cancel',
  },
  update: {
    id: 'subscription.updateAmount.update.btn',
    defaultMessage: 'Update',
  },
  updatePaymentMethod: {
    id: 'subscription.menu.editPaymentMethod',
    defaultMessage: 'Update payment method',
  },
  addPaymentMethod: {
    id: 'subscription.menu.addPaymentMethod',
    defaultMessage: 'Add new payment method',
  },
  save: {
    id: 'save',
    defaultMessage: 'Save',
  },
});

const getPaymentMethodsQuery = gqlV2`
  query UpdatePaymentMethodPopUpQuery($collectiveSlug: String) {
    account(slug: $collectiveSlug) {
      id
      paymentMethods(types: ["creditcard", "virtualcard", "prepaid"]) {
        id
        name
        data
        service
        type
        balance
        currency
        account {
          id
        }
      }
    }
  }
`;

const updatePaymentMethodMutation = gqlV2/* GraphQL */ `
  mutation updatePaymentMethod($order: OrderReferenceInput!, $paymentMethod: PaymentMethodReferenceInput!) {
    updateOrder(order: $order, paymentMethod: $paymentMethod) {
      id
      paymentMethod {
        id
      }
    }
  }
`;

const addPaymentMethodMutation = gqlV2/* GraphQL */ `
  mutation addPaymentMethod($paymentMethod: PaymentMethodCreateInput!, $account: AccountReferenceInput!) {
    addStripeCreditCard(paymentMethod: $paymentMethod, account: $account) {
      id
      name
    }
  }
`;

const UpdatePaymentMethodPopUp = ({
  setMenuState,
  contribution,
  createNotification,
  setShowPopup,
  router,
  loadStripe,
  account,
}) => {
  const intl = useIntl();

  // state management
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(null);
  const [loadingDefaultPaymentMethod, setLoadingDefaultPaymentMethod] = useState(true);
  const [stripeIsReady, setStripeIsReady] = useState(false);
  const [stripe, setStripe] = useState(null);
  const [newPaymentMethodInfo, setNewPaymentMethodInfo] = useState(null);
  const [addedPaymentMethod, setAddedPaymentMethod] = useState(null);

  // GraphQL mutations and queries
  const { data } = useQuery(getPaymentMethodsQuery, {
    variables: {
      collectiveSlug: router.query.collectiveSlug,
    },
    context: API_V2_CONTEXT,
  });
  const [submitUpdatePaymentMethod, { loading: loadingUpdatePaymentMethod }] = useMutation(
    updatePaymentMethodMutation,
    {
      context: API_V2_CONTEXT,
    },
  );
  const [submitAddPaymentMethod, { loading: loadingAddPaymentMethod }] = useMutation(addPaymentMethodMutation, {
    context: API_V2_CONTEXT,
  });

  // load stripe on mount
  useEffect(() => {
    loadStripe();
    setStripeIsReady(true);
  }, [stripeIsReady]);

  // data handling
  const minBalance = 50; // Minimum usable balance for virtual card

  const paymentMethods = get(data, 'account.paymentMethods', null);
  const paymentOptions = React.useMemo(() => {
    if (!paymentMethods) {
      return null;
    }
    const paymentMethodsOptions = paymentMethods.map(pm => ({
      key: `pm-${pm.id}`,
      title: getPaymentMethodName(pm),
      subtitle: getPaymentMethodMetadata(pm),
      icon: getPaymentMethodIcon(pm),
      paymentMethod: pm,
      disabled: pm.balance < minBalance,
      id: pm.id,
      CollectiveId: pm.account.id,
    }));
    const uniquePMs = uniqBy(paymentMethodsOptions, 'id');
    // put the PM that matches this recurring contribution on top of the list
    const sortedPMs = uniquePMs.sort(a => a.id !== contribution.paymentMethod.id);
    return sortedPMs;
  }, [paymentMethods]);

  useEffect(() => {
    if (paymentOptions && defaultPaymentMethod === null) {
      setDefaultPaymentMethod(first(paymentOptions.filter(option => option.id === contribution.paymentMethod.id)));
      setLoadingDefaultPaymentMethod(false);
    } else if (paymentOptions && addedPaymentMethod) {
      setSelectedPaymentMethod(paymentOptions.find(option => option.id === addedPaymentMethod.legacyId));
    }
  }, [paymentOptions]);

  return (
    <Fragment>
      <Flex width={1} alignItems="center" justifyContent="center" minHeight={45}>
        <P my={2} fontSize="Caption" textTransform="uppercase" color="black.700">
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
          <PlusCircle
            size={20}
            onClick={() => setShowAddPaymentMethod(true)}
            data-cy="recurring-contribution-add-pm-button"
          />
        )}
      </Flex>
      {showAddPaymentMethod ? (
        <NewCreditCardForm
          name="newCreditCardInfo"
          profileType={'USER'}
          // error={errors.newCreditCardInfo}
          onChange={setNewPaymentMethodInfo}
          onReady={({ stripe }) => setStripe(stripe)}
          hasSaveCheckBox={false}
        />
      ) : loadingDefaultPaymentMethod ? (
        <LoadingPlaceholder height={100} />
      ) : (
        <StyledRadioList
          id="PaymentMethod"
          name="PaymentMethod"
          keyGetter="key"
          options={paymentOptions}
          onChange={setSelectedPaymentMethod}
          defaultValue={defaultPaymentMethod?.key}
          value={selectedPaymentMethod}
        >
          {({ radio, value: { title, subtitle, icon } }) => (
            <PaymentMethodBox minheight={50} p={2} bg="white.full" data-cy="recurring-contribution-pm-box">
              <Flex alignItems="center">
                <Box as="span" mr={3} flexWrap="wrap">
                  {radio}
                </Box>
                <Flex mr={2} css={{ flexBasis: '26px' }}>
                  {icon}
                </Flex>
                <Flex flexDirection="column">
                  <P fontWeight={subtitle ? 600 : 400} color="black.900">
                    {title}
                  </P>
                  {subtitle && (
                    <P fontSize="Caption" fontWeight={400} lineHeight="Caption" color="black.500">
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
      <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center" minHeight={45}>
        {showAddPaymentMethod ? (
          <Fragment>
            <StyledButton
              buttonSize="tiny"
              onClick={() => {
                setShowAddPaymentMethod(false);
                setNewPaymentMethodInfo(null);
              }}
            >
              {intl.formatMessage(messages.cancel)}
            </StyledButton>
            <StyledButton
              ml={2}
              buttonSize="tiny"
              buttonStyle="secondary"
              disabled={newPaymentMethodInfo ? !newPaymentMethodInfo?.value.complete : true}
              type="submit"
              loading={loadingAddPaymentMethod}
              data-cy="recurring-contribution-submit-pm-button"
              onClick={async () => {
                if (!stripe) {
                  createNotification(
                    'error',
                    'There was a problem initializing the payment form. Please reload the page and try again',
                  );
                  return false;
                }
                const { token, error } = await stripe.createToken();

                if (error) {
                  createNotification('error', error.message);
                  return false;
                }
                const newStripePaymentMethod = stripeTokenToPaymentMethod(token);
                const newPaymentMethod = pick(newStripePaymentMethod, ['name', 'token', 'data']);
                try {
                  const res = await submitAddPaymentMethod({
                    variables: { paymentMethod: newPaymentMethod, account: { id: account.id } },
                    refetchQueries: [
                      {
                        query: getPaymentMethodsQuery,
                        variables: { collectiveSlug: router.query.collectiveSlug },
                        context: API_V2_CONTEXT,
                      },
                    ],
                  });
                  setAddedPaymentMethod(res.data.addStripeCreditCard);
                  setShowAddPaymentMethod(false);
                } catch (error) {
                  const errorMsg = getErrorFromGraphqlException(error).message;
                  createNotification('error', errorMsg);
                }
              }}
            >
              {intl.formatMessage(messages.save)}
            </StyledButton>
          </Fragment>
        ) : (
          <Fragment>
            <StyledButton
              buttonSize="tiny"
              onClick={() => {
                setMenuState('mainMenu');
              }}
            >
              {intl.formatMessage(messages.cancel)}
            </StyledButton>
            <StyledButton
              ml={2}
              buttonSize="tiny"
              buttonStyle="secondary"
              loading={loadingUpdatePaymentMethod}
              disabled={!selectedPaymentMethod}
              data-cy="recurring-contribution-update-pm-button"
              onClick={async () => {
                try {
                  await submitUpdatePaymentMethod({
                    variables: {
                      order: { id: contribution.id },
                      paymentMethod: {
                        id: selectedPaymentMethod.value.paymentMethod.id,
                      },
                    },
                  });
                  createNotification('update');
                  setShowPopup(false);
                } catch (error) {
                  const errorMsg = getErrorFromGraphqlException(error).message;
                  createNotification('error', errorMsg);
                }
              }}
            >
              {intl.formatMessage(messages.update)}
            </StyledButton>
          </Fragment>
        )}
      </Flex>
    </Fragment>
  );
};

UpdatePaymentMethodPopUp.propTypes = {
  data: PropTypes.object,
  setMenuState: PropTypes.func,
  router: PropTypes.object.isRequired,
  contribution: PropTypes.object.isRequired,
  createNotification: PropTypes.func,
  setShowPopup: PropTypes.func,
  loadStripe: PropTypes.func.isRequired,
  account: PropTypes.object.isRequired,
};

export default withStripeLoader(withRouter(UpdatePaymentMethodPopUp));
