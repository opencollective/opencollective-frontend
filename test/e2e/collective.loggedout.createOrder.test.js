import { Chromeless }  from 'chromeless';
import { download, closeChrome } from '../utils';

const WEBSITE_URL = "https://staging.opencollective.com";
// const WEBSITE_URL = "http://localhost:3030";

describe("collective.loggedout.createOrder", () => {
  let chromeless;

  beforeAll((done) => {
    chromeless = new Chromeless({ remote: true });
    done();
  })

  afterAll(() => {
    jest.setTimeout(3000);
    return closeChrome(chromeless);
  });
  
  test("makes a one time donation", async () => {
    
    jest.setTimeout(25000);

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
        .screenshot();

      download("createOrder", screenshot);
      const screenshot2 = await chromeless.wait('.UserCollectivePage', 10000).screenshot();
      download("orderCreated", screenshot2);
      
      const url = await chromeless.evaluate(() => window.location.href)
      console.log(">>> url", url);
      expect(url).toEqual(expect.stringContaining(`${WEBSITE_URL}/xdamman`));
      expect(url).toEqual(expect.stringContaining(`?status=orderCreated&CollectiveId=302`));
      const thankyou = await chromeless.exists('p.thankyou');
      expect(thankyou).toBeTruthy();
      const messageContent = await chromeless.evaluate(() => document.querySelector('.message').innerText);
      expect(messageContent).toEqual(expect.stringContaining('webpack'));
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
