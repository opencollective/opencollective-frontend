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
});
