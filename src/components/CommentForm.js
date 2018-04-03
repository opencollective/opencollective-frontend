import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { defineMessages, FormattedNumber, FormattedMessage } from 'react-intl';
import { imagePreview, capitalize } from '../lib/utils';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import InputField from './InputField';
import SmallButton from './SmallButton';
import MarkdownEditor from './MarkdownEditor';

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

  onSubmit() {
    this.props.onSubmit(this.state.comment);
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
    const { LoggedInUser } = this.props;

    return (
        <div className={`CommentForm`}>
        <style jsx>{`
          .CommentForm {
            font-size: 1.2rem;
            overflow: hidden;
            transition: max-height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
        `}</style>
        <div className="comment">
          <MarkdownEditor onChange={markdown => this.handleChange('markdown', markdown)} />
        </div>
        <div className="actions">
          <SmallButton className="primary save" onClick={this.onSubmit}><FormattedMessage id="comment.btn" defaultMessage="Comment" /></SmallButton>        
        </div>
      </div>
    );
  }
}

export default withIntl(CommentForm);