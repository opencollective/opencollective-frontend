import { GraphQLInt, GraphQLNonNull } from 'graphql';

import RequiredBankInformation from '../object/RequiredBankInformation';
import models from '../../../models';

const RequiredBankInformationQuery = {
  type: RequiredBankInformation,
  args: {
    collectiveId: {
      type: new GraphQLNonNull(GraphQLInt),
      description: 'The public id identifying the host collective',
    },
  },
  async resolve(_, args, req): Promise<any> {
    if (!req.remoteUser) {
      return null;
    }
    req.collective = await models.Collective.findByPk(args.collectiveId);
    return {};
  },
};

export default RequiredBankInformationQuery;
