import { normalizeLocation } from '../analytics/plausible';

describe('normalizeLocation', () => {
  it('handles dashboard urls', () => {
    expect(normalizeLocation('https://opencollective.com/dashboard/user-slug')).toBe(
      'https://opencollective.com/dashboard/[slug]',
    );

    expect(normalizeLocation('https://opencollective.com/dashboard/user-slug/')).toBe(
      'https://opencollective.com/dashboard/[slug]/',
    );

    expect(normalizeLocation('https://opencollective.com/dashboard/suser-slug/submitted-expenses')).toBe(
      'https://opencollective.com/dashboard/[slug]/submitted-expenses',
    );

    expect(normalizeLocation('https://opencollective.com/dashboard/user-slug/submitted-expenses?status=PAID')).toBe(
      'https://opencollective.com/dashboard/[slug]/submitted-expenses?status=PAID',
    );

    expect(normalizeLocation('https://opencollective.com/collective-slug/expenses')).toBe(
      'https://opencollective.com/collective-slug/expenses',
    );

    expect(normalizeLocation('https://opencollective.com/collective-slug')).toBe(
      'https://opencollective.com/collective-slug',
    );

    expect(normalizeLocation('https://opencollective.com/collective-slug/')).toBe(
      'https://opencollective.com/collective-slug/',
    );

    expect(normalizeLocation('https://opencollective.com/collective-slug/expenses?status=PAID')).toBe(
      'https://opencollective.com/collective-slug/expenses?status=PAID',
    );
  });

  it('handles tokens', () => {
    expect(normalizeLocation('https://opencollective.com/signin/:token')).toBe(
      'https://opencollective.com/signin/[token]',
    );

    expect(normalizeLocation('https://opencollective.com/signin/sent')).toBe('https://opencollective.com/signin/sent');

    expect(normalizeLocation('https://opencollective.com/reset-password/:token')).toBe(
      'https://opencollective.com/reset-password/[token]',
    );

    expect(normalizeLocation('https://opencollective.com/confirm/email/:token')).toBe(
      'https://opencollective.com/confirm/email/[token]',
    );

    expect(normalizeLocation('https://opencollective.com/confirm/guest/:token')).toBe(
      'https://opencollective.com/confirm/guest/[token]',
    );

    expect(normalizeLocation('https://opencollective.com/email/unsubscribe/:email/:slug/:type/:token')).toBe(
      'https://opencollective.com/email/unsubscribe/[email]/[slug]/:type/[token]',
    );
  });
});
