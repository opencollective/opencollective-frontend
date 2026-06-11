import { get } from 'lodash-es';

import type { GraphQLV1Collective } from './custom_typings/GraphQLV1';
import type { Policies } from './graphql/types/v2/graphql';

type PoliciesUnion = Exclude<keyof Policies, '__typename' | 'id'>;

type AccountWithPolicies = {
  policies?: { [K in PoliciesUnion]?: Policies[K] } | null;
  parent?: AccountWithPolicies | null;
  parentCollective?: Pick<GraphQLV1Collective, 'policies'> | null;
};

/**
 * Retrieves a policy from the collective or its parent.
 */
export const getPolicy = <Policy extends PoliciesUnion = PoliciesUnion>(
  collective: AccountWithPolicies | null | undefined,
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
export const require2FAForAdmins = (collective: AccountWithPolicies | null | undefined): boolean => {
  return Boolean(getPolicy<'REQUIRE_2FA_FOR_ADMINS'>(collective, 'REQUIRE_2FA_FOR_ADMINS'));
};
