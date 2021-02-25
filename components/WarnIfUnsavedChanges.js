import React from 'react';
import PropTypes from 'prop-types';
import Router from 'next/router';
import { defineMessages, injectIntl } from 'react-intl';

import { IgnorableError } from '../lib/errors';

/**
 * A component to warn users if they try to leave with unsaved data. Just set
 * `hasUnsavedChanges` to true when this is the case and this component will block any
 * attempt to leave the page.
 */
class WarnIfUnsavedChanges extends React.Component {
  static propTypes = {
    hasUnsavedChanges: PropTypes.bool,
    children: PropTypes.node,
    intl: PropTypes.object,
  };

  componentDidMount() {
    window.addEventListener('beforeunload', this.beforeunload);
    Router.router.events.on('routeChangeStart', this.routeChangeStart);
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.beforeunload);
    Router.router.events.off('routeChangeStart', this.routeChangeStart);
  }

  messages = defineMessages({
    warning: {
      id: 'WarningUnsavedChanges',
      defaultMessage: 'You have unsaved changes. Are you sure you want to leave this page?',
    },
  });

  /**
   * NextJS doesn't yet provide a nice way to abort page loading. We're stuck with throwing
   * an error, which will produce an error in dev but should work fine in prod.
   */
  routeChangeStart = () => {
    const { hasUnsavedChanges, intl } = this.props;
    if (hasUnsavedChanges && !confirm(intl.formatMessage(this.messages.warning))) {
      Router.router.abortComponentLoad();
      Router.router.events.emit('routeChangeError'); // For NProgress to stop the loading indicator
      throw new IgnorableError('Abort page navigation');
    }
  };

  /** Triggered when closing tabs */
  beforeunload = e => {
    const { hasUnsavedChanges, intl } = this.props;
    if (hasUnsavedChanges) {
      e.preventDefault();
      const message = intl.formatMessage(this.messages.warning);
      e.returnValue = message;
      return message;
    }
  };

  render() {
    return this.props.children;
  }
}

export default injectIntl(WarnIfUnsavedChanges);
