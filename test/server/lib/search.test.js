import { expect } from 'chai';
import config from 'config';
import { CollectiveType } from '../../../server/graphql/v1/CollectiveInterface';
import { searchCollectivesInDB, searchCollectivesByEmail } from '../../../server/lib/search';
import { newUser } from '../../stores';
import { fakeUser } from '../../test-helpers/fake-data';

describe('server/lib/search', () => {
  describe('Search in DB', () => {
    it('By slug', async () => {
      const { userCollective } = await newUser();
      const [results] = await searchCollectivesInDB(userCollective.slug);
      expect(results.find(collective => collective.id === userCollective.id)).to.exist;
    });

    it('By name', async () => {
      const name = 'AVeryUniqueName ThatNoOneElseHas';
      const { userCollective } = await newUser(name);
      const [results] = await searchCollectivesInDB(name);
      expect(results.find(collective => collective.id === userCollective.id)).to.exist;
    });

    it("Doesn't return items with the wrong type", async () => {
      const typeFilter = [CollectiveType.ORGANIZATION];
      const { userCollective } = await newUser();
      const [results, count] = await searchCollectivesInDB(userCollective.slug, 0, 10000, typeFilter);
      expect(results.length).to.eq(0);
      expect(count).to.eq(0);
    });

    describe('By email', async () => {
      it('returns exact match', async () => {
        const user = await fakeUser();
        const searchedUser = await fakeUser();
        const [collectives] = await searchCollectivesByEmail(searchedUser.email, user);
        expect(collectives[0].id).to.equal(searchedUser.CollectiveId);
      });

      it('is rate limited', async () => {
        const user = await fakeUser();
        const searchedUser = await fakeUser();
        for (let i = 0; i < config.limits.searchEmailPerHour; i++) {
          await searchCollectivesByEmail(searchedUser.email, user);
        }

        const searchPromise = searchCollectivesByEmail(searchedUser.email, user);
        await expect(searchPromise).to.be.eventually.rejectedWith('Rate limit exceeded');
      });
    });
  });

  describe('Search by email', async () => {
    it('Returns the user profile', async () => {
      const { user, userCollective } = await newUser();
      const [results, count] = await searchCollectivesByEmail(user.email, user);
      expect(count).to.eq(1);
      expect(results.find(collective => collective.id === userCollective.id)).to.exist;
    });
  });
});
