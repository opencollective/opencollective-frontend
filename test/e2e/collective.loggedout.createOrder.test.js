import { download, chromeless } from '../utils';

const WEBSITE_URL = process.env.WEBSITE_URL || "https://staging.opencollective.com";

describe("collective.loggedout.createOrder", () => {
  let browser;

  beforeAll(() => browser = chromeless.init());
  afterAll(() => chromeless.close(browser));

  test("makes a one time donation", async () => {

    jest.setTimeout(25000);

    const run = async () => {

      const email = `testuser+${Math.round(Math.random()*1000000)}@gmail.com`;

      const screenshot = await browser
        .goto(`${WEBSITE_URL}/apex/donate?test=e2e`)
        .type(email, "input[name='email']")
        .type("Xavier", "input[name='firstName']")
        .type("Damman", "input[name='lastName']")
        .type("https://xdamman.com", "input[name='website']")
        .type("xdamman", "input[name='twitterHandle']")
        .type("short bio", "input[name='description']")
        .click(".presetBtn")
        .type("Public message", "textarea[name='publicMessage']")
        .scrollToElement('.Footer')
        .wait(2000)
        .click('.submit button')
        .screenshot();

      download("createOrder", screenshot);
      const screenshot2 = await browser.wait('.UserCollectivePage', 15000).screenshot();
      download("orderCreated", screenshot2);

      const url = await browser.evaluate(() => window.location.href)
      console.log(">>> url", url);
      expect(url).toEqual(expect.stringContaining(`${WEBSITE_URL}/xdamman`));
      expect(url).toEqual(expect.stringContaining(`?status=orderCreated&CollectiveId=43`));
      const thankyou = await browser.exists('p.thankyou');
      expect(thankyou).toBeTruthy();
      const messageContent = await browser.evaluate(() => document.querySelector('.message').innerText);
      expect(messageContent).toEqual(expect.stringContaining('apex'));
    }

    try {
      await run();
    } catch (e) {
      // Sadly this doesn't work yet: https://github.com/graphcool/browser/issues/279
      const screenshot = await browser.screenshot();
      console.error(">>> error: ", e);
      download("createOrderError", screenshot);
      throw e;
    }
  })

});
