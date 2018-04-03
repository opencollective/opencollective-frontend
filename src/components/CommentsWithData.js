import React from 'react';
import PropTypes from 'prop-types';
import Error from '../components/Error';
import withIntl from '../lib/withIntl';
import Comments from '../components/Comments';
import CommentForm from '../components/CommentForm';
import { graphql, compose } from 'react-apollo'
import gql from 'graphql-tag'
import { FormattedMessage } from 'react-intl'
import { pick, get } from 'lodash';

class CommentsWithData extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    ExpenseId: PropTypes.number,
    UpdateId: PropTypes.number,
    limit: PropTypes.number,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.createComment = this.createComment.bind(this);
  }

  async createComment(comment) {
    const { LoggedInUser, ExpenseId, collective } = this.props;

    const CommentInputType = {
      ...comment,
      CollectiveId: collective.id,
      FromCollectiveId: LoggedInUser.collective.id,
      ExpenseId: parseInt(ExpenseId, 10)
    }
    console.log(">>> createComment", CommentInputType);
    try {
      const res = await this.props.createComment(CommentInputType);
      console.log(">>> res", res);
    } catch(e) {
      console.error(">>> error while trying to create the comment", CommentInputType, e);
    }
  }

  render() {
    const {
      data,
      LoggedInUser,
      collective,
      view
    } = this.props;

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<Error message="GraphQL error" />)
    }

    const comments = data.allComments;

    return (
      <div className="CommentsWithData">

        <Comments
          collective={collective}
          comments={comments}
          refetch={data.refetch}
          editable={view !== 'compact'}
          fetchMore={this.props.fetchMore}
          LoggedInUser={LoggedInUser}
          />

        <CommentForm onSubmit={this.createComment} />

      </div>
    );
  }

}


const getCommentsQuery = gql`
query Comments($ExpenseId: Int) {
  allComments(ExpenseId: $ExpenseId) {
    id
    markdown
    createdAt
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
      image
    }
  }
}
`;

const getCommentsVariables = (props) => {
  const vars = {
    ExpenseId: props.ExpenseId,
    UpdateId: props.UpdateId,
    offset: 0,
    limit: props.limit || EXPENSES_PER_PAGE * 2
  };
  return vars;
}

const EXPENSES_PER_PAGE = 10;
export const addCommentsData = graphql(getCommentsQuery, {
  options(props) {
    return {
      variables: getCommentsVariables(props)
    }
  },
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allComments.length,
          limit: EXPENSES_PER_PAGE
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allComments: [...previousResult.allComments, ...fetchMoreResult.allComments]
          })
        }
      })
    }
  })  
});

const createCommentQuery = gql`
mutation createComment($comment: CommentInputType!) {
  createComment(comment: $comment) {
    id
    markdown
    createdAt
    updatedAt
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
      image
    }
  }
}
`;

const addMutation = graphql(createCommentQuery, {
  props: ( { ownProps, mutate }) => ({
    createComment: async (comment) => {
      return await mutate({
        variables: { comment },
        update: (proxy, { data: { createComment} }) => {
          const data = proxy.readQuery({
            query: getCommentsQuery,
            variables: getCommentsVariables(ownProps)
          });
          data.allComments.unshift(createComment);
          proxy.writeQuery({
            query: getCommentsQuery,
            variables: getCommentsVariables(ownProps),
            data
          });
        },
      })
    }
  })
});

const addData = compose(addCommentsData, addMutation);


export default addData(withIntl(CommentsWithData));