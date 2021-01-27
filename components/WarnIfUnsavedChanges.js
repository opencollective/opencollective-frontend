import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { defineMessages, injectIntl } from 'react-intl';

import { IgnorableError } from '../lib/errors';

/**
 * A component to warn users if they try to leave with unsaved data. Just set
 * `hasUnsavedChanges` to true when this is the case and this component will block any
 * attempt to leave the page.
 */
class WarnIfUnsavedChanges extends React.Component {
  static propTypes = {
    router: PropTypes.object,
    hasUnsavedChanges: PropTypes.bool,
    children: PropTypes.node,
    intl: PropTypes.object,
  };

  componentDidMount() {
    window.addEventListener('beforeunload', this.beforeunload);
    this.props.router.events.on('routeChangeStart', this.routeChangeStart);
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.beforeunload);
    this.props.router.events.off('routeChangeStart', this.routeChangeStart);
  }

  messages = defineMessages({
    warning: {
      id: 'WarningUnsavedChanges',
      defaultMessage: 'You are trying to leave this page with un-saved changes. Are you sure?',
    },
  });

  /**
   * NextJS doesn't yet provide a nice way to abort page loading. We're stuck with throwing
   * an error, which will produce an error in dev but should work fine in prod.
   */
  routeChangeStart = () => {
    const { hasUnsavedChanges, intl } = this.props;
    if (hasUnsavedChanges && !confirm(intl.formatMessage(this.messages.warning))) {
      this.props.router.abortComponentLoad();
      this.props.router.events.emit('routeChangeError'); // For NProgress to stop the loading indicator
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

export default injectIntl(withRouter(WarnIfUnsavedChanges));
