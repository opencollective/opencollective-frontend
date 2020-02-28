import nock from 'nock';
import { expect } from 'chai';

import * as utils from '../../../../utils';
import models from '../../../../../server/models';

const createCollectiveQuery = `
    mutation createCollective($collective: CollectiveCreateInput!, $host: AccountReferenceInput, $automateApprovalWithGithub: Boolean) {
      createCollective(collective: $collective, host: $host, automateApprovalWithGithub: $automateApprovalWithGithub) {
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

const backYourStackCollectiveData = {
  name: 'BackYourStack',
  slug: 'backyourstack',
  description: 'The description of BackYourStack collective',
  githubHandle: 'backyourstack/backyourstack',
};

describe('server/graphql/v2/mutation/CreateCollectiveMutations', () => {
  beforeEach('reset db', async () => {
    await utils.resetTestDB();
  });

  let host;

  beforeEach('create host', async () => {
    host = await models.Collective.create({
      name: 'Open Source Collective',
      slug: 'opensource',
      type: 'ORGANIZATION',
      settings: { apply: true },
      isHostAccount: true,
    });
  });

  describe('simple case', async () => {
    it('fails if not authenticated', async () => {
      const result = await utils.graphqlQueryV2(createCollectiveQuery, {
        collective: newCollectiveData,
      });
      expect(result.errors).to.have.length(1);
      expect(result.errors[0].message).to.equal('You need to be logged in to create a collective');
    });

    it('succeeds if all parameters are right', async () => {
      const user = await models.User.createUserWithCollective(utils.data('user2'));
      const result = await utils.graphqlQueryV2(createCollectiveQuery, { collective: newCollectiveData }, user);
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      expect(result.data.createCollective.name).to.equal(newCollectiveData.name);
      expect(result.data.createCollective.slug).to.equal(newCollectiveData.slug);
      expect(result.data.createCollective.tags).to.deep.equal(newCollectiveData.tags);
    });
  });

  describe('with GitHub repository', async () => {
    it('fail if user is not admin', async () => {
      const user = await models.User.createUserWithCollective(utils.data('user2'));
      await models.ConnectedAccount.create({
        service: 'github',
        token: 'faketoken',
        CreatedByUserId: user.id,
        CollectiveId: user.CollectiveId,
      });

      nock('https://api.github.com:443')
        .get('/repos/backyourstack/backyourstack')
        .reply(200, {
          name: 'backyourstack',
          stargazers_count: 102,
          permissions: { admin: false, push: true, pull: true },
        });

      const result = await utils.graphqlQueryV2(
        createCollectiveQuery,
        {
          collective: backYourStackCollectiveData,
          host: { slug: host.slug },
          automateApprovalWithGithub: true,
        },
        user,
      );
      expect(result.errors).to.have.length(1);
      expect(result.errors[0].message).to.equal("We could not verify that you're admin of the GitHub repository");
    });

    it('succeeds if user is admin', async () => {
      const user = await models.User.createUserWithCollective(utils.data('user2'));
      await models.ConnectedAccount.create({
        service: 'github',
        token: 'faketoken',
        CreatedByUserId: user.id,
        CollectiveId: user.CollectiveId,
      });

      nock('https://api.github.com:443')
        .get('/repos/backyourstack/backyourstack')
        .times(2)
        .reply(200, {
          name: 'backyourstack',
          stargazers_count: 102,
          permissions: { admin: true, push: true, pull: true },
        });

      const result = await utils.graphqlQueryV2(
        createCollectiveQuery,
        {
          collective: backYourStackCollectiveData,
          host: { slug: host.slug },
          automateApprovalWithGithub: true,
        },
        user,
      );

      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;

      expect(result.data.createCollective.name).to.equal(backYourStackCollectiveData.name);
      expect(result.data.createCollective.slug).to.equal(backYourStackCollectiveData.slug);
      expect(result.data.createCollective.tags).to.include('open source');
    });
  });

  describe('with GitHub organization', async () => {
    it('fail if user is not admin', async () => {
      const user = await models.User.createUserWithCollective(utils.data('user2'));
      await models.ConnectedAccount.create({
        service: 'github',
        token: 'faketoken',
        CreatedByUserId: user.id,
        CollectiveId: user.CollectiveId,
      });

      nock('https://api.github.com:443', { encodedQueryParams: true })
        .get('/user/memberships/orgs')
        .query({ page: '1', per_page: '100' })
        .reply(200, [{ organization: { login: 'backyourstack' }, state: 'active', role: 'member' }]);

      const result = await utils.graphqlQueryV2(
        createCollectiveQuery,
        {
          collective: { ...backYourStackCollectiveData, githubHandle: 'backyourstack' },
          host: { slug: host.slug },
          automateApprovalWithGithub: true,
        },
        user,
      );
      expect(result.errors).to.have.length(1);
      expect(result.errors[0].message).to.equal("We could not verify that you're admin of the GitHub organization");
    });

    it('succeeds if user is admin', async () => {
      const user = await models.User.createUserWithCollective(utils.data('user2'));
      await models.ConnectedAccount.create({
        service: 'github',
        token: 'faketoken',
        CreatedByUserId: user.id,
        CollectiveId: user.CollectiveId,
      });

      nock('https://api.github.com:443', { encodedQueryParams: true })
        .get('/user/memberships/orgs')
        .query(true)
        .reply(200, [{ organization: { login: 'backyourstack' }, state: 'active', role: 'admin' }]);

      nock('https://api.github.com:443', { encodedQueryParams: true })
        .get('/orgs/backyourstack/repos')
        .query(true)
        .reply(200, [{ name: 'backyourstack', stargazers_count: 102 }]);

      const result = await utils.graphqlQueryV2(
        createCollectiveQuery,
        {
          collective: { ...backYourStackCollectiveData, githubHandle: 'backyourstack' },
          host: { slug: host.slug },
          automateApprovalWithGithub: true,
        },
        user,
      );

      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;

      expect(result.data.createCollective.name).to.equal(backYourStackCollectiveData.name);
      expect(result.data.createCollective.slug).to.equal(backYourStackCollectiveData.slug);
      expect(result.data.createCollective.tags).to.include('open source');
    });
  });
});
