import { gqlV1 } from '../helpers';

export const collectiveBalanceFragment = gqlV1/* GraphQL */ `
  fragment StatFieldsFragment on CollectiveStatsType {
    id
    balance
  }
`;
