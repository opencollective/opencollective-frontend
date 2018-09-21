import { GraphQLInputObjectType, GraphQLEnumType } from 'graphql';

import { OrderDirectionType } from '../enum/OrderDirectionType';

export const ChronologicalOrder = new GraphQLInputObjectType({
  name: 'ChronologicalOrder',
  description: 'Ordering results chronologically',
  fields: {
    field: {
      description: 'The field to chronologically order by.',
      defaultValue: 'createdAt',
      type: new GraphQLEnumType({
        name: 'ChronologicalOrderField',
        description:
          'Properties by which result can be chronologically ordered.',
        values: {
          CREATED_AT: {
            value: 'createdAt',
            description: 'Order results by creation time.',
          },
        },
      }),
    },
    direction: {
      name: 'ChronologicalOrderDirection',
      description: 'The ordering direction.',
      defaultValue: 'DESC',
      type: OrderDirectionType,
    },
  },
});

ChronologicalOrder.defaultValue = Object.entries(
  ChronologicalOrder.getFields(),
).reduce(
  (values, [key, value]) => ({
    ...values,
    [key]: value.defaultValue,
  }),
  {},
);
