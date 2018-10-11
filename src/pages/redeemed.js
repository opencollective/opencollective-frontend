import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import sanitizeHtml from 'sanitize-html';
import styled from 'styled-components';
import gql from 'graphql-tag';
import { Flex, Box } from 'grid-styled';
import { backgroundSize, fontSize, minHeight, maxWidth } from 'styled-system';
import { FormattedMessage } from 'react-intl';
import { get } from 'lodash';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectivesWithData from '../components/CollectivesWithData';
import Container from '../components/Container';
import { P, H1, H5 } from '../components/Text';
import GiftCard from '../components/GiftCard';
import SearchForm from '../components/SearchForm';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

const paymentMethodQuery = gql`
  query PaymentMethod($code: String) {
    PaymentMethod(code: $code) {
      id
      initialBalance
      monthlyLimitPerMember
      currency
      name
      collective {
        id
        name
        slug
      }
      emitter {
        id
        name
        slug
      }
    }
  }
`;

const Title = styled(H1)`
  color: white;
  ${fontSize};
`;

const Subtitle = styled(H5)`
  color: white;
  ${fontSize};
  ${maxWidth};
`;

const SearchFormContainer = styled(Box)`
  margin: 64px auto 32px;
  text-align: center;
`;

const Hero = styled(Box)`
  width: 100%;
  ${minHeight};
  background-image: url('/static/images/redeem-hero.svg');
  background-position: center top;
  background-repeat: no-repeat;
  background-size: auto 376px;
  ${backgroundSize};
`;

class RedeemedPage extends React.Component {
  static getInitialProps({
    query: { code, amount, name, emitterSlug, emitterName },
  }) {
    return {
      code,
      amount: amount && Number(amount),
      name: sanitizeHtml(name || '', {
        allowedTags: [],
        allowedAttributes: [],
      }),
      emitterSlug: sanitizeHtml(emitterSlug, {
        allowedTags: [],
        allowedAttributes: [],
      }),
      emitterName: sanitizeHtml(emitterName, {
        allowedTags: [],
        allowedAttributes: [],
      }),
    };
  }

  static propTypes = {
    client: PropTypes.object.isRequired,
    getLoggedInUser: PropTypes.func.isRequired,
    code: PropTypes.string,
    name: PropTypes.string,
    emitterSlug: PropTypes.string,
    emitterName: PropTypes.string,
    amount: PropTypes.number,
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
    const { getLoggedInUser, client, code } = this.props;

    getLoggedInUser().then(LoggedInUser => {
      this.setState({ LoggedInUser });
    });

    if (code) {
      client
        .query({ query: paymentMethodQuery, variables: { code } })
        .then(result => {
          const { PaymentMethod } = result.data;
          if (PaymentMethod) {
            this.setState({
              amount:
                PaymentMethod.initialBalance ||
                PaymentMethod.monthlyLimitPerMember,
              name: PaymentMethod.collective.name,
              collective: PaymentMethod.collective,
              emitter: PaymentMethod.emitter,
              currency: PaymentMethod.currency,
              loading: false,
            });
          }
        });
    }
  }

  render() {
    const {
      amount,
      emitter,
      collective,
      currency,
      LoggedInUser,
      loading,
    } = this.state;

    let error;
    if (get(LoggedInUser, 'collective.id') !== get(collective, 'id')) {
      error = 'account mismatch';
    }

    return (
      <div className="RedeemedPage">
        <Header
          title="Gift Card Redeemed"
          description="Use your gift card to support open source projects that you are contributing to."
          LoggedInUser={LoggedInUser}
        />

        <Body>
          <Flex alignItems="center" flexDirection="column">
            <Hero
              minHeight={['300px', null, '380px']}
              backgroundSize={['auto 300px', 'auto 380px']}
            >
              <Flex alignItems="center" flexDirection="column">
                <Box mt={5}>
                  <Title fontSize={['3rem', null, '4rem']}>
                    Gift Card Redeemed! 🎉
                  </Title>
                </Box>

                {error && (
                  <Box mt={2}>
                    <Subtitle
                      fontSize={['1.5rem', null, '2rem']}
                      maxWidth={['90%', '640px']}
                    >
                      Error: {error}
                    </Subtitle>
                  </Box>
                )}

                {!loading &&
                  !error && (
                    <Fragment>
                      <Box mt={2}>
                        <Subtitle
                          fontSize={['1.5rem', null, '2rem']}
                          maxWidth={['90%', '640px']}
                        >
                          <Box>
                            <FormattedMessage
                              id="redeemed.subtitle.line1"
                              defaultMessage="The card has been added to your account."
                            />
                          </Box>
                          <Box>
                            <FormattedMessage
                              id="redeemed.subtitle.line2"
                              defaultMessage="You can now donate to any collective of your choice."
                            />
                          </Box>
                        </Subtitle>
                      </Box>

                      <Box mt={[4, 5]}>
                        <GiftCard
                          amount={amount}
                          currency={currency || 'USD'}
                          emitter={emitter}
                          collective={collective}
                        />
                      </Box>
                    </Fragment>
                  )}
              </Flex>
            </Hero>

            <Box width={['320px', '640px']}>
              <SearchFormContainer>
                <Box mb={3}>
                  <H5>
                    <FormattedMessage
                      id="redeemed.findCollectives"
                      defaultMessage="Find open collectives to support."
                    />
                  </H5>
                </Box>
                <SearchForm fontSize="1.4rem" />
              </SearchFormContainer>
            </Box>

            <Box width={['320px', '640px']} my={3}>
              <P color="#76777A" textAlign="center">
                <FormattedMessage
                  id="redeemed.backyourstack"
                  defaultMessage="or discover the open source projects that your organization is depending on and that need funding on {link}"
                  values={{
                    link: (
                      <a href="https://backyourstack.com">BackYourStack.com</a>
                    ),
                  }}
                />
              </P>
            </Box>

            <P color="#76777A" textAlign="center">
              <FormattedMessage
                id="redeemed.suggestions"
                defaultMessage="or you can choose from these awesome collectives that are doing great work:"
              />
            </P>

            <Box mb={5}>
              <Container maxWidth="1200px">
                <CollectivesWithData
                  HostCollectiveId={11004} // hard-coded to only show open source projects
                  orderBy="balance"
                  orderDirection="DESC"
                  limit={12}
                />
              </Container>
            </Box>
          </Flex>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default withData(withIntl(withLoggedInUser(RedeemedPage)));
