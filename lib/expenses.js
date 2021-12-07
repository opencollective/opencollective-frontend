import { get, omit } from 'lodash';
import memoizeOne from 'memoize-one';

import { CollectiveType } from './constants/collectives';

const { ORGANIZATION } = CollectiveType;

export const getPayoutProfiles = memoizeOne(loggedInAccount => {
  if (!loggedInAccount) {
    return [];
  } else {
    const payoutProfiles = [loggedInAccount];
    for (const membership of get(loggedInAccount, 'adminMemberships.nodes', [])) {
      if (
        // Organizations
        [ORGANIZATION].includes(membership.account.type) ||
        // Relax available accounts
        membership.account.isActive
      ) {
        // Push main account
        payoutProfiles.push(omit(membership.account, ['childrenAccounts']));
        // Push children and add Host if missing
        for (const childrenAccount of membership.account.childrenAccounts.nodes) {
          payoutProfiles.push({ host: membership.account.host, ...childrenAccount });
        }
      }
    }
    return payoutProfiles;
  }
});
