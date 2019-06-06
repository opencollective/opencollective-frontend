import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { get, uniqBy } from 'lodash';
import { createGlobalStyle } from 'styled-components';

import withIntl from '../lib/withIntl';
import { withUser } from '../components/UserProvider';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import Loading from '../components/Loading';
import TierPageContent from '../components/tier-page';
import { CollectiveType } from '../constants/collectives';

/** Overrides global styles for this page */
const GlobalStyles = createGlobalStyle`
  main {
    /** The "overflow: hidden" set in Body prevents from using position sticky */
    overflow-x: inherit !important;
  }
`;

/**
 * The main page to display collectives. Wrap route parameters and GraphQL query
 * to render `components/collective-page` with everything needed.
 */
class TierPage extends React.Component {
  static propTypes = {
    tierId: PropTypes.number.isRequired,
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object, // from withUser
  };

  static getInitialProps({ query: { tierId } }) {
    return { tierId: Number(tierId) };
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
    if (tier && tier.collective) {
      const collective = tier.collective;
      return {
        title: `${collective.name} - ${tier.name}`,
        description: tier.description || collective.description || collective.longDescription,
        twitterHandle: collective.twitterHandle || get(collective, 'parentCollective.twitterHandle'),
        image: collective.image || get(collective, 'parentCollective.image'),
      };
    } else {
      return {
        title: 'Tier',
        image: '/static/images/defaultBackgroundImage.png',
      };
    }
  }

  /**
   * As we also count the collective admins among tier contributors, we must add this
   * to the tier stats.
   */
  getMembersStats = (baseStats, admins) => {
    const countAdminType = type => admins.filter(m => m.collective.type === type).length;
    return {
      all: baseStats.all + admins.length,
      collectives: baseStats.collectives + countAdminType(CollectiveType.COLLECTIVE),
      organizations: baseStats.organizations + countAdminType(CollectiveType.ORGANIZATION),
      users: baseStats.users + countAdminType(CollectiveType.USER),
    };
  };

  render() {
    const { data, LoggedInUser } = this.props;

    return !data || data.error ? (
      <ErrorPage data={data} />
    ) : (
      <Page {...this.getPageMetaData(data.Tier)}>
        {data.loading || !data.Tier || !data.Tier.collective ? (
          <Loading />
        ) : (
          <React.Fragment>
            <GlobalStyles />
            <TierPageContent
              LoggedInUser={LoggedInUser}
              collective={data.Tier.collective}
              tier={data.Tier}
              members={uniqBy([...data.Tier.collective.admins, ...data.Tier.members], 'collective.id')}
              membersStats={this.getMembersStats(data.Tier.stats.members, data.Tier.collective.admins)}
            />
          </React.Fragment>
        )}
      </Page>
    );
  }
}

const getCollective = graphql(gql`
  query TierPage($tierId: Int!) {
    Tier(id: $tierId) {
      id
      name
      slug
      description
      longDescription
      videoUrl
      goal
      currency
      interval

      stats {
        id
        totalDonated
        totalRecurringDonations
        members {
          id
          all
          collectives
          organizations
          users
        }
      }

      collective {
        id
        slug
        type
        name
        image
        backgroundImage
        admins: members(role: "ADMIN") {
          id
          role
          collective: member {
            id
            type
            slug
            name
            image
          }
        }
        parentCollective {
          id
          twitterHandle
          image
        }
      }

      members {
        id
        role
        collective: member {
          id
          type
          slug
          name
          image
        }
      }
    }
  }
`);

export default withUser(getCollective(withIntl(TierPage)));
