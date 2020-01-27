import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { get } from 'lodash';
import { Flex } from '@rebass/grid';

import { compose, parseToBoolean } from '../lib/utils';
import { CollectiveType } from '../lib/constants/collectives';

import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import Link from '../components/Link';
import { withStripeLoader } from '../components/StripeProvider';
import { withUser } from '../components/UserProvider';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import Container from '../components/Container';
import StyledButton from '../components/StyledButton';

import ContributionFlow from '../components/contribution-flow';
import ContributionFlowCover from '../components/contribution-flow/Cover';

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

    if (!data.Collective.host) {
      return this.renderMessage('info', intl.formatMessage(messages.missingHost));
    } else if (!data.Collective.isActive) {
      return this.renderMessage('info', intl.formatMessage(messages.inactiveCollective));
    } else if (this.props.tierId && !data.Tier) {
      return this.renderMessage('warning', intl.formatMessage(messages.missingTier), true);
    } else if (data.Tier && data.Tier.endsAt && new Date(data.Tier.endsAt) < new Date()) {
      return this.renderMessage('warning', intl.formatMessage(messages.expiredTier), true);
    } else {
      return (
        <ContributionFlow
          collective={data.Collective}
          host={data.Collective.host}
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

const collectiveFields = `
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
  tags
  settings
  isActive
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
  }
  parentCollective {
    slug
    settings
    location {
      country
    }
  }
`;

/* eslint-disable graphql/template-strings, graphql/no-deprecated-fields, graphql/capitalized-type-name, graphql/named-operations */
const CollectiveDataQuery = gql`
  query Collective($collectiveSlug: String!) {
    Collective(slug: $collectiveSlug) {
      ${collectiveFields}
    }
  }
`;

const CollectiveWithTierDataQuery = gql`
  query CollectiveWithTier($collectiveSlug: String!, $tierId: Int!) {
    Collective(slug: $collectiveSlug) {
      ${collectiveFields}
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
`;

const addGraphQL = compose(
  graphql(CollectiveDataQuery, { skip: props => props.tierId }),
  graphql(CollectiveWithTierDataQuery, { skip: props => !props.tierId }),
);

export default injectIntl(addGraphQL(withUser(withStripeLoader(CreateOrderPage))));
