import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { cn } from '../lib/utils';

import { Button } from './ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import Image from './Image';
import Link from './Link';
import Spinner from './Spinner';
import { withUser } from './UserProvider';

interface SignupLoginProps {
  /**
   * Login button label. Default: "Sign In"
   */
  children?: React.ReactNode;
  loadingLoggedInUser?: boolean;
  asLink?: boolean;
  className?: string;
  whitelabel?: {
    domain: string;
  };
}

/**
 * A user login button with proper redirect function.
 * If user is currently loggin in, button will be disabled and will show a spinner.
 */
const SignupLogin: React.FC<SignupLoginProps> = ({
  loadingLoggedInUser = false,
  asLink = false,
  className,
  whitelabel,
}) => {
  const redirectAfterSigninRef = useRef('/');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      redirectAfterSigninRef.current = window.location.href.replace(/^https?:\/\/[^/]+/, '');
    }
  }, []);

  const label = <FormattedMessage id="LogIn" defaultMessage="Log In" />;

  if (whitelabel) {
    const platformSignInUrl = new URL(`${process.env.WEBSITE_URL}/signin`);
    platformSignInUrl.searchParams.set(
      'next',
      typeof window !== 'undefined' ? window.location.href : whitelabel.domain,
    );
    return (
      <a
        href={platformSignInUrl.toString()}
        className={cn(
          'text-primary hover:text-primary/80',
          loadingLoggedInUser ? 'h-8 w-8' : 'h-8 px-4',
          asLink ? 'inline' : 'inline-flex items-center justify-center rounded-full border text-sm whitespace-nowrap',
          className,
        )}
      >
        {loadingLoggedInUser ? (
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
    <div className={cn('flex items-center gap-3', className)}>
      {!loadingLoggedInUser && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="marketing" className="rounded-full whitespace-nowrap" size="sm">
              <FormattedMessage id="SignUp" defaultMessage="Sign Up" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={10} className="w-full max-w-md p-6">
            <div className="relative">
              <div className="space-y-3">
                <Link
                  href="/signup/organization"
                  className="group flex w-full items-center justify-between rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <div>
                    <h4 className="mb-1 text-lg font-semibold text-blue-800">
                      <FormattedMessage defaultMessage="Join as an organization" id="eVjJXR" />
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      <FormattedMessage defaultMessage="If you have a legal entity" id="Zx+AFA" />
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                </Link>

                <Link
                  href="/signup/collective"
                  className="group flex w-full items-center justify-between rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <div>
                    <h4 className="mb-1 text-lg font-semibold text-blue-800">
                      <FormattedMessage defaultMessage="Join as a collective" id="asmRTg" />
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      <FormattedMessage defaultMessage="If you do NOT have a legal entity" id="Xzk6kY" />
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                </Link>
              </div>

              <div className="mt-4">
                <span className="text-sm text-muted-foreground">Or </span>
                <Link href="/signup" className="text-sm text-blue-800 underline hover:text-blue-700">
                  <FormattedMessage defaultMessage="Join as an individual" id="s+BE7Y" />
                </Link>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <Button asChild variant="outline" className="rounded-full whitespace-nowrap" size="sm">
        <Link href={{ pathname: '/signin', query: { next: redirectAfterSigninRef.current } }}>
          {loadingLoggedInUser ? <Spinner size="1em" /> : label}
        </Link>
      </Button>
    </div>
  );
};

export default withUser(SignupLogin);
