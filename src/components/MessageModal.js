import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages } from 'react-intl';
import withIntl from '../lib/withIntl';

class MessageModal extends React.Component {

  static propTypes = {
    message: PropTypes.string,
  }

  constructor(props) {
    super(props);
    this.state = { show: true };
    this.close = this.close.bind(this);
    this.messages = defineMessages({
      'StripeAccountConnected': { id: 'collective.messages.StripeAccountConnected', defaultMessage: 'Stripe account connected successfully' }
    })
  }

  close() {
    this.setState({ show: false });
  }

  render() {
    const {
      message,
      className,
      intl
    } = this.props;

    if (!this.state.show) {
      return <div />
    }

    return (
      <div className={`MessageModal ${className}`} onClick={this.close}>
        <style jsx>{`
          .MessageModal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 999;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .content {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 300px;
            height: 250px;
            background: white;
            border-radius: 10px;
            flex-direction: column;
          }
        `}</style>
        <div className="content">
          {intl.formatMessage(this.messages[message])}
          <div className="action">
            <a href="" onClick={this.close}>close</a>
          </div>
        </div>
      </div>
    );
  }
}

export default withIntl(MessageModal);
