import React from 'react';
import PropTypes from 'prop-types';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import { defineMessages } from 'react-intl';
import withIntl from '../lib/withIntl';

class ErrorPage extends React.Component {

  static propTypes = {
    message: PropTypes.string
  }

  constructor(props) {
    super(props);
    const { intl, message } = props;

    this.messages = defineMessages({
      'collective.is.not.host': { id: 'page.error.collective.is.not.host', defaultMessage: "This page is only for hosts" },
      'default': { id: 'page.error.default', defaultMessage: "Unknown error" }
    });

    if (this.messages[message]) {
      this.error = intl.formatMessage(this.messages[message]);
    } else {
      this.error = message || intl.formatMessage(this.messages['default']);
    }

  }

  render() {
    return (
      <div className="Error">
        <Header />
        <style jsx>{`
        h1 {
          text-align:center;
          padding: 8rem;
        }
        `}
        </style>
        <Body>
          <h1>{this.error}</h1>
        </Body>
        <Footer />
      </div>
    )
  }
}

export default withIntl(ErrorPage);
