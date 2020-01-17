import { expect } from 'chai';
import { generateCanSeeUserPrivateInfoLoader } from '../../../../server/graphql/loaders/user.ts';
import { fakeUser, fakeCollective } from '../../../test-helpers/fake-data';

describe('server/graphql/loaders/user', () => {
  describe('canSeeUserPrivateInfoLoader', () => {
    let userWithPrivateInfo, randomUser, collectiveAdmin, hostAdmin;

    before(async () => {
      userWithPrivateInfo = await fakeUser();
      randomUser = await fakeUser();
      collectiveAdmin = await fakeUser();
      hostAdmin = await fakeUser();

      const collective = await fakeCollective();
      await collective.addUserWithRole(userWithPrivateInfo, 'BACKER');
      await collective.addUserWithRole(collectiveAdmin, 'ADMIN');
      await collective.host.addUserWithRole(hostAdmin, 'ADMIN');
    });

    it('Cannot see infos as unauthenticated', async () => {
      const loader = generateCanSeeUserPrivateInfoLoader({ remoteUser: null });
      const result = await loader.load(userWithPrivateInfo);
      expect(result).to.be.false;
    });

    it('Cannot see infos as a random user', async () => {
      const loader = generateCanSeeUserPrivateInfoLoader({ remoteUser: randomUser });
      const result = await loader.load(userWithPrivateInfo);
      expect(result).to.be.false;
    });

    it('Can see infos if self', async () => {
      const loader = generateCanSeeUserPrivateInfoLoader({ remoteUser: userWithPrivateInfo });
      const result = await loader.load(userWithPrivateInfo);
      expect(result).to.be.true;
    });

    it('Can see infos if collective admin', async () => {
      const loader = generateCanSeeUserPrivateInfoLoader({ remoteUser: collectiveAdmin });
      const result = await loader.load(userWithPrivateInfo);
      expect(result).to.be.true;
    });

    it('Can see infos if host admin', async () => {
      const loader = generateCanSeeUserPrivateInfoLoader({ remoteUser: hostAdmin });
      const result = await loader.load(userWithPrivateInfo);
      expect(result).to.be.true;
    });
  });
});
