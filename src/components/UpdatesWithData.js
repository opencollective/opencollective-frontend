import React from 'react';
import PropTypes from 'prop-types';
import Error from '../components/Error';
import withIntl from '../lib/withIntl';
import Updates from '../components/Updates';
import Currency from '../components/Currency';
import CreateUpdateForm from '../components/CreateUpdateForm';
import { graphql, compose } from 'react-apollo'
import gql from 'graphql-tag'
import { FormattedMessage } from 'react-intl'
import { pick, get } from 'lodash';
import HTMLEditor from './HTMLEditor';

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
    this.createUpdate = this.createUpdate.bind(this);
    this.state = {
      showNewUpdateForm: props.defaultAction === 'new' ? true : false
    }
  }

  async createUpdate(update) {
    const { LoggedInUser, collective } = this.props;
    try {
      update.collective = { id: collective.id };
      update.currency = collective.currency;
      update.user = pick(update, ['email', 'paypalEmail']);
      delete update.email;
      delete update.paypalEmail;

      if (LoggedInUser) {
        update.user.id = LoggedInUser.id;
      }
      console.log(">>> createUpdate", update);
      const res = await this.props.createUpdate(update);
      console.log(">>> createUpdate res", res);
      this.setState({ showNewUpdateForm: false, updateCreated: res.data.createUpdate })
    } catch (e) {
      console.error(e);
    }
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

    return (
      <div className="UpdatesContainer">
        <style jsx>{`
          .title {
            margin-top: 8rem;
            overflow: hidden;
            border-left: 4px solid #3399FF;
            padding-left: 2.8rem;
            margin-bottom: 5rem;
          }
          h1 {
            color: #18191A;
            font-family: Rubik;
            font-size: 32px;
            font-weight: 500;
            line-height: 38px;
            margin-top: 0;
            margin-bottom: 0.8rem;
            text-align: left;
          }
          .subtitle {
            color: #666F80;
            font-family: Rubik;
            font-size: 16px;
            line-height: 19px;
          }
          .adminActions {
            text-align: center;
            text-transform: uppercase;
            font-size: 1.3rem;
            font-weight: 600;
            letter-spacing: 0.05rem;
            margin-bottom: 3rem;
          }
          .adminActions ul {
            overflow: hidden;
            text-align: center;
            margin: 0 auto;
            padding: 0;
            display: flex;
            justify-content: center;
            flex-direction: row;
            list-style: none;
          }
          .adminActions ul li {
            margin: 0 2rem;
          }
        `}</style>

        { !includeHostedCollectives && this.state.showNewUpdateForm &&
          <CreateUpdateForm
            collective={collective}
            LoggedInUser={LoggedInUser}
            onSubmit={this.createUpdate}
            />
        }

        { this.state.updateCreated &&
          <div className="updateCreated">
            <FormattedMessage id="update.created" defaultMessage="Your update has been submitted with success. It is now pending approval from one of the core contributors of the collective. You will be notified by email once it has been approved." />
          </div>
        }

        { !compact &&
          <div>
            <div className="title">
              <h1>
                <FormattedMessage id="collective.latestUpdates.title" defaultMessage="{n, plural, one {Latest Update} other {Latest Updates}}" values={{n: 2}} />
              </h1>
              <div className="subtitle">
                <FormattedMessage id="collective.latestUpdates.subtitle" defaultMessage="Find out how everyone's contributions take us closer to our goals." />
              </div>
            </div>
            <div className="adminActions">
              <ul>
              { !includeHostedCollectives && !this.state.showNewUpdateForm &&
                <li><a className="submitNewUpdate" onClick={() => this.setState({ showNewUpdateForm: true })}>
                  <FormattedMessage id="update.new.button" defaultMessage="Submit a new update" />
                </a></li>
              }
              </ul>
            </div>
            { LoggedInUser && LoggedInUser.canEditCollective(collective) &&
              <HTMLEditor placeholder={'Write something...'}/>
            }
          </div>
        }

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
    title
    summary
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

const createUpdateQuery = gql`
mutation createUpdate($update: UpdateInputType!) {
  createUpdate(update: $update) {
    id
    title
    summary
    text
    publishedAt
    updatedAt
    tags
    image
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

const addMutation = graphql(createUpdateQuery, {
  props: ( { ownProps, mutate }) => ({
    createUpdate: async (update) => {
      return await mutate({
        variables: { update },
        update: (proxy, { data: { createUpdate} }) => {
          const data = proxy.readQuery({
            query: getUpdatesQuery,
            variables: getUpdatesVariables(ownProps)
          });
          createUpdate.isNew = true;
          data.allUpdates.unshift(createUpdate);
          proxy.writeQuery({
            query: getUpdatesQuery,
            variables: getUpdatesVariables(ownProps),
            data
          });
        },
      })
    }
  })
});

const addData = compose(addUpdatesData, addMutation);

export default addData(withIntl(UpdatesWithData));