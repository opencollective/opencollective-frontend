import { gqlV1 } from '../helpers';

export const collectiveBalanceFragment = gqlV1 /* GraphQL */ `
  fragment StatFields on CollectiveStatsType {
    id
    balance
  }
`;
