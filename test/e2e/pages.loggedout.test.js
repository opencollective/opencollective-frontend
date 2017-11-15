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
      .goto(`${WEBSITE_URL}/webpack/donate/50/month/custom%20description`)
      .wait('.tier')
      .scrollToElement('.tier')
      .screenshot();

    download("donate", screenshot);
    
    const description = await browser.evaluate(() => document.querySelector('.tier .description').innerText);
    expect(description).toEqual("custom description");

    const amount = await browser.evaluate(() => document.querySelector('.tier .amount').innerText);
    expect(amount).toEqual("$50/monthly");
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
