import path from 'path';
import { Chromeless }  from 'chromeless';
import { expect } from 'chai';

const WEBSITE_URL = "https://staging.opencollective.com";
// const WEBSITE_URL = "http://localhost:3030";

const screenshotsDirectory = (process.env.CIRCLE_ARTIFACTS) ? process.env.CIRCLE_ARTIFACTS : '/tmp';
console.log(">>> screenshotsDirectory", screenshotsDirectory);

describe("logged out", () => {
  let chromeless;

  before((done) => {
    chromeless = new Chromeless();
    done();
  })

  after(async () => await chromeless.end());
  
  it("load collective page", async function() {
    
    this.timeout(20000);

    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/webpack`)
      .wait('section#sponsors', 2000)
      .wait('section#backers', 2000)
      .wait('section#budget', 2000)
      .screenshot({ filePath: path.join(screenshotsDirectory, 'collective_page.png')});

    console.log(">>> screenshot", screenshot);
    const balance = await chromeless.evaluate(() => document.querySelector('.balance').innerText);
    console.log(">>> balance", balance);
    expect(balance).to.match(/\$[0-9]/);
  });

  it("filter transactions", async function() {
    
    this.timeout(20000);

    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/webpack`)
      .wait('#transactions .filterBtn', 4000)
      .scrollToElement('#transactions')
      .click('#transactions .filterBtn:nth-of-type(3)')
      .wait('.transaction.debit', 4000)
      .screenshot({ filePath: path.join(screenshotsDirectory, 'filter_transactions.png')});

    console.log(">>> screenshot", screenshot);
    const numberOfDebitTransactions = await chromeless.evaluate(() => document.querySelectorAll('.transaction.debit').length);
    expect(numberOfDebitTransactions).to.equal(5);
  });

  it("clicks on submit new expense", async function() {
    this.timeout(20000);
    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/webpack`)
      .wait('.SubmitExpenseBtn')
      .scrollToElement('.SubmitExpenseBtn')
      .wait(500)
      .click('.SubmitExpenseBtn')
      .wait(3000)
      .screenshot({ filePath: path.join(screenshotsDirectory, 'click_submit_new_expense.png')});

    console.log(">>> screenshot", screenshot);
    // const transactions = await chromeless.evaluate(() => document.querySelectorAll('.CollectiveActivityItem'));
    // console.log(">>> transactions length", transactions.length);
    // console.log(">>> transactions", transactions);
    const url = await chromeless.evaluate(() => window.location.href)
    console.log(">>> url", url);
    expect(url).to.contain(`${WEBSITE_URL}/webpack/expenses/new`);
  });

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
      .screenshot({ filePath: path.join(screenshotsDirectory, 'order_free_ticket.png')});

    console.log(">>> screenshot", screenshot);
    const url = await chromeless.evaluate(() => window.location.href)
    expect(url).to.contain(`${WEBSITE_URL}/opensource/events/webpack-webinar/order/78?quantity=2&totalAmount=0`);

    screenshot = await chromeless
      .scrollToElement('#free.tier .btn.increase')
      .click('#free.tier .btn.increase')
      .scrollToElement('.submit button')
      .click('.submit button')
      .wait('.UserCollectivePage')
      .screenshot({ filePath: path.join(screenshotsDirectory, 'order_free_ticket.png')});

    console.log(">>> screenshot", screenshot);
    const url2 = await chromeless.evaluate(() => window.location.href)

    expect(url2).to.contain(`?status=orderCreated&CollectiveId=8735&TierId=78&type=EVENT&totalAmount=0`);
  })

  it("makes a one time donation", async function() {
    
    this.timeout(25000);

    const run = async () => {

      const email = `testuser+${Math.round(Math.random()*1000000)}@gmail.com`;

      const screenshot = await chromeless
        .goto(`${WEBSITE_URL}/webpack/donate`)
        .type(email, "input[name='email']")
        .type("Xavier", "input[name='firstName']")
        .type("Damman", "input[name='lastName']")
        .type("https://xdamman.com", "input[name='website']")
        .type("xdamman", "input[name='twitterHandle']")
        .type("short bio", "input[name='description']")
        .type("4242424242424242", "input[name='CCnumber']")
        .type("Full Name", "input[name='CCname']")
        .type("11/22", "input[name='CCexpiry']")
        .type("111", "input[name='CCcvc']")
        .click(".presetBtn")
        .type("Public message", "textarea[name='publicMessage']")
        .click('.submit button')
        .wait('.UserCollectivePage', 10000)
        .screenshot({ filePath: path.join(screenshotsDirectory, 'onetime_donation.png')});

      console.log(">>> screenshot", screenshot);
      const url = await chromeless.evaluate(() => window.location.href)
      console.log(">>> url", url);
      expect(url).to.contain(`${WEBSITE_URL}/xdamman`);
      expect(url).to.contain(`?status=orderCreated&CollectiveId=302`);
      const thankyou = await chromeless.exists('p.thankyou');
      expect(thankyou).to.be.true;
      const messageContent = await chromeless.evaluate(() => document.querySelector('.message').innerText);
      expect(messageContent).to.contain('webpack');
    }

    try {
      await run();
    } catch (e) {
      // Sadly this doesn't work yet: https://github.com/graphcool/chromeless/issues/279
      const screenshot = await chromeless.screenshot({ filePath: path.join(screenshotsDirectory, 'collective_page.png')});
      console.error(">>> error: ", e);
      console.log(">>> screenshot", screenshot);
    }
  })

  it("goes to a custom donate URL", async function() {
    this.timeout(10000);
    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/webpack/donate/50/month`)
      .wait('.presetBtn')
      .scrollToElement('.presetBtn')
      .screenshot({ filePath: path.join(screenshotsDirectory, 'custom_donation_page.png')});

    console.log(">>> screenshot", screenshot);

    const middlePresetSelected = await chromeless.exists('.presetBtnGroup button:nth-child(2).btn-primary');
    expect(middlePresetSelected).to.be.true;

    const monthlySelected = await chromeless.exists('.intervalBtnGroup button:nth-child(2).btn-primary');
    expect(monthlySelected).to.be.true;
  })
});
