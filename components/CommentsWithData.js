import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';
import { FormattedMessage } from 'react-intl';
import { get, cloneDeep } from 'lodash';

import { compose } from '../lib/utils';

import Error from './Error';
import Comments from './Comments';
import CommentForm from './CommentForm';
import LoginBtn from './LoginBtn';

const gqlV2 = gql; // Needed for lint validation of api v2 schema.

class CommentsWithData extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    expense: PropTypes.shape({
      id: PropTypes.number.isRequired,
      status: PropTypes.string,
      user: PropTypes.shape({
        id: PropTypes.number.isRequired,
      }),
    }),
    UpdateId: PropTypes.number,
    limit: PropTypes.number,
    LoggedInUser: PropTypes.object,
    createComment: PropTypes.func,
    data: PropTypes.object,
    view: PropTypes.object,
    fetchMore: PropTypes.func,
    deleteComment: PropTypes.func,
    editComment: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.createComment = this.createComment.bind(this);
  }

  async createComment(comment) {
    const { expense } = this.props;

    const CommentInputType = {
      ...comment,
      expense: { legacyId: expense.id },
    };

    const res = await this.props.createComment(CommentInputType);
    return res.data.createComment;
  }

  renderUserAction(LoggedInUser, expense, notice) {
    if (!LoggedInUser) {
      return (
        <div>
          <hr />
          <LoginBtn>
            <FormattedMessage id="comment.login" defaultMessage="Login to comment" />
          </LoginBtn>
        </div>
      );
    }
    return <CommentForm onSubmit={this.createComment} LoggedInUser={LoggedInUser} notice={notice} />;
  }

  render() {
    const { data, LoggedInUser, collective, expense, view, fetchMore, deleteComment, editComment } = this.props;
    const { expense: expenseComments, error } = data;
    if (error) {
      return <Error message={error.message} />;
    }

    let comments;
    let totalComments;
    if (expenseComments) {
      comments = expenseComments.comments.nodes;
      totalComments = expenseComments.comments.totalCount;
    }
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
          totalComments={totalComments}
          editable={view !== 'compact'}
          LoggedInUser={LoggedInUser}
          fetchMore={fetchMore}
          deleteComment={deleteComment}
          editComment={editComment}
        />

        {this.renderUserAction(LoggedInUser, expense, notice)}
      </div>
    );
  }
}

const getCommentsQuery = gqlV2`
  query getCommentsQuery($id: String!, $limit: Int, $offset: Int) {
    expense(id: $id) {
      id
      comments(limit: $limit, offset: $offset, orderBy: {direction: ASC}) {
        totalCount
        nodes {
          id
          html
          createdAt
          collective {
            id
            slug
            currency
            name
            ... on Collective {
              balance
              host {
                id
                slug
              }
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
    }
  }
`;

const getCommentsQueryVariables = ({ expense, limit = COMMENTS_PER_PAGE }) => ({
  id: `${expense.id}`,
  offset: 0,
  limit,
});

const COMMENTS_PER_PAGE = 10;
export const commentsQuery = graphql(getCommentsQuery, {
  options(props) {
    return {
      context: { apiVersion: '2' },
      variables: getCommentsQueryVariables(props),
    };
  },
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.expense.comments.nodes.length,
          limit: COMMENTS_PER_PAGE,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult;
          }
          const newResult = { ...fetchMoreResult };
          newResult.expense.comments.nodes = [
            ...previousResult.expense.comments.nodes,
            ...fetchMoreResult.expense.comments.nodes,
          ];
          return newResult;
        },
      });
    },
  }),
});

const createCommentQuery = gqlV2`
  mutation createComment($comment: CommentCreateInput!) {
    createComment(comment: $comment) {
      id
      html
      createdAt
      collective {
        id
        slug
        currency
        name
        ... on Collective {
          balance
          host {
            id
            slug
          }
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

const createCommentMutation = graphql(createCommentQuery, {
  options: {
    context: { apiVersion: '2' },
  },
  props: ({ ownProps, mutate }) => ({
    createComment: async comment => {
      return await mutate({
        variables: { comment },
        update: (proxy, { data: { createComment } }) => {
          const query = getCommentsQuery;
          const variables = getCommentsQueryVariables(ownProps);
          /**
           * In other to fire a component re-render it is necessary to deep clone the
           * data before writing it. To learn more about this check this issue:
           * https://github.com/apollographql/apollo-client/issues/3909#issuecomment-522349064
           */
          const data = cloneDeep(proxy.readQuery({ query, variables }));
          // Increment the total amount of comments by one
          data.expense.comments.totalCount++;
          data.expense.comments.nodes.push(createComment);
          proxy.writeQuery({ query, variables, data });
        },
      });
    },
  }),
});

const deleteCommentQuery = gqlV2`
  mutation deleteComment($id: String!) {
    deleteComment(id: $id) {
      id
    }
  }
`;

const deleteCommentMutation = graphql(deleteCommentQuery, {
  options: {
    context: { apiVersion: '2' },
  },
  props: ({ ownProps, mutate }) => ({
    deleteComment: async id => {
      return await mutate({
        variables: { id },
        update: (proxy, { data: { deleteComment } }) => {
          const query = getCommentsQuery;
          const variables = getCommentsQueryVariables(ownProps);
          /**
           * In other to fire a component re-render it is necessary to deep clone the
           * data before writing it. To learn more about this check this issue:
           * https://github.com/apollographql/apollo-client/issues/3909#issuecomment-522349064
           */
          const data = cloneDeep(proxy.readQuery({ query, variables }));
          // Decrease the total amount of comments by one
          data.expense.comments.totalCount--;
          data.expense.comments.nodes = data.expense.comments.nodes.filter(comment => comment.id !== deleteComment.id);
          proxy.writeQuery({ query, variables, data });
        },
      });
    },
  }),
});

const editCommentQuery = gqlV2`
  mutation editComment($comment: CommentUpdateInput!) {
    editComment(comment: $comment) {
      id
      html
      createdAt
      collective {
        id
        slug
        currency
        name
        ... on Collective {
          balance
          host {
            id
            slug
          }
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

const editCommentMutation = graphql(editCommentQuery, {
  options: {
    context: { apiVersion: '2' },
  },
  props: ({ mutate }) => ({
    editComment: async comment => {
      return await mutate({ variables: { comment } });
    },
  }),
});

export default compose(
  commentsQuery,
  createCommentMutation,
  editCommentMutation,
  deleteCommentMutation,
)(CommentsWithData);
