import React from 'react';
import PropTypes from 'prop-types';
import Error from '../components/Error';
import withIntl from '../lib/withIntl';
import { graphql } from 'react-apollo';
import { getSubscriptionsQuery } from '../graphql/queries';
import Subscriptions from '../components/Subscriptions';
import { cloneDeep } from 'lodash';

class SubscriptionsWithData extends React.Component {

  static propTypes = {
    slug: PropTypes.string.isRequired,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
  }

  render() {
    const { data, LoggedInUser, subscriptions } = this.props;

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<Error message="GraphQL error" />)
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
      }
    }
  },

  props: ({ data }) => {

    let subscriptions = [];

    // since membership data is separate, we can combine it here once
    if (data && data.Collective) {
      subscriptions = cloneDeep(data.Collective.ordersFromCollective);

      subscriptions.map(s => {
        const memberInfo = data.Collective.memberOf.filter(member => member.collective.id === s.collective.id)[0];
        if (memberInfo) {
          s.stats = memberInfo.stats || {};
        }
      });

    }

    return ({
      data,
      subscriptions
    })
  }

});


export default addSubscriptionsData(withIntl(SubscriptionsWithData));
