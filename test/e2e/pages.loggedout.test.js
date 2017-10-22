import { Chromeless }  from 'chromeless';
import { expect } from 'chai';
import { download } from '../utils';
const WEBSITE_URL = "https://staging.opencollective.com";
// const WEBSITE_URL = "http://localhost:3030";

describe("logged out", () => {
  let chromeless;

  before((done) => {
    chromeless = new Chromeless({
      remote: true,
      viewport: { width: 768, height: 1024 }
    });
    done();
  })

  after(async () => await chromeless.end());

  it("goes to a custom donate URL", async function() {
    this.timeout(10000);
    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/webpack/donate/50/month`)
      .wait('.presetBtn')
      .scrollToElement('.presetBtn')
      .screenshot();

    download("donate", screenshot);
    
    const middlePresetSelected = await chromeless.exists('.presetBtnGroup button:nth-child(2).btn-primary');
    expect(middlePresetSelected).to.be.true;

    const monthlySelected = await chromeless.exists('.intervalBtnGroup button:nth-child(2).btn-primary');
    expect(monthlySelected).to.be.true;
  })
});
