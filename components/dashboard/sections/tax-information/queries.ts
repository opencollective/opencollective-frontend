import { gql, QueryResult } from '@apollo/client';

import { AccountTaxInformationQuery } from '../../../../lib/graphql/types/v2/graphql';

export const accountTaxInformationQuery = gql`
  query AccountTaxInformation($slug: String!) {
    account(slug: $slug) {
      id
      slug
      name
      legalName
      usTaxForms: legalDocuments(type: US_TAX_FORM) {
        id
        year
        requestStatus
        updatedAt
      }
      location {
        address
        country
        structured
      }
    }
  }
`;

export type AccountFromTaxInformationQuery = QueryResult<AccountTaxInformationQuery>['data']['account'];
