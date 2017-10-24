import { download, chromeless } from '../utils';
const WEBSITE_URL = "https://staging.opencollective.com";
// const WEBSITE_URL = "http://localhost:3030";

describe("pages.loggedout", () => {
  let browser;

  beforeAll(() => browser = chromeless.init());
  afterAll(() => chromeless.close(browser));

  test("goes to a custom donate URL", async () => {
    jest.setTimeout(10000);
    const screenshot = await browser
      .goto(`${WEBSITE_URL}/webpack/donate/50/month`)
      .wait('.presetBtn')
      .scrollToElement('.presetBtn')
      .screenshot();

    download("donate", screenshot);
    
    const middlePresetSelected = await browser.exists('.presetBtnGroup button:nth-child(2).btn-primary');
    expect(middlePresetSelected).toBeTruthy();

    const monthlySelected = await browser.exists('.intervalBtnGroup button:nth-child(2).btn-primary');
    expect(monthlySelected).toBeTruthy();
  });

  test("loads the /events iframe", async () => {
    jest.setTimeout(10000);
    const screenshot = await browser
      .goto(`${WEBSITE_URL}/brusselstogether/events/iframe`)
      .wait('.pastEvents li')
      .screenshot();

    download("events.iframe", screenshot);
    const numberOfPastEvents = await browser.evaluate(() => document.querySelectorAll('.pastEvents li').length);
    expect(numberOfPastEvents).toBeGreaterThanOrEqual(3);
  });

});
