import { Chromeless }  from 'chromeless';
import { download, closeChrome } from '../utils';
const WEBSITE_URL = "https://staging.opencollective.com";
// const WEBSITE_URL = "http://localhost:3030";

describe("organization.profile", () => {
  let chromeless;

  beforeAll((done) => {
    chromeless = new Chromeless({
      remote: true,
      viewport: { width: 768, height: 1024 }
    });
    done();
  })

  afterAll(() => {
    jest.setTimeout(3000);
    return closeChrome(chromeless);
  });

  test("loads a profile of a user", async () => {
    jest.setTimeout(10000);
    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/stickermule`)
      .wait('#BACKER')
      .scrollToElement('#BACKER')
      .screenshot();

    download("organization.profile", screenshot);
    
    const numberOfPastEvents = await chromeless.evaluate(() => document.querySelectorAll('#BACKER .CollectiveCard').length);
    expect(numberOfPastEvents).toBeGreaterThanOrEqual(3);
  });

});
