import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { FormattedMessage } from 'react-intl';
import { get } from 'lodash';

import { compose } from '../lib/utils';

import Error from './Error';
import Comments from './Comments';
import CommentForm from './CommentForm';
import LoginBtn from './LoginBtn';

class CommentsWithData extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    expense: PropTypes.object,
    UpdateId: PropTypes.number,
    limit: PropTypes.number,
    LoggedInUser: PropTypes.object,
    createComment: PropTypes.func,
    data: PropTypes.object,
    view: PropTypes.object,
    fetchMore: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.createComment = this.createComment.bind(this);
  }

  async createComment(comment) {
    const { LoggedInUser, expense, collective } = this.props;

    const CommentInputType = {
      ...comment,
      CollectiveId: collective.id,
      FromCollectiveId: LoggedInUser.collective.id,
      ExpenseId: expense.id,
    };

    const res = await this.props.createComment(CommentInputType);
    return res.data.createComment;
  }

  renderUserAction(LoggedInUser, expense, notice) {
    if (!LoggedInUser)
      return (
        <div>
          <hr />
          <LoginBtn>
            <FormattedMessage id="comment.login" defaultMessage="Login to comment" />
          </LoginBtn>
        </div>
      );
    return <CommentForm onSubmit={this.createComment} LoggedInUser={LoggedInUser} notice={notice} />;
  }

  render() {
    const { data, LoggedInUser, collective, expense, view } = this.props;

    if (data.error) {
      console.error('graphql error>>>', data.error.message);
      return <Error message="GraphQL error" />;
    }

    const comments = data.allComments;
    let notice;
    if (LoggedInUser && LoggedInUser.id !== get(expense, 'user.id')) {
      notice = (
        <FormattedMessage
          id="comment.post.to.author"
          defaultMessage={'Note: Your comment will be public and we will notify the person who submitted the expense'}
        />
      );
    }
    if (LoggedInUser && LoggedInUser.id === get(expense, 'user.id') && expense.status === 'APPROVED') {
      notice = (
        <FormattedMessage
          id="comment.post.to.host"
          defaultMessage={
            'Note: Your comment will be public and we will notify the administrators of the host of this collective'
          }
        />
      );
    }
    if (LoggedInUser && LoggedInUser.id === get(expense, 'user.id') && expense.status !== 'APPROVED') {
      notice = (
        <FormattedMessage
          id="comment.post.to.collective"
          defaultMessage={'Note: Your comment will be public and we will notify the administrators of this collective'}
        />
      );
    }

    return (
      <div className="CommentsWithData">
        <Comments
          collective={collective}
          comments={comments}
          editable={view !== 'compact'}
          fetchMore={this.props.fetchMore}
          LoggedInUser={LoggedInUser}
        />

        {this.renderUserAction(LoggedInUser, expense, notice)}
      </div>
    );
  }
}

const getCommentsQuery = gql`
  query Comments($ExpenseId: Int) {
    allComments(ExpenseId: $ExpenseId) {
      id
      html
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
        imageUrl
      }
    }
  }
`;

const getCommentsVariables = props => {
  const vars = {
    ExpenseId: props.expense.id,
    UpdateId: props.UpdateId,
    offset: 0,
    limit: props.limit || EXPENSES_PER_PAGE * 2,
  };
  return vars;
};

const EXPENSES_PER_PAGE = 10;
export const addCommentsData = graphql(getCommentsQuery, {
  options(props) {
    return {
      variables: getCommentsVariables(props),
    };
  },
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allComments.length,
          limit: EXPENSES_PER_PAGE,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult;
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allComments: [...previousResult.allComments, ...fetchMoreResult.allComments],
          });
        },
      });
    },
  }),
});

const createCommentQuery = gql`
  mutation createComment($comment: CommentInputType!) {
    createComment(comment: $comment) {
      id
      html
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
        imageUrl
      }
    }
  }
`;

const addMutation = graphql(createCommentQuery, {
  props: ({ ownProps, mutate }) => ({
    createComment: async comment => {
      return await mutate({
        variables: { comment },
        update: (proxy, { data: { createComment } }) => {
          const data = proxy.readQuery({
            query: getCommentsQuery,
            variables: getCommentsVariables(ownProps),
          });
          data.allComments.push(createComment);
          proxy.writeQuery({
            query: getCommentsQuery,
            variables: getCommentsVariables(ownProps),
            data,
          });
        },
      });
    },
  }),
});

const addData = compose(addCommentsData, addMutation);

export default addData(CommentsWithData);
