import type { useQuery } from "@apollo/client/react";
import { gql } from '@apollo/client';

import type { AccountTaxInformationQuery } from '../../../../lib/graphql/types/v2/graphql';

export const accountTaxInformationQuery = gql`
  query AccountTaxInformation($id: String!) {
    account(id: $id) {
      id
      slug
      name
      legalName
      type
      usTaxForms: legalDocuments(type: US_TAX_FORM) {
        id
        year
        status
        updatedAt
        service
        type
        documentLink
        isExpired
      }
      location {
        address
        country
        structured
      }
    }
  }
`;

export type AccountFromTaxInformationQuery = useQuery.Result<AccountTaxInformationQuery>['data']['account'];
