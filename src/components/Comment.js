import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { defineMessages, FormattedMessage, FormattedNumber, FormattedDate } from 'react-intl';
import { capitalize, formatCurrency } from '../lib/utils';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import Avatar from './Avatar';
import Link from './Link';
import SmallButton from './SmallButton';
import Markdown from 'react-markdown';

class Comment extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    comment: PropTypes.object,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);

    this.state = {
      modified: false,
      comment: {},
      mode: undefined
    };

    this.save = this.save.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.messages = defineMessages({
      'edit': { id: 'comment.edit', defaultMessage: 'edit' },
      'cancelEdit': { id: 'comment.cancelEdit', defaultMessage: 'cancel edit' }
    });
    this.currencyStyle = { style: 'currency', currencyDisplay: 'symbol', minimumFractionDigits: 2, maximumFractionDigits: 2};
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

  handleChange(comment) {
    this.setState({ modified: true, comment });
  }

  async save() {
    const comment = {
      id: this.props.comment.id,
      ...this.state.comment
    }
    const res = await this.props.editComment(comment);
    this.setState({ modified: false, mode: 'details' });
  }

  render() {
    const {
      intl,
      collective,
      comment,
      LoggedInUser,
      editable,
      view
    } = this.props;

    return (
      <div className={`comment ${status} ${this.state.mode}View`}>
        <style jsx>{`
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
            white-space: nowrap;
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

          @media(max-width: 600px) {
            .comment {
              max-height: 23rem;
            }
          }
        `}</style>
        <style jsx global>{`
          .comment .actions > div > div {
            margin-right: 0.5rem;
          }
        `}</style>
        <div className="fromCollective">
          <a href={`/${comment.fromCollective.slug}`} title={comment.fromCollective.name}>
            <Avatar src={comment.fromCollective.image} key={comment.fromCollective.id} radius={40} />
          </a>
        </div>
        <div className="body">
          <div className="header">
            <div className="meta">
              <span className="createdAt"><FormattedDate value={comment.createdAt} day="numeric" month="numeric" /></span> |&nbsp;
              <span className="metaItem"><Link route={`/${comment.collective.slug}/comments/${comment.category}`}>{capitalize(comment.category)}</Link></span>
              { editable && LoggedInUser && LoggedInUser.canEditComment(comment) &&
                <span> | <a className="toggleEditComment" onClick={this.toggleEdit}>{intl.formatMessage(this.messages[`${this.state.mode === 'edit' ? 'cancelEdit' : 'edit'}`])}</a></span>
              }
            </div>
            <div className="description">
              <Markdown source={comment.markdown} />
            </div>
          </div>

          { editable &&
            <div className="actions">
              { this.state.mode === 'edit' && this.state.modified &&
                <div>
                  <div className="leftColumn"></div>
                  <div className="rightColumn">
                    <SmallButton className="primary save" onClick={this.save}><FormattedMessage id="comment.save" defaultMessage="save" /></SmallButton>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    );
  }
}

const editCommentQuery = gql`
mutation editComment($comment: CommentInputType!) {
  editComment(comment: $comment) {
    id
    markdown
  }
}
`;

const addMutation = graphql(editCommentQuery, {
props: ( { mutate }) => ({
  editComment: async (comment) => {
    return await mutate({ variables: { comment } })
  }
})
});

export default withIntl(addMutation(Comment));