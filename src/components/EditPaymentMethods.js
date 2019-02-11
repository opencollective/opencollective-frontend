import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { graphql, compose } from 'react-apollo';
import { get, sortBy } from 'lodash';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Flex, Box } from '@rebass/grid';

import { Add } from 'styled-icons/material/Add.cjs';

import withIntl from '../lib/withIntl';
import { paymentMethodLabel } from '../lib/payment_method_label';
import { H3 } from './Text';
import Loading from './Loading';
import EditPaymentMethod from './EditPaymentMethod';
import StyledButton from './StyledButton';
import Container from './Container';
import { withStripeLoader } from './StripeProvider';
import NewCreditCardForm from './NewCreditCardForm';
import MessageBox from './MessageBox';
import { stripeTokenToPaymentMethod } from '../lib/stripe';

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
    hasForm: false,
    newCreditCardInfo: null,
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
        const paymentMethod = stripeTokenToPaymentMethod(token);
        await this.props.addCreditCard({ CollectiveId: this.props.data.Collective.id, ...paymentMethod });
        this.props.data.refetch();
        this.setState({ hasForm: false, error: null, newCreditCardInfo: null, submitting: false });
      } catch (e) {
        this.setState({ error: e.message, submitting: false });
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
      this.setState({ error: e.message, savingId: null });
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
        this.setState({ error: e.message });
      }
    }
    this.setState({ removedId: null });
  };

  getPaymentMethodsToDisplay() {
    const paymentMethods = get(this.props, 'data.Collective.paymentMethods', []).filter(
      pm => pm.balance > 0 || (pm.type === 'virtualcard' && pm.monthlyLimitPerMember),
    );
    return sortBy(paymentMethods, ['type', 'id']);
  }

  render() {
    const { hasForm, error, submitting, removedId, savingId } = this.state;
    const { Collective, loading } = this.props.data;
    const paymentMethods = this.getPaymentMethodsToDisplay();

    return loading ? (
      <Loading />
    ) : (
      <Flex className="EditPaymentMethods" flexDirection="column">
        <Flex className="paymentMethods" flexDirection="column" mb={2}>
          {paymentMethods.map(pm => (
            <Container
              className="paymentMethod"
              key={pm.id}
              mb={4}
              p={3}
              border="1px solid #dedede"
              boxShadow="0px 3px 18px #eaeaea"
              borderRadius={4}
              style={{ filter: pm.id === removedId ? 'blur(1px)' : 'none' }}
            >
              <EditPaymentMethod
                paymentMethod={pm}
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
        {error && (
          <MessageBox type="error" withIcon>
            {error}
          </MessageBox>
        )}
        {!hasForm ? (
          <Flex justifyContent="center" mx={3} mt={3} mb={4}>
            <Box>
              <StyledButton buttonStyle="standard" buttonSize="large" onClick={() => this.setState({ hasForm: true })}>
                <Add size="1em" />
                {'  '}
                <FormattedMessage id="paymentMethods.add" defaultMessage="Add a payment method" />
              </StyledButton>
            </Box>
          </Flex>
        ) : (
          <Container
            display="flex"
            alignItems="center"
            flexWrap="wrap"
            mt={2}
            mb={3}
            px={3}
            py={1}
            borderRadius={4}
            border="1px solid #dedede"
            boxShadow="0px 3px 18px #eaeaea"
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
                onClick={() => this.setState({ hasForm: false, error: null })}
                disabled={submitting}
              >
                <FormattedMessage id="paymentMethod.cancel" defaultMessage="Cancel" />
              </StyledButton>
              <StyledButton
                buttonStyle="primary"
                buttonSize="medium"
                type="submit"
                onClick={this.submitNewCreditCard}
                disabled={submitting}
                loading={submitting}
              >
                <FormattedMessage id="paymentMethod.save" defaultMessage="Save" />
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
      currency
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
        orders(hasActiveSubscription: true) {
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
  addCreditCard,
);

export default withIntl(withStripeLoader(addData(EditPaymentMethods)));
