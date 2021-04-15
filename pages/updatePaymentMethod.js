import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { get } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';
import { maxWidth } from 'styled-system';

import { formatCurrency } from '../lib/currency-utils';
import { subscriptionsQuery } from '../lib/graphql/queries';
import { stripeTokenToPaymentMethod } from '../lib/stripe';
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

function UpdatePaymentPage(props) {
  const stripe = useStripe();
  const elements = useElements();
  const [showCreditCardForm, setShowCreditCardForm] = useState(true);
  const [newCreditCardInfo, setNewCreditCardInfo] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const replaceCreditCard = async () => {
    const data = newCreditCardInfo.value;

    if (!data || !stripe) {
      setError('There was a problem initializing the payment form');
      setSubmitting(false);
      setShowCreditCardForm(false);
    } else if (data.error) {
      setError(data.error.message);
      setSubmitting(false);
      setShowCreditCardForm(false);
    } else {
      try {
        setSubmitting(true);
        const cardElement = elements.getElement(CardElement);
        const { token, error } = await elements.createToken(cardElement);
        if (error) {
          setError('There was a problem with Stripe.');
          setSubmitting(false);
          setShowCreditCardForm(false);
          throw error;
        }
        const paymentMethod = stripeTokenToPaymentMethod(token);
        const res = await props.replaceCreditCard({
          variables: {
            CollectiveId: props.LoggedInUser.collective.id,
            ...paymentMethod,
            id: parseInt(props.id),
          },
        });
        const updatedCreditCard = res.data.replaceCreditCard;

        if (updatedCreditCard.stripeError) {
          handleStripeError(updatedCreditCard.stripeError);
        } else {
          handleSuccess();
        }
      } catch (e) {
        const message = e.message;
        setError(message);
        setSubmitting(false);
        setShowCreditCardForm(false);
      }
    }
  };

  const handleSuccess = () => {
    setShowCreditCardForm(false);
    setError(null);
    setNewCreditCardInfo({});
    setSubmitting(false);
    setSuccess(true);
  };

  const handleReload = () => {
    props.data.refetch();
    setShowCreditCardForm(true);
    setError(null);
    setNewCreditCardInfo(null);
    setSubmitting(false);
  };

  const handleStripeError = async ({ message, response }) => {
    if (!response) {
      setError(message);
      setSubmitting(false);
      setShowCreditCardForm(false);
      return;
    }

    if (response.setupIntent) {
      const result = await stripe.handleCardSetup(response.setupIntent.client_secret);
      if (result.error) {
        setSubmitting(false);
        setError(result.error.message);
        setShowCreditCardForm(false);
      }
      if (result.setupIntent && result.setupIntent.status === 'succeeded') {
        handleSuccess();
      }
    }
  };

  const { LoggedInUser, loadingLoggedInUser, data } = props;

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

  const filteredSubscriptions = props.subscriptions.filter(
    sub => sub.paymentMethod && sub.paymentMethod.id === props.id,
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
                          profileType={get(props.collective, 'type')}
                          hasSaveCheckBox={false}
                          onChange={newCreditCardInfo => {
                            setNewCreditCardInfo(newCreditCardInfo);
                            setError(null);
                          }}
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
                      onClick={replaceCreditCard}
                      disabled={submitting}
                      loading={submitting}
                      textTransform="capitalize"
                    >
                      <FormattedMessage id="updatePaymentMethod.form.updatePaymentMethod.btn" defaultMessage="update" />
                    </StyledButton>
                  )}
                  {!showCreditCardForm && error && (
                    <StyledButton
                      buttonStyle="primary"
                      buttonSize="large"
                      mb={2}
                      maxWidth={335}
                      width={1}
                      onClick={handleReload}
                    >
                      <FormattedMessage
                        id="updatePaymentMethod.form.updatePaymentMethodError.btn"
                        defaultMessage="Try again"
                      />
                    </StyledButton>
                  )}
                  {!showCreditCardForm && success && (
                    <Link href={`/${props.slug}`}>
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

UpdatePaymentPage.getInitialProps = async ({ query: { collectiveSlug, id } }) => {
  return { slug: collectiveSlug, id: Number(id) };
};

UpdatePaymentPage.propTypes = {
  collective: PropTypes.object,
  slug: PropTypes.string,
  id: PropTypes.number,
  LoggedInUser: PropTypes.object,
  loadingLoggedInUser: PropTypes.bool,
  data: PropTypes.object,
  subscriptions: PropTypes.array,
  intl: PropTypes.object.isRequired,
  replaceCreditCard: PropTypes.func.isRequired,
};

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

export default injectIntl(withUser(addGraphql(UpdatePaymentPage)));
