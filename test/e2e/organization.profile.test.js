import { download, chromeless } from '../utils';
const WEBSITE_URL = "https://staging.opencollective.com";
// const WEBSITE_URL = "http://localhost:3030";

describe("organization.profile", () => {
  let browser;

  beforeAll(() => browser = chromeless.init());
  afterAll(() => chromeless.close(browser));

  test("loads a profile of a user", async () => {
    jest.setTimeout(15000);
    const screenshot = await browser
      .goto(`${WEBSITE_URL}/stickermule`)
      .wait('#BACKER')
      .scrollToElement('#BACKER')
      .screenshot();

    download("organization.profile", screenshot);
    
    const numberOfPastEvents = await browser.evaluate(() => document.querySelectorAll('#BACKER .CollectiveCard').length);
    expect(numberOfPastEvents).toBeGreaterThanOrEqual(3);
  });

});
