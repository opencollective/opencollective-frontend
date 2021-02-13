describe('Contact collective', () => {
  let collectiveSlug;

  before(() => {
    return cy.createHostedCollective({ type: 'COLLECTIVE' }).then(collective => {
      collectiveSlug = collective.slug;
    });
  });

  it('Needs to be logged in', () => {
    cy.visit(`/${collectiveSlug}/contact`);
    cy.contains('You need to be logged in to continue.');
  });

  it('Shows a disclaimer about email being shared', () => {
    cy.login({ redirect: `/${collectiveSlug}/contact` });
    cy.contains('Your email address will be shared with the admins who will receive this message.');
  });

  it("Can't contact organizations", () => {
    cy.createCollective({ type: 'ORGANIZATION' }).then(org => {
      cy.login({ redirect: `/${org.slug}/contact` });
      cy.contains("This Collective can't be contacted via Open Collective.");
    });
  });

  it("Can't contact inactive collectives", () => {
    cy.createCollective({ type: 'COLLECTIVE' }).then(org => {
      cy.login({ redirect: `/${org.slug}/contact` });
      cy.contains("This Collective can't be contacted via Open Collective.");
    });
  });

  it('Sends the message', () => {
    cy.login({ redirect: `/${collectiveSlug}/contact` });
    cy.getByDataCy('subject').type('Hello');
    cy.getByDataCy('message').type('Hello');
    cy.getByDataCy('submit').should('be.disabled'); // message is not long enough
    cy.getByDataCy('message').type(' Lorem ipsum dolor sit amet, consectetur adipiscing elit.');
    cy.getByDataCy('submit').click();
    cy.contains('Message sent');
  });
});
