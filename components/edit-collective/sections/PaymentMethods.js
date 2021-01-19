import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { Add } from '@styled-icons/material/Add';
import { get, merge, pick, sortBy } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { getErrorFromGraphqlException, isErrorType } from '../../../lib/errors';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { addEditCollectiveMutation } from '../../../lib/graphql/mutations';
import { paymentMethodLabel } from '../../../lib/payment_method_label';
import { getStripe, stripeTokenToPaymentMethod } from '../../../lib/stripe';
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
import { withStripeLoader } from '../../StripeProvider';
import StyledButton from '../../StyledButton';
import { P, Span } from '../../Text';
import EditPaymentMethod from '../EditPaymentMethod';
import SettingsTitle from '../SettingsTitle';

class EditPaymentMethods extends React.Component {
  static propTypes = {
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
    /** From stripeLoader */
    loadStripe: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      removeConfirm: {
        id: 'paymentMethods.removeConfirm',
        defaultMessage: 'Do you really want to remove this payment method from your account?',
      },
    });
  }

  state = {
    showCreditCardForm: false,
    newCreditCardInfo: null,
    bankDetails: null,
    error: null,
    stripe: null,
    submitting: false,
    removedId: null,
    savingId: null,
  };

  componentDidMount() {
    this.props.loadStripe();
  }

  submitNewCreditCard = async () => {
    const data = get(this.state, 'newCreditCardInfo.value');
    if (!data || !this.state.stripe) {
      this.setState({ error: 'There was a problem initializing the payment form' });
    } else if (data.error) {
      this.setState({ error: data.error.message });
    } else {
      try {
        this.setState({ submitting: true });
        const { token, error } = await this.state.stripe.createToken();
        if (error) {
          throw error;
        }
        const newStripePaymentMethod = stripeTokenToPaymentMethod(token);
        const newCreditCardInfo = merge(newStripePaymentMethod.data, pick(newStripePaymentMethod, ['token']));
        const res = await this.props.createCreditCardEditCollective({
          variables: {
            creditCardInfo: newCreditCardInfo,
            name: get(newStripePaymentMethod, 'name'),
            account: { legacyId: this.props.data.Collective.id },
          },
        });

        const { paymentMethod, stripeError } = res.data.addCreditCard;

        if (stripeError) {
          this.handleStripeError(paymentMethod, stripeError);
        } else {
          this.handleSuccess();
        }
      } catch (e) {
        this.setState({ error: e.message, submitting: false });
      }
    }
  };

  handleSuccess = () => {
    this.props.data.refetch();
    this.setState({
      showCreditCardForm: false,
      error: null,
      newCreditCardInfo: null,
      submitting: false,
    });
  };

  handleStripeError = async (paymentMethod, stripeError) => {
    const { message, response } = stripeError;

    if (!response) {
      this.setState({ error: message, submitting: false });
      return;
    }

    if (response.setupIntent) {
      const stripe = await getStripe();
      const result = await stripe.handleCardSetup(response.setupIntent.client_secret);
      if (result.error) {
        this.setState({ submitting: false, error: result.error.message });
      } else {
        try {
          await this.props.confirmCreditCardEditCollective({
            variables: { paymentMethod: { id: paymentMethod.id } },
          });
          this.handleSuccess();
        } catch (error) {
          this.setState({ submitting: false, error: result.error.message });
        }
      }
    }
  };

  updatePaymentMethod = async paymentMethod => {
    this.setState({ savingId: paymentMethod.id });
    try {
      await this.props.updatePaymentMethod({ variables: paymentMethod });
      await this.props.data.refetch();
      this.setState({ savingId: null });
    } catch (e) {
      this.showError(e.message);
      this.setState({ savingId: null });
    }
  };

  removePaymentMethod = async paymentMethod => {
    const pmLabel = paymentMethodLabel(this.props.intl, paymentMethod, get(this.props.data, 'Collective.name'));
    const confirmQuestion = this.props.intl.formatMessage(this.messages['removeConfirm']);
    if (confirm(`${pmLabel} - ${confirmQuestion}`)) {
      try {
        this.setState({ removedId: paymentMethod.id });
        await this.props.removePaymentMethod({ variables: { id: paymentMethod.id } });
        this.setState({ error: null });
        await this.props.data.refetch();
      } catch (e) {
        this.showError(getErrorFromGraphqlException(e));
      }
    }
    this.setState({ removedId: null });
  };

  showError = error => {
    this.setState({ error });
    window.scrollTo(0, 0);
  };

  getPaymentMethodsToDisplay() {
    const paymentMethods = get(this.props, 'data.Collective.paymentMethods', []).filter(
      pm => pm.balance > 0 || (pm.type === 'virtualcard' && pm.monthlyLimitPerMember),
    );
    return sortBy(paymentMethods, ['type', 'id']);
  }

  renderError(error) {
    if (typeof error === 'string') {
      return error;
    } else if (isErrorType(error, 'PM.Remove.HasActiveSubscriptions')) {
      return (
        <React.Fragment>
          <FormattedMessage
            id="errors.PM.Remove.HasActiveSubscriptions"
            defaultMessage="This payment method cannot be removed because it has active recurring financial contributions."
          />{' '}
          <Link route="recurring-contributions" params={{ slug: this.props.collectiveSlug }}>
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
  }

  render() {
    const { Collective, loading } = this.props.data;
    const { showCreditCardForm, error, submitting, removedId, savingId } = this.state;
    const paymentMethods = this.getPaymentMethodsToDisplay();
    return loading ? (
      <Loading />
    ) : (
      <Flex className="EditPaymentMethods" flexDirection="column">
        <SettingsTitle>
          <FormattedMessage id="editCollective.menu.paymentMethods" defaultMessage="Payment Methods" />
        </SettingsTitle>
        {error && (
          <MessageBox type="error" withIcon mb={4}>
            {this.renderError(error)}
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
                  onSave={pm => this.updatePaymentMethod(pm)}
                  onRemove={pm => this.removePaymentMethod(pm)}
                  isSaving={pm.id === savingId}
                />
              </Container>
            ))}
          </Flex>
        }
        {!showCreditCardForm && (
          <Flex alignItems="center" mx={3} my={4} flexDirection="column">
            <StyledButton
              buttonStyle="standard"
              buttonSize="large"
              onClick={() => this.setState({ showCreditCardForm: true })}
            >
              <Add size="1em" />
              {'  '}
              <FormattedMessage id="paymentMethods.creditcard.add" defaultMessage="Add a credit card" />
            </StyledButton>
            <Span fontSize="12px" mt={2} color="black.600">
              <FormattedMessage
                id="paymentMethods.creditcard.add.info"
                defaultMessage="To make donations as {contributeAs}"
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
                onChange={newCreditCardInfo => this.setState({ newCreditCardInfo, error: null })}
                onReady={({ stripe }) => this.setState({ stripe })}
              />
            </Box>
            <Box my={2}>
              <StyledButton
                mr={2}
                buttonStyle="standard"
                buttonSize="medium"
                onClick={() => this.setState({ showCreditCardForm: false, error: null })}
                disabled={submitting}
              >
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </StyledButton>
              <StyledButton
                buttonStyle="primary"
                buttonSize="medium"
                type="submit"
                onClick={this.submitNewCreditCard}
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
}

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
        addedFunds
        addedFundsLimit
        bankTransfers
        bankTransfersLimit
        hostedCollectives
        hostedCollectivesLimit
        manualPayments
        name
      }
      paymentMethods(types: ["creditcard", "virtualcard", "prepaid"]) {
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

export default injectIntl(withStripeLoader(addGraphql(EditPaymentMethods)));
