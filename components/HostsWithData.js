import React from 'react';
import PropTypes from 'prop-types';
import Error from './Error';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import CollectiveCard from './CollectiveCard';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';

const COLLECTIVE_CARDS_PER_PAGE = 10;

class HostsWithData extends React.Component {
  static propTypes = {
    tags: PropTypes.arrayOf(PropTypes.string), // only fetch collectives that have those tags
    onChange: PropTypes.func,
    limit: PropTypes.number,
    empty: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
    fetchMore: PropTypes.func,
    refetch: PropTypes.func,
    data: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.fetchMore = this.fetchMore.bind(this);
    this.refetch = this.refetch.bind(this);
    this.state = {
      role: null,
      loading: false,
    };
  }

  componentDidMount() {
    const { onChange } = this.props;
    onChange && this.node && onChange({ height: this.node.offsetHeight });
  }

  fetchMore(e) {
    const { onChange } = this.props;
    e.target.blur();
    this.setState({ loading: true });
    this.props.fetchMore().then(() => {
      this.setState({ loading: false });
      onChange && onChange({ height: this.node.offsetHeight });
    });
  }

  refetch(role) {
    this.setState({ role });
    this.props.refetch({ role });
  }

  render() {
    const { data } = this.props;

    if (data.error) {
      console.error('graphql error>>>', data.error.message);
      return <Error message="GraphQL error" />;
    }
    if (!data.allHosts || !data.allHosts.collectives) {
      return <div />;
    }
    const collectives = [...data.allHosts.collectives];
    if (collectives.length === 0) {
      return (
        <div className="empty" style={{ marginTop: '1rem' }}>
          {this.props.empty || ''}
        </div>
      );
    }

    const limit = this.props.limit || COLLECTIVE_CARDS_PER_PAGE * 2;
    return (
      <div className="HostsContainer" ref={node => (this.node = node)}>
        <style jsx>
          {`
            :global(.loadMoreBtn) {
              margin: 1rem;
              text-align: center;
            }
            .filter {
              width: 100%;
              max-width: 400px;
              margin: 0 auto;
            }
            :global(.filterBtnGroup) {
              width: 100%;
            }
            :global(.filterBtn) {
              width: 33%;
            }
            .Hosts {
              display: flex;
              flex-wrap: wrap;
              flex-direction: row;
              justify-content: center;
              overflow: hidden;
              margin: 1rem 0;
            }
            .HostsContainer :global(.CollectiveCard) {
              margin: 1rem;
            }
          `}
        </style>

        <div className="Hosts cardsList">
          {collectives.map(collective => (
            <CollectiveCard key={collective.id} collective={collective} />
          ))}
        </div>
        {collectives.length % 10 === 0 && collectives.length >= limit && (
          <div className="loadMoreBtn">
            <Button bsStyle="default" onClick={this.fetchMore}>
              {this.state.loading && <FormattedMessage id="loading" defaultMessage="loading" />}
              {!this.state.loading && <FormattedMessage id="loadMore" defaultMessage="load more" />}
            </Button>
          </div>
        )}
      </div>
    );
  }
}

const getHostsQuery = gql`
  query allHosts(
    $tags: [String]
    $currency: String
    $limit: Int
    $offset: Int
    $orderBy: HostCollectiveOrderFieldType
    $orderDirection: OrderDirection
  ) {
    allHosts(
      tags: $tags
      currency: $currency
      limit: $limit
      offset: $offset
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      total
      collectives {
        id
        type
        createdAt
        slug
        name
        description
        longDescription
        currency
        backgroundImage
        stats {
          id
          collectives {
            hosted
          }
        }
      }
    }
  }
`;

export const addHostsData = graphql(getHostsQuery, {
  options(props) {
    return {
      variables: {
        tags: props.tags,
        currency: props.currency,
        orderBy: props.orderBy,
        orderDirection: props.orderDirection,
        offset: 0,
        limit: props.limit || COLLECTIVE_CARDS_PER_PAGE * 2,
      },
    };
  },
  props: ({ data, ownProps }) => ({
    data,
    fetchMore: () =>
      data.fetchMore({
        variables: {
          offset: data.allHosts.collectives.length,
          limit: ownProps.limit || COLLECTIVE_CARDS_PER_PAGE,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult;
          }
          // Update the results object with new entries
          const { __typename, total, collectives } = previousResult.allHosts;
          const all = collectives.concat(fetchMoreResult.allHosts.collectives);
          return Object.assign({}, previousResult, {
            allHosts: { __typename, total, collectives: all },
          });
        },
      }),
  }),
});

export default addHostsData(HostsWithData);
