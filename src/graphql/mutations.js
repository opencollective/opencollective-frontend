import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import { pick } from 'lodash';

const createOrderQuery = gql`
  mutation createOrder($order: OrderInputType) {
    createOrder(order: $order) {
      id,
      createdAt,
      user {
        id,
        username,
        email
      },
      tier {
        id,
        name,
        description,
        maxQuantity,
        availableQuantity
      },
      collective {
        id,
        slug
      }
    }
  }
`;

const createMemberQuery = gql`
  mutation createMember($user: UserAttributesInputType!, $collective: CollectiveAttributesInputType!, $role: String!) {
    createMember(user: $user, collective: $collective, role: $role) {
      id,
      role,
      createdAt,
      user {
        id,
        username,
        image,
        twitterHandle,
        description
      },
      collective {
        id,
        slug
      }
    }
  }
`;

const removeMemberQuery = gql`
  mutation removeMember($user: UserAttributesInputType!, $collective: CollectiveAttributesInputType!, $role: String!) {
    removeMember(user: $user, collective: $collective, role: $role) {
      id,
      role,
      user {
        id,
        username,
        image,
        twitterHandle,
        description
      },
      collective {
        id,
        slug
      }
    }
  }
`;

const createCollectiveQuery = gql`
  mutation createCollective($collective: CollectiveInputType!) {
    createCollective(collective: $collective) {
      id,
      slug,
      name,
      tiers {
        id,
        name,
        amount
      },
      parentCollective {
        id,
        slug
      }
    }
  }
`;

const editCollectiveQuery = gql`
  mutation editCollective($collective: CollectiveInputType!) {
    editCollective(collective: $collective) {
      id,
      slug,
      name,
      tiers {
        id,
        name,
        amount
      },
      parentCollective {
        id,
        slug
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
    createMember: (user, collective, role) => mutate({ variables: { user, collective, role } })
  })
});

export const addRemoveMemberMutation = graphql(removeMemberQuery, {
  props: ( { mutate }) => ({
    removeMember: (user, collective, role) => mutate({ variables: { user, collective, role } })
  })
});

export const addRegisterToEventMutations = compose(addCreateOrderMutation, addCreateMemberMutation, addRemoveMemberMutation);

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
        'description',
        'longDescription',
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
      if (collective.tiers && collective.tiers.length > 0) {
        CollectiveInputType.tiers = collective.tiers.map(tier => pick(tier, ['id', 'type', 'name', 'description', 'amount', 'maxQuantity', 'maxQuantityPerUser']));
      }
      CollectiveInputType.location = pick(collective.location, ['name','address','lat','long']);
      console.log(">>> this.props.editCollective", CollectiveInputType)
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
