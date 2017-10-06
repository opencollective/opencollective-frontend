import path from 'path';
import { Chromeless } from 'chromeless';
import { expect } from 'chai';

const WEBSITE_URL = "https://staging.opencollective.com";
const screenshotsDirectory = (process.env.CIRCLE_ARTIFACTS) ? process.env.CIRCLE_ARTIFACTS : '/tmp';

describe("make a donation", () => {
  let chromeless;

  before((done) => {
    chromeless = new Chromeless();
    done();
  })

  after(() => chromeless.end());

  it("makes a one time donation", async function() {
    
    this.timeout(25000);

    const run = async () => {

      const email = `testuser+${Math.round(Math.random()*1000000)}@gmail.com`;

      const screenshot = await chromeless
        .goto(`${WEBSITE_URL}/webpack/donate`)
        .type(email, "input[name='email']")
        .type("Xavier", "input[name='firstName']")
        .type("Damman", "input[name='lastName']")
        .type("https://xdamman.com", "input[name='website']")
        .type("xdamman", "input[name='twitterHandle']")
        .type("short bio", "input[name='description']")
        .type("4242424242424242", "input[name='CCnumber']")
        .type("Full Name", "input[name='CCname']")
        .type("11/22", "input[name='CCexpiry']")
        .type("111", "input[name='CCcvc']")
        .click(".presetBtn")
        .type("Public message", "textarea[name='publicMessage']")
        .click('.submit button')
        .wait('.UserCollectivePage', 10000)
        .screenshot({ filePath: path.join(screenshotsDirectory, 'onetime_donation.png')});

      console.log(">>> screenshot", screenshot);
      const url = await chromeless.evaluate(() => window.location.href)
      console.log(">>> url", url);
      expect(url).to.contain(`${WEBSITE_URL}/xdamman`);
      expect(url).to.contain(`?status=orderCreated&CollectiveId=302`);
      const thankyou = await chromeless.exists('p.thankyou');
      expect(thankyou).to.be.true;
      const messageContent = await chromeless.evaluate(() => document.querySelector('.message').innerText);
      expect(messageContent).to.contain('webpack');
    }

    try {
      await run();
    } catch (e) {
      // Sadly this doesn't work yet: https://github.com/graphcool/chromeless/issues/279
      const screenshot = await chromeless.screenshot({ filePath: path.join(screenshotsDirectory, 'collective_page.png')});
      console.error(">>> error: ", e);
      console.log(">>> screenshot", screenshot);
    }
  })
});