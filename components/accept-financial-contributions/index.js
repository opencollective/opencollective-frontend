import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import { withRouter } from 'next/router';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import ContributionCategoryPicker from './ContributionCategoryPicker';
import ApplyToHost from './ApplyToHost';
import Loading from '../Loading';
import HostSuccessPage from './HostSuccessPage';

class AcceptFinancialContributions extends Component {
  static propTypes = {
    router: PropTypes.object,
    data: PropTypes.object,
    host: PropTypes.object,
    collective: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      path: null,
      chosenHost: null,
    };
  }

  handleChange = (key, value) => {
    this.setState({ [key]: value });
  };

  render() {
    const { data, router } = this.props;
    const { chosenHost } = this.state;
    const { path, state } = router.query;

    if (!data.hosts || !data.hosts.nodes) {
      return <Loading />;
    }

    const hostCollectives = [...data.hosts.nodes];

    if (!path) {
      return <ContributionCategoryPicker onChange={this.handleChange} />;
    }

    if (state) {
      return <HostSuccessPage chosenHost={chosenHost} collective={this.props.collective} />;
    }

    return (
      <ApplyToHost hostCollectives={hostCollectives} collective={this.props.collective} onChange={this.handleChange} />
    );
  }
}

const getHostsQuery = gqlV2`
query getHosts($tags: [String], $limit: Int) {
  hosts(tags: $tags, limit: $limit) {
    totalCount
    nodes {
      legacyId
      createdAt
      type
      name
      slug
      description
      currency
      totalHostedCollectives
      hostFeePercent
      stats {
        yearlyBudget {
          value
        }
      }
      members {
        nodes {
          role
        }
      }
    }
  }
}
`;

export const addHostsData = graphql(getHostsQuery, {
  options: props => ({
    variables: {
      tags: props.tags,
      limit: props.limit,
    },
    context: API_V2_CONTEXT,
  }),
});

export default withRouter(addHostsData(AcceptFinancialContributions));
