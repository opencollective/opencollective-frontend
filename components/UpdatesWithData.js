import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { FormattedMessage } from 'react-intl';

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
  };

  constructor(props) {
    super(props);
    this.state = {
      showNewUpdateForm: props.defaultAction === 'new' ? true : false,
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
    const { data, LoggedInUser, collective, compact } = this.props;

    if (data.error) {
      return <Error message={data.error.message} />;
    }

    const updates = data.allUpdates;
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
                  defaultMessage="Stay up to dates with our latest activities and progress."
                />
              </P>
            </Container>
            {LoggedInUser?.canEditCollective(collective) && (
              <Link route="createUpdate" params={{ collectiveSlug: collective.slug }}>
                <StyledButton buttonStyle="primary" m={2}>
                  <FormattedMessage id="sections.update.new" defaultMessage="Create an Update" />
                </StyledButton>
              </Link>
            )}
          </Flex>
        )}
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

const updatesQuery = gql`
  query Updates($CollectiveId: Int!, $limit: Int, $offset: Int) {
    allUpdates(CollectiveId: $CollectiveId, limit: $limit, offset: $offset) {
      id
      slug
      title
      summary
      createdAt
      publishedAt
      updatedAt
      userCanSeeUpdate
      tags
      image
      isPrivate
      makePublicOn
      collective {
        id
        slug
      }
      fromCollective {
        id
        type
        name
        slug
        imageUrl
      }
    }
  }
`;

const getUpdatesVariables = props => {
  return {
    CollectiveId: props.collective.id,
    offset: 0,
    limit: props.limit || UPDATES_PER_PAGE * 2,
    includeHostedCollectives: props.includeHostedCollectives || false,
  };
};

const UPDATES_PER_PAGE = 10;

export const addUpdatesData = graphql(updatesQuery, {
  options: props => ({
    variables: getUpdatesVariables(props),
  }),
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allUpdates.length,
          limit: UPDATES_PER_PAGE,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult;
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allUpdates: [...previousResult.allUpdates, ...fetchMoreResult.allUpdates],
          });
        },
      });
    },
  }),
});

export default addUpdatesData(UpdatesWithData);
