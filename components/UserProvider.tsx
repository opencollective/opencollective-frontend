import React from 'react';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { withApollo } from '@apollo/client/react/hoc';
import { decodeJwt } from 'jose';
import { get, isEqual } from 'lodash';
import type { NextRouter } from 'next/router';
import Router, { withRouter } from 'next/router';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';

import * as auth from '../lib/auth';
import { createError, ERROR, formatErrorMessage } from '../lib/errors';
import withLoggedInUser from '../lib/hooks/withLoggedInUser';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS, removeFromLocalStorage } from '../lib/local-storage';
import type LoggedInUser from '../lib/LoggedInUser';
import UserClass from '../lib/LoggedInUser';
import { withTwoFactorAuthenticationPrompt } from '../lib/two-factor-authentication/TwoFactorAuthenticationContext';
import { loggedInUserQuery } from '@/lib/graphql/queries';

import { toast } from './ui/useToast';

type TwoFactorAuthPromptResult = { code: string; type: string };

type TwoFactorAuthPrompt = {
  open: (options?: {
    supportedMethods?: string[];
    authenticationOptions?: Record<string, unknown>;
    allowRecovery?: boolean;
  }) => Promise<TwoFactorAuthPromptResult | undefined>;
};

type GetLoggedInUserOptions = {
  token?: string | null;
  twoFactorAuthenticatorCode?: string;
  twoFactorAuthenticationType?: string;
};

export type UserContextValue = {
  loadingLoggedInUser: boolean;
  errorLoggedInUser: string | Error | null;
  LoggedInUser: LoggedInUser | null;
  logout: (arg?: { redirect?: string; skipQueryRefetch?: boolean }) => Promise<void>;
  login: (token?: string) => Promise<LoggedInUser | null>;
  refetchLoggedInUser: () => Promise<boolean>;
  updateLoggedInUserFromCache: () => void;
};

export const UserContext = React.createContext<UserContextValue>({
  loadingLoggedInUser: true,
  errorLoggedInUser: null,
  LoggedInUser: null,
  logout: async () => undefined,
  login: async () => null,
  refetchLoggedInUser: async () => true,
  updateLoggedInUserFromCache: () => {},
});

type UserProviderProps = WrappedComponentProps & {
  getLoggedInUser: (options?: GetLoggedInUserOptions) => Promise<LoggedInUser | null>;
  getLoggedInUserFromCache: () => LoggedInUser | null;
  twoFactorAuthPrompt: TwoFactorAuthPrompt;
  router: NextRouter;
  client: ApolloClient<NormalizedCacheObject>;
  children?: React.ReactNode;
  initialLoggedInUser?: LoggedInUser | null;
};

type UserProviderState = {
  loadingLoggedInUser: boolean;
  LoggedInUser: LoggedInUser | null;
  errorLoggedInUser: string | Error | null;
};

type TwoFactorAuthError = Error & { type?: string };

class UserProvider extends React.Component<UserProviderProps, UserProviderState> {
  constructor(props: UserProviderProps) {
    super(props);
    this.state = {
      loadingLoggedInUser: !props.initialLoggedInUser,
      LoggedInUser: props.initialLoggedInUser ?? null,
      errorLoggedInUser: null,
    };
  }

  override componentDidMount() {
    window.addEventListener('storage', this.checkLogin);

    if (Router.pathname !== '/signin') {
      this.login();
    }
  }

  override componentWillUnmount() {
    window.removeEventListener('storage', this.checkLogin);
  }

  checkLogin = (event: StorageEvent) => {
    if (event.key === 'LoggedInUser') {
      if (event.oldValue && !event.newValue) {
        return this.setState({ LoggedInUser: null });
      }
      if (!event.oldValue && event.newValue) {
        const { value } = JSON.parse(event.newValue);
        return this.setState({ LoggedInUser: new UserClass(value) });
      }

      const { value: oldValue } = JSON.parse(event.oldValue!);
      const { value } = JSON.parse(event.newValue!);

      if (!isEqual(oldValue, value)) {
        this.setState({ LoggedInUser: new UserClass(value) });
      }
    }
  };

  logout = async ({ redirect, skipQueryRefetch }: { redirect?: string; skipQueryRefetch?: boolean } = {}) => {
    auth.logout();

    this.setState({ LoggedInUser: null, errorLoggedInUser: null });
    await this.props.client.clearStore();

    if (!skipQueryRefetch) {
      await this.props.client.reFetchObservableQueries();
    } else {
      await this.props.client.query({ query: loggedInUserQuery, fetchPolicy: 'network-only' });
    }

    if (redirect) {
      this.props.router.push({
        pathname: redirect,
      });
    }
  };

