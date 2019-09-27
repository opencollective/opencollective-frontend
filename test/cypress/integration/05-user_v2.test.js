describe('New users profiles', () => {
  describe('Contributions section', () => {
    it('Shows contributions with date since and amount contributed', () => {
      cy.visit('/xdamman/v2');
      cy.get('#Contributions');
      cy.get('.collectives').should('have.length.greaterThan', 1);
      cy.get('.date-since')
        .parent()
        .contains('since');
      cy.get('.date-since')
        .first()
        .contains('August 2016');
      cy.get('.amount-contributed')
        .first()
        .contains('$642');
    });

    it('Can load more', () => {
      cy.visit('/xdamman/v2');
      cy.get('#Contributions');
      cy.get('button#loadMore').contains('load more');
    });

    it('Can filter by contribution type (admin, financial...etc)', () => {
      cy.visit('/xdamman/v2');
      cy.get('#Contributions');
      cy.get('button.filters')
        .eq(1)
        .contains('Core Contributor');
      cy.get('button.filters')
        .eq(2)
        .contains('Financial Contributor');
      cy.get('button.filters')
        .eq(3)
        .contains('Events');
    });
  });

  describe('Transactions section', () => {
    it('Can filter by expense/contributions', () => {
      cy.visit('/xdamman/v2');
      cy.get('.navbar-contributions').contains('Contributions');
      cy.get('.navbar-transactions').contains('Transactions');
    });

    it('Show transactions with all info and links', () => {
      cy.visit('/xdamman/v2');
      cy.get('.collective-link').should('have.attr', 'href');
      cy.get('.description')
        .first()
        .contains('Monthly donation to Extinction Rebellion Namur (Rebel)');
      cy.get('.collective-link')
        .parent()
        .contains('July 1');
      cy.get('.transaction-amount')
        .first()
        .contains('€5.00');
    });
  });
});
