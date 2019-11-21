import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, FormattedDate, injectIntl } from 'react-intl';
import { graphql } from 'react-apollo';

import { compose } from '../lib/utils';
import gql from 'graphql-tag';
import Avatar from './Avatar';
import Link from './Link';
import SmallButton from './SmallButton';
import { pick } from 'lodash';
import InputField from './InputField';
import ConfirmationModal from './ConfirmationModal';

class Comment extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    comment: PropTypes.object,
    LoggedInUser: PropTypes.object,
    editComment: PropTypes.func,
    intl: PropTypes.object.isRequired,
    editable: PropTypes.bool,
    deleteComment: PropTypes.func,
    refetch: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      modified: false,
      comment: props.comment,
      mode: undefined,
      showDeleteModal: false,
    };

    this.save = this.save.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.messages = defineMessages({
      edit: { id: 'comment.edit', defaultMessage: 'Edit' },
      cancelEdit: { id: 'comment.cancelEdit', defaultMessage: 'Cancel edit' },
      delete: { id: 'comment.delete', defaultMessage: 'Delete' },
      'delete.modal.cancel': { id: 'cancel', defaultMessage: 'Cancel' },
      'delete.modal.header': {
        id: 'delete.modal.header',
        defaultMessage: 'Delete comment',
      },
      'delete.modal.body': {
        id: 'delete.modal.body',
        defaultMessage: 'Are you sure you want to delete this comment?',
      },
    });
    this.currencyStyle = {
      style: 'currency',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
  }

  cancelEdit() {
    this.setState({ modified: false, mode: 'details' });
  }

  edit() {
    this.setState({ modified: false, mode: 'edit' });
  }

  toggleEdit() {
    this.state.mode === 'edit' ? this.cancelEdit() : this.edit();
  }

  handleDelete = async () => {
    try {
      await this.props.deleteComment(this.state.comment.id);
      await this.props.refetch();
      this.setState({ showDeleteModal: false });
    } catch (err) {
      console.error(err);
      this.setState({ showDeleteModal: false });
    }
  };

  handleChange(attr, value) {
    this.setState({
      modified: true,
      comment: {
        ...this.state.comment,
        [attr]: value,
      },
    });
    window.state = {
      modified: true,
      comment: { ...this.state.comment, [attr]: value },
    };
  }

  async save() {
    const comment = pick(this.state.comment, ['id', 'html']);
    await this.props.editComment(comment);
    this.setState({ modified: false, mode: 'details' });
  }

  render() {
    const { intl, LoggedInUser, editable } = this.props;
    const { comment } = this.state;
    if (!comment) return <div />;

    return (
      <div className={`comment ${this.state.mode}View`}>
        <style jsx>
          {`
            .comment {
              width: 100%;
              margin: 0.5em 0;
              padding: 0.5em;
              transition: max-height 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              overflow: hidden;
              position: relative;
              display: flex;
            }
            a {
              cursor: pointer;
            }
            .fromCollective {
              float: left;
              margin-right: 1rem;
            }
            .body {
              overflow: hidden;
              font-size: 1.5rem;
              width: 100%;
            }
            .description {
              text-overflow: ellipsis;
              overflow: hidden;
              display: block;
            }
            .meta {
              color: #919599;
              font-size: 1.2rem;
            }
            .meta .metaItem {
              margin: 0 0.2rem;
            }
            .meta .collective {
              margin-right: 0.2rem;
            }

            .actions > div {
              display: flex;
              margin: 0.5rem 0;
            }

            .actions .leftColumn {
              width: 72px;
              margin-right: 1rem;
              float: left;
            }

            .commentActions :global(> div) {
              margin-right: 0.5rem;
            }
          `}
        </style>
        <style jsx global>
          {`
            .comment .actions > div > div {
              margin-right: 0.5rem;
            }
            .comment p {
              margin: 0rem;
            }
          `}
        </style>
        <div className="fromCollective">
          <Link
            route="collective"
            params={{ slug: comment.fromCollective.slug }}
            title={comment.fromCollective.name}
            passHref
          >
            <Avatar collective={comment.fromCollective} key={comment.fromCollective.id} radius={40} />
          </Link>
        </div>
        <div className="body">
          <div className="header">
            <div className="meta">
              <span className="createdAt">
                <FormattedDate value={comment.createdAt} day="numeric" month="numeric" />
              </span>{' '}
              |&nbsp;
              <span className="metaItem">
                <Link route={`/${comment.fromCollective.slug}`}>{comment.fromCollective.name}</Link>
              </span>
              {editable && LoggedInUser && LoggedInUser.canEditComment(comment) && (
                <>
                  <span>
                    {' '}
                    |{' '}
                    <a className="toggleEditComment" onClick={this.toggleEdit}>
                      {intl.formatMessage(this.messages[`${this.state.mode === 'edit' ? 'cancelEdit' : 'edit'}`])}
                    </a>
                  </span>
                  <span>
                    {' '}
                    |{' '}
                    <a className="toggleEditComment" onClick={() => this.setState({ showDeleteModal: true })}>
                      {intl.formatMessage(this.messages['delete'])}
                    </a>
                  </span>
                </>
              )}
            </div>
            <div className="description">
              {this.state.mode !== 'edit' && <div dangerouslySetInnerHTML={{ __html: comment.html }} />}
              {this.state.mode === 'edit' && (
                <InputField
                  name={`comment-${comment.id}`}
                  type="html"
                  defaultValue={comment.html}
                  onChange={value => this.handleChange('html', value)}
                />
              )}
            </div>
          </div>

          {editable && (
            <div className="actions">
              {this.state.mode === 'edit' && (
                <div>
                  <SmallButton className="primary save" onClick={this.save} disabled={!this.state.modified}>
                    <FormattedMessage id="save" defaultMessage="Save" />
                  </SmallButton>
                </div>
              )}
            </div>
          )}
        </div>
        {this.state.showDeleteModal && (
          <ConfirmationModal
            show={this.state.showDeleteModal}
            onClose={() => this.setState({ showDeleteModal: false })}
            cancelLabel={intl.formatMessage(this.messages['delete.modal.cancel'])}
            header={intl.formatMessage(this.messages['delete.modal.header'])}
            body={intl.formatMessage(this.messages['delete.modal.body'])}
            cancelHandler={() => this.setState({ showDeleteModal: false })}
            continueLabel={intl.formatMessage(this.messages['delete'])}
            continueHandler={this.handleDelete}
          />
        )}
      </div>
    );
  }
}

const editCommentQuery = gql`
  mutation editComment($comment: CommentAttributesInputType!) {
    editComment(comment: $comment) {
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

const deleteCommentQuery = gql`
  mutation deleteComment($id: Int!) {
    deleteComment(id: $id) {
      id
    }
  }
`;

const deleteCommentMutation = graphql(deleteCommentQuery, {
  props: ({ mutate }) => ({
    deleteComment: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

const editCommentMutation = graphql(editCommentQuery, {
  props: ({ mutate }) => ({
    editComment: async comment => {
      return await mutate({ variables: { comment } });
    },
  }),
});

const addMutation = compose(deleteCommentMutation, editCommentMutation);
export default injectIntl(addMutation(Comment));
