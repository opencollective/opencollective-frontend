import { GraphQLInputObjectType } from 'graphql';

import { OrderDirectionType } from '../enum/OrderDirectionType';
import { DateTimeField } from '../enum/DateTimeField';

export const ChronologicalOrderInput = new GraphQLInputObjectType({
  name: 'ChronologicalOrderInput',
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

ChronologicalOrderInput.defaultValue = Object.entries(ChronologicalOrderInput.getFields()).reduce(
  (values, [key, value]) => ({
    ...values,
    [key]: value.defaultValue,
  }),
  {},
);
