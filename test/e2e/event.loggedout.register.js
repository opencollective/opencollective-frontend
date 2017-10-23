import { Chromeless }  from 'chromeless';
import { download, closeChrome } from '../utils';

const WEBSITE_URL = "https://staging.opencollective.com";
// const WEBSITE_URL = "http://localhost:3030";

describe("event.loggedout.register", () => {
  let chromeless;

  beforeAll((done) => {
    chromeless = new Chromeless({ remote: true });
    done();
  })

  afterAll(() => {
    jest.setTimeout(3000);
    return closeChrome(chromeless);
  });
  
  test("register for a free event", async () => {
    jest.setTimeout(40000);
    const email = `testuser+${Math.round(Math.random()*1000000)}@gmail.com`;
    let screenshot = await chromeless
      .goto(`${WEBSITE_URL}/opensource/events/webpack-webinar`)
      .wait('#free.tier')
      .scrollToElement('#free.tier')
      .click('#free.tier .btn.increase')
      .click('#free.tier .ctabtn')
      .wait('.OrderForm')
      .type(email, "input[name='email']")
      .type("Xavier", "input[name='firstName']")
      .type("Damman", "input[name='lastName']")
      .type("https://xdamman.com", "input[name='website']")
      .type("xdamman", "input[name='twitterHandle']")
      .type("short bio", "input[name='description']")
      .type("Open Collective Inc.", "input[name='organization_name']")
      .type("http://opencollective.com.com", "input[name='organization_website']")
      .type("opencollect", "input[name='organization_twitterHandle']")
      .type("Public message", "textarea[name='publicMessage']")
      .screenshot();

    download("event.register", screenshot);
    const url = await chromeless.evaluate(() => window.location.href)
    expect(url).toEqual(expect.stringContaining(`${WEBSITE_URL}/opensource/events/webpack-webinar/order/78?quantity=2&totalAmount=0`));

    screenshot = await chromeless
      .scrollToElement('#free.tier .btn.increase')
      .click('#free.tier .btn.increase')
      .scrollToElement('.submit button')
      .click('.submit button')
      .wait('.UserCollectivePage')
      .screenshot();

    download("event.registered", screenshot);
    const url2 = await chromeless.evaluate(() => window.location.href)

    expect(url2).toEqual(expect.stringContaining(`?status=orderCreated&CollectiveId=8735&TierId=78&type=EVENT&totalAmount=0`));
  })

});
