import { CollectiveType } from '../../../lib/constants/collectives';
import {
  PAYEE_SLUG_CREATE_LEGAL_ENTITY,
  PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER,
  PAYEE_SLUG_INVITE,
  PAYEE_SLUG_INVITE_EXISTING_USER,
  PAYEE_SLUG_INVITE_SOMEONE,
  PAYEE_SLUG_NEW_VENDOR,
  PAYEE_SLUG_VENDOR,
} from '../../expenses/lib/constants';

import { getAccountQuerySlug, getPayeeChoice, getPayeeSubmission, PayeeKind } from './payee-choice';
import { InviteeAccountType } from './types';

const choice = (payeeSlug: string, overrides = {}) =>
  getPayeeChoice({
    payeeSlug,
    inviteeExistingAccount: 'bob',
    inviteeAccountType: InviteeAccountType.INDIVIDUAL,
    inviteeNewIndividual: { name: 'Ind' },
    inviteeNewOrganization: { name: 'Org admin', organization: { name: 'Org' } },
    ...overrides,
  });

describe('getPayeeChoice', () => {
  it.each([
    [undefined, PayeeKind.NOT_CHOSEN, null, false],
    ['', PayeeKind.NOT_CHOSEN, null, false],
    ['__unknown', PayeeKind.NOT_CHOSEN, null, false],
    ['jane', PayeeKind.ACCOUNT, 'jane', false],
    ['constructor', PayeeKind.ACCOUNT, 'constructor', false],
    [PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER, PayeeKind.FIND_ACCOUNT_I_ADMINISTER, null, false],
    [PAYEE_SLUG_CREATE_LEGAL_ENTITY, PayeeKind.NEW_LEGAL_ENTITY, null, false],
    [PAYEE_SLUG_VENDOR, PayeeKind.VENDOR_PICKER, null, false],
    [PAYEE_SLUG_NEW_VENDOR, PayeeKind.NEW_VENDOR, null, false],
    [PAYEE_SLUG_INVITE_SOMEONE, PayeeKind.INVITE_SOMEONE, null, true],
    [PAYEE_SLUG_INVITE, PayeeKind.INVITE_NEW, null, true],
    [PAYEE_SLUG_INVITE_EXISTING_USER, PayeeKind.INVITE_EXISTING_USER, 'bob', true],
  ])('decodes %s as %s, querying %s', (payeeSlug, kind, querySlug, isInvite) => {
    const result = choice(payeeSlug);
    expect(result.kind).toBe(kind);
    expect(result.querySlug).toBe(querySlug);
    expect(result.isInvite).toBe(isInvite);
  });

  it.each([
    [InviteeAccountType.INDIVIDUAL, { name: 'Ind' }],
    [InviteeAccountType.ORGANIZATION, { name: 'Org admin', organization: { name: 'Org' } }],
  ])('exposes the new %s invitee', (inviteeAccountType, invitee) => {
    expect(choice(PAYEE_SLUG_INVITE, { inviteeAccountType }).invitee).toEqual(invitee);
  });

  it('exposes the invited existing user', () => {
    expect(choice(PAYEE_SLUG_INVITE_EXISTING_USER).invitee).toEqual({ slug: 'bob' });
  });

  it('has no invitee for other choices', () => {
    expect(choice('jane').invitee).toBeNull();
  });

  it('marks the administered-account pickers', () => {
    expect(choice(PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER).isAdministeredAccountPicker).toBe(true);
    expect(choice(PAYEE_SLUG_CREATE_LEGAL_ENTITY).isAdministeredAccountPicker).toBe(true);
    expect(choice('jane').isAdministeredAccountPicker).toBe(false);
  });
});

describe('getPayeeSubmission', () => {
  const payoutProfiles = [{ slug: 'jane' }];
  it.each([
    ['an administered account', 'jane', null, 'create'],
    ['a Vendor', 'vendor', { slug: 'vendor', type: CollectiveType.VENDOR }, 'create'],
    ['an account the submitter does not administer', 'bob', { slug: 'bob', type: CollectiveType.USER }, 'invite'],
    ['a new invitee', PAYEE_SLUG_INVITE, null, 'invite'],
    ['an invited existing user', PAYEE_SLUG_INVITE_EXISTING_USER, { slug: 'bob', type: CollectiveType.USER }, 'invite'],
  ])('submits %s as %s', (_, payeeSlug, payee, submission) => {
    expect(getPayeeSubmission(choice(payeeSlug), { payee, payoutProfiles })).toBe(submission);
  });
});

describe('getAccountQuerySlug', () => {
  it.each([
    ['collective', 'collective'],
    ['__pick', null],
    [undefined, null],
  ])('queries %s as %s', (accountSlug, querySlug) => {
    expect(getAccountQuerySlug(accountSlug)).toBe(querySlug);
  });
});
