import { download, chromeless } from '../utils';
const WEBSITE_URL = process.env.WEBSITE_URL || "https://staging.opencollective.com";

describe("collective.edit.test", () => {
  let browser;

  beforeAll(() => browser = chromeless.init());
  afterAll(() => chromeless.close(browser));

  beforeEach(async () => {
    await browser
      .goto(`${WEBSITE_URL}/testcollective/edit`)
      .wait('.login .btn')
      .click('.login .btn')
      .wait("input[name='email']")
      .type("testuser+admin@opencollective.com", "input[name='email']")
      .wait('button.login')
      .click('button.login')
      .wait('.CollectiveCover');
  })
    
  test("edit collective ", async () => {
    
    jest.setTimeout(30000);
    const randomDescription = `Hello World ${Math.round(Math.random()*1000000)}`;
    const randomLongDescription = `**Hello World** [anchor](https://google.com) ${Math.round(Math.random()*1000000)}`;

    const screenshot = await browser
      .wait("input[name='description']")
      .clearInput("input[name='description']")
      .type(randomDescription, "input[name='description']")
      .clearInput("textarea[name='longDescription']")
      .type(randomLongDescription, "textarea[name='longDescription']")
      .wait(500)
      .scrollToElement('.actions')
      .click("button[type='submit']")
      .screenshot();

    download("collective_edit_page", screenshot);
    const username = await browser.evaluate(() => document.querySelector('.LoginTopBarProfileButton-name').innerText);
    expect(username).toEqual("test-admin-user");

    const screenshot2 = await browser
      .goto(`${WEBSITE_URL}/testcollective?cacheburst=${Math.round(Math.random()*10000)}`)
      .wait('section#about')
      .wait('.longDescription a[href="https://google.com"]')
      .screenshot();
    
    download("collective_edited_page", screenshot2);

    const description = await browser.evaluate(() => document.querySelector('.description').innerText);
    const anchor = await browser.evaluate(() => document.querySelector('.longDescription a').innerText);
    expect(description).toEqual(randomDescription);
    expect(anchor).toEqual("anchor");
  });

  it("edit tiers", async () => {
    jest.setTimeout(90000);
    const screenshot = await browser
      .goto(`${WEBSITE_URL}/testcollective/edit`)
      .wait('.menuBtnGroup .tiers')
      .click('.menuBtnGroup .tiers')
      .scrollToElement('.addTier')
      .click('.addTier')
      .type('New tier', '.tier:last-child input[name="name"]')
      .type('New tier description', '.tier:last-child textarea[name="description"]')
      .clearInput('.tier:last-child input[name="amount"]')
      .type('2', '.tier:last-child input[name="amount"]')
      .focus('.tier:last-child input[name="maxQuantity"]')
      .clearInput('.tier:last-child input[name="maxQuantity"]')
      .type('10', '.tier:last-child input[name="maxQuantity"]')
      .scrollToElement('.addTier')
      .click('.addTier')
      .wait(500)
      .type('New tier 2', '.tier:last-child input[name="name"]')
      .type('New tier 2 description', '.tier:last-child textarea[name="description"]')
      .focus('.tier:last-child input[name="amount"]')
      .clearInput('.tier:last-child input[name="amount"]')
      .type('25', '.tier:last-child input[name="amount"]')
      .wait(500)
      .scrollToElement("button[type='submit']")
      .focus("button[type='submit']")
      .click("button[type='submit']")
      .wait(1000)
      .goto(`${WEBSITE_URL}/testcollective`)
      .wait('.CollectiveCover')
      .wait('.TierCard#new-tier .amount')
      .screenshot();

    download("collective_tiers_edited", screenshot);
    const amount = await browser.evaluate(() => document.querySelector('.TierCard#new-tier .amount').innerText);
    console.log(">>> amount", amount);
    expect(amount).toEqual(`$2`);
    
    const screenshot2 = await browser
      .goto(`${WEBSITE_URL}/testcollective/edit#tiers`)
      .wait('.tiers')
      .click('.tier.new-tier .removeTier')
      .click('.tier.new-tier-2 .removeTier')
      .wait(500)
      .scrollToElement("button[type='submit']")
      .click("button[type='submit']")
      .wait(1000)
      .goto(`${WEBSITE_URL}/testcollective`)
      .wait('.CollectiveCover')
      .screenshot();
      
    download("collective_edit_tiers_clean", screenshot2);

    const tiersCount = await browser.evaluate(() => document.querySelectorAll('.TierCard').length);
    expect(tiersCount).toEqual(2);
  })

});
