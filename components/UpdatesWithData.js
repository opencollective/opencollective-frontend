import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { cloneDeep } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import UpdateFilters from './updates/UpdateFilters';
import Container from './Container';
import Error from './Error';
import { Box, Flex } from './Grid';
import Link from './Link';
import StyledButton from './StyledButton';
import { H1, P } from './Text';
import Updates from './Updates';

class UpdatesWithData extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    limit: PropTypes.number,
    compact: PropTypes.bool, // compact view for homepage (can't edit update, don't show header)
    defaultAction: PropTypes.string, // "new" to open the new update form by default
    LoggedInUser: PropTypes.object,
    data: PropTypes.object,
    fetchMore: PropTypes.func,
    onChange: PropTypes.func,
    query: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = {
      showNewUpdateForm: props.defaultAction === 'new',
    };
  }

  componentDidUpdate(prevProps) {
    const { data, collective } = this.props;
    const { LoggedInUser } = this.props;
    if (!prevProps.LoggedInUser && LoggedInUser && LoggedInUser.canEditCollective(collective)) {
      // We refetch the data to get the updates that are not published yet
      data.refetch({ options: { fetchPolicy: 'network-only' } });
    }
  }

  render() {
    const { data, LoggedInUser, collective, compact, onChange, query } = this.props;

    if (data.error) {
      return <Error message={data.error.message} />;
    }

    const updates = data.account?.updates;
    return (
      <div className="UpdatesContainer">
        {!compact && (
          <Flex flexWrap="wrap" alignItems="center" pr={2} justifyContent="space-between">
            <Container padding="0.8rem 0" my={4}>
              <H1 fontSize="40px" fontWeight="normal" textAlign="left" mb={2}>
                <FormattedMessage id="updates" defaultMessage="Updates" />
              </H1>
              <P color="black.700" css={{ flex: '0 1 70%' }}>
                <FormattedMessage
                  id="section.updates.subtitle"
                  defaultMessage="Updates on our activities and progress."
                />
              </P>
            </Container>
            {LoggedInUser?.canEditCollective(collective) && (
              <Link href={`/${collective.slug}/updates/new`}>
                <StyledButton buttonStyle="primary" m={2}>
                  <FormattedMessage id="sections.update.new" defaultMessage="Create an Update" />
                </StyledButton>
              </Link>
            )}
          </Flex>
        )}
        <UpdateFilters values={query} onChange={onChange} />
        <Box mt={4} mb={5}>
          <Updates
            collective={collective}
            updates={updates}
            editable={!compact}
            fetchMore={this.props.fetchMore}
            LoggedInUser={LoggedInUser}
          />
        </Box>
      </div>
    );
  }
}

const updatesQuery = gqlV2/* GraphQL */ `
  query Updates(
    $collectiveSlug: String!
    $limit: Int
    $offset: Int
    $searchTerm: String
    $orderBy: ChronologicalOrderInput
  ) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      id
      updates(limit: $limit, offset: $offset, searchTerm: $searchTerm, orderBy: $orderBy) {
        totalCount
        nodes {
          id
          slug
          title
          summary
          createdAt
          publishedAt
          updatedAt
          userCanSeeUpdate
          tags
          isPrivate
          isChangelog
          makePublicOn
          fromAccount {
            id
            type
            name
            slug
            imageUrl
          }
        }
      }
    }
  }
`;

const getUpdatesVariables = props => {
  return {
    collectiveSlug: props.collective.slug,
    offset: 0,
    limit: props.limit || UPDATES_PER_PAGE * 2,
    includeHostedCollectives: props.includeHostedCollectives || false,
    orderBy: { field: 'CREATED_AT', direction: props.query?.orderBy === 'oldest' ? 'ASC' : 'DESC' },
    searchTerm: props.query?.searchTerm,
  };
};

const UPDATES_PER_PAGE = 10;

export const addUpdatesData = graphql(updatesQuery, {
  options: props => ({
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
    variables: getUpdatesVariables(props),
  }),
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.account.updates.nodes.length,
          limit: UPDATES_PER_PAGE,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult;
          }
          const previousResultNodes = Object.assign({}, previousResult.account.updates, {
            // Append the new posts results to the old one
            nodes: [...previousResult.account.updates.nodes, ...fetchMoreResult.account.updates.nodes],
          });

          const previousResultClone = cloneDeep(previousResult);
          previousResultClone.account.updates.nodes = previousResultNodes.nodes;
          return previousResultClone;
        },
      });
    },
  }),
});

export default addUpdatesData(UpdatesWithData);
