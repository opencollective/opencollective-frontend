import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import { pick } from 'lodash';

const createOrderQuery = gql`
  mutation createOrder($order: OrderInputType!) {
    createOrder(order: $order) {
      id,
      createdAt,
      createdByUser {
        id,
      },
      fromCollective {
        id,
        slug
      }
      collective {
        id,
        slug
      }
    }
  }
`;

const createMemberQuery = gql`
mutation createMember($member: CollectiveAttributesInputType!, $collective: CollectiveAttributesInputType!, $role: String!) {
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
  mutation removeMember($member: CollectiveAttributesInputType!, $collective: CollectiveAttributesInputType!, $role: String!) {
    removeMember(member: $member, collective: $collective, role: $role) {
      id
    }
  }
`;


const createCollectiveQuery = gql`
  mutation createCollective($collective: CollectiveInputType!) {
    createCollective(collective: $collective) {
      id
      slug
    }
  }
`;

const editCollectiveQuery = gql`
  mutation editCollective($collective: CollectiveInputType!) {
    editCollective(collective: $collective) {
      id
      type
      slug
      name
      image
      backgroundImage
      description
      longDescription
      website
      twitterHandle
      members {
        id
        role
        description
      }
    }
  }
`;

const editTiersQuery = gql`
  mutation editTiers($collectiveSlug: String!, $tiers: [TierInputType]!) {
    editTiers(collectiveSlug: $collectiveSlug, tiers: $tiers) {
      id,
      type,
      name,
      amount
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

export const addCreateOrderMutation = graphql(createOrderQuery, {
  props: ( { mutate }) => ({
    createOrder: (order) => mutate({ variables: { order } })
  })
});

export const addCreateMemberMutation = graphql(createMemberQuery, {
  props: ( { mutate }) => ({
    createMember: (member, collective, role) => mutate({ variables: { member, collective, role } })
  })
});

export const addRemoveMemberMutation = graphql(removeMemberQuery, {
  props: ( { mutate }) => ({
    removeMember: (member, collective, role) => mutate({ variables: { member, collective, role } })
  })
});

export const addEventMutations = compose(addCreateOrderMutation, addCreateMemberMutation, addRemoveMemberMutation);

export const addCreateCollectiveMutation = graphql(createCollectiveQuery, {
  props: ( { mutate }) => ({
    createCollective: async (event) => {
      const CollectiveInputType = pick(event, [
        'slug',
        'type',
        'name',
        'longDescription',
        'location',
        'startsAt',
        'endsAt',
        'timezone',
        'maxAmount',
        'currency',
        'quantity',
        'ParentCollectiveId'
      ]);
      CollectiveInputType.tiers = event.tiers.map(tier => pick(tier, ['type', 'name', 'description', 'amount', 'maxQuantity', 'maxQuantityPerUser']));
      CollectiveInputType.location = pick(event.location, ['name','address','lat','long']);
      return await mutate({ variables: { collective: CollectiveInputType } })
    }
  })
});

export const addEditCollectiveMutation = graphql(editCollectiveQuery, {
  props: ( { mutate }) => ({
    editCollective: async (collective) => {
      const CollectiveInputType = pick(collective, [
        'id',
        'type',
        'slug',
        'name',
        'company',
        'description',
        'longDescription',
        'website',
        'twitterHandle',
        'location',
        'startsAt',
        'endsAt',
        'timezone',
        'maxAmount',
        'currency',
        'quantity',
        'ParentCollectiveId',
        'image',
        'backgroundImage'
      ]);
      if (collective.paymentMethods && collective.paymentMethods.length > 0) {
        CollectiveInputType.paymentMethods = collective.paymentMethods.map(pm => pick(pm, ['id', 'name', 'token', 'data', 'monthlyLimitPerMember', 'currency']));
      } else {
        CollectiveInputType.paymentMethods = []; // force removing existing payment methods
      }
      if (collective.tiers && collective.tiers.length > 0) {
        CollectiveInputType.tiers = collective.tiers.map(tier => pick(tier, ['id', 'type', 'name', 'description', 'amount', 'interval', 'maxQuantity', 'maxQuantityPerUser']));
      }
      if (collective.members && collective.members.length > 0) {
        CollectiveInputType.members = collective.members.map(member => {
          return {
            id: member.id,
            role: member.role,
            description: member.description,
            member: {
              name: member.member.name,
              email: member.member.email
            }
          }
        });
      }
      CollectiveInputType.location = pick(collective.location, ['name','address','lat','long']);
      return await mutate({ variables: { collective: CollectiveInputType } })
    }
  })
});

export const addEditTiersMutation = graphql(editTiersQuery, {
  props: ( { mutate }) => ({
    editTiers: async (collectiveSlug, tiers) => {
      tiers = tiers.map(tier => pick(tier, ['id', 'type', 'name', 'description', 'amount', 'maxQuantity', 'maxQuantityPerUser', 'interval', 'endsAt']));
      return await mutate({ variables: { collectiveSlug, tiers } })
    }
  })
});

export const addDeleteCollectiveMutation = graphql(deleteCollectiveQuery, {
  props: ( { mutate }) => ({
    deleteCollective: async (id) => {
      return await mutate({ variables: { id } })
    }
  })
});
