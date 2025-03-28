import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { cn } from '../lib/utils';

import Image from './Image';
import Link from './Link';
import StyledSpinner from './StyledSpinner';
import { withUser } from './UserProvider';
/**
 * A user login button with proper redirect function.
 * If user is currently loggin in, button will be disabled and will show a spinner.
 */
class LoginBtn extends React.Component {
  static propTypes = {
    /**
     * Login button label. Default: "Sign In"
     */
    children: PropTypes.node,
    loadingLoggedInUser: PropTypes.bool,
    asLink: PropTypes.bool,
    className: PropTypes.string,
    isWhitelabelDomain: PropTypes.bool,
  };

  static defaultProps = {
    children: null,
  };

  constructor(props) {
    super(props);
    this.redirectAfterSignin = '/';
  }

  componentDidMount() {
    if (typeof window !== 'undefined') {
      this.redirectAfterSignin = window.location.href.replace(/^https?:\/\/[^/]+/, '');
    }
  }

  render() {
    const label =
      this.props.children || this.props.isWhitelabelDomain ? (
        <React.Fragment>
          <FormattedMessage id="signInWith" defaultMessage="Sign In with" />
          <Image
            width={18}
            height={18}
            src="/static/images/opencollectiveicon-48x48@2x.png"
            alt="Open Collective"
            style={{ marginLeft: '4px' }}
          />
        </React.Fragment>
      ) : (
        <FormattedMessage id="signIn" defaultMessage="Sign In" />
      );
    return (
      <Link
        href={{ pathname: '/signin', query: { next: this.redirectAfterSignin } }}
        className={cn(
          'text-primary hover:text-primary/80',
          this.props.loadingLoggedInUser ? 'h-8 w-8' : 'h-8 px-4',
          this.props.asLink
            ? 'inline'
            : 'inline-flex items-center justify-center rounded-full border text-sm whitespace-nowrap',
          this.props.className,
        )}
      >
        {this.props.loadingLoggedInUser ? <StyledSpinner size="1em" /> : label}
      </Link>
    );
  }
}

export default withUser(LoginBtn);
