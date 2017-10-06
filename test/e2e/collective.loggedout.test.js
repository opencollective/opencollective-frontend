import path from 'path';
import { Chromeless }  from 'chromeless';
import { expect } from 'chai';

const WEBSITE_URL = "https://staging.opencollective.com";
// const WEBSITE_URL = "http://localhost:3030";

const screenshotsDirectory = (process.env.CIRCLE_ARTIFACTS) ? process.env.CIRCLE_ARTIFACTS : '/tmp';
console.log(">>> screenshotsDirectory", screenshotsDirectory);

describe("collective page logged out", () => {
  let chromeless;

  before((done) => {
    chromeless = new Chromeless();
    done();
  })

  after(() => chromeless.end());

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
      .click('.SubmitExpenseBtn')
      .wait(1000)
      .screenshot({ filePath: path.join(screenshotsDirectory, 'click_submit_new_expense.png')});

    console.log(">>> screenshot", screenshot);
    // const transactions = await chromeless.evaluate(() => document.querySelectorAll('.CollectiveActivityItem'));
    // console.log(">>> transactions length", transactions.length);
    // console.log(">>> transactions", transactions);
    const url = await chromeless.evaluate(() => window.location.href)
    console.log(">>> url", url);
    expect(url).to.contain(`${WEBSITE_URL}/webpack/expenses/new`);
  });
});
