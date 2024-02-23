import { get } from 'lodash';

import type { Policies } from './graphql/types/v2/graphql';

type PoliciesUnion = Exclude<keyof Policies, '__typename' | 'id'>;

/**
 * Retrieves a policy from the collective or its parent.
 */
export const getPolicy = <Policy extends PoliciesUnion = PoliciesUnion>(
  collective,
  policy: PoliciesUnion,
): Policies[Policy] => {
  const parent = collective && (collective.parent || collective.parentCollective);
  const policyPath = `policies.${policy}`;
  const parentPolicy = get(parent, policyPath);
  const ownPolicy = get(collective, policyPath);
  return ownPolicy || parentPolicy;
};

/**
 * Returns true if the account requires 2FA for admins. Parent must be preloaded.
 */
export const require2FAForAdmins = (collective): boolean => {
  return Boolean(getPolicy<'REQUIRE_2FA_FOR_ADMINS'>(collective, 'REQUIRE_2FA_FOR_ADMINS'));
};
