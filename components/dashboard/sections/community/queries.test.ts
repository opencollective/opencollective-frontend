import { type FieldNode, Kind, type OperationDefinitionNode, type SelectionSetNode } from 'graphql';

import { communityAccountDetailQuery } from './queries';

const getSelectedFieldNames = (selectionSet: SelectionSetNode): string[] =>
  selectionSet.selections.flatMap(selection => (selection.kind === Kind.FIELD ? [selection.name.value] : []));

const getHostField = (): FieldNode => {
  const operation = communityAccountDetailQuery.definitions.find(
    definition => definition.kind === Kind.OPERATION_DEFINITION && definition.name?.value === 'CommunityAccountDetail',
  ) as OperationDefinitionNode;
  const hostField = operation.selectionSet.selections.find(
    selection => selection.kind === Kind.FIELD && selection.name.value === 'host',
  ) as FieldNode;

  expect(hostField).toBeDefined();
  return hostField;
};

describe('communityAccountDetailQuery', () => {
  it('selects the host payout settings used by the vendor payout method form', () => {
    const hostField = getHostField();

    expect(getSelectedFieldNames(hostField.selectionSet)).toEqual(
      expect.arrayContaining(['supportedPayoutMethods', 'currency', 'transferwise']),
    );
  });
});
