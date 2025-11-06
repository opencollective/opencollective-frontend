// eslint-disable-next-line spaced-comment
/// <reference types="cypress" />

import type { Message, MessageSummary } from 'cypress-mailpit/src/types';

import { fakeTag as gql } from '../../../lib/graphql/helpers';
import type { AmountInput } from '@/lib/graphql/types/v2/schema';

import { graphqlQueryV2, signinRequestAndReturnToken } from './commands';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      retryChain<T>(
        chain: () => Chainable<T>,
        assert: (subject: T) => void,
        options?: { maxAttempts?: number; wait?: number },
        attempts?: number,
      ): Chainable<T>;

      login(params: {
        email: string;
        redirect?: string;
        visitParams?: Partial<Cypress.VisitOptions>;
        sendLink?: boolean;
      }): Chainable<{ email: string; newsletterOptIn: false }>;

      createCollective(params: {
        email?: string;
        slug?: string;
        name?: string;
        type?: string;
      }): Chainable<{ slug: string }>;

      createCollectiveV2(params: {
        email?: string;
        skipApproval?: boolean;
        host?: { slug: string };
        collective?: {
          slug?: string;
          name?: string;
          type?: string;
          location?: { country: string };
          settings?: Record<string, unknown>;
        };
      }): Chainable<{ id: string; slug: string; name; description: string; settings: Record<string, unknown> }>;

      signup(params?: {
        user?: { email?: string; name?: string };
        redirect?: string;
        visitParams?: Partial<Cypress.VisitOptions>;
      }): Chainable<{ email: string }>;

      getByDataCy: Chainable['get'];

      createExpense(params: {
        userEmail?: string;
        account: { slug: string };
        payee: { slug: string };
        items?: { description: string; amountV2: AmountInput }[];
        payoutMethod: {
          type: string;
          name: string;
          data: Record<string, unknown>;
        };
      }): Chainable<{ legacyId: number }>;

      openEmail(matcher: (summary: MessageSummary) => boolean): Chainable<Message>;

      logout();

      createHostOrganization(
        email: string,
        options?: unknown,
      ): Chainable<{ id: string; legacyId: number; slug: string }>;

      createVendor: typeof createVendor;

      getAccount: typeof getAccount;

      checkToast(params: { variant: 'success' | 'error' | 'warning' | 'info'; message: string }): Chainable<void>;
    }
  }
}

// eslint-disable-next-line prefer-arrow-callback
Cypress.Commands.add('retryChain', function <
  T,
>(chain: () => Cypress.Chainable<T>, assert, options = { maxAttempts: 10, wait: 1000 }, attempts = 0) {
  return chain().then(subject => {
    try {
      assert(subject);
    } catch (e) {
      if (attempts >= (options.maxAttempts ?? 10)) {
        throw e;
      }
      cy.wait(options.wait ?? 1000);
      return cy.retryChain(chain, assert, options, attempts + 1);
    }
  });
});

Cypress.Commands.add('createVendor', createVendor);
function createVendor(
  hostSlug: string,
  vendor: { name: string; payoutMethod?: unknown },
  userEmail: string,
): Cypress.Chainable<{ name: string }> {
  return signinRequestAndReturnToken({ email: userEmail }, null).then(token => {
    return graphqlQueryV2(token, {
      operationName: 'CreateVendor',
      query: gql`
        mutation CreateVendor($hostSlug: String!, $vendor: VendorCreateInput!) {
          createVendor(host: { slug: $hostSlug }, vendor: $vendor) {
            id
            name
            slug
            hasPayoutMethod
            __typename
          }
        }
      `,
      variables: { hostSlug, vendor },
    }).then(({ body }) => {
      return body.data.createVendor;
    });
  });
}

Cypress.Commands.add('getAccount', getAccount);
function getAccount(
  accountSlug: string,
  userEmail: string,
): Cypress.Chainable<{ name: string; payoutMethods: { id: string; type: string }[] }> {
  return signinRequestAndReturnToken({ email: userEmail }, null).then(token => {
    return graphqlQueryV2(token, {
      operationName: 'GetAccount',
      query: gql`
        query GetAccount($accountSlug: String!) {
          account(slug: $accountSlug) {
            id
            legacyId
            name
            slug
            __typename
            payoutMethods {
              id
              type
            }
          }
        }
      `,
      variables: { accountSlug },
    }).then(({ body }) => {
      return body.data.account;
    });
  });
}

export {};
