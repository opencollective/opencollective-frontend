import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Add } from '@styled-icons/material/Add';
import { get, merge, pick, sortBy } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { getErrorFromGraphqlException, isErrorType } from '../../../lib/errors';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { addEditCollectiveMutation } from '../../../lib/graphql/mutations';
import { paymentMethodLabel } from '../../../lib/payment_method_label';
import { stripeTokenToPaymentMethod } from '../../../lib/stripe';
import { compose } from '../../../lib/utils';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import Link from '../../Link';
import Loading from '../../Loading';
import MessageBox from '../../MessageBox';
import NewCreditCardForm from '../../NewCreditCardForm';
import {
  addCreditCardMutation,
  confirmCreditCardMutation,
} from '../../recurring-contributions/UpdatePaymentMethodPopUp';
import StyledButton from '../../StyledButton';
import { P, Span } from '../../Text';
import EditPaymentMethod from '../EditPaymentMethod';
import SettingsTitle from '../SettingsTitle';

function EditPaymentMethods(props) {
  const [showCreditCardForm, setShowCreditCardForm] = useState(false);
  const [newCreditCardInfo, setNewCreditCardInfo] = useState(null);
  const [error, setError] = useState(null);
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [removedId, setRemovedId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const messages = defineMessages({
    removeConfirm: {
      id: 'paymentMethods.removeConfirm',
      defaultMessage: 'Do you really want to remove this payment method?',
    },
  });

  const submitNewCreditCard = async () => {
    if (!newCreditCardInfo || !stripe) {
      setError('There was a problem initializing the payment form');
    } else if (newCreditCardInfo.error) {
      setError(newCreditCardInfo.error.message);
    } else {
      try {
        setSubmitting(true);
        const cardElement = elements.getElement(CardElement);
        const { token, error } = await stripe.createToken(cardElement);
        if (error) {
          throw error;
        }
        const newStripePaymentMethod = stripeTokenToPaymentMethod(token);
        const newCreditCardInfo = merge(newStripePaymentMethod.data, pick(newStripePaymentMethod, ['token']));
        const res = await props.createCreditCardEditCollective({
          variables: {
            creditCardInfo: newCreditCardInfo,
            name: get(newStripePaymentMethod, 'name'),
            account: { legacyId: props.data.Collective.id },
          },
        });

        const { paymentMethod, stripeError } = res.data.addCreditCard;

        if (stripeError) {
          handleStripeError(paymentMethod, stripeError);
        } else {
          handleSuccess();
        }
      } catch (e) {
        setError(e.message);
        setSubmitting(false);
      }
    }
  };

  const handleSuccess = () => {
    props.data.refetch();
    setShowCreditCardForm(false);
    setError(null);
    setNewCreditCardInfo(null);
    setSubmitting(false);
  };

  const handleStripeError = async (paymentMethod, stripeError) => {
    const { message, response } = stripeError;

    if (!response) {
      setError(message);
      setSubmitting(false);
      return;
    }
  };

  const updatePaymentMethod = async paymentMethod => {
    setSavingId(paymentMethod.id);
    try {
      await props.updatePaymentMethod({ variables: paymentMethod });
      await props.data.refetch();
      setSavingId(null);
    } catch (e) {
      showError(e.message);
      setSavingId(null);
    }
  };

  const removePaymentMethod = async paymentMethod => {
    const pmLabel = paymentMethodLabel(props.intl, paymentMethod, get(props.data, 'Collective.name'));
    const confirmQuestion = props.intl.formatMessage(messages['removeConfirm']);
    if (confirm(`${pmLabel} - ${confirmQuestion}`)) {
      try {
        setRemovedId(paymentMethod.id);
        await props.removePaymentMethod({ variables: { id: paymentMethod.id } });
        setError(null);
        await props.data.refetch();
      } catch (e) {
        showError(getErrorFromGraphqlException(e));
      }
    }
    setRemovedId(null);
  };

  const showError = error => {
    setError(error);
    window.scrollTo(0, 0);
  };

  const getPaymentMethodsToDisplay = () => {
    const paymentMethods = get(props, 'data.Collective.paymentMethods', []).filter(
      pm => pm.balance > 0 || (pm.type === 'giftcard' && pm.monthlyLimitPerMember),
    );
    return sortBy(paymentMethods, ['type', 'id']);
  };

  const renderError = error => {
    if (typeof error === 'string') {
      return error;
    } else if (isErrorType(error, 'PM.Remove.HasActiveSubscriptions')) {
      return (
        <React.Fragment>
          <FormattedMessage
            id="errors.PM.Remove.HasActiveSubscriptions"
            defaultMessage="This payment method cannot be removed because it has active recurring financial contributions."
          />{' '}
          <Link href={`/${props.collectiveSlug}/recurring-contributions`}>
            <Span textTransform="capitalize">
              <FormattedMessage
                id="paymentMethod.editSubscriptions"
                defaultMessage="Edit recurring financial contributions"
              />
            </Span>
          </Link>
        </React.Fragment>
      );
    } else {
      return error.message;
    }
  };

  const { Collective, loading } = props.data;
  const paymentMethods = getPaymentMethodsToDisplay();
  return loading ? (
    <Loading />
  ) : (
    <Flex className="EditPaymentMethods" flexDirection="column">
      <SettingsTitle>
        <FormattedMessage id="editCollective.menu.paymentMethods" defaultMessage="Payment Methods" />
      </SettingsTitle>
      {error && (
        <MessageBox type="error" withIcon mb={4}>
          {renderError(error)}
        </MessageBox>
      )}
      {
        <Flex className="paymentMethods" flexDirection="column" my={2}>
          {paymentMethods.map(pm => (
            <Container
              className="paymentMethod"
              key={pm.id}
              my={3}
              p={3}
              border="1px solid #dedede"
              borderRadius={4}
              style={{ filter: pm.id === removedId ? 'blur(1px)' : 'none' }}
            >
              <EditPaymentMethod
                paymentMethod={pm}
                subscriptions={pm.subscriptions}
                hasMonthlyLimitPerMember={Collective.type === 'ORGANIZATION' && pm.type !== 'prepaid'}
                currency={pm.currency || Collective.currency}
                collectiveSlug={Collective.slug}
                onSave={pm => updatePaymentMethod(pm)}
                onRemove={pm => removePaymentMethod(pm)}
                isSaving={pm.id === savingId}
              />
            </Container>
          ))}
        </Flex>
      }
      {!showCreditCardForm && (
        <Flex alignItems="center" mx={3} my={4} flexDirection="column">
          <StyledButton buttonStyle="standard" buttonSize="large" onClick={() => setShowCreditCardForm(true)}>
            <Add size="1em" />
            {'  '}
            <FormattedMessage id="paymentMethods.creditcard.add" defaultMessage="Add a credit card" />
          </StyledButton>
          <Span fontSize="12px" mt={2} color="black.600">
            <FormattedMessage
              id="paymentMethods.creditcard.add.info"
              defaultMessage="For making contributions as {contributeAs}"
              values={{ contributeAs: Collective.name }}
            />
          </Span>
        </Flex>
      )}
      {showCreditCardForm && (
        <Container
          display="flex"
          alignItems="center"
          flexWrap="wrap"
          my={4}
          px={3}
          py={1}
          borderRadius={4}
          border="1px solid #dedede"
        >
          <P fontSize="14px" fontWeight="bold" mr={4}>
            <FormattedMessage id="paymentMethod.add" defaultMessage="New Credit Card" />
          </P>
          <Box mr={2} css={{ flexGrow: 1 }}>
            <NewCreditCardForm
              hasSaveCheckBox={false}
              onChange={newCreditCardInfo => {
                setNewCreditCardInfo(newCreditCardInfo);
                setError(null);
              }}
            />
          </Box>
          <Box my={2}>
            <StyledButton
              mr={2}
              buttonStyle="standard"
              buttonSize="medium"
              onClick={() => {
                setNewCreditCardInfo(false);
                setError(null);
              }}
              disabled={submitting}
            >
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </StyledButton>
            <StyledButton
              buttonStyle="primary"
              buttonSize="medium"
              type="submit"
              onClick={submitNewCreditCard}
              disabled={submitting}
              loading={submitting}
            >
              <FormattedMessage id="save" defaultMessage="Save" />
            </StyledButton>
          </Box>
        </Container>
      )}
    </Flex>
  );
}

EditPaymentMethods.propTypes = {
  collectiveSlug: PropTypes.string.isRequired,
  /** From graphql query */
  data: PropTypes.object.isRequired,
  /** From intl */
  intl: PropTypes.object.isRequired,
  /** From graphql query */
  createCreditCardEditCollective: PropTypes.func.isRequired,
  /** From graphql query */
  confirmCreditCardEditCollective: PropTypes.func.isRequired,
  /** From graphql query */
  removePaymentMethod: PropTypes.func.isRequired,
  /** From graphql query */
  updatePaymentMethod: PropTypes.func.isRequired,
  /** From graphql query */
  editCollective: PropTypes.func.isRequired,
};

const paymentMethodsQuery = gql`
  query EditCollectivePaymentMethods($collectiveSlug: String) {
    Collective(slug: $collectiveSlug) {
      id
      type
      slug
      name
      currency
      isHost
      settings
      plan {
        id
        addedFunds
        addedFundsLimit
        bankTransfers
        bankTransfersLimit
        hostedCollectives
        hostedCollectivesLimit
        manualPayments
        name
      }
      paymentMethods(types: ["creditcard", "giftcard", "prepaid"]) {
        id
        uuid
        name
        data
        monthlyLimitPerMember
        service
        type
        balance
        currency
        expiryDate
        subscriptions: orders(hasActiveSubscription: true) {
          id
        }
      }
    }
  }
`;

const addPaymentMethodsData = graphql(paymentMethodsQuery);

const addCreateCreditCardMutation = graphql(addCreditCardMutation, {
  name: 'createCreditCardEditCollective',
  options: { context: API_V2_CONTEXT },
});

const addConfirmCreditCardMutation = graphql(confirmCreditCardMutation, {
  name: 'confirmCreditCardEditCollective',
  options: { context: API_V2_CONTEXT },
});

const removePaymentMethodMutation = gql`
  mutation EditCollectiveremovePaymentMethod($id: Int!) {
    removePaymentMethod(id: $id) {
      id
    }
  }
`;

const addRemovePaymentMethodMutation = graphql(removePaymentMethodMutation, {
  name: 'removePaymentMethod',
});

const updatePaymentMethodMutation = gql`
  mutation EditCollectiveUpdatePaymentMethod($id: Int!, $monthlyLimitPerMember: Int) {
    updatePaymentMethod(id: $id, monthlyLimitPerMember: $monthlyLimitPerMember) {
      id
    }
  }
`;

const addUpdatePaymentMethodMutation = graphql(updatePaymentMethodMutation, {
  name: 'updatePaymentMethod',
});

const addGraphql = compose(
  addPaymentMethodsData,
  addRemovePaymentMethodMutation,
  addUpdatePaymentMethodMutation,
  addEditCollectiveMutation,
  addCreateCreditCardMutation,
  addConfirmCreditCardMutation,
);

export default injectIntl(addGraphql(EditPaymentMethods));
