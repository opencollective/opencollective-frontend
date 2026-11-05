import type { OperationVariables } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import type { ComponentType } from 'react';

import { collectiveNavbarFieldsFragment } from '../../components/collective-page/graphql/fragments';

import { gql } from './helpers';

const collectiveNavbarQuery = gql`
  query CollectiveNavbar($slug: String!) {
    account(slug: $slug) {
      id
      legacyId
      type
      slug
      name
      settings
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
        ...NavbarFieldsV1
      }
    }
  }
  ${collectiveNavbarFieldsFragment}
`;

/**
 * Apollo injects the query payload as `data`; consumers must not have to pass it themselves.
 * The HOC's generics cannot express that split, so the injected slice is declared here and the
 * wrapped component receives `own props + data` while the returned component takes only the own props.
 */
export const addCollectiveNavbarData = <Props extends { data?: unknown }>(
  component: ComponentType<Props>,
): ComponentType<Omit<Props, 'data'>> => {
  return graphql<Omit<Props, 'data'>, object, OperationVariables, Pick<Props, 'data'>>(collectiveNavbarQuery)(
    component,
  );
};
