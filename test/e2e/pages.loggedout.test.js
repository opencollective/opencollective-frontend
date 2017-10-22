import { Chromeless }  from 'chromeless';
import { expect } from 'chai';
import { download } from '../utils';
const WEBSITE_URL = "https://staging.opencollective.com";
// const WEBSITE_URL = "http://localhost:3030";

describe("pages.loggedout", () => {
  let chromeless;

  before((done) => {
    chromeless = new Chromeless({
      remote: true,
      viewport: { width: 768, height: 1024 }
    });
    done();
  })

  after((done) => {
    chromeless.end().then(() => setTimeout(done, 1000))
  });
  
  it("goes to a custom donate URL", async function() {
    this.timeout(10000);
    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/webpack/donate/50/month`)
      .wait('.presetBtn')
      .scrollToElement('.presetBtn')
      .screenshot();

    download("donate", screenshot);
    
    const middlePresetSelected = await chromeless.exists('.presetBtnGroup button:nth-child(2).btn-primary');
    expect(middlePresetSelected).to.be.true;

    const monthlySelected = await chromeless.exists('.intervalBtnGroup button:nth-child(2).btn-primary');
    expect(monthlySelected).to.be.true;
  });

  it("loads the /events iframe", async function() {
    this.timeout(10000);
    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/brusselstogether/events`)
      .wait('.pastEvents')
      .scrollToElement('.pastEvents')
      .screenshot();

    download("events.iframe", screenshot);
    const numberOfPastEvents = await chromeless.evaluate(() => document.querySelectorAll('.pastEvents li').length);
    expect(numberOfPastEvents > 3).to.be.true;

  });

});
