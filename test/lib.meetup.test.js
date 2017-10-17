import Meetup from '../server/lib/meetup';
import { expect } from 'chai';
import nock from 'nock';
import nockMeetup from './mocks/meetup.nock';

const collective = {
  slug: 'opencollective',
  users: [{
    name: 'Github',
    website: 'https://github.com',
    tier: 'sponsor',
    totalDonations: 100
  },{
    name: 'Xavier',
    tier: 'backer',
    website: 'https://twitter.com/xdamman',
    totalDonations: 50
  },{
    name: 'Pia',
    tier: 'backer',
    website: 'https://twitter.com/piamancini',
    totalDonations: 70
  },{
    name: 'Gitlab',
    tier: 'sponsor',
    totalDonations: 500
  }]
};

const meetupAccount = {
  service: 'meetup',
  username: 'opencollective',
  token: '620459537f4174273a5d4g535321445',
  CollectiveId: 1
}

describe('meetup lib', () => {

  before(nockMeetup);

  after(() => {
    nock.cleanAll();
  });

  it("syncCollective fails if no api key set", () => {
    const meetup = new Meetup();
    meetup.catch(e => {
      expect(e).to.exist;
      expect(e.code).to.equal(400);
    });
  });

  it("generates the list of sponsors sorted by total donations", () => {
    const meetup = new Meetup(meetupAccount, collective);
    const header = meetup.makeHeader();
    const expectedHeader = `<p>Thank you to our sponsors Gitlab and <a href="https://github.com">Github</a></p> <p><a href="https://opencollective.com/${collective.slug}#sponsors"><img src="https://opencollective.com/${collective.slug}/sponsors.png?width=700"></a></p>`;
    expect(header).to.equal(expectedHeader);
  });

  it("shows the list of backers if no sponsors", () => {
    const collectiveWithoutSponsors = Object.assign({}, collective, { users: collective.users.slice(1,3)});
    const meetup = new Meetup(meetupAccount, collectiveWithoutSponsors);
    const header = meetup.makeHeader();
    const expectedHeader = `<p>Thank you to our backers <a href="https://twitter.com/piamancini">Pia</a> and <a href="https://twitter.com/xdamman">Xavier</a></p> <p><a href="https://opencollective.com/opencollective#backers"><img src="https://opencollective.com/opencollective/backers.png?width=700"></a></p>`;
    expect(header).to.equal(expectedHeader);
  });

  it("adds/removes the header when no backers", () => {
    const collectiveWithoutBackers = Object.assign({}, collective, { users: [] });
    const description = "<p>Hello World</p>";

    const meetup = new Meetup(meetupAccount, collectiveWithoutBackers);
    const header = meetup.makeHeader();
    const descriptionWithHeader = meetup.generateNewDescription('addHeader', description);
    const descriptionWithoutHeader = meetup.generateNewDescription('removeHeader', descriptionWithHeader);

    expect(header).to.equal(`<p><a href="https://opencollective.com/opencollective#backers"><img src="https://opencollective.com/opencollective/backers.png?width=700"></a></p>`);
    expect(descriptionWithHeader).to.equal(`<p><a href="https://opencollective.com/opencollective#backers"><img src="https://opencollective.com/opencollective/backers.png?width=700"></a></p> <p>Hello World</p>`);
    expect(descriptionWithoutHeader).to.equal(description);
  });

  it("adds the header to the next meetup", (done) => {
    const meetup = new Meetup(meetupAccount, collective);
    meetup.syncCollective('addHeader').then(result => {
      expect(result.length).to.equal(1);
      const expectedDescription = `<p>Thank you to our sponsors Gitlab and <a href="https://github.com">Github</a></p> <p><a href="https://opencollective.com/opencollective#sponsors"><a href="https://opencollective.com/opencollective/sponsors.png?width=700" class="linkified">https://opencollective.com/opencollective/sponsors.png?width=700</a></a></p> <p>We\'ll share how meetups are currently using OpenCollective to raise money - through donations and/or memberships - and increasing their impact on the world.</p> <p>Also a good chance to meet our core team - Xavier, Pia and Aseem.</p>`;
      expect(result[0].description).to.equal(expectedDescription);
      done();
    })
    .catch(done);
  });

  it("removes the header from the next meetup", (done) => {
    const meetup = new Meetup(meetupAccount, collective);
    meetup.syncCollective('removeHeader').then(result => {
      expect(result.length).to.equal(1);
      const expectedDescription = `<p>We\'ll share how meetups are currently using OpenCollective to raise money - through donations and/or memberships - and increasing their impact on the world.</p> <p>Also a good chance to meet our core team - Xavier, Pia and Aseem.</p>`;
      expect(result[0].description).to.equal(expectedDescription);
      done();
    })
    .catch(done);
  });
});