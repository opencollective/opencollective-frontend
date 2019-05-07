import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import { pick, isArray } from 'lodash';

import { getLoggedInUserQuery, getCollectiveToEditQueryFields } from './queries';

const createOrderQuery = gql`
  mutation createOrder($order: OrderInputType!) {
    createOrder(order: $order) {
      id
      createdAt
      status
      createdByUser {
        id
      }
      fromCollective {
        id
        slug
      }
      collective {
        id
        slug
      }
      transactions(type: "CREDIT") {
        id
        uuid
      }
    }
  }
`;

export const createUserQuery = gql`
  mutation createUser($user: UserInputType!, $organization: CollectiveInputType, $redirect: String) {
    createUser(user: $user, organization: $organization, redirect: $redirect) {
      user {
        id
        email
      }
      organization {
        id
        slug
      }
    }
  }
`;

const createMemberQuery = gql`
  mutation createMember(
    $member: CollectiveAttributesInputType!
    $collective: CollectiveAttributesInputType!
    $role: String!
  ) {
    createMember(member: $member, collective: $collective, role: $role) {
      id
      createdAt
      member {
        id
        name
        image
        slug
        twitterHandle
        description
      }
      role
    }
  }
`;

const removeMemberQuery = gql`
  mutation removeMember(
    $member: CollectiveAttributesInputType!
    $collective: CollectiveAttributesInputType!
    $role: String!
  ) {
    removeMember(member: $member, collective: $collective, role: $role) {
      id
    }
  }
`;

const createCollectiveQuery = gql`
  mutation createCollective($collective: CollectiveInputType!) {
    createCollective(collective: $collective) {
      id
      name
      slug
      type
      website
      twitterHandle
    }
  }
`;

const createCollectiveFromGithubQuery = gql`
  mutation createCollectiveFromGithub($collective: CollectiveInputType!) {
    createCollectiveFromGithub(collective: $collective) {
      id
      name
      slug
      type
      githubHandle
    }
  }
`;

/* eslint-disable graphql/template-strings, graphql/no-deprecated-fields, graphql/capitalized-type-name, graphql/named-operations */
const editCollectiveQuery = gql`
  mutation editCollective($collective: CollectiveInputType!) {
    editCollective(collective: $collective) {
      ${getCollectiveToEditQueryFields}
    }
  }
`;
/* eslint-enable graphql/template-strings, graphql/no-deprecated-fields, graphql/capitalized-type-name, graphql/named-operations */

const deleteEventCollectiveQuery = gql`
  mutation deleteEventCollective($id: Int!) {
    deleteEventCollective(id: $id) {
      id
    }
  }
`;

const deleteCollectiveQuery = gql`
  mutation deleteCollective($id: Int!) {
    deleteCollective(id: $id) {
      id
    }
  }
`;

const deleteUserCollectiveQuery = gql`
  mutation deleteUserCollective($id: Int!) {
    deleteUserCollective(id: $id) {
      id
    }
  }
`;

const archiveCollectiveQuery = gql`
  mutation archiveCollective($id: Int!) {
    archiveCollective(id: $id) {
      id
      isArchived
    }
  }
`;

const unarchiveCollectiveQuery = gql`
  mutation unarchiveCollective($id: Int!) {
    unarchiveCollective(id: $id) {
      id
      isArchived
    }
  }
`;

export const createApplicationMutation = gql`
  mutation createApplication($application: ApplicationInput!) {
    createApplication(application: $application) {
      id
      name
      description
      callbackUrl
      clientId
      clientSecret
    }
  }
`;

export const updateApplicationMutation = gql`
  mutation updateApplication($id: String!, $application: ApplicationInput!) {
    updateApplication(id: $id, application: $application) {
      id
      name
      description
      callbackUrl
    }
  }
`;

export const deleteApplicationMutation = gql`
  mutation deleteApplication($id: String!) {
    deleteApplication(id: $id) {
      id
    }
  }
`;

export const createVirtualCardsMutationQuery = gql`
  mutation createVirtualCards(
    $CollectiveId: Int!
    $numberOfVirtualCards: Int
    $emails: [String]
    $PaymentMethodId: Int
    $amount: Int
    $monthlyLimitPerMember: Int
    $description: String
    $expiryDate: String
    $currency: String
    $limitedToTags: [String]
    $limitedToCollectiveIds: [Int]
    $limitedToHostCollectiveIds: [Int]
    $limitedToOpenSourceCollectives: Boolean
    $customMessage: String
  ) {
    createVirtualCards(
      amount: $amount
      monthlyLimitPerMember: $monthlyLimitPerMember
      CollectiveId: $CollectiveId
      PaymentMethodId: $PaymentMethodId
      description: $description
      expiryDate: $expiryDate
      currency: $currency
      limitedToTags: $limitedToTags
      limitedToCollectiveIds: $limitedToCollectiveIds
      limitedToHostCollectiveIds: $limitedToHostCollectiveIds
      numberOfVirtualCards: $numberOfVirtualCards
      emails: $emails
      limitedToOpenSourceCollectives: $limitedToOpenSourceCollectives
      customMessage: $customMessage
    ) {
      id
      name
      uuid
      description
      initialBalance
      monthlyLimitPerMember
      expiryDate
      currency
      data
    }
  }
`;

export const addCreateOrderMutation = graphql(createOrderQuery, {
  props: ({ mutate }) => ({
    createOrder: order => mutate({ variables: { order } }),
  }),
});

