/**
 * Payee choice: the only reader of how the Expense form encodes who gets paid.
 *
 * The `payeeSlug` form value holds either a real Account slug or a `__` sentinel for the other
 * choices (vendor picker, invite, new legal entity...). This keeps Formik values and URLs simple;
 * everything else asks this module what the encoding means.
 */
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

import type { ExpenseFormValues } from './types';
import { InviteeAccountType } from './types';

export enum PayeeKind {
  /** Nothing chosen yet */
  NOT_CHOSEN = 'NOT_CHOSEN',
  /** An existing Account */
  ACCOUNT = 'ACCOUNT',
  /** Picking an Account the submitter administers */
  FIND_ACCOUNT_I_ADMINISTER = 'FIND_ACCOUNT_I_ADMINISTER',
  /** Creating a new legal entity (Organization) to get paid */
  NEW_LEGAL_ENTITY = 'NEW_LEGAL_ENTITY',
  /** Picking a Vendor */
  VENDOR_PICKER = 'VENDOR_PICKER',
  /** Creating a new Vendor */
  NEW_VENDOR = 'NEW_VENDOR',
  /** Searching for someone to invite */
  INVITE_SOMEONE = 'INVITE_SOMEONE',
  /** Inviting a new individual or Organization */
  INVITE_NEW = 'INVITE_NEW',
  /** Inviting an existing user */
  INVITE_EXISTING_USER = 'INVITE_EXISTING_USER',
}

const KIND_BY_SENTINEL: Record<string, PayeeKind> = {
  [PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER]: PayeeKind.FIND_ACCOUNT_I_ADMINISTER,
  [PAYEE_SLUG_CREATE_LEGAL_ENTITY]: PayeeKind.NEW_LEGAL_ENTITY,
  [PAYEE_SLUG_VENDOR]: PayeeKind.VENDOR_PICKER,
  [PAYEE_SLUG_NEW_VENDOR]: PayeeKind.NEW_VENDOR,
  [PAYEE_SLUG_INVITE_SOMEONE]: PayeeKind.INVITE_SOMEONE,
  [PAYEE_SLUG_INVITE]: PayeeKind.INVITE_NEW,
  [PAYEE_SLUG_INVITE_EXISTING_USER]: PayeeKind.INVITE_EXISTING_USER,
};

const isSentinel = (slug: string) => slug.startsWith('__');

type PayeeValues = Partial<
  Pick<
    ExpenseFormValues,
    'payeeSlug' | 'inviteeExistingAccount' | 'inviteeAccountType' | 'inviteeNewIndividual' | 'inviteeNewOrganization'
  >
>;

type PayeeChoice = {
  kind: PayeeKind;
  /** The Account slug to query for the payee, if any */
  querySlug: string | null;
  /** Whether the payee is invited to complete the expense */
  isInvite: boolean;
  /** Whether the submitter is picking (or creating) an Account they administer */
  isAdministeredAccountPicker: boolean;
  /** Who is invited, for invites */
  invitee: PayeeValues['inviteeNewIndividual'] | PayeeValues['inviteeNewOrganization'] | { slug: string } | null;
};

export function getPayeeChoice(values: PayeeValues): PayeeChoice {
  const slug = values.payeeSlug;
  const kind = !slug
    ? PayeeKind.NOT_CHOSEN
    : (KIND_BY_SENTINEL[slug] ?? (isSentinel(slug) ? PayeeKind.NOT_CHOSEN : PayeeKind.ACCOUNT));

  let querySlug: string | null = null;
  let invitee: PayeeChoice['invitee'] = null;
  if (kind === PayeeKind.ACCOUNT) {
    querySlug = slug;
  } else if (kind === PayeeKind.INVITE_EXISTING_USER) {
    querySlug = values.inviteeExistingAccount || null;
    invitee = { slug: values.inviteeExistingAccount };
  } else if (kind === PayeeKind.INVITE_NEW) {
    invitee =
      values.inviteeAccountType === InviteeAccountType.INDIVIDUAL
        ? values.inviteeNewIndividual
        : values.inviteeNewOrganization;
  }

  return {
    kind,
    querySlug,
    isInvite: [PayeeKind.INVITE_SOMEONE, PayeeKind.INVITE_NEW, PayeeKind.INVITE_EXISTING_USER].includes(kind),
    isAdministeredAccountPicker: [PayeeKind.FIND_ACCOUNT_I_ADMINISTER, PayeeKind.NEW_LEGAL_ENTITY].includes(kind),
    invitee,
  };
}

/** The kind of payee encoded by the given `payeeSlug` form value */
export function getPayeeKind(payeeSlug: string | null | undefined): PayeeKind {
  return getPayeeChoice({ payeeSlug }).kind;
}

/**
 * How a new expense for this payee is submitted: created directly for a Vendor or an Account the
 * submitter administers, or drafted and sent as an invite otherwise.
 */
export function getPayeeSubmission(
  choice: PayeeChoice,
  options: { payee?: { type?: string } | null; payoutProfiles?: { slug: string }[] },
): 'create' | 'invite' {
  if (options.payee?.type === CollectiveType.VENDOR) {
    return 'create';
  } else if (choice.kind === PayeeKind.ACCOUNT && options.payoutProfiles?.some(p => p.slug === choice.querySlug)) {
    return 'create';
  } else {
    return 'invite';
  }
}

/** The paying Account slug to query, if a real Account is selected */
export function getAccountQuerySlug(accountSlug: string | null | undefined): string | null {
  return accountSlug && !isSentinel(accountSlug) ? accountSlug : null;
}
