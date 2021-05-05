import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { FormattedMessage } from 'react-intl';

import CollectiveCard from './CollectiveCard';
import Container from './Container';
import Error from './Error';
import StyledButton from './StyledButton';

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
      return <Error message={data.error.message} />;
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
      <Container ref={node => (this.node = node)}>
        <Container
          display="flex"
          flexWrap="wrap"
          flexDirection="row"
          justifyContent="center"
          overflow="hidden"
          margin="1rem 0"
        >
          {collectives.map(collective => (
            <CollectiveCard margin="1rem" key={collective.id} collective={collective} />
          ))}
        </Container>
        {collectives.length % 10 === 0 && collectives.length >= limit && (
          <Container margin="1rem" textAlign="center">
            <StyledButton onClick={this.fetchMore}>
              {this.state.loading && <FormattedMessage id="loading" defaultMessage="loading" />}
              {!this.state.loading && <FormattedMessage id="loadMore" defaultMessage="load more" />}
            </StyledButton>
          </Container>
        )}
      </Container>
    );
  }
}

const hostsQuery = gql`
  query Hosts(
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
        isHost
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

export const addHostsData = graphql(hostsQuery, {
  options: props => ({
    variables: {
      tags: props.tags,
      currency: props.currency,
      orderBy: props.orderBy,
      orderDirection: props.orderDirection,
      offset: 0,
      limit: props.limit || COLLECTIVE_CARDS_PER_PAGE * 2,
    },
  }),
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
