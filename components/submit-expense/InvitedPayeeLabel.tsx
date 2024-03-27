import { useQuery } from '@apollo/client';

import { gqlV1 } from '../../lib/graphql/helpers';

import { ExpenseFormValues } from './useExpenseForm';

type InvitedPayeeLabelProps = {
  invitePayee: ExpenseFormValues['invitePayee'];
};

export function InvitedPayeeLabel(props: InvitedPayeeLabelProps) {
  const query = useQuery(
    gqlV1`
    query InvitedPayeeLabel($id: Int!) {
      Collective(id: $id) {
        id
        type
        name
        slug
        imageUrl
      }
    }
  `,
    {
      skip: props.invitePayee?.['name'] || !props.invitePayee?.['legacyId'],
      variables: {
        id: props.invitePayee?.['legacyId'],
      },
    },
  );

  if (!props.invitePayee) {
    return null;
  }

  const name = props.invitePayee['name'] ?? query.data.Collective.name;

  return props.invitePayee['email'] ? `${name} (${props.invitePayee['email']})` : name;
}
