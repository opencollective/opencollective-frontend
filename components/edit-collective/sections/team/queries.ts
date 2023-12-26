import { gql } from '../../../../lib/graphql/helpers';

const memberFieldsFragment = gql`
  fragment MemberFields on Member {
    id
    role
    since
    createdAt
    description
    inherited
    account {
      id
      name
      slug
      type
      imageUrl(height: 64)
      ... on Individual {
        email
      }
    }
  }
`;

export const teamSectionQuery = gql`
  query TeamSection($collectiveSlug: String!, $account: AccountReferenceInput!) {
    account(slug: $collectiveSlug) {
      id
      legacyId
      slug
      isFrozen
      type
      imageUrl(height: 256)
      ... on AccountWithParent {
        parent {
          id
          slug
          type
          name
        }
      }
      ... on AccountWithHost {
        host {
          id
          slug
          name
          features {
            id
            CONTACT_FORM
          }
          policies {
            id
            COLLECTIVE_MINIMUM_ADMINS {
              numberOfAdmins
              applies
              freeze
            }
          }
        }
      }
      members(role: [ADMIN, MEMBER, ACCOUNTANT], limit: 100) {
        nodes {
          id
          ...MemberFields
        }
      }
      childrenAccounts {
        nodes {
          id
          slug
          type
          name
          members(includeInherited: false, role: [ADMIN, MEMBER, ACCOUNTANT], limit: 100) {
            nodes {
              id
              ...MemberFields
            }
          }
        }
      }
    }
    memberInvitations(account: $account) {
      id
      role
      since
      createdAt
      description
      account: memberAccount {
        id
        name
        slug
        type
        imageUrl(height: 64)
        ... on Individual {
          email
        }
      }
    }
  }
  ${memberFieldsFragment}
`;
