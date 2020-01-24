import React from 'react';
import PropTypes from 'prop-types';
import Error from './Error';
import { graphql } from 'react-apollo';
import { getSubscriptionsQuery } from '../lib/graphql/queries';
import Subscriptions from './Subscriptions';
import { cloneDeep } from 'lodash';

class SubscriptionsWithData extends React.Component {
  static propTypes = {
    slug: PropTypes.string.isRequired,
    LoggedInUser: PropTypes.object,
    subscriptions: PropTypes.array,
    data: PropTypes.object,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { data, LoggedInUser, subscriptions } = this.props;

    if (data.error) {
      return <Error message={data.error.message} />;
    }

    return (
      <div className="SubscriptionContainer">
        <Subscriptions
          subscriptions={subscriptions}
          refetch={data.refetch}
          LoggedInUser={LoggedInUser}
          collective={data.Collective}
          loading={data.loading}
        />
      </div>
    );
  }
}

export const addSubscriptionsData = graphql(getSubscriptionsQuery, {
  options(props) {
    return {
      variables: {
        slug: props.slug,
      },
    };
  },

  props: ({ data }) => {
    let subscriptions = [];

    // since membership data is separate, we can combine it here once
    if (data && data.Collective) {
      subscriptions = cloneDeep(data.Collective.ordersFromCollective);

      subscriptions.map(s => {
        const memberOf = data.Collective.memberOf || [];
        const memberInfo = memberOf.filter(member => member.collective.id === s.collective.id)[0];
        if (memberInfo) {
          s.stats = memberInfo.stats || {};
        }
      });
    }

    return {
      data,
      subscriptions,
    };
  },
});

export default addSubscriptionsData(SubscriptionsWithData);
