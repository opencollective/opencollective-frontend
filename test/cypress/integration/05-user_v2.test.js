describe('New users profiles', () => {
  describe('Contributions section', () => {
    before(() => {
      cy.visit('/xdamman/v2');
      cy.get('[data-cy=Contributions]');
    });
    it('Shows contributions with date since and amount contributed', () => {
      cy.get('[data-cy=collectives]').should('have.length.greaterThan', 1);
      cy.get('[data-cy=date-since]').contains('since');
      cy.get('[data-cy=amount-contributed]');
    });

    it('Can load more', () => {
      cy.get('button[data-cy=load-more]').contains('load more');
    });

    it('Can filter by contribution type (admin, financial...etc)', () => {
      cy.get('button[data-cy=filters]').contains(/(Core|Financial|Events)/);
    });
  });

  describe('Transactions section', () => {
    before(() => {
      cy.visit('/xdamman/v2');
    });
    it('Can filter by expense/contributions', () => {
      cy.get('[data-cy=navbar-contributions]').contains('Contributions');
      cy.get('[data-cy=navbar-transactions]').contains('Transactions');
    });

    it('Show transactions with all info and links', () => {
      cy.get('[data-cy=transaction-details]');
      cy.get('[data-cy=transaction-details] > p');
      cy.get('[data-cy=transaction-details] > a').should('have.attr', 'href');
      cy.get('[data-cy=transaction-details]').contains('on');
      cy.get('[data-cy=amount]').contains(/(EUR|USD)/);
    });
  });
});
