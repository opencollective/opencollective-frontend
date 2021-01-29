import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import sanitizeHtml from 'sanitize-html';
import styled from 'styled-components';
import { fontSize, maxWidth } from 'styled-system';

import withData from '../lib/withData';

import Body from '../components/Body';
import CollectivesWithData from '../components/CollectivesWithData';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import Container from '../components/Container';
import Footer from '../components/Footer';
import GiftCard from '../components/GiftCard';
import { Box, Flex } from '../components/Grid';
import Header from '../components/Header';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import MessageBox from '../components/MessageBox';
import SearchForm from '../components/SearchForm';
import { H1, H5, P } from '../components/Text';
import { withUser } from '../components/UserProvider';
import CollectiveCard from '../components/virtual-cards/CollectiveCard';
import HappyBackground from '../components/virtual-cards/HappyBackground';

const redeemedPaymentMethodQuery = gql`
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

const SearchFormContainer = styled(Box)`
  margin: 64px auto 32px;
  text-align: center;
`;

class RedeemedPage extends React.Component {
  static getInitialProps({ query: { code, amount, name, emitterSlug, emitterName, collectiveSlug } }) {
    return {
      code,
      collectiveSlug,
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
          <Title fontSize={['3rem', null, '4rem']}>
            <FormattedMessage id="redeemed.success" defaultMessage="Gift Card Redeemed!" /> 🎉
          </Title>
          <Flex flexWrap="wrap" maxWidth={750} m="0 auto" alignItems="center">
            <Subtitle fontSize={['1.5rem', null, '2rem']} maxWidth={['90%', '640px']}>
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
    const recommendedCollectives = get(emitter, 'settings.recommendedCollectives');

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
                      {emitter && emitter.imageUrl && (
                        <Container position="absolute" top={[85, 115]} left={[10, 20]}>
                          <CollectiveCard
                            collective={emitter}
                            mb={3}
                            size={[48, 64]}
                            avatarSize={[24, 32]}
                            fontSize="14px"
                            boxShadow="0 0 8px rgba(0, 0, 0, 0.24) inset"
                            borderColor="blue.200"
                            p={2}
                          />
                        </Container>
                      )}
                    </Container>
                  )}
                </Container>
              )}

              {recommendedCollectives && (
                <Box my={5}>
                  <H5 textAlign={'center'}>
                    <FormattedMessage
                      id="redeemed.collective-recommendations"
                      defaultMessage="Collectives recommended by {emitter}"
                      values={{ emitter: emitter.name }}
                    />
                  </H5>
                  <Container maxWidth="1200px">
                    <CollectivesWithData
                      slugs={recommendedCollectives}
                      orderBy="name"
                      orderDirection="ASC"
                      limit={12}
                    />
                  </Container>
                </Box>
              )}

              <Box width={['320px', '640px']}>
                <SearchFormContainer>
                  <Box mb={3}>
                    <H5 textAlign="center">
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
                      link: <a href="https://backyourstack.com">BackYourStack.com</a>,
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
        </CollectiveThemeProvider>
        <Footer />
      </div>
    );
  }
}
const redeemedPageQuery = gql`
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

export default withUser(withData(addRedeemedPageData(RedeemedPage)));
