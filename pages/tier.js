import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';

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
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object, // from withUser
    tierSlug: PropTypes.string,
    redirect: PropTypes.string,
  };

  // See https://github.com/opencollective/opencollective/issues/1872
  shouldComponentUpdate(newProps) {
    if (get(this.props, 'data.Tier') && !get(newProps, 'data.Tier')) {
      return false;
    } else {
      return true;
    }
  }

  getPageMetaData(tier) {
    if (tier && tier.collective) {
      const collective = tier.collective;
      return {
        title: `${collective.name} - ${tier.name}`,
        description: tier.description || collective.description || collective.longDescription,
        twitterHandle: collective.twitterHandle || get(collective, 'parentCollective.twitterHandle'),
        image: collective.image || get(collective, 'parentCollective.image'),
        canonicalURL: `${process.env.WEBSITE_URL}/${tier.collective.slug}/contribute/${tier.slug}-${tier.id}`,
      };
    } else {
      return {
        title: 'Tier',
        image: '/static/images/defaultBackgroundImage.png',
        canonicalURL: `${process.env.WEBSITE_URL}/${this.props.collectiveSlug}/contribute/${this.props.tierSlug}-${this.props.tierId}`,
      };
    }
  }

  render() {
    const { redirect, data, LoggedInUser } = this.props;

    return !data || data.error ? (
      <ErrorPage data={data} />
    ) : (
      <Page {...this.getPageMetaData(data.Tier)}>
        {data.loading || !data.Tier || !data.Tier.collective ? (
          <Loading />
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

export default withUser(addTierPageData(TierPage));
