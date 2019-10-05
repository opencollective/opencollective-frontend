describe('New users profiles', () => {
  before(() => {
    cy.visit('/xdamman/v2');
  });
  describe('Contributions section', () => {
    it('Shows contributions with date since and amount contributed', () => {
      cy.get('[data-cy=section-contributions]').click({ force: true });
      cy.hash().should('eq', '#section-contributions');
      cy.get('[data-cy=section-contributions-title]').contains('Contributions');
      cy.get('[data-cy=contribution-date-since]')
        .first()
        .contains('Collective Admin since');
      cy.get('[data-cy=contribution-date-since]')
        .first()
        .contains('August 2016');
      cy.get('[data-cy=amount-contributed]')
        .first()
        .contains('amount contributed');
      cy.get('[data-cy=amount-contributed]')
        .first()
        .contains('$642');
    });

    it('Can load more', () => {
      cy.get('[data-cy=collective-contribution]').should('have.length', 16);
      cy.get('button[data-cy=load-more]').click({ force: true });
      cy.get('[data-cy=collective-contribution]').should('have.length.gt', 16);
    });

    it('Can filter by contribution type (admin, financial...etc)', () => {
      cy.get('[data-cy=filters]');
      cy.get('[data-type=core]').click({ force: true });
      cy.get('[data-cy=collective-contribution]')
        .first()
        .get('[data-cy=caption]')
        .contains('Collective Admin since');
      cy.get('[data-type=financial]').click({ force: true });
      cy.get('[data-cy=collective-contribution]')
        .first()
        .get('[data-cy=caption]')
        .contains('Financial Contributor since');
      cy.get('[data-type=events]').click({ force: true });
      cy.get('[data-cy=collective-contribution]')
        .first()
        .get('[data-cy=caption]')
        .contains('Attendee since');
    });
  });

  describe('Transactions section', () => {
    it('Can filter by expense/contributions', () => {
      cy.get('[data-cy=section-transactions]').click({ force: true });
      cy.hash().should('eq', '#section-transactions');
      cy.get('[data-cy=section-transactions-title]').contains('Transactions');
      cy.get('button[data-type=expenses]').click({ force: true });
      cy.get('[data-cy=expenses]');
      cy.get('[data-cy=credit]')
        .first()
        .contains('+');
      cy.get('button[data-type=contributions]').click({ force: true });
      cy.get('[data-cy=contributions]');
      cy.get('[data-cy=credit]')
        .first()
        .contains('-');
    });

    it('Show transactions with all info and links', () => {
      cy.get('[data-type=transactions]')
        .first()
        .get('[data-cy=transaction-details] > a')
        .should('have.attr', 'href', '/xr-namur')
        .contains('Extinction Rebellion Namur');
      cy.get('[data-type=transactions]')
        .first()
        .get('[data-cy=transaction-description]')
        .contains('Monthly donation to Extinction Rebellion Namur (Rebel)');
      cy.get('[data-type=transactions]')
        .first()
        .get('[data-cy=transaction-details] > span[data-cy=transaction-date]')
        .contains('07/01/2019');
      cy.get('[data-type=transactions]')
        .first()
        .get('[data-cy=transaction-amount] > span')
        .eq(0)
        .contains('-');
      cy.get('[data-type=transactions]')
        .first()
        .get('[data-cy=transaction-amount] > span')
        .eq(1)
        .contains('€5.00');
      cy.get('[data-type=transactions]')
        .first()
        .get('[data-cy=transaction-amount] > span')
        .eq(2)
        .contains('EUR');
    });
  });
});
