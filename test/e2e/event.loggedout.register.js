import { Chromeless }  from 'chromeless';
import { expect } from 'chai';
import { download } from '../utils';

const WEBSITE_URL = "https://staging.opencollective.com";
// const WEBSITE_URL = "http://localhost:3030";

describe("logged out", () => {
  let chromeless;

  before((done) => {
    chromeless = new Chromeless({ remote: true });
    done();
  })

  after(async () => await chromeless.end());

  it("register for a free event", async function() {
    this.timeout(40000);
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
    expect(url).to.contain(`${WEBSITE_URL}/opensource/events/webpack-webinar/order/78?quantity=2&totalAmount=0`);

    screenshot = await chromeless
      .scrollToElement('#free.tier .btn.increase')
      .click('#free.tier .btn.increase')
      .scrollToElement('.submit button')
      .click('.submit button')
      .wait('.UserCollectivePage')
      .screenshot();

    download("event.registered", screenshot);
    const url2 = await chromeless.evaluate(() => window.location.href)

    expect(url2).to.contain(`?status=orderCreated&CollectiveId=8735&TierId=78&type=EVENT&totalAmount=0`);
  })

});
