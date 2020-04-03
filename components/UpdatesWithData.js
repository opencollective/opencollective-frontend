import React from 'react';
import PropTypes from 'prop-types';
import Error from './Error';
import Updates from './Updates';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';
import { FormattedMessage } from 'react-intl';
import SectionTitle from './SectionTitle';
import StyledButton from './StyledButton';

class UpdatesWithData extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    limit: PropTypes.number,
    compact: PropTypes.bool, // compact view for homepage (can't edit update, don't show header)
    defaultAction: PropTypes.string, // "new" to open the new update form by default
    includeHostedCollectives: PropTypes.bool,
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
    const { data, LoggedInUser, collective, compact, includeHostedCollectives } = this.props;

    if (data.error) {
      return <Error message={data.error.message} />;
    }

    const updates = data.allUpdates;

    let action;
    if (LoggedInUser && LoggedInUser.canEditCollective(collective)) {
      action = {
        href: `/${collective.slug}/updates/new`,
        label: (
          <StyledButton buttonStyle="primary">
            {' '}
            <FormattedMessage id="sections.update.new" defaultMessage="Create an Update" />{' '}
          </StyledButton>
        ),
      };
    }

    return (
      <div className="UpdatesContainer">
        <style jsx>
          {`
            .FullPage .adminActions {
              text-transform: uppercase;
              font-size: 1.3rem;
              font-weight: 600;
              letter-spacing: 0.05rem;
              margin-bottom: 3rem;
            }
          `}
        </style>

        {!compact && (
          <div className="FullPage">
            <SectionTitle section="updates" action={action} />
          </div>
        )}

        <Updates
          collective={collective}
          updates={updates}
          editable={!compact}
          fetchMore={this.props.fetchMore}
          LoggedInUser={LoggedInUser}
          includeHostedCollectives={includeHostedCollectives}
        />
      </div>
    );
  }
}

const getUpdatesQuery = gql`
  query Updates($CollectiveId: Int!, $limit: Int, $offset: Int, $includeHostedCollectives: Boolean) {
    allUpdates(
      CollectiveId: $CollectiveId
      limit: $limit
      offset: $offset
      includeHostedCollectives: $includeHostedCollectives
    ) {
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
export const addUpdatesData = graphql(getUpdatesQuery, {
  options(props) {
    return {
      variables: getUpdatesVariables(props),
    };
  },
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
