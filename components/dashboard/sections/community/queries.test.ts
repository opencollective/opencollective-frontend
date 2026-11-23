import { type FieldNode, Kind, type OperationDefinitionNode, type SelectionSetNode } from 'graphql';

import { communityAccountDetailQuery, peopleHostDashboardQuery } from './queries';

const getSelectedFieldNames = (selectionSet: SelectionSetNode): string[] =>
  selectionSet.selections.flatMap(selection => (selection.kind === Kind.FIELD ? [selection.name.value] : []));

const getOperationDefinition = (document, name: string): OperationDefinitionNode =>
  document.definitions.find(
    definition => definition.kind === Kind.OPERATION_DEFINITION && definition.name?.value === name,
  ) as OperationDefinitionNode;

const getField = (selectionSet: SelectionSetNode, name: string): FieldNode =>
  selectionSet.selections.find(
    selection => selection.kind === Kind.FIELD && selection.name.value === name,
  ) as FieldNode;

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

describe('peopleHostDashboardQuery', () => {
  it('declares the missingInformation variable and passes it to the community query', () => {
    const operation = getOperationDefinition(peopleHostDashboardQuery, 'PeopleHostDashboard');

    const variableDefinition = operation.variableDefinitions?.find(
      definition => definition.variable.name.value === 'missingInformation',
    );
    expect(variableDefinition).toBeDefined();

    const communityField = getField(operation.selectionSet, 'community');
    const missingInformationArg = communityField.arguments?.find(arg => arg.name.value === 'missingInformation');
    expect(missingInformationArg).toBeDefined();
    expect(missingInformationArg.value).toMatchObject({
      kind: Kind.VARIABLE,
      name: { kind: Kind.NAME, value: 'missingInformation' },
    });
  });
});
