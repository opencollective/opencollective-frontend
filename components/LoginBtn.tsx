import React from 'react';
import { FormattedMessage } from 'react-intl';

import { cn } from '../lib/utils';

import Image from './Image';
import Link from './Link';
import Spinner from './Spinner';
import { withUser } from './UserProvider';

type Props = {
  /**
   * Login button label. Default: "Sign In"
   */
  children?: React.ReactNode;
  loadingLoggedInUser?: boolean;
  asLink?: boolean;
  className?: string;
  whitelabel?: { domain?: string };
};

/**
 * A user login button with proper redirect function.
 * If user is currently loggin in, button will be disabled and will show a spinner.
 */
class LoginBtn extends React.Component<Props> {
  static defaultProps = {
    children: null,
  };

  constructor(props: Props) {
    super(props);
    this.redirectAfterSignin = '/';
  }

  componentDidMount() {
    if (typeof window !== 'undefined') {
      this.redirectAfterSignin = window.location.href.replace(/^https?:\/\/[^/]+/, '');
    }
  }

  redirectAfterSignin: string;

  render() {
    const label = this.props.children || <FormattedMessage id="signIn" defaultMessage="Sign In" />;

    if (this.props.whitelabel) {
      const platformSignInUrl = new URL(`${process.env.WEBSITE_URL}/signin`);
      platformSignInUrl.searchParams.set(
        'next',
        typeof window !== 'undefined' ? window.location.href : this.props.whitelabel.domain,
      );
      return (
        <a
          href={platformSignInUrl.toString()}
          className={cn(
            'text-primary hover:text-primary/80',
            this.props.loadingLoggedInUser ? 'h-8 w-8' : 'h-8 px-4',
            this.props.asLink
              ? 'inline'
              : 'inline-flex items-center justify-center rounded-full border text-sm whitespace-nowrap',
            this.props.className,
          )}
        >
          {this.props.loadingLoggedInUser ? (
            <Spinner size="1em" />
          ) : (
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
          )}
        </a>
      );
    }
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
        {this.props.loadingLoggedInUser ? <Spinner size="1em" /> : label}
      </Link>
    );
  }
}

export default withUser(LoginBtn);
