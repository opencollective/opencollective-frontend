import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages } from 'react-intl';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import { get } from 'lodash';
import { Box, Flex } from '@rebass/grid';
import styled from 'styled-components';
import themeGet from '@styled-system/theme-get';

import { Facebook } from 'styled-icons/fa-brands/Facebook';
import { Twitter } from 'styled-icons/fa-brands/Twitter';
import { Times } from 'styled-icons/fa-solid/Times';

import orderSuccessBackgroundUrl from '../static/images/order-success-background.svg';

import { tweetURL, facebooKShareURL, objectToQueryString } from '../lib/url_helpers';
import { formatCurrency } from '../lib/utils';
import withIntl from '../lib/withIntl';
import { Link } from '../server/pages';
import { withUser } from '../components/UserProvider';
import { H3, P, Span } from '../components/Text';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import { fadeIn } from '../components/StyledKeyframes';
import StyledButton from '../components/StyledButton';
import StyledLink from '../components/StyledLink';
import Loading from '../components/Loading';
import StyledCard from '../components/StyledCard';
import Container from '../components/Container';
import MessageBox from '../components/MessageBox';
import StyledInput from '../components/StyledInput';
import SpeechTriangle from '../components/icons/SpeechTriangle';
import Avatar from '../components/Avatar';

const OrderSuccessContainer = styled(Flex)`
  background: white url(${orderSuccessBackgroundUrl}) 0 0/100% no-repeat;
  min-height: 500px;

  @media (max-width: 1440px) {
    background-size: 1440px 304px;
  }
`;

const ShareLink = styled(StyledLink)`
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    margin-right: 8px;
  }
`;
ShareLink.defaultProps = {
  width: 160,
  buttonStyle: 'standard',
  buttonSize: 'medium',
  fontWeight: 600,
  mx: 2,
  mb: 2,
  target: '_blank',
  omitProps: StyledLink.defaultProps.omitProps,
};

const CollectiveLogoContainer = styled(Flex)`
  position: relative;
  border-top: 1px solid ${themeGet('colors.black.200')};
  justify-content: center;
  a {
    display: block;
    &:hover {
      opacity: 0.8;
    }
  }
  img {
    width: 48px;
    height: 48px;
    margin: 0 auto;
    background: ${themeGet('colors.black.100')};
    display: block;
    position: absolute;
    border-radius: 8px;
    margin-top: -24px;
  }
`;

const PublicMessagePopup = styled.div`
  position: relative;
  padding: 8px;
  margin-right: 32px;
  margin-left: 32px;
  margin-bottom: 32px;
  border: 1px solid #f3f3f3;
  border-radius: 8px;
  background: white;
  box-shadow: 0px 4px 8px rgba(20, 20, 20, 0.16);
  animation: ${fadeIn} 0.3s ease-in-out;

  @media screen and (min-width: 52em) {
    position: absolute;
    top: 0;
    left: 160px;
  }
`;

const SpeechCaret = styled(SpeechTriangle)`
  position: absolute;
  left: -26px;
  top: 15%;
  color: white;
  filter: drop-shadow(-4px 4px 2px rgba(20, 20, 20, 0.09));
  height: 32px;
  width: 32px;

  @media screen and (max-width: 510px) {
    display: none;
  }
`;

