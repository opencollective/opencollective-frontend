import { Chromeless }  from 'chromeless';
import { download, closeChrome } from '../utils';
const WEBSITE_URL = "https://staging.opencollective.com";
// const WEBSITE_URL = "http://localhost:3030";

describe("pages.loggedout", () => {
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
  
  test("goes to a custom donate URL", async () => {
    jest.setTimeout(10000);
    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/webpack/donate/50/month`)
      .wait('.presetBtn')
      .scrollToElement('.presetBtn')
      .screenshot();

    download("donate", screenshot);
    
    const middlePresetSelected = await chromeless.exists('.presetBtnGroup button:nth-child(2).btn-primary');
    expect(middlePresetSelected).toBeTruthy();

    const monthlySelected = await chromeless.exists('.intervalBtnGroup button:nth-child(2).btn-primary');
    expect(monthlySelected).toBeTruthy();
  });

  test("loads the /events iframe", async () => {
    jest.setTimeout(10000);
    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/brusselstogether/events`)
      .wait('.pastEvents')
      .scrollToElement('.pastEvents')
      .screenshot();

    download("events.iframe", screenshot);
    const numberOfPastEvents = await chromeless.evaluate(() => document.querySelectorAll('.pastEvents li').length);
    expect(numberOfPastEvents > 3).toBeTruthy();

  });

});
