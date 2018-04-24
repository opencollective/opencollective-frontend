import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { defineMessages, FormattedNumber, FormattedMessage, FormattedDate } from 'react-intl';
import { imagePreview, capitalize } from '../lib/utils';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import InputField from './InputField';
import SmallButton from './SmallButton';
import Avatar from './Avatar';
import Link from './Link';
import { get } from 'lodash';

class CommentForm extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    onChange: PropTypes.func,
    onSubmit: PropTypes.func
  }

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

    this.messages = defineMessages({
      'paypal': { id: 'comment.payoutMethod.paypal', defaultMessage: 'PayPal ({paypalEmail})' },
      // 'manual': { id: 'comment.payoutMethod.donation', defaultMessage: 'Consider as donation' },
      'other': { id: 'comment.payoutMethod.manual', defaultMessage: 'Other (give instructions)' }
    });

    this.state = { comment: {} };
 
  }

  async onSubmit() {
    const res = await this.props.onSubmit(this.state.comment);
    if (res.data && res.data.createComment) {
      const comment = res.data.createComment;
      this.setState({ comment });
    }
  }

  handleChange(attr, value) {
    const comment = {
      ...this.state.comment,
      [attr]: value
    };
    this.setState({ comment })
    this.props.onChange && this.props.onChange(comment);
  }

  render() {
    const { LoggedInUser, collective } = this.props;
    if (!LoggedInUser) return <div />;

    const comment = {
      createdAt: new Date,
      fromCollective: {
        id: LoggedInUser.collective.id,
        slug: LoggedInUser.collective.slug,
        name: LoggedInUser.collective.name,
        image: LoggedInUser.image
      }
    };
    const editor = (get(LoggedInUser, 'collective.settings.editor') === 'markdown' || get(collective, 'settings.editor') === 'markdown') ? 'markdown' : 'html';

    return (
        <div className={`CommentForm`}>
        <style jsx>{`
          .CommentForm {
            font-size: 1.2rem;
            overflow: hidden;
            margin: 0.5rem;
            padding: 0.5rem;
          }
          .fromCollective {
            float: left;
            margin-right: 1rem;
          }
          .meta {
            color: #919599;
            font-size: 1.2rem;
          }
          .body {
            overflow: hidden;
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
              <span className="metaItem"><Link route={`/${comment.fromCollective.slug}`}>{comment.fromCollective.name}</Link></span>
            </div>
            <div className="description">
              <div className="comment">
              <InputField
                key={`comment-${this.state.comment.id}`}
                type={editor}
                defaultValue={this.state.comment[editor]}
                onChange={(value) => this.handleChange(editor, value)}
                />
              </div>
              <div className="actions">
                <SmallButton className="primary save" onClick={this.onSubmit}><FormattedMessage id="comment.btn" defaultMessage="Comment" /></SmallButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withIntl(CommentForm);