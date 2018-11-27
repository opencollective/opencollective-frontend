import { GraphQLInputObjectType } from 'graphql';

import { OrderDirectionType } from '../enum/OrderDirectionType';
import { DateTimeField } from '../enum/DateTimeField';

export const ChronologicalOrder = new GraphQLInputObjectType({
  name: 'ChronologicalOrder',
  description: 'Input to order results chronologically',
  fields: {
    field: {
      description: 'Field to chronologically order by.',
      defaultValue: 'createdAt',
      type: DateTimeField,
    },
    direction: {
      description: 'Ordering direction.',
      defaultValue: 'DESC',
      type: OrderDirectionType,
    },
  },
});

ChronologicalOrder.defaultValue = Object.entries(ChronologicalOrder.getFields()).reduce(
  (values, [key, value]) => ({
    ...values,
    [key]: value.defaultValue,
  }),
  {},
);
