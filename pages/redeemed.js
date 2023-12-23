import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { fontSize, maxWidth } from 'styled-system';

import { gqlV1 } from '../lib/graphql/helpers';
import withData from '../lib/withData';

import Body from '../components/Body';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import Container from '../components/Container';
import HappyBackground from '../components/gift-cards/HappyBackground';
import GiftCard from '../components/GiftCard';
import { Box, Flex } from '../components/Grid';
import Header from '../components/Header';
import Link from '../components/Link';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import MessageBox from '../components/MessageBox';
import Footer from '../components/navigation/Footer';
import StyledButton from '../components/StyledButton';
import { H1, H5 } from '../components/Text';
import { withUser } from '../components/UserProvider';

const redeemedPaymentMethodQuery = gqlV1/* GraphQL */ `
  query RedeemedPaymentMethod($code: String) {
    PaymentMethod(code: $code) {
      id
      initialBalance
      monthlyLimitPerMember
      currency
      name
      expiryDate
      collective {
        id
        name
        slug
      }
      emitter {
        id
        name
        slug
        imageUrl
        settings
      }
    }
  }
`;

const Title = styled(H1)`
  color: white;
  text-align: center;
  ${fontSize};
`;

const Subtitle = styled(H5)`
  color: white;
  margin: 0 auto;
  text-align: center;
  ${fontSize};
  ${maxWidth};
`;

class RedeemedPage extends React.Component {
  static getInitialProps({ query: { code, amount, name, emitterSlug, emitterName, collectiveSlug } }) {
    return {
      code,
      collectiveSlug,
      amount: amount && Number(amount),
      name: name?.trim(),
      emitterSlug: emitterSlug?.trim(),
      emitterName: emitterName?.trim(),
    };
  }

  static propTypes = {
    client: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object,
    code: PropTypes.string,
    name: PropTypes.string,
    emitterSlug: PropTypes.string,
    emitterName: PropTypes.string,
    amount: PropTypes.number,
    data: PropTypes.object,
  };

  constructor(props) {
    super(props);

    if (!props.code) {
      this.state = {
        amount: props.amount,
        collective: {
          name: props.name,
        },
        emitter: {
          slug: props.emitterSlug,
          name: props.emitterName,
        },
      };
    } else {
      this.state = { loading: true };
    }
  }

  async componentDidMount() {
    const { client, code } = this.props;

    if (code) {
      client.query({ query: redeemedPaymentMethodQuery, variables: { code } }).then(result => {
        const { PaymentMethod } = result.data;
        if (PaymentMethod) {
          this.setState({
            amount: PaymentMethod.initialBalance || PaymentMethod.monthlyLimitPerMember,
            name: PaymentMethod.collective.name,
            collective: PaymentMethod.collective,
            emitter: PaymentMethod.emitter,
            currency: PaymentMethod.currency,
            expiryDate: PaymentMethod.expiryDate,
            loading: false,
          });
        }
      });
    }
  }

  renderHeroContent(loading, error) {
    if (loading) {
      return <LoadingPlaceholder height={104} with="100%" maxWidth={400} m="0 auto" borderRadius={16} />;
    } else if (error) {
      return (
        <MessageBox type="error" withIcon>
          <FormattedMessage id="redeemed.mismatch" defaultMessage="Accounts mismatch" />
        </MessageBox>
      );
    } else {
      return (
        <div>
          <Title fontSize={['1.9rem', null, '2.5rem']}>
            <FormattedMessage id="redeemed.success" defaultMessage="Gift Card Redeemed!" /> 🎉
          </Title>
          <Flex flexWrap="wrap" maxWidth={750} m="0 auto" alignItems="center">
            <Subtitle fontSize={['0.95rem', null, '1.25rem']} maxWidth={['90%', '640px']}>
              <Box>
                <FormattedMessage
                  id="redeemed.subtitle.line1"
                  defaultMessage="The card has been added to your account."
                />
              </Box>
              <Box>
                <FormattedMessage
                  id="redeemed.subtitle.line2"
                  defaultMessage="You can now contribute to the Collective(s) of your choice."
                />
              </Box>
            </Subtitle>
          </Flex>
        </div>
      );
    }
  }

  getError() {
    const { LoggedInUser } = this.props;
    const { collective } = this.state;
    if (LoggedInUser && collective && get(LoggedInUser, 'collective.id') !== get(collective, 'id')) {
      return 'account mismatch';
    }
  }

  render() {
    const { LoggedInUser, data } = this.props;
    const { amount, collective, currency, expiryDate, loading } = this.state;
    const error = this.getError();
    const emitter = this.state.emitter || (data && data.Collective);

    return (
      <div className="RedeemedPage">
        <Header
          title="Gift Card Redeemed"
          description="Use your gift card to support open source projects that you are contributing to."
          LoggedInUser={LoggedInUser}
        />

        <CollectiveThemeProvider collective={emitter}>
          <Body>
            <Flex alignItems="center" flexDirection="column">
              <HappyBackground collective={emitter}>
                <Box mt={5}>{this.renderHeroContent(loading, error)}</Box>
              </HappyBackground>

              {!error && (
                <Container mt={-125}>
                  {loading ? (
                    <LoadingPlaceholder width={['300px', '400px']} height={['168px', '224px']} borderRadius={16} />
                  ) : (
                    <Container position="relative">
                      <GiftCard
                        amount={amount}
                        currency={currency || 'USD'}
                        emitter={emitter}
                        collective={collective}
                        expiryDate={expiryDate}
                      />
                    </Container>
                  )}
                </Container>
              )}

              <Link href="/search">
                <StyledButton buttonStyle="primary" buttonSize="large" my={5}>
                  <FormattedMessage defaultMessage="Discover Collectives to Support" />
                </StyledButton>
              </Link>
            </Flex>
          </Body>
        </CollectiveThemeProvider>
        <Footer />
      </div>
    );
  }
}
const redeemedPageQuery = gqlV1/* GraphQL */ `
  query RedeemedPage($collectiveSlug: String!) {
    Collective(slug: $collectiveSlug) {
      id
      name
      type
      slug
      imageUrl
      backgroundImageUrl
      description
      settings
    }
  }
`;

const addRedeemedPageData = graphql(redeemedPageQuery, {
  skip: props => !props.collectiveSlug,
});

// ignore unused exports default
// next.js export
export default withUser(withData(addRedeemedPageData(RedeemedPage)));