  login = async (token?: string): Promise<LoggedInUser | null> => {
    const { getLoggedInUser, twoFactorAuthPrompt, intl } = this.props;

    try {
      const LoggedInUser = token ? await getLoggedInUser({ token }) : await getLoggedInUser();
      this.setState({
        loadingLoggedInUser: false,
        errorLoggedInUser: null,
        LoggedInUser,
      });
      return LoggedInUser;
    } catch (error: unknown) {
      const err = error as { networkError?: { result?: { error?: { type?: string } } }; message?: string };
      const errorType = get(err, 'networkError.result.error.type');

      if (!token && errorType === 'jwt_expired') {
        this.logout();
        this.setState({ loadingLoggedInUser: false });
        const message = formatErrorMessage(intl, createError(ERROR.JWT_EXPIRED));
        toast({ variant: 'error', message });
        return null;
      }

      if (err.message?.includes('Two-factor authentication is enabled')) {
        while (true) {
          try {
            const storedToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.TWO_FACTOR_AUTH_TOKEN);
            const decodedToken = decodeJwt(storedToken) as {
              supported2FAMethods?: string[];
              authenticationOptions?: Record<string, unknown>;
            };

            const result = await twoFactorAuthPrompt.open({
              supportedMethods: decodedToken.supported2FAMethods,
              authenticationOptions: decodedToken.authenticationOptions,
              allowRecovery: true,
            });

            if (!result) {
              return null;
            }

            const LoggedInUser = await getLoggedInUser({
              token: getFromLocalStorage(LOCAL_STORAGE_KEYS.TWO_FACTOR_AUTH_TOKEN),
              twoFactorAuthenticatorCode: result.code,
              twoFactorAuthenticationType: result.type,
            });
            if (result.type === 'recovery_code') {
              this.props.router.replace({
                pathname: '/dashboard/[slug]/user-security',
                query: { slug: LoggedInUser?.slug },
              });
            } else {
              this.setState({
                loadingLoggedInUser: false,
                errorLoggedInUser: null,
                LoggedInUser,
              });
            }
            removeFromLocalStorage(LOCAL_STORAGE_KEYS.TWO_FACTOR_AUTH_TOKEN);

            return LoggedInUser;
          } catch (e: unknown) {
            const twoFactorError = e as TwoFactorAuthError;
            this.setState({
              loadingLoggedInUser: false,
              errorLoggedInUser: twoFactorError.message,
            });

            if (twoFactorError.type === 'TWO_FACTOR_AUTH_CANCELED') {
              throw new Error(formatErrorMessage(intl, twoFactorError));
            }

            if (
              twoFactorError.type === 'too_many_requests' ||
              (twoFactorError.type === 'unauthorized' && twoFactorError.message?.includes('Cannot use this token'))
            ) {
              throw new Error(twoFactorError.message);
            }

            toast({ variant: 'error', message: twoFactorError.message });
          }
        }
      } else {
        this.setState({
          loadingLoggedInUser: false,
          errorLoggedInUser: (error as Error).message,
        });
      }
    }
    return null;
  };

  refetchLoggedInUser = async (): Promise<boolean> => {
    const { getLoggedInUser } = this.props;
    try {
      const LoggedInUser = await getLoggedInUser();
      this.setState({
        errorLoggedInUser: null,
        loadingLoggedInUser: false,
        LoggedInUser,
      });
    } catch (error) {
      this.setState({ loadingLoggedInUser: false, errorLoggedInUser: error as Error });
    }
    return true;
  };

  updateLoggedInUserFromCache = () => {
    const { getLoggedInUserFromCache } = this.props;
    const LoggedInUser = getLoggedInUserFromCache();
    this.setState({ LoggedInUser });
  };

  override render() {
    return (
      <UserContext.Provider
        value={{
          ...this.state,
          logout: this.logout,
          login: this.login,
          refetchLoggedInUser: this.refetchLoggedInUser,
          updateLoggedInUserFromCache: this.updateLoggedInUserFromCache,
        }}
      >
        {this.props.children}
      </UserContext.Provider>
    );
  }
}

const { Consumer: UserConsumer } = UserContext;

export function withUser<P extends object>(
  WrappedComponent: React.ComponentType<P & UserContextValue>,
): React.ComponentType<P> {
  const WithUser = (props: P) => <UserConsumer>{context => <WrappedComponent {...context} {...props} />}</UserConsumer>;

  const wrapped = WrappedComponent as React.ComponentType<P & UserContextValue> & {
    getInitialProps?: (context: unknown) => Promise<object>;
  };
  WithUser.getInitialProps = async (context: unknown) => {
    return wrapped.getInitialProps ? await wrapped.getInitialProps(context) : {};
  };

  return WithUser as React.ComponentType<P>;
}

type UserProviderPublicProps = {
  children?: React.ReactNode;
  initialLoggedInUser?: LoggedInUser | null;
};

export default injectIntl(
  withApollo(
    withLoggedInUser(withTwoFactorAuthenticationPrompt(withRouter(injectIntl(UserProvider)))),
  ) as React.ComponentType<WrappedComponentProps<'intl'>>,
) as React.ComponentType<UserProviderPublicProps>;
