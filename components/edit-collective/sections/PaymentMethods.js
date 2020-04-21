import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import { set, get, sortBy } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import { Add } from '@styled-icons/material/Add';

import { getErrorFromGraphqlException, isErrorType } from '../../../lib/errors';
import { compose } from '../../../lib/utils';
import { addEditCollectiveMutation } from '../../../lib/graphql/mutations';
import { paymentMethodLabel } from '../../../lib/payment_method_label';
import { getStripe, stripeTokenToPaymentMethod } from '../../../lib/stripe';

import { H3, Span } from '../../Text';
import Link from '../../Link';
import Loading from '../../Loading';
import StyledButton from '../../StyledButton';
import Container from '../../Container';
import { withStripeLoader } from '../../StripeProvider';
import NewCreditCardForm from '../../NewCreditCardForm';
import MessageBox from '../../MessageBox';

import EditReceivingSendingMoney from '../EditReceivingSendingMoney';
import EditPaymentMethod from '../EditPaymentMethod';
import BankTransfer from './BankTransfer';

class EditPaymentMethods extends React.Component {
  static propTypes = {
    collectiveSlug: PropTypes.string.isRequired,
    /** From graphql query */
    data: PropTypes.object.isRequired,
    /** From intl */
    intl: PropTypes.object.isRequired,
    /** From graphql query */
    addCreditCard: PropTypes.func.isRequired,
    /** From graphql query */
    removePaymentMethod: PropTypes.func.isRequired,
    /** From graphql query */
    updatePaymentMethod: PropTypes.func.isRequired,
    /** From graphql query */
    editCollective: PropTypes.func.isRequired,
    /** From stripeLoader */
    loadStripe: PropTypes.func.isRequired,
    receivingSection: PropTypes.bool,
    sendingSection: PropTypes.bool,
    collective: PropTypes.object,
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

  updateBankDetails = async () => {
    if (!this.state.bankDetails) {
      this.setState({ showCreditCardForm: false, error: null, showManualPaymentMethodForm: false, submitting: false });
      return;
    }
    const { Collective } = this.props.data;
    const CollectiveInputType = { id: Collective.id, settings: Collective.settings || {} };
    set(CollectiveInputType, 'settings.paymentMethods.manual.instructions', this.state.bankDetails.instructions);
    this.setState({ submitting: true });
    try {
      await this.props.editCollective(CollectiveInputType);
      this.handleSuccess();
    } catch (e) {
      this.setState({ error: e.message });
    } finally {
      this.setState({ submitting: false });
    }
  };

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
        const paymentMethod = stripeTokenToPaymentMethod(token);
        const res = await this.props.addCreditCard({ CollectiveId: this.props.data.Collective.id, ...paymentMethod });
        const createdCreditCard = res.data.createCreditCard;

        if (createdCreditCard.stripeError) {
          this.handleStripeError(createdCreditCard.stripeError);
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
      showManualPaymentMethodForm: false,
      error: null,
      newCreditCardInfo: null,
      submitting: false,
    });
  };

  handleStripeError = async ({ message, response }) => {
    if (!response) {
      this.setState({ error: message, submitting: false });
      return;
    }

    if (response.setupIntent) {
      const stripe = await getStripe();
      const result = await stripe.handleCardSetup(response.setupIntent.client_secret);
      if (result.error) {
        this.setState({ submitting: false, error: result.error.message });
      }
      if (result.setupIntent && result.setupIntent.status === 'succeeded') {
        this.handleSuccess();
      }
    }
  };

  updatePaymentMethod = async paymentMethod => {
    this.setState({ savingId: paymentMethod.id });
    try {
      await this.props.updatePaymentMethod(paymentMethod);
      await this.props.data.refetch();
      this.setState({ savingId: null });
    } catch (e) {
      this.showError(e.message);
      this.setState({ savingId: null });
    }
  };

  removePaymentMethod = async pm => {
    const pmLabel = paymentMethodLabel(this.props.intl, pm, get(this.props.data, 'Collective.name'));
    const confirmQuestion = this.props.intl.formatMessage(this.messages['removeConfirm']);
    if (confirm(`${pmLabel} - ${confirmQuestion}`)) {
      try {
        this.setState({ removedId: pm.id });
        await this.props.removePaymentMethod(pm.id);
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

  showManualPaymentMethod = (formvalue, setError) => {
    if (setError) {
      this.setState({ showManualPaymentMethodForm: formvalue, error: null });
    } else {
      this.setState({ showManualPaymentMethodForm: formvalue });
    }
  };

  setBankDetails = bankDetails => {
    this.setState({ bankDetails, error: null });
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
          <Link route="subscriptions" params={{ collectiveSlug: this.props.collectiveSlug }}>
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
    const { showCreditCardForm, showManualPaymentMethodForm, error, submitting, removedId, savingId } = this.state;
    const { Collective, loading } = this.props.data;
    const paymentMethods = this.getPaymentMethodsToDisplay();
    const showEditManualPaymentMethod =
      !showCreditCardForm && !showManualPaymentMethodForm && get(Collective, 'isHost');
    return loading ? (
      <Loading />
    ) : (
      <Flex className="EditPaymentMethods" flexDirection="column">
        {error && (
          <MessageBox type="error" withIcon mb={4}>
            {this.renderError(error)}
          </MessageBox>
        )}
        {this.props.sendingSection && !showManualPaymentMethodForm && (
          <Flex className="paymentMethods" flexDirection="column" my={2}>
            <H3>
              <FormattedMessage id="paymentMethods.send.title" defaultMessage="Sending money" />
            </H3>
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
        )}
        {this.props.sendingSection && !showCreditCardForm && !showManualPaymentMethodForm && (
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
            <Span fontSize="Caption" mt={2} color="black.600">
              <FormattedMessage
                id="paymentMethods.creditcard.add.info"
                defaultMessage="To make donations as {contributeAs}"
                values={{ contributeAs: Collective.name }}
              />
            </Span>
          </Flex>
        )}
        {this.props.receivingSection && showEditManualPaymentMethod && (
          <React.Fragment>
            <H3>
              <FormattedMessage id="editCollective.receivingMoney" defaultMessage="Receiving Money" />
            </H3>
            <EditReceivingSendingMoney
              collective={this.props.collective}
              connectedAccounts={this.props.collective.connectedAccounts}
              sendingMoney={false}
            />
          </React.Fragment>
        )}
        {this.props.receivingSection && (
          <BankTransfer
            data={this.props.data}
            receivingSection={this.props.receivingSection}
            showEditManualPaymentMethod={showEditManualPaymentMethod}
            submitting={submitting}
            showManualPaymentMethodForm={showManualPaymentMethodForm}
            setBankDetails={this.setBankDetails}
            updateBankDetails={this.updateBankDetails}
            showManualPaymentMethod={this.showManualPaymentMethod}
          ></BankTransfer>
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
            <H3 mr={4}>
              <FormattedMessage id="paymentMethod.add" defaultMessage="New Credit Card" />
            </H3>
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

const getPaymentMethods = graphql(gql`
  query Collective($collectiveSlug: String) {
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
        hostDashboard
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
`);

export const addCreditCard = graphql(
  gql`
    mutation addCreditCard(
      $CollectiveId: Int!
      $name: String!
      $token: String!
      $data: StripeCreditCardDataInputType!
      $monthlyLimitPerMember: Int
    ) {
      createCreditCard(
        CollectiveId: $CollectiveId
        name: $name
        token: $token
        data: $data
        monthlyLimitPerMember: $monthlyLimitPerMember
      ) {
        id
        stripeError {
          message
          response
        }
      }
    }
  `,
  {
    props: ({ mutate }) => ({
      addCreditCard: variables => mutate({ variables }),
    }),
  },
);

const removePaymentMethod = graphql(
  gql`
    mutation removePaymentMethod($id: Int!) {
      removePaymentMethod(id: $id) {
        id
      }
    }
  `,
  {
    props: ({ mutate }) => ({
      removePaymentMethod: id => mutate({ variables: { id } }),
    }),
  },
);

const updatePaymentMethod = graphql(
  gql`
    mutation updatePaymentMethod($id: Int!, $monthlyLimitPerMember: Int) {
      updatePaymentMethod(id: $id, monthlyLimitPerMember: $monthlyLimitPerMember) {
        id
      }
    }
  `,
  {
    props: ({ mutate }) => ({
      updatePaymentMethod: paymentMethod => mutate({ variables: paymentMethod }),
    }),
  },
);

const addData = compose(
  getPaymentMethods,
  removePaymentMethod,
  updatePaymentMethod,
  addEditCollectiveMutation,
  addCreditCard,
);

export default injectIntl(withStripeLoader(addData(EditPaymentMethods)));
