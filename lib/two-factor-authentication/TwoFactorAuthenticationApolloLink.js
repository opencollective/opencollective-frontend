import { ApolloLink, Observable } from '@apollo/client';
import { get } from 'lodash';

import { TwoFactorAuthenticationHeader } from '.';

// adapted from https://github.com/apollographql/apollo-client/blob/main/src/link/retry/retryLink.ts

class RetryOperation {
  constructor(operation, nextLink, twoFactorAuthContext) {
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

  onNext = value => {
    if (value.errors && !this.waitingForTwoFactorAuthCode) {
      if (get(value.errors, '0.extensions.code') === '2FA_REQUIRED') {
        const supportedMethods = get(value.errors, '0.extensions.supportedMethods', []);
        const authenticationOptions = get(value.errors, '0.extensions.authenticationOptions', {});

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

  onError = error => {
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

  subscribe = observer => {
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

  unsubscribe(observer) {
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
  constructor(twoFactorAuthContext) {
    super();
    this.twoFactorAuthContext = twoFactorAuthContext;
  }

  request(operation, nextLink) {
    const retryLink = new RetryOperation(operation, nextLink, this.twoFactorAuthContext);
    retryLink.try();

    return new Observable(observer => {
      retryLink.subscribe(observer);
      return () => {
        retryLink.unsubscribe(observer);
      };
    });
  }
}
