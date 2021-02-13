import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import NextLink from 'next/link';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';
import { GQLV2_PAYMENT_METHOD_TYPES } from '../lib/constants/payment-methods';
import { generateNotFoundError, getErrorFromGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { floatAmountToCents } from '../lib/math';
import { isTierExpired } from '../lib/tier-utils';
import { compose, parseToBoolean } from '../lib/utils';

import Container from '../components/Container';
import { STEPS } from '../components/contribution-flow/constants';
import ContributionFlowSuccess from '../components/contribution-flow/ContributionFlowSuccess';
import ContributionFlowContainer from '../components/contribution-flow/index';
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
    defaultMessage: 'This tier is not active anymore.',
  },
  emptyTier: {
    id: 'Tier.empty',
    defaultMessage: 'There are no more {type, select, TICKET {tickets} other {units}} for {name}',
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

    const getFloatAmount = amountStr => {
      return !amountStr ? null : floatAmountToCents(parseFloat(amountStr));
    };

    return {
      collectiveSlug: query.eventSlug || query.collectiveSlug,
      totalAmount: getFloatAmount(query.amount) || parseInt(query.totalAmount) || null,
      platformContribution: getFloatAmount(query.platformContribution),
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
    verb: PropTypes.string,
    redirect: PropTypes.string,
    description: PropTypes.string,
    quantity: PropTypes.number,
    totalAmount: PropTypes.number,
    platformContribution: PropTypes.number,
    interval: PropTypes.string,
    tierId: PropTypes.number,
    customData: PropTypes.object,
    contributeAs: PropTypes.string,
    skipStepDetails: PropTypes.bool,
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      account: PropTypes.object,
      tier: PropTypes.object,
    }), // from withData
    intl: PropTypes.object,
    loadStripe: PropTypes.func,
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    step: PropTypes.oneOf(Object.values(STEPS)),
  };

  componentDidMount() {
    this.loadExternalScripts();
  }

  componentDidUpdate(prevProps) {
    const hostPath = 'data.account.host';
    if (get(this.props, hostPath) !== get(prevProps, hostPath)) {
      this.loadExternalScripts();
    }
  }

  loadExternalScripts() {
    // Load stripe
    const supportedPaymentMethods = get(this.props.data, 'account.host.supportedPaymentMethods', []);
    const hostHasStripe = supportedPaymentMethods.includes(GQLV2_PAYMENT_METHOD_TYPES.CREDIT_CARD);
    if (hostHasStripe) {
      this.props.loadStripe();
    }
  }

  getCanonicalURL(collective, tier) {
    if (!tier) {
      return `${process.env.WEBSITE_URL}/${collective.slug}/donate`;
    } else if (collective.type === CollectiveType.EVENT) {
      const parentSlug = get(collective.parent, 'slug', collective.slug);
      return `${process.env.WEBSITE_URL}/${parentSlug}/events/${collective.slug}/order/${tier.id}`;
    } else {
      return `${process.env.WEBSITE_URL}/${collective.slug}/contribute/${tier.slug}-${tier.id}/checkout`;
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
      <Flex flexDirection="column" alignItems="center" py={[5, null, 6]}>
        <MessageBox type={type} withIcon maxWidth={800}>
          {content}
        </MessageBox>
        {showOtherWaysToContribute && (
          <NextLink href={`${collectiveSlug}/contribute`}>
            <StyledButton buttonStyle="primary" buttonSize="large" mt={5}>
              <FormattedMessage id="createOrder.backToTier" defaultMessage="View all the other ways to contribute" />
            </StyledButton>
          </NextLink>
        )}
      </Flex>
    );
  }

  renderPageContent() {
    const { data = {}, intl, step, LoggedInUser } = this.props;
    const { account, tier } = data;

    if (data.loading) {
      return (
        <Container py={[5, 6]}>
          <Loading />
        </Container>
      );
    } else if (!account.host) {
      return this.renderMessage('info', intl.formatMessage(messages.missingHost));
    } else if (!account.isActive) {
      return this.renderMessage('info', intl.formatMessage(messages.inactiveCollective));
    } else if (!account.host.supportedPaymentMethods.length) {
      const content = (
        <React.Fragment>
          <strong>
            <FormattedMessage
              id="ContributionFlow.noSupportedPaymentMethods"
              defaultMessage="There is no payment provider available"
            />
          </strong>
          <br />
          {LoggedInUser?.isHostAdmin(account) && (
            <Link route="accept-financial-contributions" params={{ slug: account.slug, path: 'organization' }}>
              <StyledButton buttonStyle="primary" mt={3}>
                <FormattedMessage id="contributions.startAccepting" defaultMessage="Start accepting contributions" />
              </StyledButton>
            </Link>
          )}
        </React.Fragment>
      );
      return this.renderMessage('info', content);
    } else if (tier?.availableQuantity === 0) {
      const intlParams = { type: tier.type, name: <q>{tier.name}</q> };
      return this.renderMessage('info', intl.formatMessage(messages.emptyTier, intlParams), true);
    } else if (this.props.tierId && !tier) {
      return this.renderMessage('warning', intl.formatMessage(messages.missingTier), true);
    } else if (tier && isTierExpired(tier)) {
      return this.renderMessage('warning', intl.formatMessage(messages.expiredTier), true);
    } else if (account.settings.disableCustomContributions && !tier) {
      return this.renderMessage('warning', intl.formatMessage(messages.disableCustomContributions), true);
    } else if (step === 'success') {
      return <ContributionFlowSuccess collective={account} />;
    } else {
      return (
        <ContributionFlowContainer
          collective={account}
          host={account.host}
          tier={tier}
          step={step}
          verb={this.props.verb}
          redirect={this.props.redirect}
          description={this.props.description}
          defaultQuantity={this.props.quantity}
          fixedInterval={this.props.interval}
          fixedAmount={this.props.totalAmount}
          platformContribution={this.props.platformContribution}
          customData={this.props.customData}
          skipStepDetails={this.props.skipStepDetails}
          contributeAs={this.props.contributeAs}
        />
      );
    }
  }

  render() {
    const { data } = this.props;
    if (!data.loading && !data.account) {
      const error = data.error
        ? getErrorFromGraphqlException(data.error)
        : generateNotFoundError(this.props.collectiveSlug);

      return <ErrorPage error={error} />;
    }

    return <Page {...this.getPageMetadata()}>{this.renderPageContent()}</Page>;
  }
}

