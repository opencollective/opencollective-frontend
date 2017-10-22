import { Chromeless }  from 'chromeless';
import { expect } from 'chai';
import { download } from '../utils';
const WEBSITE_URL = "https://staging.opencollective.com";
// const WEBSITE_URL = "http://localhost:3030";

describe("collective.loggedout.test", () => {
  let chromeless;

  before((done) => {
    chromeless = new Chromeless({
      remote: true,
      viewport: { width: 768, height: 1024 }
    });
    done();
  })

  after((done) => {
    chromeless.end().then(() => setTimeout(done, 1500))
  });
  
  it("load collective page", async function() {
    
    this.timeout(20000);

    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/webpack`)
      .wait('section#sponsors', 2000)
      .wait('section#backers', 2000)
      .wait('section#budget', 2000)
      .screenshot();

    download("collective_page", screenshot);
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
      .screenshot();

    download("filter_transactions", screenshot);
    const numberOfDebitTransactions = await chromeless.evaluate(() => document.querySelectorAll('.transaction.debit').length);
    expect(numberOfDebitTransactions).to.equal(5);
  });

  it("clicks on submit new expense", async function() {
    this.timeout(20000);
    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/tipbox`)
      .wait('.SubmitExpenseBtn')
      .wait(200)
      .scrollToElement('.SubmitExpenseBtn')
      .wait(800)
      .click('.SubmitExpenseBtn')
      .wait(500)
      .screenshot();

    download("new_expense", screenshot);
    const url = await chromeless.evaluate(() => window.location.href)
    expect(url).to.contain(`${WEBSITE_URL}/tipbox/expenses/new`);
  });
});
