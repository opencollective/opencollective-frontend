import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import CollectiveCard from './CollectiveCard';
import Error from './Error';

const COLLECTIVE_CARDS_PER_PAGE = 10;

class CollectivesWithData extends React.Component {
  static propTypes = {
    HostCollectiveId: PropTypes.number, // only fetch collectives that are hosted by this collective id
    hostCollectiveSlug: PropTypes.string, // only fetch collectives that are hosted by this collective slug
    memberOfCollectiveSlug: PropTypes.string, // only fetch collectives that are a member of this collective slug
    slugs: PropTypes.arrayOf(PropTypes.string), // manual render of collective by slug
    role: PropTypes.string, // filter collectives that have this given role (use only with memberOfCollectiveSlug)
    type: PropTypes.string, // COLLECTIVE, EVENT, ORGANIZATION or USER
    ParentCollectiveId: PropTypes.number, // only fetch collectives that are under this collective id
    tags: PropTypes.arrayOf(PropTypes.string), // only fetch collectives that have those tags
    onChange: PropTypes.func,
    limit: PropTypes.number,
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
    if (!data.allCollectives || !data.allCollectives.collectives) {
      return <div />;
    }
    const collectives = [...data.allCollectives.collectives];
    if (collectives.length === 0) {
      return <div />;
    }

    const limit = this.props.limit || COLLECTIVE_CARDS_PER_PAGE * 2;
    return (
      <div className="CollectivesContainer" ref={node => (this.node = node)}>
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
            .Collectives {
              display: flex;
              flex-wrap: wrap;
              flex-direction: row;
              justify-content: center;
              overflow: hidden;
              margin: 1rem 0;
            }
            .CollectivesContainer :global(.CollectiveCard) {
              margin: 1rem;
            }
          `}
        </style>

        <div className="Collectives cardsList">
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

const getCollectivesQuery = gql`
  query allCollectives(
    $HostCollectiveId: Int
    $hostCollectiveSlug: String
    $ParentCollectiveId: Int
    $tags: [String]
    $memberOfCollectiveSlug: String
    $role: String
    $type: TypeOfCollective
    $limit: Int
    $offset: Int
    $orderBy: CollectiveOrderField
    $orderDirection: OrderDirection
    $slugs: [String]
  ) {
    allCollectives(
      HostCollectiveId: $HostCollectiveId
      hostCollectiveSlug: $hostCollectiveSlug
      memberOfCollectiveSlug: $memberOfCollectiveSlug
      role: $role
      type: $type
      ParentCollectiveId: $ParentCollectiveId
      tags: $tags
      limit: $limit
      offset: $offset
      orderBy: $orderBy
      orderDirection: $orderDirection
      slugs: $slugs
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
        imageUrl
        backgroundImage
        stats {
          id
          yearlyBudget
          backers {
            all
          }
        }
      }
    }
  }
`;

export const addCollectivesData = graphql(getCollectivesQuery, {
  options(props) {
    return {
      variables: {
        ParentCollectiveId: props.ParentCollectiveId,
        tags: props.tags,
        HostCollectiveId: props.HostCollectiveId,
        hostCollectiveSlug: props.hostCollectiveSlug,
        memberOfCollectiveSlug: props.memberOfCollectiveSlug,
        slugs: props.slugs,
        role: props.role,
        type: props.type,
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
          offset: data.allCollectives.collectives.length,
          limit: ownProps.limit || COLLECTIVE_CARDS_PER_PAGE,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult;
          }
          // Update the results object with new entries
          const { __typename, total, collectives } = previousResult.allCollectives;
          const all = collectives.concat(fetchMoreResult.allCollectives.collectives);
          return Object.assign({}, previousResult, {
            allCollectives: { __typename, total, collectives: all },
          });
        },
      }),
  }),
});

export default addCollectivesData(CollectivesWithData);
