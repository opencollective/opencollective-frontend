import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Link } from '../server/pages';
import StyledLink from './StyledLink';

/**
 * A user login button with proper redirect function. This will **not** check
 * if user is already logged in.
 */
export default class LoginBtn extends React.Component {
  static propTypes = {
    /**
     * Login button label. Default: "Login"
     */
    children: PropTypes.node,
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
    return (
      <Link route="signin" params={{ next: this.redirectAfterSignin }} passHref>
        <StyledLink
          border="1px solid #D5DAE0"
          borderRadius="20px"
          color="#3385FF"
          display="inline-block"
          fontSize="1.4rem"
          px={3}
          py={2}
        >
          {this.props.children || <FormattedMessage id="login.button" defaultMessage="Login" />}
        </StyledLink>
      </Link>
    );
  }
}
