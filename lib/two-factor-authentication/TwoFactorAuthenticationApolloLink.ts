import type { FetchResult } from '@apollo/client';
import { ApolloLink, Observable } from '@apollo/client';
import { get } from 'lodash-es';

import type { TwoFactorAuthContextValue } from './TwoFactorAuthenticationContext';
import { TwoFactorAuthenticationHeader } from '.';

// adapted from https://github.com/apollographql/apollo-client/blob/main/src/link/retry/retryLink.ts

type RetryOperationArguments = {
  operation: Parameters<ApolloLink['request']>[0];
  nextLink: Parameters<ApolloLink['request']>[1];
  twoFactorAuthContext: TwoFactorAuthContextValue;
};

type RetryObserver = {
  next: (value: FetchResult) => void;
  complete: () => void;
  error: (error: Error) => void;
};

class RetryOperation {
  operation: Parameters<ApolloLink['request']>[0];
  nextLink: Parameters<ApolloLink['request']>[1];
  twoFactorAuthContext: TwoFactorAuthContextValue;
  values: FetchResult[];
  observers: RetryObserver[];
  complete: boolean;
  error: Error;
  canceled: boolean;
  currentSubscription: { unsubscribe: () => void };
  waitingForTwoFactorAuthCode: boolean;

  constructor({ operation, nextLink, twoFactorAuthContext }: RetryOperationArguments) {
    this.operation = operation;
    this.nextLink = nextLink;
    this.values = [];
    this.observers = [];
    this.complete = false;
    this.error = null;
    this.canceled = false;
    this.currentSubscription = null;

    this.twoFactorAuthContext = twoFactorAuthContext;
    this.waitingForTwoFactorAuthCode = false;
  }

  onNext = (value: FetchResult) => {
    if (value.errors && !this.waitingForTwoFactorAuthCode) {
      if (get(value.errors, '0.extensions.code') === '2FA_REQUIRED') {
        // GraphQL error extensions are untyped: `get` returns `unknown`, asserted to their runtime shape.
        const supportedMethods = (get(value.errors, '0.extensions.supportedMethods') as string[]) || [];
        const authenticationOptions =
          (get(value.errors, '0.extensions.authenticationOptions') as Record<string, unknown>) || {};

        this.waitingForTwoFactorAuthCode = true;

        this.twoFactorAuthContext.prompt
          .open({ supportedMethods, authenticationOptions })
          .then(({ type, code }) => {
            this.operation.setContext(prevContext => ({
              ...prevContext,
              headers: {
                ...prevContext.headers,
                [TwoFactorAuthenticationHeader]: `${type} ${code}`,
              },
            }));
            this.try();
            this.waitingForTwoFactorAuthCode = false;
          })
          .catch(() => {
            this.onNext(value);
            this.waitingForTwoFactorAuthCode = false;
            this.onComplete();
          });
        return;
      }
    }

    this.values.push(value);
    for (const observer of this.observers) {
      if (!observer) {
        continue;
      }
      observer.next(value);
    }
  };

  onComplete = () => {
    if (this.waitingForTwoFactorAuthCode) {
      return;
    }

    this.complete = true;
    for (const observer of this.observers) {
      if (!observer) {
        continue;
      }
      observer.complete();
    }
  };

  onError = (error: Error) => {
    this.error = error;
    for (const observer of this.observers) {
      if (!observer) {
        continue;
      }
      observer.error(error);
    }
  };

  try() {
    this.nextLink(this.operation).subscribe({
      next: this.onNext,
      error: this.onError,
      complete: this.onComplete,
    });
  }

  cancel = () => {
    if (this.currentSubscription) {
      this.currentSubscription.unsubscribe();
    }
    this.currentSubscription = null;
    this.canceled = true;
  };

  subscribe = (observer: RetryObserver) => {
    if (this.canceled) {
      throw new Error(`Subscribing to a TwoFactorRetryOperation link that was canceled is not supported`);
    }
    this.observers.push(observer);

    for (const value of this.values) {
      observer.next(value);
    }

    if (this.complete) {
      observer.complete();
    } else if (this.error) {
      observer.error(this.error);
    }
  };

  unsubscribe(observer: RetryObserver) {
    const index = this.observers.indexOf(observer);
    if (index < 0) {
      throw new Error(`TwoFactorRetryOperation BUG! Attempting to unsubscribe unknown observer!`);
    }

    this.observers[index] = null;

    if (this.observers.every(o => o === null)) {
      this.cancel();
    }
  }
}

export default class TwoFactorAuthenticationApolloLink extends ApolloLink {
  twoFactorAuthContext: TwoFactorAuthContextValue;

  constructor(twoFactorAuthContext: TwoFactorAuthContextValue) {
    super();
    this.twoFactorAuthContext = twoFactorAuthContext;
  }

  request(operation: Parameters<ApolloLink['request']>[0], nextLink: Parameters<ApolloLink['request']>[1]) {
    const retryLink = new RetryOperation({ operation, nextLink, twoFactorAuthContext: this.twoFactorAuthContext });
    retryLink.try();

    return new Observable(observer => {
      retryLink.subscribe(observer);
      return () => {
        retryLink.unsubscribe(observer);
      };
    });
  }
}
