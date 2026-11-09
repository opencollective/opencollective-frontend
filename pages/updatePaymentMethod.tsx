import React from 'react';
import { graphql } from '@apollo/client/react/hoc';
import { CardElement } from '@stripe/react-stripe-js';
import { get } from 'lodash-es';
import { FormattedMessage } from 'react-intl';
import { styled } from 'styled-components';
import { maxWidth } from 'styled-system';

import { formatCurrency } from '../lib/currency-utils';
import { API_V1_CONTEXT, gqlV1 } from '../lib/graphql/helpers';
import { getStripe, stripeTokenToPaymentMethod } from '../lib/stripe';
import { compose } from '../lib/utils';
import injectIntl from '@/lib/injectIntl';

import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import { Box, Flex } from '../components/Grid';
import HappyBackground from '../components/HappyBackground';
import Link from '../components/Link';
import LinkCollective from '../components/LinkCollective';
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

type UpdatePaymentPageProps = {
  paymentMethodId?: number;
  LoggedInUser?: { collective?: { id?: number } };
  loadingLoggedInUser?: boolean;
  intl?: import('react-intl').IntlShape;
  replaceCreditCard?: (options: unknown) => Promise<{
    data?: { replaceCreditCard?: Record<string, unknown> };
  }>;
  loadStripe?: () => Promise<unknown>;
  data?: {
    refetch?: (...args: unknown[]) => unknown;
    loading?: boolean;
    error?: unknown;
    PaymentMethod?: {
      id?: number;
      orders?: Array<{
        id?: number;
        fromCollective?: { slug?: string; name?: string };
        collective?: { slug?: string; name?: string };
        totalAmount?: number;
        currency?: string;
        interval?: string;
      }>;
    };
  };
};

type UpdatePaymentPageState = {
  showCreditCardForm: boolean;
  newCreditCardInfo: { value?: { error?: { message?: string } } };
  error: string | null;
  stripe: import('@stripe/stripe-js').Stripe;
  stripeElements: import('@stripe/stripe-js').StripeElements;
  submitting: boolean;
  success: boolean;
  showManualPaymentMethodForm?: boolean;
};

class UpdatePaymentPage extends React.Component<UpdatePaymentPageProps, UpdatePaymentPageState> {
  static getInitialProps({ query: { paymentMethodId } }) {
    return { paymentMethodId: parseInt(paymentMethodId) };
  }

  state = {
    showCreditCardForm: true,
    newCreditCardInfo: {},
    error: null,
    stripe: null,
    stripeElements: null,
    submitting: false,
    success: false,
  };

  componentDidMount() {
    this.props.loadStripe();
  }

