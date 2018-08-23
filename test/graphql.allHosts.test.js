import { expect } from 'chai';
import { describe, it } from 'mocha';
import models from '../server/models';

import * as utils from './utils';

describe('graphql.allHosts.test.js', () => {
  let hostAdmin, publicHost, privateHost, collective1, collective2, user1;

  before('reset test db', () => utils.resetTestDB());
  before('build up db content', async () => {
    hostAdmin = await models.User.createUserWithCollective({ email: "admin@host.com" });
    user1 = await models.User.createUserWithCollective({ email: "user1@gmail.com" });
    privateHost = user1.collective;
    publicHost = await models.Collective.create({ name: "BrusselsTogether ASBL", tags: ['host', 'brussels'], settings: { apply: { title: "apply" } }});
    await models.Collective.create({ name: "Open Collective Paris", tags: ['host', 'paris', 'chapter'], settings: { apply: { title: "apply" } }});
    privateHost = await models.Collective.create({ name: "Xavier"  });
    await publicHost.addUserWithRole(hostAdmin, "ADMIN");
    collective1 = await models.Collective.create({ name: "VeganBrussels" });
    await collective1.addHost(publicHost, user1);
    collective2 = await models.Collective.create({ name: "Personal Collective" });
    await collective2.addHost(privateHost, user1);
    await publicHost.createConnectedAccount({
      service: "stripe"
    });
    await privateHost.createConnectedAccount({
      service: "stripe"
    });
  });


  describe("hosts", () => {

    const allHostsQuery = `
    query allHosts($tags: [String]) {
      allHosts(tags: $tags) {
        total
        collectives {
          id
          type
          slug
          tags
          settings
          canApply
        }
      }
    }
    `;

    it('gets all the hosts where we can apply', async () => {
      const result = await utils.graphqlQuery(allHostsQuery);
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const { allHosts } = result.data;
      const hosts = allHosts.collectives;
      expect(hosts).to.have.length(2);
      expect(hosts[0].slug).to.equal("brusselstogether-asbl");
      expect(hosts[0].canApply).to.be.true;
    });

    it('gets all the public hosts by tag', async () => {
      const result = await utils.graphqlQuery(allHostsQuery, { tags: ['paris'] });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const { allHosts } = result.data;
      const hosts = allHosts.collectives;
      expect(hosts).to.have.length(1);
      expect(hosts[0].slug).to.equal("open-collective-paris");
      expect(hosts[0].canApply).to.be.true;
    });

  });

});
