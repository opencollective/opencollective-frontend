import { expect } from 'chai';

import * as utils from '../../../../utils';
import models from '../../../../../server/models';

const createCollectiveQuery = `
    mutation createCollective($collective: CreateCollectiveInput!) {
      createCollective(collective: $collective) {
        name
        slug
        tags
      }
    }`;

const newCollectiveData = {
  name: 'My New Collective',
  slug: 'my-new-collective-slug',
  description: 'The description of my new collective',
  tags: ['community'],
};

describe('server/graphql/v2/mutation/CreateCollectiveMutations', () => {
  beforeEach('reset db', async () => {
    await utils.resetTestDB();
  });

  it('fails if not authenticated', async () => {
    const result = await utils.graphqlQueryV2(createCollectiveQuery, {
      collective: newCollectiveData,
    });
    expect(result.errors).to.have.length(1);
    expect(result.errors[0].message).to.equal('You need to be logged in to create a collective');
  });

  it('succeeds with simple case', async () => {
    const user = await models.User.createUserWithCollective(utils.data('user1'));
    const result = await utils.graphqlQueryV2(createCollectiveQuery, { collective: newCollectiveData }, user);
    result.errors && console.error(result.errors);
    expect(result.errors).to.not.exist;
    expect(result.data.createCollective.name).to.equal(newCollectiveData.name);
    expect(result.data.createCollective.slug).to.equal(newCollectiveData.slug);
    expect(result.data.createCollective.tags).to.deep.equal(newCollectiveData.tags);
  });
});
