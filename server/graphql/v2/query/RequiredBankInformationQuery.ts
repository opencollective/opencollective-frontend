import { GraphQLNonNull, GraphQLString } from 'graphql';

import RequiredBankInformation from '../object/RequiredBankInformation';
import models from '../../../models';

const RequiredBankInformationQuery = {
  type: RequiredBankInformation,
  args: {
    slug: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The public id identifying the host collective',
    },
  },
  async resolve(_, args, req): Promise<any> {
    if (!req.remoteUser) {
      return null;
    }
    const slug = args.slug.toLowerCase();
    const collective = await models.Collective.findBySlug(slug);
    const host = collective.isHostAccount ? collective : await collective.getHostCollective();
    return { host };
  },
};

export default RequiredBankInformationQuery;
