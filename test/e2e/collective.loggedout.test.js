import { Chromeless }  from 'chromeless';
import { download, closeChrome } from '../utils';
const WEBSITE_URL = "https://staging.opencollective.com";
// const WEBSITE_URL = "http://localhost:3030";

describe("collective.loggedout.test", () => {
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
  
  test("load collective page", async () => {
    
    jest.setTimeout(20000);

    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/webpack`)
      .wait('section#sponsors', 2000)
      .wait('section#backers', 2000)
      .wait('section#budget', 2000)
      .screenshot();

    download("collective_page", screenshot);
    const balance = await chromeless.evaluate(() => document.querySelector('.balance').innerText);
    console.log(">>> balance", balance);
    expect(balance).toMatch(/\$[0-9]/);
  });

  test("filter transactions", async () => {
    
    jest.setTimeout(20000);

    const screenshot = await chromeless
      .goto(`${WEBSITE_URL}/webpack`)
      .wait('#transactions .filterBtn', 4000)
      .scrollToElement('#transactions')
      .click('#transactions .filterBtn:nth-of-type(3)')
      .wait('.transaction.debit', 4000)
      .screenshot();

    download("filter_transactions", screenshot);
    const numberOfDebitTransactions = await chromeless.evaluate(() => document.querySelectorAll('.transaction.debit').length);
    expect(numberOfDebitTransactions).toEqual(5);
  });

  test("clicks on submit new expense", async () => {
    jest.setTimeout(20000);
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
    expect(url).toEqual(expect.stringContaining(`${WEBSITE_URL}/tipbox/expenses/new`));
  });
});
