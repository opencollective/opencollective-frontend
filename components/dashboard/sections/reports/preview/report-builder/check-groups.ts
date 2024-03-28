import { Group, GroupFilter } from '../types';

function filtersOverlap(filterI: GroupFilter, filterJ: GroupFilter): boolean {
  for (const key of Object.keys(filterI) as (keyof GroupFilter)[]) {
    if (filterI[key] !== filterJ[key] && filterJ[key] !== undefined) {
      return false; // They do not overlap if any corresponding defined key doesn't match
    }
  }
  for (const key of Object.keys(filterJ) as (keyof GroupFilter)[]) {
    if (filterI[key] !== filterJ[key] && filterI[key] !== undefined) {
      return false; // They do not overlap if any corresponding defined key doesn't match
    }
  }
  return true; // All compared keys match
}

export function checkGroupsMutualExclusivity(groups: Group[]): boolean {
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const filterI = groups[i].filter;
      const filterJ = groups[j].filter;

      if (filtersOverlap(filterI, filterJ)) {
        throw new Error(
          `Report groups are not mutually exclusive, overlapping filters: ${JSON.stringify({ 1: filterI, 2: filterJ })}`,
        );
      }
    }
  }
  return true;
}
