const { Chromeless } = require('chromeless')
import { expect } from 'chai';

const chromeless = new Chromeless();
// const WEBSITE_URL = "https://staging.opencollective.com";
const WEBSITE_URL = "http://localhost:3030";

describe("collective page logged out", () => {

  it("load collective page", async function() {
    
    this.timeout(20000);

    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/webpack`)
      .wait('section#sponsors', 2000)
      .wait('section#backers', 2000)
      .wait('section#budget', 2000)
      .screenshot();

    console.log(">>> screenshot", screenshot);
    const balance = await chromeless.evaluate(() => document.querySelector('.balance').innerText);
    console.log(">>> balance", balance);
    expect(balance).to.match(/\$[0-9]/);
    await chromeless.end();
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

    console.log(">>> screenshot", screenshot);
    const numberOfDebitTransactions = await chromeless.evaluate(() => document.querySelectorAll('.transaction.debit').length);
    expect(numberOfDebitTransactions).to.equal(5);
    await chromeless.end();
  });

  it("clicks on submit new expense", async function() {
    this.timeout(20000);
    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/webpack`)
      .wait('#SubmitExpenseBtn')
      .scrollToElement('#SubmitExpenseBtn')
      .click('#SubmitExpenseBtn')
      .wait(1000)
      .screenshot();

    console.log(">>> screenshot", screenshot);
    // const transactions = await chromeless.evaluate(() => document.querySelectorAll('.CollectiveActivityItem'));
    // console.log(">>> transactions length", transactions.length);
    // console.log(">>> transactions", transactions);
    const url = await chromeless.evaluate(() => window.location.href)
    console.log(">>> url", url);
    expect(url).to.contain(`${WEBSITE_URL}/webpack/expenses/new`);
    await chromeless.end();
  });
});