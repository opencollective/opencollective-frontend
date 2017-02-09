import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

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

export const addCreateResponseMutation = graphql(createResponseQuery, {
  props: ( { mutate }) => ({
    createResponse: (response) => mutate({ variables: { response } })
  })
});
