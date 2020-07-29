import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import { get } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { compose, parseToBoolean } from '../lib/utils';

import Container from '../components/Container';
import { Flex } from '../components/Grid';
import Link from '../components/Link';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import { STEPS } from '../components/new-contribution-flow/constants';
import NewContributionFlowSuccess from '../components/new-contribution-flow/ContributionFlowSuccess';
import NewContributionFlowContainer from '../components/new-contribution-flow/index';
import Page from '../components/Page';
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

class NewContributionFlowPage extends React.Component {
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
      step: query.step || 'details',
      tierId: parseInt(query.tierId) || null,
      quantity: parseInt(query.quantity) || 1,
      description: query.description ? decodeURIComponent(query.description) : undefined,
      interval: query.interval,
      verb: query.verb,
      redirect: query.redirect,
      customData: query.data,
      skipStepDetails: query.skipStepDetails ? parseToBoolean(query.skipStepDetails) : false,
      contributeAs: query.contributeAs,
    };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string.isRequired,
    tierId: PropTypes.number,
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      account: PropTypes.object,
      tier: PropTypes.object,
    }), // from withData
    intl: PropTypes.object,
    router: PropTypes.object,
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    step: PropTypes.oneOf(Object.values(STEPS)),
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

    if (!data || !data.account) {
      return { title: 'Contribute' };
    }

    const collective = data.account;
    return {
      canonicalURL: this.getCanonicalURL(collective, data.tier),
      description: collective.description,
      twitterHandle: collective.twitterHandle,
      image: collective.imageUrl || collective.backgroundImageUrl,
      title:
        collective.type === CollectiveType.EVENT
          ? intl.formatMessage(messages.eventTitle, { event: collective.name })
          : intl.formatMessage(messages.collectiveTitle, { collective: collective.name }),
    };
  }

  renderMessage(type, content, showOtherWaysToContribute = false) {
    const { collectiveSlug } = this.props;
    return (
      <Flex flexDirection="column" alignItems="center" py={5}>
        <MessageBox type={type} withIcon maxWidth={800}>
          {content}
        </MessageBox>
        {showOtherWaysToContribute && (
          <Link route="contribute" params={{ collectiveSlug, verb: 'contribute' }}>
            <StyledButton buttonStyle="primary" buttonSize="large" mt={5}>
              <FormattedMessage id="createOrder.backToTier" defaultMessage="View all the other ways to contribute" />
            </StyledButton>
          </Link>
        )}
      </Flex>
    );
  }

  renderPageContent() {
    const { router, data = {}, intl, step } = this.props;
    const { account, tier } = data;
    const feesOnTopAvailable = get(data, 'Collective.platformFeePercent') === 0;
    const taxDeductible = get(data, 'Collective.host.settings.taxDeductibleDonations');

    if (data.loading) {
      return (
        <Container py={[5, 6]}>
          <Loading />
        </Container>
      );
    } else if (!account.host && !account.isHost) {
      return this.renderMessage('info', intl.formatMessage(messages.missingHost));
    } else if (!account.isActive) {
      return this.renderMessage('info', intl.formatMessage(messages.inactiveCollective));
    } else if (this.props.tierId && !data.Tier) {
      return this.renderMessage('warning', intl.formatMessage(messages.missingTier), true);
    } else if (data.Tier && data.Tier.endsAt && new Date(data.Tier.endsAt) < new Date()) {
      return this.renderMessage('warning', intl.formatMessage(messages.expiredTier), true);
    } else if (account.settings.disableCustomContributions && !data.Tier) {
      return this.renderMessage('warning', intl.formatMessage(messages.disableCustomContributions), true);
    } else if (router.query.step === 'success') {
      return <NewContributionFlowSuccess collective={account} />;
    } else {
      return (
        <NewContributionFlowContainer
          collective={account}
          host={account.host}
          tier={tier}
          feesOnTopAvailable={feesOnTopAvailable}
          taxDeductible={taxDeductible}
          step={step}
        />
      );
    }
  }

  render() {
    return <Page {...this.getPageMetadata()}>{this.renderPageContent()}</Page>;
  }
}

const hostFieldsFragment = gqlV2/* GraphQL */ `
  fragment ContributionFlowHostFields on Host {
    id
    slug
    name
    settings
  }
`;

const accountFieldsFragment = gqlV2/* GraphQL */ `
  fragment ContributionFlowAccountFields on Account {
    id
    legacyId
    slug
    type
    name
    currency
    settings
    twitterHandle
    description
    imageUrl
    isHost
    isActive
    ... on Collective {
      contributors(limit: 6) {
        totalCount
        nodes {
          id
          name
          image
          collectiveSlug
        }
      }
      host {
        ...ContributionFlowHostFields
      }
    }
    ... on Event {
      host {
        ...ContributionFlowHostFields
      }
    }
    ... on Fund {
      host {
        ...ContributionFlowHostFields
      }
    }
    ... on Project {
      host {
        ...ContributionFlowHostFields
      }
    }
  }
  ${hostFieldsFragment}
`;

const accountQuery = gqlV2/* GraphQL */ `
  query ContributionFlowAccountQuery($collectiveSlug: String!) {
    account(slug: $collectiveSlug) {
      ...ContributionFlowAccountFields
    }
  }
  ${accountFieldsFragment}
`;

const accountWithTierQuery = gqlV2/* GraphQL */ `
  query ContributionFlowAccountQuery($collectiveSlug: String!, $tier: TierReferenceInput!) {
    account(slug: $collectiveSlug) {
      ...ContributionFlowAccountFields
    }
    tier(tier: $tier) {
      id
      type
      name
      slug
      description
      amount {
        value
        currency
      }
      amountType
      minimumAmount {
        value
        currency
      }
      interval
      presets
    }
  }
  ${accountFieldsFragment}
`;

const addAccountData = graphql(accountQuery, {
  skip: props => Boolean(props.tierId),
  options: props => ({
    variables: { collectiveSlug: props.collectiveSlug },
    context: API_V2_CONTEXT,
  }),
});

const addAccountWithTierData = graphql(accountWithTierQuery, {
  skip: props => !props.tierId,
  options: props => ({
    variables: { collectiveSlug: props.collectiveSlug, tier: { legacyId: props.tierId } },
    context: API_V2_CONTEXT,
  }),
});

const addGraphql = compose(addAccountData, addAccountWithTierData);

export default addGraphql(withUser(withRouter(injectIntl(NewContributionFlowPage))));
