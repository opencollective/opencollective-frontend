import { GraphQLEnumType } from 'graphql';

export const ImageFormat = new GraphQLEnumType({
  name: 'ImageFormat',
  values: {
    txt: {},
    png: {},
    jpg: {},
    gif: {},
    svg: {},
  },
});
