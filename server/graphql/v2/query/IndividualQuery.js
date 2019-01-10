import { GraphQLString } from 'graphql';

import models from '../../../models';
import { NotFound } from '../../errors';
import { idDecode } from '../identifiers';
import { Individual } from '../object/Individual';

const IndividualQuery = {
  type: Individual,
  args: {
    id: {
      type: GraphQLString,
      description: 'The public id identifying the individual (ie: ggnxdwzj-3le5mpwa-5eqy8rvb-ko04a97b)',
    },
    slug: {
      type: GraphQLString,
      description: 'The slug identifying the individual (ie: piamancini for https://opencollective.com/piamancini)',
    },
  },
  async resolve(_, args) {
    let collective;
    if (args.slug) {
      const slug = args.slug.toLowerCase();
      collective = await models.Collective.findBySlug(slug);
    } else if (args.id) {
      const id = idDecode(args.id, 'account');
      collective = await models.Collective.findByPk(id);
    } else {
      return new Error('Please provide a slug or an id');
    }
    if (!collective) {
      throw new NotFound({ message: 'Individual Not Found' });
    }
    if (collective.type !== 'USER') {
      throw new NotFound({ message: 'Not an Individual Account ' });
    }
    return collective;
  },
};

export default IndividualQuery;