export const addCreateMemberMutation = graphql(createMemberQuery, {
  props: ({ mutate }) => ({
    createMember: (member, collective, role) => mutate({ variables: { member, collective, role } }),
  }),
});

export const addRemoveMemberMutation = graphql(removeMemberQuery, {
  props: ({ mutate }) => ({
    removeMember: (member, collective, role) => mutate({ variables: { member, collective, role } }),
  }),
});

export const addEventMutations = compose(
  addCreateOrderMutation,
  addCreateMemberMutation,
  addRemoveMemberMutation,
);

export const addCreateCollectiveMutation = graphql(createCollectiveQuery, {
  props: ({ mutate }) => ({
    createCollective: async collective => {
      const CollectiveInputType = pick(collective, [
        'slug',
        'type',
        'name',
        'image',
        'description',
        'longDescription',
        'location',
        'twitterHandle',
        'githubHandle',
        'website',
        'tags',
        'startsAt',
        'endsAt',
        'timezone',
        'maxAmount',
        'currency',
        'quantity',
        'HostCollectiveId',
        'ParentCollectiveId',
        'data',
        CollectiveInputType,
      ]);
      CollectiveInputType.tiers = (collective.tiers || []).map(tier =>
        pick(tier, ['type', 'name', 'description', 'amount', 'maxQuantity', 'maxQuantityPerUser']),
      );
      CollectiveInputType.location = pick(collective.location, ['name', 'address', 'lat', 'long', 'country']);
      return await mutate({
        variables: { collective: CollectiveInputType },
        update: (store, { data: { createCollective } }) => {
          const data = store.readQuery({ query: getLoggedInUserQuery });
          data.LoggedInUser.memberOf.push({
            __typename: 'Member',
            collective: createCollective,
            role: 'ADMIN',
          });
          store.writeQuery({ query: getLoggedInUserQuery, data });
        },
      });
    },
  }),
});

export const addCreateCollectiveFromGithubMutation = graphql(createCollectiveFromGithubQuery, {
  props: ({ mutate }) => ({
    createCollectiveFromGithub: async collective => {
      const CollectiveInputType = pick(collective, ['slug', 'type', 'name', 'description', 'githubHandle']);
      return await mutate({
        variables: { collective: CollectiveInputType },
        update: (store, { data: { createCollectiveFromGithub } }) => {
          const data = store.readQuery({ query: getLoggedInUserQuery });
          data.LoggedInUser.memberOf.push({
            __typename: 'Member',
            collective: createCollectiveFromGithub,
            role: 'ADMIN',
          });
          store.writeQuery({ query: getLoggedInUserQuery, data });
        },
      });
    },
  }),
});

export const addEditCollectiveMutation = graphql(editCollectiveQuery, {
  props: ({ mutate }) => ({
    editCollective: async collective => {
      const CollectiveInputType = pick(collective, [
        'id',
        'type',
        'slug',
        'name',
        'company',
        'description',
        'longDescription',
        'tags',
        'expensePolicy',
        'website',
        'twitterHandle',
        'githubHandle',
        'location',
        'startsAt',
        'endsAt',
        'timezone',
        'maxAmount',
        'currency',
        'quantity',
        'ParentCollectiveId',
        'HostCollectiveId',
        'image',
        'backgroundImage',
        'settings',
        'hostFeePercent',
      ]);

      if (isArray(collective.tiers)) {
        CollectiveInputType.tiers = collective.tiers.map(tier =>
          pick(tier, [
            'id',
            'type',
            'name',
            'description',
            'amount',
            'interval',
            'maxQuantity',
            'maxQuantityPerUser',
            'presets',
            'minimumAmount',
          ]),
        );
      }
      if (isArray(collective.members)) {
        CollectiveInputType.members = collective.members.map(member => {
          return {
            id: member.id,
            role: member.role,
            description: member.description,
            member: {
              name: member.member.name,
              email: member.member.email,
            },
          };
        });
      }
      CollectiveInputType.location = pick(collective.location, ['name', 'address', 'lat', 'long', 'country']);
      return await mutate({ variables: { collective: CollectiveInputType } });
    },
  }),
});

export const addDeleteEventCollectiveMutation = graphql(deleteEventCollectiveQuery, {
  props: ({ mutate }) => ({
    deleteEventCollective: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

export const addDeleteCollectiveMutation = graphql(deleteCollectiveQuery, {
  props: ({ mutate }) => ({
    deleteCollective: async id => {
      return await mutate({
        variables: { id },
        awaitRefetchQueries: true,
        refetchQueries: [{ query: getLoggedInUserQuery }],
      });
    },
  }),
});

export const addDeleteUserCollectiveMutation = graphql(deleteUserCollectiveQuery, {
  props: ({ mutate }) => ({
    deleteUserCollective: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

export const addArchiveCollectiveMutation = graphql(archiveCollectiveQuery, {
  props: ({ mutate }) => ({
    archiveCollective: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

export const addUnarchiveCollectiveMutation = graphql(unarchiveCollectiveQuery, {
  props: ({ mutate }) => ({
    unarchiveCollective: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

export const addUpdateUserEmailMutation = graphql(
  gql`
    mutation updateUserEmail($email: String!) {
      updateUserEmail(email: $email) {
        id
        email
        emailWaitingForValidation
      }
    }
  `,
  {
    props: ({ mutate }) => ({
      updateUserEmail: email => {
        return mutate({ variables: { email } });
      },
    }),
  },
);