  replaceCreditCard = async () => {
    const data = get(this.state, 'newCreditCardInfo.value') as { error?: { message?: string } } | undefined;

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
        const cardElement = this.state.stripeElements.getElement(CardElement);
        const { token, error } = await this.state.stripe.createToken(cardElement);
        if (error) {
          this.setState({ error: 'There was a problem with Stripe.', submitting: false, showCreditCardForm: false });
          throw error;
        }
        const paymentMethod = stripeTokenToPaymentMethod(token);
        const res = await this.props.replaceCreditCard({
          variables: {
            collectiveId: this.props.LoggedInUser.collective.id,
            ...paymentMethod,
            id: parseInt(String(this.props.paymentMethodId)),
          },
        });
        const updatedCreditCard = res.data.replaceCreditCard;

        if (updatedCreditCard.stripeError) {
          this.handleStripeError(updatedCreditCard.stripeError as never);
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
      const result = await stripe.confirmCardSetup(response.setupIntent.client_secret);
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
    const { LoggedInUser, loadingLoggedInUser, data, intl } = this.props;

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

    const orders = data.PaymentMethod?.orders || [];
    const hasForm = Boolean(showCreditCardForm && data.PaymentMethod && orders.length);
    const contributingAccount = orders[0]?.fromCollective || LoggedInUser.collective;
    return (
      <div className="UpdatedPaymentMethodPage">
        <Page>
          <Flex alignItems="center" flexDirection="column">
            <HappyBackground>
              <Box mt={5}>
                <H1 color="white.full" fontSize={['1.9rem', null, '2.5rem']} textAlign="center">
                  <FormattedMessage id="updatePaymentMethod.title" defaultMessage="Update Payment Method" />
                </H1>
              </Box>

              {Boolean(data.PaymentMethod && orders.length) && (
                <React.Fragment>
                  <Box mt={3}>
                    <Subtitle fontSize={['0.95rem', null, '1.25rem']}>
                      <Box>
                        <FormattedMessage
                          id="updatePaymentMethod.subtitle.line"
                          defaultMessage="Please add a new payment method for the following subscriptions before your current one expires."
                        />
                      </Box>
                    </Subtitle>
                  </Box>

                  <Box mt={3}>
                    <Subtitle fontSize={['0.95rem', null, '1.25rem']}>
                      <Box alignItems="left">
                        <AlignedBullets>
                          {orders.map(order => {
                            return (
                              <li key={order.id}>
                                <LinkCollective collective={order.collective} openInNewTab />:{' '}
                                {formatCurrency(
                                  order.totalAmount,
                                  order.currency as Parameters<typeof formatCurrency>[1],
                                  {
                                    precision: 2,
                                    locale: intl.locale,
                                  },
                                )}{' '}
                                ({order.interval}ly)
                              </li>
                            );
                          })}
                        </AlignedBullets>
                      </Box>
                    </Subtitle>
                  </Box>
                </React.Fragment>
              )}
            </HappyBackground>
            <Flex alignItems="center" flexDirection="column" mt={-175} mb={4}>
              <Container mt={54} zIndex={2}>
                <Flex justifyContent="center" alignItems="center" flexDirection="column">
                  <Container background="white" borderRadius="16px" maxWidth="600px">
                    <ShadowBox py="24px" px="32px" minWidth="500px">
                      {hasForm ? (
                        <Box mr={2} css={{ flexGrow: 1 }}>
                          <NewCreditCardForm
                            name="newCreditCardInfo"
                            hasSaveCheckBox={false}
                            onChange={newCreditCardInfo => this.setState({ newCreditCardInfo, error: null })}
                            onReady={({ stripe, stripeElements }) => this.setState({ stripe, stripeElements })}
                          />
                        </Box>
                      ) : error ? (
                        error
                      ) : success ? (
                        <FormattedMessage
                          id="updatePaymentMethod.form.success"
                          defaultMessage="Your new card info has been added."
                        />
                      ) : !data.PaymentMethod ? (
                        <FormattedMessage
                          defaultMessage="This payment method does not exist or has already been updated."
                          id="RiYYFO"
                        />
                      ) : !orders.length ? (
                        <FormattedMessage
                          defaultMessage="There are no active subscriptions linked to this payment method, it may have already been updated."
                          id="jor/DD"
                        />
                      ) : (
                        <FormattedMessage defaultMessage="An unexpected error occurred." id="3IKub9" />
                      )}
                    </ShadowBox>
                  </Container>
                  <Flex mt={5} mb={4} px={2} flexDirection="column" alignItems="center">
                    {hasForm && (
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
                    {!hasForm && error && (
                      <StyledButton
                        buttonStyle="primary"
                        buttonSize="large"
                        mb={2}
                        mt={3}
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
                    {!hasForm && success && (
                      <Box mt={3}>
                        <Link href={`/${(contributingAccount as { slug?: string }).slug}`}>
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
                              defaultMessage="Go to profile page"
                            />
                          </StyledButton>
                        </Link>
                      </Box>
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

const replaceCreditCardMutation = gqlV1 /* GraphQL */ `
  mutation ReplaceCreditCard(
    $id: Int!
    $collectiveId: Int!
    $name: String!
    $token: String!
    $data: StripeCreditCardDataInputType!
  ) {
    replaceCreditCard(CollectiveId: $collectiveId, name: $name, token: $token, data: $data, id: $id) {
      id
      data
      createdAt
    }
  }
`;

const subscriptionsQuery = gqlV1 /* GraphQL */ `
  query UpdateSubscriptionsForPaymentMethod($paymentMethodId: Int) {
    PaymentMethod(id: $paymentMethodId) {
      id
      orders(hasActiveSubscription: true) {
        id
        currency
        totalAmount
        interval
        createdAt
        fromCollective {
          id
          name
          slug
        }
        collective {
          id
          name
          slug
        }
      }
    }
  }
`;

const addReplaceCreditCardMutation = graphql(replaceCreditCardMutation, {
  name: 'replaceCreditCard',
  options: {
    context: API_V1_CONTEXT,
  },
});

const addSubscriptionsData = graphql(subscriptionsQuery, {
  options: {
    context: API_V1_CONTEXT,
  },
  skip: (props: UpdatePaymentPageProps) => {
    return props.loadingLoggedInUser || !props.LoggedInUser;
  },
});

const addGraphql = compose(addSubscriptionsData, addReplaceCreditCardMutation);

// next.js export
// ts-unused-exports:disable-next-line
export default injectIntl(withUser(addGraphql(withStripeLoader(UpdatePaymentPage))));
