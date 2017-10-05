const { Chromeless } = require('chromeless')
import { expect } from 'chai';

const chromeless = new Chromeless();
const WEBSITE_URL = "https://staging.opencollective.com";

describe("make a donation", () => {

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
        .screenshot();

      console.log(">>> screenshot", screenshot);
      const url = await chromeless.evaluate(() => window.location.href)
      console.log(">>> url", url);
      expect(url).to.contain(`${WEBSITE_URL}/xdamman`);
      expect(url).to.contain(`?status=orderCreated&CollectiveId=302`);
      const thankyou = await chromeless.exists('p.thankyou');
      expect(thankyou).to.be.true;
      const messageContent = await chromeless.evaluate(() => document.querySelector('.message').innerText);
      expect(messageContent).to.contain('webpack');
      await chromeless.end()    
    }

    try {
      await run();
    } catch (e) {
      // Sadly this doesn't work yet: https://github.com/graphcool/chromeless/issues/279
      const screenshot = await chromeless.screenshot();
      console.error(">>> error: ", e);
      console.log(">>> screenshot", screenshot);
    }
  })
});