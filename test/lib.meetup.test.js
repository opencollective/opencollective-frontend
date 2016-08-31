import Meetup from '../server/lib/meetup';
import { expect } from 'chai';
import nock from 'nock';
import nockMeetup from './mocks/meetup.nock';

// nock.recorder.rec();

const group = {
  slug: 'opencollective',
  users: [{
    name: 'Github',
    website: 'https://github.com',
    tier: 'sponsor'
  },{
    name: 'Xavier',
    tier: 'backer'
  },{
    name: 'Gitlab',
    tier: 'sponsor'
  }]
};

const meetupAccount = {
  provider: 'meetup',
  username: 'meetup-group-NqJGKtSx',
  secret: '27652da7f3a3ab586c6b29f3b7940',
  GroupId: 1
}

describe('meetup lib', () => {

  before(() => nockMeetup());

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

  it("generate the list of sponsors", () => {
    const meetup = new Meetup(meetupAccount, group);
    const header = meetup.makeHeadersForTier('sponsor');
    const expectedHeader = `<p>Thank you to our sponsors <a href="https://github.com">Github</a> and Gitlab</p>
<p><a href="https://opencollective.com/${group.slug}"><img src="https://opencollective.com/${group.slug}/sponsors.png?width=700"></a></p>`;
    expect(header).to.equal(expectedHeader);
  });

  it("doesn't show the list of sponsors if none", () => {
    const meetup = new Meetup(meetupAccount, group);
    const header = meetup.makeHeadersForTier('unknownTier');
    const expectedHeader = `<p><a href="https://opencollective.com/${group.slug}"><img src="https://opencollective.com/${group.slug}/unknownTiers.png?width=700"></a></p>`;
    expect(header).to.equal(expectedHeader);
  });

  it("updates the next 2 meetups", (done) => {
    const meetup = new Meetup(meetupAccount, group);
    meetup.syncCollective().then(result => {
      expect(result.length).to.equal(2);
      const expectedDescription = `<p>Thank you to our sponsors <a href="https://github.com">Github</a> and Gitlab</p> <p><a href="https://opencollective.com/opencollective"><a href="https://opencollective.com/opencollective/sponsors.png?width=700" class="linkified">https://opencollective.com/opencollective/sponsors.png?width=700</a></a></p> <p>Our cofounder Pia Mancini is in town from SF so let\'s get together at a bar.</p> <p>Let\'s talk about your communities (meetups, open source projects, ...) and discuss how we can help them be more economically sustainable.</p> <p>Our goal at Open Collective is to enable communities to collect and disburse money in full transparency. We believe that we can make our communities stronger if we give them the tools to be economically sustainable. It\'s a work in progress and we value your input. If you are managing a community we want to hear from you and we want to help you!</p>`;
      expect(result[0].description).to.equal(expectedDescription);
      done();
    })
    .catch(done);
  });

});