const PublicMessage = styled.p`
  font-size: ${themeGet('fontSizes.Tiny')}px;
  lineheight: ${themeGet('fontSizes.Caption')}px;
  color: ${themeGet('colors.black.600')};
  margin-top: 12px;
  text-align: center;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const publicMessageMaxLength = 140;

/**
 * A collective card to present collectives. This component only displays the
 * collective banner and the logo. What's displayed in the card body is up to you.
 */
const StyledCollectiveCard = ({ collective, children, ...props }) => {
  return (
    <StyledCard className="collective-card" {...props}>
      <CollectiveLogoContainer mt={47}>
        <Box mt={-32}>
          <Link route="collective" params={{ slug: collective.slug }}>
            <a>
              <Avatar src={collective.image} radius={48} name={collective.name} />
            </a>
          </Link>
        </Box>
      </CollectiveLogoContainer>
      <Container display="flex" mt={2} cursor="pointer" justifyContent="center">
        <Link route="collective" passHref params={{ slug: collective.slug }}>
          <StyledLink fontSize="Paragraph" fontWeight="bold" lineHeight="Caption" color="black.900">
            {collective.name}
          </StyledLink>
        </Link>
      </Container>
      {children}
    </StyledCard>
  );
};

StyledCollectiveCard.propTypes = {
  /** All props accepted by `StyledCard` */
  ...StyledCard.propTypes,
  /** The collective to display data for */
  collective: PropTypes.shape({
    settings: PropTypes.object,
    image: PropTypes.string,
    type: PropTypes.string,
    website: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
};

StyledCollectiveCard.defaultProps = { width: 160, mx: 'auto' };

class OrderSuccessPage extends React.Component {
  static propTypes = {
    OrderId: PropTypes.number.isRequired,
    data: PropTypes.object.isRequired, // from withData
    intl: PropTypes.object.isRequired, // from withIntl
    loggedInUserLoading: PropTypes.bool, // from withUser
    LoggedInUser: PropTypes.object, // from withUser
    updateOrderInfo: PropTypes.func.isRequired,
  };

  static getInitialProps({ query: { OrderId } }) {
    return { OrderId: parseInt(OrderId) };
  }

  constructor(props) {
    super(props);

    const messageInput = get(props, 'data.Order.publicMessage');
    this.state = {
      hasPublicMessagePopup: !messageInput,
      messageInput: messageInput || '',
      submitting: false,
    };

    this.messages = defineMessages({
      tweet: {
        id: 'order.created.tweet',
        defaultMessage: "I've just donated {amount} to {collective}. Consider donating too, every little helps!",
      },
      'tweet.event': {
        id: 'order.created.tweet.event',
        defaultMessage: "I'm attending {event}. Join me!",
      },
      publicMessagePlaceholder: {
        id: 'contribute.publicMessage.placeholder',
        defaultMessage: 'Motivate others to contribute in 140 characters :) ...',
      },
    });
  }

  componentDidMount() {
    if (!get(this.props, 'data.Order.publicMessage')) {
      this.setState({ hasPublicMessagePopup: true });
    } else {
      this.loadMessageInputFromProps();
    }
  }

  componentDidUpdate(oldProps) {
    if (get(this.props, 'data.Order.publicMessage') !== get(oldProps, 'data.Order.publicMessage')) {
      this.loadMessageInputFromProps();
    }
  }

  loadMessageInputFromProps() {
    this.setState({ messageInput: get(this.props, 'data.Order.publicMessage', '') });
  }

  submitPublicMessage = async () => {
    const publicMessage = this.state.messageInput.trim();
    try {
      this.setState({ submitting: true });
      await this.props.updateOrderInfo({ id: this.props.OrderId, publicMessage });
      this.setState({ submitting: false, hasPublicMessagePopup: false });
    } catch (e) {
      this.setState({ error: e.message, submitting: false });
    }
  };

  openPublicMessagePopup = () => {
    this.setState({
      messageInput: get(this.props, 'data.Order.publicMessage', ''),
      hasPublicMessagePopup: true,
    });
  };

  renderContributeDetailsSummary(amount, currency, interval) {
    const formattedAmount = formatCurrency(amount, currency);
    return !interval ? (
      formattedAmount
    ) : (
      <Span>
        {formattedAmount}{' '}
        <FormattedMessage
          id="tier.interval"
          defaultMessage="per {interval, select, month {month} year {year} other {}}"
          values={{ interval: interval }}
        />
      </Span>
    );
  }

  renderUserProfileBtn(loading = false) {
    return (
      <StyledButton buttonStyle="primary" fontWeight={600} loading={loading}>
        <FormattedMessage id="viewYourProfile" defaultMessage="View your profile" />
      </StyledButton>
    );
  }

  getTwitterMessage() {
    const { collective, totalAmount, currency } = this.props.data.Order;
    let msgId = 'tweet';
    const values = {
      collective: collective.twitterHandle ? `@${collective.twitterHandle}` : collective.name,
      amount: formatCurrency(totalAmount, currency, { precision: 0 }),
    };
    if (collective.type === 'EVENT') {
      msgId = 'tweet.event';
      values.event = collective.name;
    }
    return this.props.intl.formatMessage(this.messages[msgId], values);
  }

  renderContributionSummary(tier, collective, fromCollective) {
    if (!tier) {
      return (
        <FormattedMessage
          id="contributeFlow.successMessageBacker"
          defaultMessage="{fromCollectiveName, select, anonymous {You're} other {{fromCollectiveName} is}} now a backer of {collectiveName}!"
          values={{
            fromCollectiveName: fromCollective.name,
            collectiveName: collective.name,
          }}
        />
      );
    }

    return tier.type === 'TICKET' ? (
      <FormattedMessage
        id="contributeFlow.successMessageTicket"
        defaultMessage="{fromCollectiveName, select, anonymous {You've} other {{fromCollectiveName} has}} registered for the event {eventName} ({tierName})"
        values={{
          fromCollectiveName: fromCollective.name,
          eventName: <strong>{collective.name}</strong>,
          tierName: get(tier, 'name', 'ticket'),
        }}
      />
    ) : (
      <FormattedMessage
        id="contributeFlow.successMessage"
        defaultMessage="{fromCollectiveName, select, anonymous {You're} other {{fromCollectiveName} is}} now a member of {collectiveName}'s '{tierName}' tier!"
        values={{
          fromCollectiveName: fromCollective.name,
          collectiveName: <strong>{collective.name}</strong>,
          tierName: get(tier, 'name', 'backer'),
        }}
      />
    );
  }

  render() {
    const { data, LoggedInUser, loggedInUserLoading, intl } = this.props;

    if (data.loading) {
      return <Loading />;
    } else if (data.error || !data.Order) {
      return <ErrorPage data={data} />;
    }

    const order = data.Order;
    const { collective, fromCollective, totalAmount, interval, currency, tier } = order;
    const referralOpts = objectToQueryString({ referral: fromCollective.id });
    const websiteUrl = process.env.WEBSITE_URL || 'https://opencollective.com';
    const referralURL = `${websiteUrl}${collective.path}/${referralOpts}`;
    const message = this.getTwitterMessage();
    const isFreeTier = get(tier, 'amount') === 0 || (get(tier, 'presets') || []).includes(0);
    const isManualDonation = order.status === 'PENDING' && !order.paymentMethod && !isFreeTier;

    return (
      <Page title={'Contribute'}>
        <OrderSuccessContainer id="page-order-success" flexDirection="column" alignItems="center" mb={6}>
          {isManualDonation ? (
            <MessageBox type="warning" my={4} mx={2}>
              <FormattedMessage
                id="collective.user.orderProcessing.manual"
                defaultMessage="Your donation is pending. Please follow the instructions in the confirmation email to manually pay the host of the collective."
              />
            </MessageBox>
          ) : (
            <Box mt={100} mb={3}>
              <H3 fontWeight={800} color="black.900" mb={3} textAlign="center">
                <FormattedMessage id="contributeFlow.successTitle" defaultMessage="Woot woot! 🎉" />
              </H3>
              <P p={2} textAlign="center" style={{ maxWidth: 600 }}>
                {this.renderContributionSummary(tier, collective, fromCollective)}
              </P>
            </Box>
          )}

          <Container display="flex" position="relative" flexWrap="wrap" justifyContent="center" p={2} mb={4}>
            <StyledCollectiveCard mt={4} mb={32} collective={fromCollective} showCover={false}>
              <Flex flexDirection="column" p={12} alignItems="center">
                {totalAmount !== 0 && (
                  <React.Fragment>
                    <Span fontSize="10px">
                      <FormattedMessage id="contributeFlow.contributedTotal" defaultMessage="Contributed a total of:" />
                    </Span>
                    <Span fontWeight="bold" fontSize="Caption">
                      {this.renderContributeDetailsSummary(totalAmount, currency, interval)}
                    </Span>
                    {order.publicMessage && (
                      <Container textAlign="center" color="black.600">
                        <PublicMessage onClick={this.openPublicMessagePopup}>“{order.publicMessage}”</PublicMessage>
                      </Container>
                    )}
                    {!order.publicMessage && !this.state.hasPublicMessagePopup && (
                      <Span
                        mt={2}
                        cursor="pointer"
                        fontSize="Tiny"
                        color="black.600"
                        textAlign="center"
                        onClick={() => this.setState({ hasPublicMessagePopup: true })}
                      >
                        <FormattedMessage
                          id="contribute.publicMessage"
                          defaultMessage="Leave a public message (Optional)"
                        />
                      </Span>
                    )}
                  </React.Fragment>
                )}
              </Flex>
            </StyledCollectiveCard>
            {this.state.hasPublicMessagePopup && (
              <PublicMessagePopup data-cy="public-message-popup">
                <Flex justifyContent="flex-end">
                  <Times
                    size="1em"
                    color="#a2a2a2"
                    cursor="pointer"
                    onClick={() => this.setState({ hasPublicMessagePopup: false })}
                  />
                </Flex>
                <Flex flexDirection="column" p={2}>
                  <Span fontSize="Paragraph" color="black.600" mb={2}>
                    <FormattedMessage
                      id="contribute.publicMessage"
                      defaultMessage="Leave a public message (Optional)"
                    />
                  </Span>
                  <StyledInput
                    name="publicMessage"
                    as="textarea"
                    px={10}
                    py={10}
                    width={240}
                    height={112}
                    fontSize="Paragraph"
                    style={{ resize: 'none' }}
                    placeholder={intl.formatMessage(this.messages['publicMessagePlaceholder'])}
                    value={this.state.messageInput}
                    onChange={e => this.setState({ messageInput: e.target.value.slice(0, publicMessageMaxLength) })}
                    maxLength={publicMessageMaxLength}
                  />
                  {this.state.error && (
                    <Span color="red.500" fontSize="Caption" mt={2}>
                      {this.state.error}
                    </Span>
                  )}
                  <Box m="0 auto">
                    <StyledButton
                      buttonSize="small"
                      fontWeight="bold"
                      px={4}
                      mt={3}
                      onClick={this.submitPublicMessage}
                      loading={this.state.submitting}
                    >
                      <FormattedMessage id="button.submit" defaultMessage="Submit" />
                    </StyledButton>
                  </Box>
                </Flex>
                <SpeechCaret />
              </PublicMessagePopup>
            )}
          </Container>

          <Flex flexWrap="wrap" justifyContent="center" mt={2}>
            <ShareLink href={tweetURL({ url: referralURL, text: message })}>
              <Twitter size="1.2em" color="#38A1F3" />
              <FormattedMessage id="tweetIt" defaultMessage="Tweet it" />
            </ShareLink>
            <ShareLink href={facebooKShareURL({ u: referralURL })}>
              <Facebook size="1.2em" color="#3c5a99" />
              <FormattedMessage id="shareIt" defaultMessage="Share it" />
            </ShareLink>
          </Flex>
          <Box width={64} my={4} bg="black.300" css={{ height: '1px' }} />
          {collective.tags && (
            <Flex flexDirection="column" alignItems="center" mb={4}>
              <Span color="black.600">
                <FormattedMessage
                  id="contributeSuccess.discover"
                  defaultMessage="Discover other related collectives to support:"
                />
              </Span>
              <Flex mt={1} flexWrap="wrap" justifyContent="center" css={{ maxWidth: 500 }}>
                {collective.tags.map(tag => (
                  <Link key={tag} route="search" params={{ q: tag }} passHref>
                    <StyledLink fontSize="Paragraph" lineHeight="Caption" mr={1} textAlign="center">
                      #{tag}
                    </StyledLink>
                  </Link>
                ))}
              </Flex>
            </Flex>
          )}
          {!LoggedInUser && this.renderUserProfileBtn(true)}
          {LoggedInUser && !loggedInUserLoading && (
            <Link route="collective" params={{ slug: get(LoggedInUser, 'collective.slug', '') }} passHref>
              {this.renderUserProfileBtn()}
            </Link>
          )}
        </OrderSuccessContainer>
      </Page>
    );
  }
}

const getOrder = graphql(gql`
  query OrderSuccess($OrderId: Int!) {
    Order(id: $OrderId) {
      id
      quantity
      totalAmount
      interval
      currency
      status
      publicMessage
      fromCollective {
        id
        image
        name
        path
        slug
      }
      collective {
        name
        tags
        path
      }
      tier {
        type
        name
        amount
        presets
      }
      paymentMethod {
        id
      }
    }
  }
`);

export const updateOrderInfo = graphql(
  gql`
    mutation updateOrderInfo($id: Int!, $publicMessage: String!) {
      updateOrderInfo(id: $id, publicMessage: $publicMessage) {
        id
        publicMessage
      }
    }
  `,
  {
    props: ({ mutate }) => ({
      updateOrderInfo: variables => mutate({ variables }),
    }),
  },
);

const addGraphQL = compose(
  getOrder,
  updateOrderInfo,
);

export default withUser(addGraphQL(withIntl(OrderSuccessPage)));
