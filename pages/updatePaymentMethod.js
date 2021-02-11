import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';
import { maxWidth } from 'styled-system';

import { formatCurrency } from '../lib/currency-utils';
import { subscriptionsQuery } from '../lib/graphql/queries';
import { getStripe, stripeTokenToPaymentMethod } from '../lib/stripe';
import { compose } from '../lib/utils';

import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import HappyBackground from '../components/gift-cards/HappyBackground';
import { Box, Flex } from '../components/Grid';
import Link from '../components/Link';
import Loading from '../components/Loading';
import NewCreditCardForm from '../components/NewCreditCardForm';
import Page from '../components/Page';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import { withStripeLoader } from '../components/StripeProvider';
import StyledButton from '../components/StyledButton';
import { H1, H5 } from '../components/Text';
import { withUser } from '../components/UserProvider';

const ShadowBox = styled(Box)`
  box-shadow: 0px 8px 16px rgba(20, 20, 20, 0.12);
`;

const Subtitle = styled(H5)`
  color: white;
  text-align: center;
  margin: 0 auto;
  ${maxWidth};
`;

const AlignedBullets = styled.ul`
  margin: auto;
  text-align: left;
  width: max-content;
`;

class UpdatePaymentPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, id } }) {
    console.log(`Updating Payment Method: ${collectiveSlug} ${id}`);
    return { slug: collectiveSlug, id: Number(id) };
  }

  static propTypes = {
    collective: PropTypes.object,
    slug: PropTypes.string,
    id: PropTypes.number,
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    data: PropTypes.object,
    subscriptions: PropTypes.array,
    intl: PropTypes.object.isRequired,
    replaceCreditCard: PropTypes.func.isRequired,
    loadStripe: PropTypes.func.isRequired,
  };

  state = {
    showCreditCardForm: true,
    newCreditCardInfo: {},
    error: null,
    stripe: null,
    submitting: false,
    success: false,
  };

  componentDidMount() {
    this.props.loadStripe();
  }

  replaceCreditCard = async () => {
    const data = get(this.state, 'newCreditCardInfo.value');

    if (!data || !this.state.stripe) {
      this.setState({
        error: 'There was a problem initializing the payment form',
        submitting: false,
        showCreditCardForm: false,
      });
    } else if (data.error) {
      this.setState({ error: data.error.message, submitting: false, showCreditCardForm: false });
    } else {
      try {
        this.setState({ submitting: true });
        const { token, error } = await this.state.stripe.createToken();
        if (error) {
          this.setState({ error: 'There was a problem with Stripe.', submitting: false, showCreditCardForm: false });
          throw error;
        }
        const paymentMethod = stripeTokenToPaymentMethod(token);
        const res = await this.props.replaceCreditCard({
          variables: {
            CollectiveId: this.props.LoggedInUser.collective.id,
            ...paymentMethod,
            id: parseInt(this.props.id),
          },
        });
        const updatedCreditCard = res.data.replaceCreditCard;

        if (updatedCreditCard.stripeError) {
          this.handleStripeError(updatedCreditCard.stripeError);
        } else {
          this.handleSuccess();
        }
      } catch (e) {
        const message = e.message;
        this.setState({ error: message, submitting: false, showCreditCardForm: false });
      }
    }
  };

  handleSuccess = () => {
    this.setState({
      showCreditCardForm: false,
      showManualPaymentMethodForm: false,
      error: null,
      newCreditCardInfo: {},
      submitting: false,
      success: true,
    });
  };

  handleReload = () => {
    this.props.data.refetch();
    this.setState({
      showCreditCardForm: true,
      showManualPaymentMethodForm: false,
      error: null,
      newCreditCardInfo: null,
      submitting: false,
    });
  };

  handleStripeError = async ({ message, response }) => {
    if (!response) {
      this.setState({ error: message, submitting: false, showCreditCardForm: false });
      return;
    }

    if (response.setupIntent) {
      const stripe = await getStripe();
      const result = await stripe.handleCardSetup(response.setupIntent.client_secret);
      if (result.error) {
        this.setState({ submitting: false, error: result.error.message, showCreditCardForm: false });
      }
      if (result.setupIntent && result.setupIntent.status === 'succeeded') {
        this.handleSuccess();
      }
    }
  };

  render() {
    const { showCreditCardForm, submitting, error, success } = this.state;
    const { LoggedInUser, loadingLoggedInUser, data } = this.props;

    if (!LoggedInUser && !loadingLoggedInUser) {
      return (
        <Page>
          <Flex justifyContent="center" p={5}>
            <SignInOrJoinFree />
          </Flex>
        </Page>
      );
    } else if (loadingLoggedInUser || (data && data.loading)) {
      return (
        <Page>
          <Flex justifyContent="center" py={6}>
            <Loading />
          </Flex>
        </Page>
      );
    } else if (!data) {
      return <ErrorPage />;
    } else if (data && data.error) {
      return <ErrorPage data={data} />;
    }

    const filteredSubscriptions = this.props.subscriptions.filter(
      sub => sub.paymentMethod && sub.paymentMethod.id === this.props.id,
    );

    return (
      <div className="UpdatedPaymentMethodPage">
        <Page>
          <Flex alignItems="center" flexDirection="column">
            <HappyBackground>
              <Box mt={5}>
                <H1 color="white.full" fontSize={['3rem', null, '4rem']} textAlign="center">
                  <FormattedMessage id="updatePaymentMethod.title" defaultMessage="Update Payment Method" />
                </H1>
              </Box>

              <Box mt={3}>
                <Subtitle fontSize={['1.5rem', null, '2rem']} maxWidth={['90%', '640px']}>
                  <Box>
                    <FormattedMessage
                      id="updatePaymentMethod.subtitle.line"
                      defaultMessage="Please add a new payment method for the following subscriptions before your current one expires."
                    />
                  </Box>
                </Subtitle>
              </Box>

              <Box mt={3}>
                <Subtitle fontSize={['1.5rem', null, '2rem']} maxWidth={['90%', '640px']}>
                  <Box alignItems="left">
                    <AlignedBullets>
                      {filteredSubscriptions.map(sub => {
                        return (
                          <li key={sub.id}>
                            {sub.collective.name}:{' '}
                            {formatCurrency(sub.totalAmount, sub.currency, {
                              precision: 2,
                            })}{' '}
                            ({sub.interval}ly)
                          </li>
                        );
                      })}
                    </AlignedBullets>
                  </Box>
                </Subtitle>
              </Box>
            </HappyBackground>
            <Flex alignItems="center" flexDirection="column" mt={-175} mb={4}>
              <Container mt={54} zIndex={2}>
                <Flex justifyContent="center" alignItems="center" flexDirection="column">
                  <Container background="white" borderRadius="16px" maxWidth="600px">
                    <ShadowBox py="24px" px="32px" minWidth="500px">
                      {showCreditCardForm && (
                        <Box mr={2} css={{ flexGrow: 1 }}>
                          <NewCreditCardForm
                            name="newCreditCardInfo"
                            profileType={get(this.props.collective, 'type')}
                            hasSaveCheckBox={false}
                            onChange={newCreditCardInfo => this.setState({ newCreditCardInfo, error: null })}
                            onReady={({ stripe }) => this.setState({ stripe })}
                          />
                        </Box>
                      )}
                      {!showCreditCardForm && error}
                      {!showCreditCardForm && success && (
                        <FormattedMessage
                          id="updatePaymentMethod.form.success"
                          defaultMessage="Your new card info has been added"
                        />
                      )}
                    </ShadowBox>
                  </Container>
                  <Flex mt={5} mb={4} px={2} flexDirection="column" alignItems="center">
                    {showCreditCardForm && (
                      <StyledButton
                        buttonStyle="primary"
                        buttonSize="large"
                        mb={2}
                        maxWidth={335}
                        width={1}
                        type="submit"
                        onClick={this.replaceCreditCard}
                        disabled={submitting}
                        loading={submitting}
                        textTransform="capitalize"
                      >
                        <FormattedMessage
                          id="updatePaymentMethod.form.updatePaymentMethod.btn"
                          defaultMessage="update"
                        />
                      </StyledButton>
                    )}
                    {!showCreditCardForm && error && (
                      <StyledButton
                        buttonStyle="primary"
                        buttonSize="large"
                        mb={2}
                        maxWidth={335}
                        width={1}
                        onClick={this.handleReload}
                      >
                        <FormattedMessage
                          id="updatePaymentMethod.form.updatePaymentMethodError.btn"
                          defaultMessage="Try again"
                        />
                      </StyledButton>
                    )}
                    {!showCreditCardForm && success && (
                      <Link route={`/${this.props.slug}`}>
                        <StyledButton
                          buttonStyle="primary"
                          buttonSize="large"
                          mb={2}
                          maxWidth={335}
                          width={1}
                          textTransform="capitalize"
                        >
                          <FormattedMessage
                            id="updatePaymentMethod.form.updatePaymentMethodSuccess.btn"
                            defaultMessage="Go to Collective page"
                          />
                        </StyledButton>
                      </Link>
                    )}
                  </Flex>
                </Flex>
              </Container>
            </Flex>
          </Flex>
        </Page>
      </div>
    );
  }
}

const replaceCreditCardMutation = gql`
  mutation ReplaceCreditCard(
    $id: Int!
    $CollectiveId: Int!
    $name: String!
    $token: String!
    $data: StripeCreditCardDataInputType!
  ) {
    replaceCreditCard(CollectiveId: $CollectiveId, name: $name, token: $token, data: $data, id: $id) {
      id
      data
      createdAt
    }
  }
`;

const addReplaceCreditCardMutation = graphql(replaceCreditCardMutation, {
  name: 'replaceCreditCard',
});

const addSubscriptionsData = graphql(subscriptionsQuery, {
  options: props => ({
    variables: {
      slug: props.slug,
    },
  }),

  skip: props => {
    return props.loadingLoggedInUser || !props.LoggedInUser;
  },

  props: ({ data }) => {
    let subscriptions = [];

    if (data && data.Collective) {
      subscriptions = data.Collective.ordersFromCollective.filter(sub => sub.isSubscriptionActive === true);
    }

    return {
      data,
      subscriptions,
    };
  },
});

const addGraphql = compose(addSubscriptionsData, addReplaceCreditCardMutation);

export default injectIntl(withUser(addGraphql(withStripeLoader(UpdatePaymentPage))));
