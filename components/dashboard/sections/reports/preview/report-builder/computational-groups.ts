import { ExpenseType, TransactionKind, TransactionType } from '../../../../../../lib/graphql/types/v2/graphql';

import { Group, GroupFilter, ReportSection } from '../types';

import { checkGroupsMutualExclusivity } from './check-groups';

// Alternative to the predefined-groups.ts file, used with the query variable `?computational=true` on the report page

const options: { [K in keyof GroupFilter]: GroupFilter[K][] } = {
  type: Object.values(TransactionType),
  kind: Object.values(TransactionKind),
  isRefund: [false, true],
};

const conditionalOptions: { [K in keyof GroupFilter]?: (currentObj: GroupFilter) => GroupFilter[K][] } = {
  expenseType: currentObj => {
    // Only include expenseType options if kind is EXPENSE
    if (currentObj.kind === TransactionKind.EXPENSE) {
      return [...Object.values(ExpenseType), null];
    }
    return []; // Return an empty array to exclude this key when not needed
  },
};

function generatePermutations(
  keys: (keyof GroupFilter)[] = Object.keys(options) as (keyof GroupFilter)[],
  currentObj: GroupFilter = {},
  allPermutations: { filter: GroupFilter }[] = [],
  index = 0,
): { filter: GroupFilter }[] {
  if (index >= keys.length) {
    allPermutations.push({ filter: { ...currentObj } });
    return allPermutations;
  }

  const currentKey = keys[index];
  let values: GroupFilter[keyof GroupFilter][] = options[currentKey] || [];

  // Apply conditional logic if defined for the current key
  if (conditionalOptions[currentKey]) {
    values = conditionalOptions[currentKey](currentObj);
    if (values.length === 0) {
      // If no values are applicable, skip this key
      return generatePermutations(keys, currentObj, allPermutations, index + 1);
    }
  }

  for (const value of values) {
    const newObj = { ...currentObj, [currentKey]: value };
    generatePermutations(keys, newObj, allPermutations, index + 1);
  }

  // To ensure permutations don't get duplicated in subsequent calls
  if (index === 0) {
    return allPermutations;
  }

  return [];
}

const allPermutations = generatePermutations();

export const computationalGroups: Group[] = allPermutations.map(({ filter }) => {
  return {
    section: filter.type === TransactionType.CREDIT ? ReportSection.INCOMING : ReportSection.OUTGOING,
    filter,
  };
});

// Check that the report groups are mutually exclusive, otherwise throw an error
checkGroupsMutualExclusivity(computationalGroups);
