import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { graphql } from '@apollo/react-hoc';

import Error from '../Error';
import Orders from './Orders';

class OrdersWithData extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    limit: PropTypes.number,
    view: PropTypes.string, // "compact" for homepage (can't edit Order, don't show header), "summary" for list view, "details" for details view
    includeHostedCollectives: PropTypes.bool,
    filters: PropTypes.bool,
    LoggedInUser: PropTypes.object,
    data: PropTypes.object.isRequired,
    fetchMore: PropTypes.func,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { data, LoggedInUser, collective, view, includeHostedCollectives, filters } = this.props;

    if (data.error) {
      return <Error message={data.error.message} />;
    }

    const orders = data.allOrders;

    return (
      <div className="OrdersWithData">
        <Orders
          collective={collective}
          orders={orders}
          refetch={data.refetch}
          editable={view !== 'compact'}
          view={view}
          filters={filters}
          fetchMore={this.props.fetchMore}
          LoggedInUser={LoggedInUser}
          includeHostedCollectives={includeHostedCollectives}
        />
      </div>
    );
  }
}

const getOrdersQuery = gql`
  query allOrders($CollectiveId: Int, $status: String, $limit: Int, $offset: Int, $includeHostedCollectives: Boolean) {
    allOrders(
      CollectiveId: $CollectiveId
      status: $status
      limit: $limit
      offset: $offset
      includeHostedCollectives: $includeHostedCollectives
    ) {
      id
      description
      status
      createdAt
      updatedAt
      totalAmount
      currency
      paymentMethod {
        id
        service
        type
      }
      quantity
      tier {
        id
        name
        amount
        currency
      }
      collective {
        id
        slug
        currency
        name
        host {
          id
          slug
        }
        stats {
          id
          balance
        }
      }
      fromCollective {
        id
        type

        name
        slug
        imageUrl
        isIncognito
      }
      transactions(type: "CREDIT") {
        id
        type
        amount
        currency
        hostCurrency
        hostCurrencyFxRate
        netAmountInCollectiveCurrency
        platformFeeInHostCurrency
        paymentProcessorFeeInHostCurrency
        hostFeeInHostCurrency
        collective {
          id
          slug
          name
          type
          imageUrl
          isIncognito
        }
        host {
          id
          slug
          name
          currency
          hostFeePercent
          type
        }
        paymentMethod {
          service
          type
          name
          data
        }
      }
    }
  }
`;

const getOrdersVariables = props => {
  const vars = {
    CollectiveId: props.collective.id,
    offset: 0,
    limit: props.limit || ORDERS_PER_PAGE * 2,
    includeHostedCollectives: props.includeHostedCollectives || false,
    ...props.filter,
  };
  return vars;
};

const ORDERS_PER_PAGE = 10;
export const addOrdersData = graphql(getOrdersQuery, {
  options(props) {
    return {
      variables: getOrdersVariables(props),
    };
  },
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allOrders.length,
          limit: ORDERS_PER_PAGE,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult;
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allOrders: [...previousResult.allOrders, ...fetchMoreResult.allOrders],
          });
        },
      });
    },
  }),
});

export default addOrdersData(OrdersWithData);
