import '@testing-library/jest-dom';

import React from 'react';
import { render, waitFor } from '@testing-library/react';

/**
 * Regression test for Wise's Int64 profile identifiers.
 *
 * The OAuth callback receives `profileId` as URL text and must forward it to the
 * `connectTransferwiseAccount` mutation without coercing it to a JavaScript number.
 * Values above `Number.MAX_SAFE_INTEGER` would otherwise be rounded before the request.
 */
const BIG_PROFILE_ID = '9223372036854775807';

const mockPush = jest.fn();
const mockQuery = { code: 'oauth-code', profileId: BIG_PROFILE_ID, state: 'state-123' };
const mockMutate = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({ isReady: true, query: mockQuery, push: mockPush }),
}));

jest.mock('next/dynamic', () => ({ __esModule: true, default: () => () => null }));

jest.mock('@apollo/client', () => ({
  gql: (strings: TemplateStringsArray) => strings.join(''),
  useMutation: () => [mockMutate],
}));

jest.mock('react-intl', () => ({
  useIntl: () => ({ formatMessage: () => 'message' }),
  FormattedMessage: ({ defaultMessage }: { defaultMessage?: string }) => defaultMessage,
  defineMessages: (messages: Record<string, unknown>) => messages,
  defineMessage: (message: unknown) => message,
}));

// eslint-disable-next-line react/display-name
jest.mock('@/components/AuthenticatedPage', () => ({ __esModule: true, default: ({ children }) => children }));

jest.mock('@/lib/confettis', () => ({ confettiFireworks: jest.fn() }));

import TransferwiseOAuthCallbackPage from '../../../../../pages/services/transferwise/oauth/callback';

describe('TransferwiseOAuthCallbackPage', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockMutate.mockResolvedValue({ data: { connectTransferwiseAccount: { redirectUrl: '/dashboard' } } });
    mockPush.mockReset();
  });

  it('forwards an OAuth profileId above Number.MAX_SAFE_INTEGER unchanged as a string', async () => {
    render(<TransferwiseOAuthCallbackPage />);

    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));

    expect(mockMutate).toHaveBeenCalledWith({
      variables: { code: 'oauth-code', profileId: BIG_PROFILE_ID, state: 'state-123' },
    });

    const passedProfileId = mockMutate.mock.calls[0][0].variables.profileId;
    expect(typeof passedProfileId).toBe('string');
    expect(passedProfileId).toBe(BIG_PROFILE_ID);
    // `Number` loses precision on this value; make sure it was not coerced.
    expect(passedProfileId).not.toBe(String(Number(BIG_PROFILE_ID)));
  });
});
