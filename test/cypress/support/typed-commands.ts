// eslint-disable-next-line spaced-comment
/// <reference types="cypress" />

import type { Message, MessageSummary } from 'cypress-mailpit/dist/src/types';

import { fakeTag as gql } from '../../../lib/graphql/helpers';
import type {
  AccountReferenceInput,
  AmountInput,
  ExpenseType,
  UploadedFileKind,
  UseVendorPolicy,
} from '@/lib/graphql/types/v2/graphql';

import { graphqlQueryV2, signinRequestAndReturnToken } from './commands';
import { getApiUrl } from './helpers';

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
        completeProfile?: boolean;
      }): Chainable<{ email: string; newsletterOptIn: false }>;

      createCollective(params: {
        email?: string;
        slug?: string;
        name?: string;
        type?: string;
      }): Chainable<{ id: number; slug: string }>;

      createHostedCollective(params?: { userEmail?: string }): Chainable<{ slug: string }>;

      createProject(params: {
        userEmail?: string;
        collective?: { slug: string };
        name?: string;
        description?: string;
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
        completeProfile?: boolean;
      }): Chainable<{ email: string }>;

      getByDataCy: Chainable['get'];

      createExpense(params: {
        userEmail?: string;
        type?: ExpenseType | `${ExpenseType}`;
        description?: string;
        account: { slug?: string; legacyId?: number };
        payee: { slug?: string; legacyId?: number };
        items?: { description: string; amountV2: AmountInput }[];
        payoutMethod?: {
          type: string;
          name: string;
          data: Record<string, unknown>;
        };
        attachedFiles?: { url: string }[];
      }): Chainable<{ legacyId: number }>;

      draftExpenseAndInviteUser(params: {
        userEmail?: string;
        account: { slug?: string; legacyId?: number };
        expense: {
          type: ExpenseType | `${ExpenseType}`;
          description?: string;
          currency?: string;
          items?: Record<string, unknown>[];
          payee: { slug?: string; legacyId?: number; name?: string; email?: string };
          [key: string]: unknown;
        };
      }): Chainable<{ id: string; legacyId: number; status: string; currency: string }>;

      openEmail(matcher: (summary: MessageSummary) => boolean): Chainable<Message>;

      logout();

      createHostOrganization(
        email: string,
        options?: unknown,
      ): Chainable<{ id: string; legacyId: number; slug: string }>;

      createVendor: typeof createVendor;

      uploadFile: typeof uploadFile;

      graphqlQueryV2(
        query: string,
        options?: { variables?: Record<string, unknown>; token?: string | null },
      ): Chainable<Record<string, unknown>>;

      editAccount(
        account: { slug: string; settings?: Record<string, unknown>; [key: string]: unknown },
        userEmail?: string,
      ): Chainable<unknown>;

      getAccount: typeof getAccount;

      checkToast(params: { variant: 'success' | 'error' | 'warning' | 'info'; message: string }): Chainable<void>;

      getDownloadedPDFContent(filename: string): Chainable<string>;
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
  vendor: {
    name: string;
    payoutMethod?: unknown;
    canBeUsedWithAccounts?: AccountReferenceInput[];
    useVendorPolicy?: UseVendorPolicy | `${UseVendorPolicy}`;
  },
  userEmail: string,
): Cypress.Chainable<{ id: string; legacyId: number; slug: string; name: string }> {
  return signinRequestAndReturnToken({ email: userEmail }, null).then(token => {
    return graphqlQueryV2(token, {
      operationName: 'CreateVendor',
      query: gql`
        mutation CreateVendor($hostSlug: String!, $vendor: VendorCreateInput!) {
          createVendor(host: { slug: $hostSlug }, vendor: $vendor) {
            id
            legacyId
            name
            slug
            hasPayoutMethod
            useVendorPolicy
            canBeUsedWithAccounts {
              id
              legacyId
              slug
            }
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

Cypress.Commands.add('uploadFile', uploadFile);
/**
 * Uploads a fixture through the API (like the file dropzones do) and returns the uploaded file URL.
 * The fixture is sent in a text body, so it must be ASCII (like `pdf/preview.pdf`).
 */
function uploadFile(
  file: { fixture: string; kind: UploadedFileKind | `${UploadedFileKind}`; mimeType: string },
  userEmail: string,
): Cypress.Chainable<string> {
  const fileName = file.fixture.split('/').pop();
  const boundary = 'cypress-upload-boundary';
  return cy.fixture(file.fixture, 'utf8').then(content => {
    return signinRequestAndReturnToken({ email: userEmail }, null).then(token => {
      return cy
        .request({
          url: `${getApiUrl()}/images`,
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
          },
          body: [
            `--${boundary}`,
            'Content-Disposition: form-data; name="kind"',
            '',
            file.kind,
            `--${boundary}`,
            `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
            `Content-Type: ${file.mimeType}`,
            '',
            content,
            `--${boundary}--`,
            '',
          ].join('\r\n'),
        })
        .then(({ body }) => {
          if (typeof body.url !== 'string') {
            throw new Error(`Upload of ${fileName} returned no file URL: ${JSON.stringify(body)}`);
          }
          return body.url;
        });
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
      operationName: 'Account',
      query: gql`
        query Account($accountSlug: String!) {
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
