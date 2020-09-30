import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';
import { compose, parseToBoolean } from '../lib/utils';

import Container from '../components/Container';
import ContributionFlow from '../components/contribution-flow';
import ContributionFlowCover from '../components/contribution-flow/Cover';
import ErrorPage from '../components/ErrorPage';
import { Flex } from '../components/Grid';
import Link from '../components/Link';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import { withStripeLoader } from '../components/StripeProvider';
import StyledButton from '../components/StyledButton';
import { withUser } from '../components/UserProvider';

const messages = defineMessages({
  collectiveTitle: {
    id: 'CreateOrder.Title',
    defaultMessage: 'Contribute to {collective}',
  },
  eventTitle: {
    id: 'CreateOrder.TitleForEvent',
    defaultMessage: 'Order tickets for {event}',
  },
  missingHost: {
    id: 'createOrder.missingHost',
    defaultMessage: "This collective doesn't have a host and can't accept financial contributions",
  },
  inactiveCollective: {
    id: 'createOrder.inactiveCollective',
    defaultMessage: "This collective is not active and can't accept financial contributions",
  },
  missingTier: {
    id: 'createOrder.missingTier',
    defaultMessage: "Oops! This tier doesn't exist or has been removed by the collective admins.",
  },
  expiredTier: {
    id: 'Tier.Past',
    defaultMessage: 'This contribution type is not active anymore.',
  },
  disableCustomContributions: {
    id: 'Tier.disableCustomContirbution',
    defaultMessage: 'This collective requires you to select a tier to contribute.',
  },
});

/**
 * Main contribution flow entrypoint. Render all the steps from contributeAs
 * to payment.
 */
class CreateOrderPage extends React.Component {
  static getInitialProps({ query }) {
    // Whitelist interval
    if (['monthly', 'yearly'].includes(query.interval)) {
      query.interval = query.interval.replace('ly', '');
    } else if (!['month', 'year'].includes(query.interval)) {
      query.interval = null;
    }

    if (query.data) {
      try {
        query.data = JSON.parse(query.data);
      } catch (err) {
        // TODO: this should be reported to the user
        console.error(err);
      }
    }

    return {
      collectiveSlug: query.eventSlug || query.collectiveSlug,
      totalAmount: parseInt(query.amount) * 100 || parseInt(query.totalAmount) || null,
      step: query.step || 'contributeAs',
      tierId: parseInt(query.tierId) || null,
      quantity: parseInt(query.quantity) || 1,
      description: query.description ? decodeURIComponent(query.description) : undefined,
      interval: query.interval,
      verb: query.verb,
      redirect: query.redirect,
      customData: query.data,
      skipStepDetails: query.skipStepDetails ? parseToBoolean(query.skipStepDetails) : false,
      contributeAs: query.contributeAs,
      version: query.version,
    };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string, // for addData
    tierId: PropTypes.number,
    quantity: PropTypes.number,
    totalAmount: PropTypes.number,
    interval: PropTypes.string,
    description: PropTypes.string,
    verb: PropTypes.string,
    step: PropTypes.string,
    customData: PropTypes.object,
    redirect: PropTypes.string,
    data: PropTypes.object.isRequired, // from withData
    intl: PropTypes.object.isRequired, // from injectIntl
    skipStepDetails: PropTypes.bool,
    contributeAs: PropTypes.string,
    version: PropTypes.string,
  };

  getCanonicalURL(collective, tier) {
    if (!tier) {
      return `/${collective.slug}/donate`;
    } else if (collective.type === CollectiveType.EVENT) {
      return `/${get(collective.parentCollective, 'slug', collective.slug)}/events/${collective.slug}/order/${tier.id}`;
    } else {
      return `/${collective.slug}/contribute/${tier.slug}-${tier.id}/checkout`;
    }
  }

  getPageMetadata() {
    const { intl, data } = this.props;

    if (!data || !data.Collective) {
      return { title: 'Contribute' };
    }

    const collective = data.Collective;
    return {
      canonicalURL: this.getCanonicalURL(collective, data.Tier),
      description: collective.description,
      twitterHandle: collective.twitterHandle,
      image: collective.image || collective.backgroundImage,
      title:
        collective.type === CollectiveType.EVENT
          ? intl.formatMessage(messages.eventTitle, { event: collective.name })
          : intl.formatMessage(messages.collectiveTitle, { collective: collective.name }),
    };
  }

