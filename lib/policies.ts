import { get } from 'lodash';

import type { GraphQLV1Collective } from './custom_typings/GraphQLV1';
import type { Account, Policies } from './graphql/types/v2/schema';

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
export const require2FAForAdmins = (
  collective: Pick<Account, 'policies'> & {
    parent?: Pick<Account, 'policies'> | null;
    parentCollective?: Pick<GraphQLV1Collective, 'policies'> | null;
  },
): boolean => {
  return Boolean(getPolicy<'REQUIRE_2FA_FOR_ADMINS'>(collective, 'REQUIRE_2FA_FOR_ADMINS'));
};
