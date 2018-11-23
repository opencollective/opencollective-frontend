const WEBSITE_URL =
  process.env.WEBSITE_URL ||
  'http://localhost:3000' ||
  'https://staging.opencollective.com';

const fill = (fieldname, value) => {
  cy.get(`.inputField.${fieldname} input`).type(value);
};

const init = (skip_signin = false) => {
  if (skip_signin) {
    cy.visit(
      'http://localhost:3000/signin/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzY29wZSI6ImxvZ2luIiwiaWQiOjk0NzQsImVtYWlsIjoidGVzdHVzZXIrYWRtaW5Ab3BlbmNvbGxlY3RpdmUuY29tIiwiaWF0IjoxNTQyOTM2ODQzLCJleHAiOjE1NDMwMjMyNDMsInN1YiI6OTQ3NH0.YSQ_N67Xt2IeD_Y6BcWUTUalATtC5tx3nX_zJDRj47c?next=/brusselstogetherasbl/dashboard',
    );
  } else {
    cy.visit(`${WEBSITE_URL}/signin?next=/brusselstogetherasbl/dashboard`);
    fill('email', 'testuser+admin@opencollective.com');
    cy.get('.LoginForm button').click();
  }
};

describe('host dashboard', () => {
  it('mark pending order as paid', () => {
    init();
    cy.get('.Orders .item:first .status').contains('pending');
    cy.get('.MarkOrderAsPaidBtn button')
      .first()
      .click();
    cy.get('.Orders .item:first .status').contains('paid');
    cy.wait(1000);
  });
});