  renderMessage(type, content, showOtherWaysToContribute = false) {
    const { data } = this.props;
    return (
      <Flex flexDirection="column" alignItems="center" py={5}>
        <MessageBox type={type} withIcon maxWidth={800}>
          {content}
        </MessageBox>
        {showOtherWaysToContribute && (
          <Link route="contribute" params={{ collectiveSlug: data.Collective.slug, verb: 'contribute' }}>
            <StyledButton buttonStyle="primary" buttonSize="large" mt={5}>
              <FormattedMessage id="createOrder.backToTier" defaultMessage="View all the other ways to contribute" />
            </StyledButton>
          </Link>
        )}
      </Flex>
    );
  }

  renderPageContent() {
    const { data, intl } = this.props;
    const feesOnTopAvailable = get(data, 'Collective.platformFeePercent') === 0;
    const taxDeductible = get(data, 'Collective.host.settings.taxDeductibleDonations');

    if (!data.Collective.host && !data.Collective.isHost) {
      return this.renderMessage('info', intl.formatMessage(messages.missingHost));
    } else if (!data.Collective.isActive) {
      return this.renderMessage('info', intl.formatMessage(messages.inactiveCollective));
    } else if (this.props.tierId && !data.Tier) {
      return this.renderMessage('warning', intl.formatMessage(messages.missingTier), true);
    } else if (data.Tier && data.Tier.endsAt && new Date(data.Tier.endsAt) < new Date()) {
      return this.renderMessage('warning', intl.formatMessage(messages.expiredTier), true);
    } else if (data.Collective.settings.disableCustomContributions && !data.Tier) {
      return this.renderMessage('warning', intl.formatMessage(messages.disableCustomContributions), true);
    } else {
      return (
        <ContributionFlow
          collective={data.Collective}
          host={data.Collective.isHost ? data.Collective : data.Collective.host}
          tier={data.Tier}
          verb={this.props.verb}
          step={this.props.step}
          redirect={this.props.redirect}
          description={this.props.description}
          defaultQuantity={this.props.quantity}
          fixedInterval={this.props.interval}
          fixedAmount={this.props.totalAmount}
          customData={this.props.customData}
          skipStepDetails={this.props.skipStepDetails}
          contributeAs={this.props.contributeAs}
          version={this.props.version}
          feesOnTopAvailable={feesOnTopAvailable}
          taxDeductible={taxDeductible}
        />
      );
    }
  }

  render() {
    const { data } = this.props;

    if (!data.loading && (!data || !data.Collective)) {
      return <ErrorPage data={data} />;
    } else {
      return (
        <Page {...this.getPageMetadata()}>
          {data.loading ? (
            <Container py={[5, 6]}>
              <Loading />
            </Container>
          ) : (
            <React.Fragment>
              <ContributionFlowCover collective={data.Collective} tier={data.Tier} />
              {this.renderPageContent()}
            </React.Fragment>
          )}
        </Page>
      );
    }
  }
}

const collectiveFieldsFragment = gql`
  fragment CollectiveFields on CollectiveInterface {
    id
    slug
    name
    description
    longDescription
    twitterHandle
    type
    website
    imageUrl
    backgroundImage
    currency
    hostFeePercent
    platformFeePercent
    tags
    settings
    isActive
    isHost
    location {
      country
    }
    host {
      id
      name
      settings
      connectedAccounts {
        id
        service
      }
      location {
        country
      }
      plan {
        bankTransfers
        bankTransfersLimit
      }
    }
    parentCollective {
      slug
      settings
      location {
        country
      }
    }
  }
`;

const createOrderPageQuery = gql`
  query CreateOrderPage($collectiveSlug: String!) {
    Collective(slug: $collectiveSlug) {
      ...CollectiveFields
    }
  }

  ${collectiveFieldsFragment}
`;

const createOrderPageWithTierQuery = gql`
  query CreateOrderPageWithTier($collectiveSlug: String!, $tierId: Int!) {
    Collective(slug: $collectiveSlug) {
      ...CollectiveFields
    }
    Tier(id: $tierId) {
      id
      type
      name
      slug
      endsAt
      description
      amount
      amountType
      minimumAmount
      currency
      interval
      presets
      customFields
      maxQuantity
      stats {
        availableQuantity
      }
    }
  }

  ${collectiveFieldsFragment}
`;

const addCreateOrderPageData = graphql(createOrderPageQuery, { skip: props => props.tierId });

const addCreateOrderPageWithTierData = graphql(createOrderPageWithTierQuery, { skip: props => !props.tierId });

const addGraphql = compose(addCreateOrderPageData, addCreateOrderPageWithTierData);

export default injectIntl(withUser(withStripeLoader(addGraphql(CreateOrderPage))));
