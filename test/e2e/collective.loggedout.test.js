import { download, chromeless } from '../utils';
const WEBSITE_URL = process.env.WEBSITE_URL || "https://staging.opencollective.com";

describe("collective.loggedout.test", () => {
  let browser;

  beforeAll(() => browser = chromeless.init());
  afterAll(() => chromeless.close(browser));

  test("load collective page", async () => {
    
    jest.setTimeout(20000);

    const screenshot = await browser
      .goto(`${WEBSITE_URL}/webpack`)
      .wait('section#organizations')
      .wait('section#backers')
      .wait('section#budget')
      .screenshot();

    download("collective_page", screenshot);
    const balance = await browser.evaluate(() => document.querySelector('.balance').innerText);
    console.log(">>> balance", balance);
    expect(balance).toMatch(/\$[0-9]/);
  });

  test("filter transactions", async () => {
    
    jest.setTimeout(20000);

    const screenshot = await browser
      .goto(`${WEBSITE_URL}/webpack`)
      .wait('#transactions .filterBtn')
      .scrollToElement('#transactions')
      .click('#transactions .filterBtn:nth-of-type(3)')
      .wait('.transaction.debit')
      .wait(1000)
      .screenshot();

    download("filter_transactions", screenshot);
    const numberOfDebitTransactions = await browser.evaluate(() => document.querySelectorAll('.transaction.debit').length);
    expect(numberOfDebitTransactions).toEqual(5);
  });

  test("clicks on submit new expense", async () => {
    jest.setTimeout(20000);
    const screenshot = await browser
      .goto(`${WEBSITE_URL}/tipbox`)
      .wait('.SubmitExpenseBtn')
      .scrollToElement('.SubmitExpenseBtn')
      .wait(500)
      .click('.SubmitExpenseBtn')
      .wait(3000)
      .screenshot();

    download("new_expense", screenshot);
    const url = await browser.evaluate(() => window.location.href)
    expect(url).toEqual(expect.stringContaining(`${WEBSITE_URL}/tipbox/expenses/new`));
  });
});
