import { Chromeless }  from 'chromeless';
import { expect } from 'chai';
import { download } from '../utils';
const WEBSITE_URL = "https://staging.opencollective.com";
// const WEBSITE_URL = "http://localhost:3030";

describe("user.profile", () => {
  let chromeless;

  before((done) => {
    chromeless = new Chromeless({
      remote: true,
      viewport: { width: 768, height: 1024 }
    });
    done();
  })

  after((done) => {
    chromeless.end().then(() => setTimeout(done, 2000))
  });
  
  it("loads a profile of a user", async function() {
    this.timeout(10000);
    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/addyosmani`)
      .wait('#BACKER')
      .scrollToElement('#BACKER')
      .screenshot();

    download("user.profile", screenshot);
    
    const numberOfPastEvents = await chromeless.evaluate(() => document.querySelectorAll('#BACKER .CollectiveCard').length);
    expect(numberOfPastEvents >= 3).to.be.true;
  });

});
