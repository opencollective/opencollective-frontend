export enum Op {
  eq = 'eq',
  gte = 'gte',
  lte = 'lte',
  contains = 'contains',
  in = 'in',
}

export const OpLabels: Record<Op, string> = {
  [Op.eq]: 'equals',
  [Op.gte]: 'greater than or equal',
  [Op.lte]: 'less than or equal',
  [Op.contains]: 'contains',
  [Op.in]: 'is one of',
};
