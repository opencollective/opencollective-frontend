import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Link } from '../server/pages';

import StyledLink from './StyledLink';
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

  renderContent() {
    if (this.props.loadingLoggedInUser) {
      return <StyledSpinner size="1em" />;
    }

    return this.props.children || <FormattedMessage id="signIn" defaultMessage="Sign In" />;
  }

  render() {
    const buttonProps = this.props.asLink
      ? {}
      : {
          border: '1px solid #D5DAE0',
          borderRadius: '20px',
          color: 'primary.700',
          display: 'inline-block',
          fontSize: '1.4rem',
          px: 3,
          py: 2,
        };
    return (
      <Link route="signin" params={{ next: this.redirectAfterSignin }} passHref>
        <StyledLink {...buttonProps}>{this.renderContent()}</StyledLink>
      </Link>
    );
  }
}

export default withUser(LoginBtn);
