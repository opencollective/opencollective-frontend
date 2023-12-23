import { graphql } from '@apollo/client/react/hoc';

import { collectiveNavbarFieldsFragment } from '../../components/collective-page/graphql/fragments';

import { API_V2_CONTEXT, gql } from './helpers';

const collectiveNavbarQuery = gql`
  query CollectiveNavbar($slug: String!) {
    account(slug: $slug) {
      id
      legacyId
      type
      slug
      name
      imageUrl(height: 256)
      ... on Event {
        parent {
          id
          slug
        }
      }
      ... on Project {
        parent {
          id
          slug
        }
      }
      features {
        id
        ...NavbarFields
      }
    }
  }
  ${collectiveNavbarFieldsFragment}
`;

export const addCollectiveNavbarData = component => {
  return graphql(collectiveNavbarQuery, { options: { context: API_V2_CONTEXT } })(component);
};
