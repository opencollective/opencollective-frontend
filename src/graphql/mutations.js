import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

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
  mutation createEvent($collectiveSlug: String!, $event: EventInputType) {
    createEvent(collectiveSlug: $collectiveSlug, event: $event) {
      id,
      slug,
      name,
      collective {
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
    createEvent: (event) => mutate({ variables: { event } })
  })
});
