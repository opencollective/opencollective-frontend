import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { get } from 'lodash';
import { Box, Flex } from '@rebass/grid';
import styled from 'styled-components';
import { themeGet } from 'styled-system';

import { InfoCircle } from 'styled-icons/boxicons-regular/InfoCircle.cjs';

import { formatCurrency, imagePreview } from '../lib/utils';
import withIntl from '../lib/withIntl';
import { pickLogo } from '../lib/collective.lib';
import { Link } from '../server/pages';
import { withUser } from '../components/UserProvider';
import { H3, H5, P, Span } from '../components/Text';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import StyledButton from '../components/StyledButton';
import StyledLink from '../components/StyledLink';
import Loading from '../components/Loading';
import StyledCard from '../components/StyledCard';

import orderSuccessBackgroundUrl from '../static/images/order-success-background.svg';
import { tweetURL, facebooKShareURL, objectToQueryString } from '../lib/url_helpers';

const OrderSuccessContainer = styled(Flex)`
  background: white url(${orderSuccessBackgroundUrl}) 0 0/100% no-repeat;
  min-height: 500px;

  @media (max-width: 1440px) {
    background-size: 1440px 304px;
  }
`;

const ShareLink = styled(StyledLink)``;
ShareLink.defaultProps = {
  buttonStyle: 'standard',
  buttonSize: 'medium',
  fontWeight: 600,
  mx: 2,
  target: '_blank',
  blacklist: StyledLink.defaultProps.blacklist,
};

const CollectiveLogoContainer = styled(Flex)`
  border-top: 1px solid ${themeGet('colors.black.200')};
  justify-content: center;
  margin-bottom: 24px;
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

/**
 * A collective card to present collectives. This component only displays the
 * collective banner and the logo. What's displayed in the card body is up to you.
 */
const StyledCollectiveCard = ({ collective, children, ...props }) => {
  const logo = imagePreview(collective.image, pickLogo(collective.id), { height: 48 });
  return (
    <StyledCard {...props}>
      <CollectiveLogoContainer mt={47}>
        <img src={logo} alt="" />
      </CollectiveLogoContainer>
      <H5 fontSize="Paragraph" fontWeight="bold" lineHeight="Caption" py="8px">
        {collective.name}
      </H5>
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

StyledCollectiveCard.defaultProps = { width: 144 };

class OrderSuccessPage extends React.Component {
  static propTypes = {
    OrderId: PropTypes.number.isRequired,
    data: PropTypes.object.isRequired, // from withData
    intl: PropTypes.object.isRequired, // from withIntl
    loggedInUserLoading: PropTypes.bool, // from withUser
    LoggedInUser: PropTypes.object, // from withUser
  };

  static getInitialProps({ query: { OrderId } }) {
    return { OrderId: parseInt(OrderId) };
  }

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      tweet: {
        id: 'order.created.tweet',
        defaultMessage: "I've just donated {amount} to {collective}. Consider donating too, every little helps!",
      },
      'tweet.event': {
        id: 'order.created.tweet.event',
        defaultMessage: "I'm attending {event}. Join me!",
      },
    });
  }

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
    const { collective, totalAmount } = this.props.data.Order;
    let msgId = 'tweet';
    const values = {
      collective: collective.twitterHandle ? `@${collective.twitterHandle}` : collective.name,
      amount: formatCurrency(totalAmount, collective.currency, { precision: 0 }),
    };
    if (collective.type === 'EVENT') {
      msgId = 'tweet.event';
      values.event = collective.name;
    }
    return this.props.intl.formatMessage(this.messages[msgId], values);
  }

  render() {
    const { data, LoggedInUser, loggedInUserLoading } = this.props;

    if (data.loading) {
      return <Loading />;
    } else if (data.error || !data.Order) {
      return <ErrorPage data={data} />;
    }

    const order = data.Order;
    const { collective, fromCollective, totalAmount, interval, currency, tier } = order;
    const referralOpts = objectToQueryString({ referral: fromCollective.id });
    const websiteUrl = process.env.WEBSITE_URL || 'https://opencollective.com';
    const referralURL = `${websiteUrl}${collective.path}${referralOpts}`;
    const message = this.getTwitterMessage();

    return (
      <Page title={'Contribute'}>
        <OrderSuccessContainer id="page-order-success" flexDirection="column" alignItems="center" mb={6}>
          {order.status === 'PENDING' && !order.paymentMethod && (
            <StyledCard borders={1} borderColor="yellow.500" bg="yellow.100" color="yellow.700" p={3} mt={4} mx={2}>
              <InfoCircle size="1.2em" />{' '}
              <FormattedMessage
                id="collective.user.orderProcessing.manual"
                defaultMessage="Your donation is pending. Please follow the instructions in the confirmation email to manually pay the host of the collective."
              />
            </StyledCard>
          )}

          <StyledCollectiveCard mt={[4, 5]} mb={32} collective={collective} showCover={false}>
            <Flex flexDirection="column" p={12} alignItems="center">
              <Span fontSize="10px">
                <FormattedMessage id="contributeFlow.contributedTotal" defaultMessage="Contributed a total of:" />
              </Span>
              <Span fontWeight="bold" fontSize="Caption">
                {this.renderContributeDetailsSummary(totalAmount, currency, interval)}
              </Span>
              {collective.tags && (
                <Flex mt={3} flexWrap="wrap" justifyContent="center">
                  {collective.tags.map(tag => (
                    <Link key={tag} route="search" params={{ q: tag }} passHref>
                      <StyledLink fontSize="Paragraph" lineHeight="Caption" mr={1}>
                        #{tag}
                      </StyledLink>
                    </Link>
                  ))}
                </Flex>
              )}
            </Flex>
          </StyledCollectiveCard>
          <H3 fontWeight={800} color="black.900" mb={3}>
            <FormattedMessage id="contributeFlow.successTitle" defaultMessage="Woot woot! 🎉" />
          </H3>
          <P mb={4}>
            <FormattedMessage
              id="contributeFlow.successMessage"
              defaultMessage="{fromCollectiveName} is now {collectiveName}'s {role}"
              values={{
                fromCollectiveName: fromCollective.name,
                collectiveName: collective.name,
                role: get(tier, 'name', 'backer'),
              }}
            />
          </P>
          <Flex>
            <ShareLink href={tweetURL({ url: referralURL, text: message })}>
              <FormattedMessage id="tweetIt" defaultMessage="Tweet it" />
            </ShareLink>
            <ShareLink href={facebooKShareURL({ u: referralURL })}>
              <FormattedMessage id="shareIt" defaultMessage="Share it" />
            </ShareLink>
          </Flex>
          <Box width={64} my={4} bg="black.300" css={{ height: '1px' }} />
          {!LoggedInUser && this.renderUserProfileBtn(true)}
          {LoggedInUser && !loggedInUserLoading && (
            <Link route="collective" params={{ slug: get(LoggedInUser, 'collective.slug', '') }}>
              {this.renderUserProfileBtn()}
            </Link>
          )}
        </OrderSuccessContainer>
      </Page>
    );
  }
}

const addData = graphql(gql`
  query OrderSuccess($OrderId: Int!) {
    Order(id: $OrderId) {
      id
      quantity
      totalAmount
      interval
      currency
      status
      fromCollective {
        id
        name
      }
      collective {
        name
        image
        tags
        path
      }
      tier {
        name
      }
      paymentMethod {
        id
      }
    }
  }
`);

export default withUser(addData(withIntl(OrderSuccessPage)));
