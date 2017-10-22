import { Chromeless }  from 'chromeless';
import { expect } from 'chai';
import { download } from '../utils';
const WEBSITE_URL = "https://staging.opencollective.com";
// const WEBSITE_URL = "http://localhost:3030";

describe("organization.profile", () => {
  let chromeless;

  before((done) => {
    chromeless = new Chromeless({
      remote: true,
      viewport: { width: 768, height: 1024 }
    });
    done();
  })

  after((done) => {
    chromeless.end().then(() => setTimeout(done, 1500))
  });

  it("loads a profile of a user", async function() {
    this.timeout(10000);
    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/stickermule`)
      .wait('#BACKER')
      .scrollToElement('#BACKER')
      .screenshot();

    download("organization.profile", screenshot);
    
    const numberOfPastEvents = await chromeless.evaluate(() => document.querySelectorAll('#BACKER .CollectiveCard').length);
    expect(numberOfPastEvents >= 3).to.be.true;
  });

});