const hostFieldsFragment = gqlV2/* GraphQL */ `
  fragment ContributionFlowHostFields on Host {
    id
    legacyId
    slug
    name
    settings
    contributionPolicy
    location {
      country
    }
    supportedPaymentMethods
    payoutMethods {
      id
      name
      data
      type
    }
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
    imageUrl(height: 192)
    isHost
    isActive
    settings
    location {
      country
    }
    ... on Organization {
      platformFeePercent
      platformContributionAvailable
      host {
        ...ContributionFlowHostFields
      }
    }
    ... on AccountWithContributions {
      contributionPolicy
      platformFeePercent
      platformContributionAvailable
      contributors(limit: 6) {
        totalCount
        nodes {
          id
          name
          image
          collectiveSlug
        }
      }
    }
    ... on AccountWithHost {
      hostFeePercent
      host {
        ...ContributionFlowHostFields
      }
    }
    ... on Event {
      parent {
        id
        slug
        settings
        location {
          country
        }
      }
    }
    ... on Project {
      parent {
        id
        slug
        settings
        location {
          country
        }
      }
    }
  }
  ${hostFieldsFragment}
`;

const accountQuery = gqlV2/* GraphQL */ `
  query ContributionFlowAccountQuery($collectiveSlug: String!) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      ...ContributionFlowAccountFields
    }
  }
  ${accountFieldsFragment}
`;

const accountWithTierQuery = gqlV2/* GraphQL */ `
  query ContributionFlowAccountQuery($collectiveSlug: String!, $tier: TierReferenceInput!) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      ...ContributionFlowAccountFields
    }
    tier(tier: $tier, throwIfMissing: false) {
      id
      legacyId
      type
      name
      slug
      description
      customFields
      availableQuantity
      maxQuantity
      endsAt
      amount {
        valueInCents
        currency
      }
      amountType
      minimumAmount {
        valueInCents
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

export default addGraphql(withUser(injectIntl(withStripeLoader(NewContributionFlowPage))));
