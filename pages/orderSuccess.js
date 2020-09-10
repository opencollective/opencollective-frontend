import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { Facebook } from '@styled-icons/fa-brands/Facebook';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { confettiFireworks } from '../lib/confettis';
import { facebookShareURL, tweetURL } from '../lib/url_helpers';

import ErrorPage from '../components/ErrorPage';
import { Box, Flex } from '../components/Grid';
import I18nFormatters from '../components/I18nFormatters';
import Link from '../components/Link';
import LinkCollective from '../components/LinkCollective';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import OrderSuccessContributorCardWithData from '../components/OrderSuccessContributorCardWithData';
import Page from '../components/Page';
import StyledButton from '../components/StyledButton';
import StyledLink from '../components/StyledLink';
import { H3, P, Span } from '../components/Text';
import { withUser } from '../components/UserProvider';

import orderSuccessBackgroundUrl from '../public/static/images/order-success-background.svg';

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
};

const orderSuccessPageQuery = gql`
  query OrderSuccessPage($OrderId: Int!) {
    Order(id: $OrderId) {
      id
      quantity
      totalAmount
      interval
      currency
      status
      fromCollective {
        id
        type
        slug
        name
        path
        imageUrl
        isIncognito
      }
      collective {
        id
        slug
        name
        tags
        path
        type
      }
      tier {
        id
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
`;

class OrderSuccessPage extends React.Component {
  static getInitialProps({ query: { OrderId } }) {
    return { OrderId: parseInt(OrderId) };
  }

  static propTypes = {
    OrderId: PropTypes.number.isRequired,
    data: PropTypes.object.isRequired, // from withData
    intl: PropTypes.object.isRequired, // from injectIntl
    loggedInUserLoading: PropTypes.bool, // from withUser
    LoggedInUser: PropTypes.object, // from withUser
  };

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      tweet: {
        id: 'order.created.tweet',
        defaultMessage: "I've just donated to {collective}. Consider donating too, every little helps!",
      },
      'tweet.event': {
        id: 'order.created.tweet.event',
        defaultMessage: "I'm attending {event}. Join me!",
      },
    });
  }

  componentDidMount() {
    if (!this.props.data?.error) {
      confettiFireworks();
    }
  }

  renderUserProfileBtn(loading = false) {
    return (
      <StyledButton buttonStyle="primary" fontWeight={600} loading={loading}>
        <FormattedMessage id="viewYourProfile" defaultMessage="View your profile" />
      </StyledButton>
    );
  }

  getTwitterMessage() {
    const { collective } = this.props.data.Order;
    let msgId = 'tweet';
    const values = {
      collective: collective.twitterHandle ? `@${collective.twitterHandle}` : collective.name,
    };
    if (collective.type === 'EVENT') {
      msgId = 'tweet.event';
      values.event = collective.name;
    }
    return this.props.intl.formatMessage(this.messages[msgId], values);
  }

  renderContributionSummary(tier, collective, fromCollective) {
    const collectiveLink = (
      <strong>
        <LinkCollective collective={collective} />
      </strong>
    );

    if (!tier) {
      return (
        <FormattedMessage
          id="contributeFlow.successMessageBacker"
          defaultMessage="{fromCollectiveName, select, incognito {You're} other {{fromCollectiveName} is}} now a backer of {collectiveName}!"
          values={{
            fromCollectiveName: fromCollective.name,
            collectiveName: collectiveLink,
          }}
        />
      );
    }

    return tier.type === 'TICKET' ? (
      <FormattedMessage
        id="contributeFlow.successMessageTicket"
        defaultMessage="{fromCollectiveName, select, incognito {You've} other {{fromCollectiveName} has}} registered for the event {eventName} ({tierName})"
        values={{
          fromCollectiveName: fromCollective.name,
          eventName: collectiveLink,
          tierName: get(tier, 'name', 'ticket'),
        }}
      />
    ) : (
      <FormattedMessage
        id="contributeFlow.successMessage"
        defaultMessage="{fromCollectiveName, select, incognito {You're} other {{fromCollectiveName} is}} now a member of {collectiveName}'s &quot;{tierName}&quot; tier!"
        values={{
          fromCollectiveName: fromCollective.name,
          collectiveName: collectiveLink,
          tierName: get(tier, 'name', 'backer'),
        }}
      />
    );
  }

  render() {
    const { data, LoggedInUser, loggedInUserLoading } = this.props;

    if (data.loading) {
      return <Loading />;
    } else if (data.error || !data.Order) {
      return <ErrorPage data={data} />;
    }

    const order = data.Order;
    const { collective, fromCollective, tier } = order;
    const shareURL = `${process.env.WEBSITE_URL}${collective.path}`;
    const message = this.getTwitterMessage();
    const isFreeTier = get(tier, 'amount') === 0 || (get(tier, 'presets') || []).includes(0);
    const isManualDonation = order.status === 'PENDING' && !order.paymentMethod && !isFreeTier;

    return (
      <Page title={'Contribute'}>
        <OrderSuccessContainer data-cy="order-success" flexDirection="column" alignItems="center" mb={6}>
          {isManualDonation ? (
            <MessageBox type="warning" my={4} mx={2}>
              <FormattedMessage
                id="collective.user.orderProcessing.manual"
                defaultMessage="<strong>Your donation is pending.</strong> Please follow the instructions in the confirmation email to manually pay the host of the collective."
                values={I18nFormatters}
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

          <Box my={[2, 5]}>
            <OrderSuccessContributorCardWithData order={order} fromCollective={fromCollective} />
          </Box>

          {!fromCollective.isIncognito && (
            <Flex flexWrap="wrap" justifyContent="center" mt={2}>
              <ShareLink href={tweetURL({ url: shareURL, text: message })}>
                <Twitter size="1.2em" color="#38A1F3" />
                <FormattedMessage id="tweetIt" defaultMessage="Tweet it" />
              </ShareLink>
              <ShareLink href={facebookShareURL({ u: shareURL })}>
                <Facebook size="1.2em" color="#3c5a99" />
                <FormattedMessage id="shareIt" defaultMessage="Share it" />
              </ShareLink>
            </Flex>
          )}
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
                  <StyledLink
                    as={Link}
                    key={tag}
                    route="search"
                    params={{ q: tag }}
                    fontSize="14px"
                    lineHeight="18px"
                    mr={1}
                    textAlign="center"
                  >
                    #{tag}
                  </StyledLink>
                ))}
              </Flex>
            </Flex>
          )}
          {!fromCollective.isIncognito && !LoggedInUser && this.renderUserProfileBtn(true)}
          {!fromCollective.isIncognito && LoggedInUser && !loggedInUserLoading && (
            <LinkCollective collective={fromCollective}>{this.renderUserProfileBtn()}</LinkCollective>
          )}
        </OrderSuccessContainer>
      </Page>
    );
  }
}

const addOrderSuccessPageData = graphql(orderSuccessPageQuery);

export default withUser(injectIntl(addOrderSuccessPageData(OrderSuccessPage)));
