import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { pick } from 'lodash';

const createResponseQuery = gql`
  mutation createResponse($response: ResponseInputType) {
    createResponse(response: $response) {
      id,
      status,
      user {
        id,
        email
      },
      event {
        id
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

const createEventQuery = gql`
  mutation createEvent($event: EventInputType!) {
    createEvent(event: $event) {
      id,
      slug,
      name,
      tiers {
        id,
        name,
        amount
      },
      collective {
        id,
        slug
      }
    }
  }
`;

const editEventQuery = gql`
  mutation editEvent($event: EventInputType!) {
    editEvent(event: $event) {
      id,
      slug,
      name,
      tiers {
        id,
        name,
        amount
      },
      collective {
        id,
        slug
      }
    }
  }
`;

export const addCreateResponseMutation = graphql(createResponseQuery, {
  props: ( { mutate }) => ({
    createResponse: (response) => mutate({ variables: { response } })
  })
});

export const addCreateEventMutation = graphql(createEventQuery, {
  props: ( { mutate }) => ({
    createEvent: async (event) => {
      const EventInputType = pick(event, [
        'slug',
        'name',
        'description',
        'locationName',
        'address',
        'startsAt',
        'endsAt',
        'timezone',
        'maxAmount',
        'currency',
        'quantity'
      ]);
      EventInputType.collective = { slug: event.collective.slug };
      EventInputType.tiers = event.tiers.map(tier => pick(tier, ['id', 'name', 'description', 'amount']));
      return await mutate({ variables: { event: EventInputType } })
    }
  })
});

export const addEditEventMutation = graphql(editEventQuery, {
  props: ( { mutate }) => ({
    editEvent: async (event) => {
      const EventInputType = pick(event, [
        'id',
        'slug',
        'name',
        'description',
        'locationName',
        'address',
        'startsAt',
        'endsAt',
        'timezone',
        'maxAmount',
        'currency',
        'quantity'
      ]);
      EventInputType.collective = { slug: event.collective.slug };
      EventInputType.tiers = event.tiers.map(tier => pick(tier, ['id', 'name', 'description', 'amount']));
      return await mutate({ variables: { event: EventInputType } })
    }
  })
});
