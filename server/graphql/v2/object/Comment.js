import { GraphQLString, GraphQLObjectType } from 'graphql';
import { GraphQLDateTime } from 'graphql-iso-date';
import { Account } from '../interface/Account';
import { getIdEncodeResolver } from '../identifiers';
import { collectiveResolver, fromCollectiveResolver, getStripTagsResolver } from '../../common/comment';

const Comment = new GraphQLObjectType({
  name: 'Comment',
  description: 'This represents an Comment',
  fields: () => {
    return {
      id: {
        type: GraphQLString,
        resolve: getIdEncodeResolver('comment'),
      },
      createdAt: {
        type: GraphQLDateTime,
      },
      html: {
        type: GraphQLString,
      },
      markdown: {
        type: GraphQLString,
        resolve: getStripTagsResolver('markdown'),
      },
      fromCollective: {
        type: Account,
        resolve: fromCollectiveResolver,
      },
      collective: {
        type: Account,
        resolve: collectiveResolver,
      },
    };
  },
});

export { Comment };
