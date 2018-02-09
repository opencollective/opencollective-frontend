import React from 'react';
import PropTypes from 'prop-types';
import Error from '../components/Error';
import withIntl from '../lib/withIntl';
import Updates from '../components/Updates';
import Currency from '../components/Currency';
import EditUpdateForm from '../components/EditUpdateForm';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { FormattedMessage } from 'react-intl'
import { pick, get } from 'lodash';
import HTMLEditor from './HTMLEditor';
import SectionTitle from './SectionTitle';
import { Link } from '../server/pages';

class UpdatesWithData extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    limit: PropTypes.number,
    compact: PropTypes.bool, // compact view for homepage (can't edit update, don't show header)
    defaultAction: PropTypes.string, // "new" to open the new update form by default
    includeHostedCollectives: PropTypes.bool,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.renderAdminActions = this.renderAdminActions.bind(this);
    this.state = {
      showNewUpdateForm: props.defaultAction === 'new' ? true : false
    }
  }

  componentWillReceiveProps(newProps) {
    const { data, collective } = this.props;
    const { LoggedInUser } = newProps;
    if (LoggedInUser && LoggedInUser.canEditCollective(collective)) {
      // We refetch the data to get the updates that are not published yet
      data.refetch({ options: { fetchPolicy: 'network-only' }});
    }
  }

  renderAdminActions(compact) {
    const { collective } = this.props;
    const className = compact ? "compact" : "";
    return (
      <div className={`adminActions ${className}`}>
        <style jsx>{`
          .adminActions ul {
            overflow: hidden;
            margin: 0 auto;
            padding: 0;
            flex-direction: row;
            list-style: none;
          }
          .adminActions ul li {
            text-align: center;
          }
          .adminActions .compact ul li {
            text-align: center;
          }
        `}</style>
        <ul>
          <li>
            <Link route={`/${collective.slug}/updates/new`}><a className="btn btn-default">
              <FormattedMessage id="update.new.button" defaultMessage="Submit a new update" />
            </a></Link>
          </li>
        </ul>
      </div>
    )
  }

  render() {
    const {
      data,
      LoggedInUser,
      collective,
      compact,
      includeHostedCollectives
    } = this.props;

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<Error message="GraphQL error" />)
    }

    const updates = data.allUpdates;
    const showAdminActions = LoggedInUser && LoggedInUser.canEditCollective(collective) && !includeHostedCollectives;

    return (
      <div className="UpdatesContainer">
        <style jsx>{`
          .FullPage .adminActions {
            text-transform: uppercase;
            font-size: 1.3rem;
            font-weight: 600;
            letter-spacing: 0.05rem;
            margin-bottom: 3rem;
          }
        `}</style>

        { !compact &&
          <div className="FullPage">
            <SectionTitle section="updates" />
          </div>
        }

        { showAdminActions && this.renderAdminActions(compact) }

        <Updates
          collective={collective}
          updates={updates}
          editable={!Boolean(compact)}
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
  allUpdates(CollectiveId: $CollectiveId, limit: $limit, offset: $offset, includeHostedCollectives: $includeHostedCollectives) {
    id
    slug
    title
    summary
    createdAt
    publishedAt
    updatedAt
    tags
    image
    collective {
      id
      slug
    }
    fromCollective {
      id
      type
      name
      slug
      image
    }
  }
}
`;

const getUpdatesVariables = (props) => {
  return {
    CollectiveId: props.collective.id,
    offset: 0,
    limit: props.limit || UPDATES_PER_PAGE * 2,
    includeHostedCollectives: props.includeHostedCollectives || false
  }
}

const UPDATES_PER_PAGE = 10;
export const addUpdatesData = graphql(getUpdatesQuery, {
  options(props) {
    return {
      variables: getUpdatesVariables(props)
    }
  },
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allUpdates.length,
          limit: UPDATES_PER_PAGE
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allUpdates: [...previousResult.allUpdates, ...fetchMoreResult.allUpdates]
          })
        }
      })
    }
  })  
});

export default addUpdatesData(withIntl(UpdatesWithData));