import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { withRouter } from 'next/router';

import { getCollectivePageMetadata } from '../lib/collective.lib';
import { CollectiveType } from '../lib/constants/collectives';
import { addParentToURLIfMissing, getCollectivePageRoute } from '../lib/url-helpers';
import { getWebsiteUrl } from '../lib/utils';

import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import ErrorPage from '../components/ErrorPage';
import Loading from '../components/Loading';
import Page from '../components/Page';
import TierPageContent from '../components/tier-page';
import { tierPageQuery } from '../components/tier-page/graphql/queries';
import { withUser } from '../components/UserProvider';

/**
 * The main page to display collectives. Wrap route parameters and GraphQL query
 * to render `components/collective-page` with everything needed.
 */
class TierPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, tierId, tierSlug, redirect } }) {
    return { collectiveSlug, tierId: Number(tierId), tierSlug, redirect };
  }

  static propTypes = {
    tierId: PropTypes.number.isRequired,
    collectiveSlug: PropTypes.string.isRequired,
    parentCollectiveSlug: PropTypes.string,
    collectiveType: PropTypes.string,
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object, // from withUser
    tierSlug: PropTypes.string,
    redirect: PropTypes.string,
    router: PropTypes.object,
  };

  componentDidMount() {
    const { router, tierId, tierSlug, data } = this.props;
    const collective = data?.Tier?.collective;
    addParentToURLIfMissing(router, collective, `/contribute/${tierSlug}-${tierId}`);
  }

  // See https://github.com/opencollective/opencollective/issues/1872
  shouldComponentUpdate(newProps) {
    if (get(this.props, 'data.Tier') && !get(newProps, 'data.Tier')) {
      return false;
    } else {
      return true;
    }
  }

  getPageMetaData(tier) {
    let canonicalURL;
    const baseMetadata = getCollectivePageMetadata(tier?.collective);
    if (tier && tier.collective) {
      const collective = tier.collective;
      canonicalURL = `${getWebsiteUrl()}/${getCollectivePageRoute(collective)}/contribute/${tier.slug}-${tier.id}`;
      return {
        ...baseMetadata,
        title: `${collective.name} - ${tier.name}`,
        description: tier.description || collective.description || collective.longDescription,
        twitterHandle: collective.twitterHandle || get(collective, 'parentCollective.twitterHandle'),
        canonicalURL,
      };
    } else {
      if ([CollectiveType.EVENT, CollectiveType.PROJECT].includes(this.props.collectiveType)) {
        canonicalURL = `${getWebsiteUrl()}/${this.props.parentCollectiveSlug}/${this.props.collectiveType}/${
          this.props.collectiveSlug
        }/contribute/${this.props.tierSlug}-${this.props.tierId}`;
      } else {
        canonicalURL = `${getWebsiteUrl()}/${this.props.collectiveSlug}/contribute/${this.props.tierSlug}-${
          this.props.tierId
        }`;
      }
      return { ...baseMetadata, title: 'Tier', canonicalURL };
    }
  }

  render() {
    const { redirect, data, LoggedInUser } = this.props;

    return !data || data.error ? (
      <ErrorPage data={data} />
    ) : (
      <Page {...this.getPageMetaData(data.Tier)}>
        {data.loading || !data.Tier || !data.Tier.collective ? (
          <div className="py-16 sm:py-32">
            <Loading />
          </div>
        ) : (
          <CollectiveThemeProvider collective={data.Tier.collective}>
            <TierPageContent
              LoggedInUser={LoggedInUser}
              collective={data.Tier.collective}
              tier={data.Tier}
              contributors={data.Tier.contributors}
              contributorsStats={data.Tier.stats.contributors}
              redirect={redirect}
            />
          </CollectiveThemeProvider>
        )}
      </Page>
    );
  }
}

const addTierPageData = graphql(tierPageQuery);

export default withRouter(withUser(addTierPageData(TierPage)));
