import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { withRequiredProviders } from '../../test/providers';

import { AuthenticatorSettings } from './AuthenticatorSettings';

describe('AuthenticatorSettings', () => {
  it('renders a QR code SVG when adding an authenticator', async () => {
    const user = userEvent.setup();
    render(
      withRequiredProviders(
        <AuthenticatorSettings
          userTwoFactorAuthenticationMethods={[]}
          individual={{ id: 'test-user', email: 'user@example.com' }}
          onRecoveryCodes={jest.fn()}
        />,
      ),
    );

    await user.click(screen.getByRole('button', { name: /add authenticator/i }));

    await waitFor(() => {
      expect(document.querySelector('[data-cy="qr-code"]')).not.toBeNull();
    });

    const qrCodeElement = document.querySelector('[data-cy="qr-code"]');
    expect(qrCodeElement?.tagName.toLowerCase()).toBe('svg');
    expect(Number(qrCodeElement?.getAttribute('width'))).toBe(256);
    expect(Number(qrCodeElement?.getAttribute('height'))).toBe(256);
  });
});
