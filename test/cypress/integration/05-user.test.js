import { disableSmoothScroll } from '../support/helpers';

const scrollToSection = section => {
  // Wait for collective page to load before disabling smooth scroll
  cy.get('[data-cy=collective-page-main]');
  disableSmoothScroll();
  cy.get(`#section-${section}`).scrollIntoView();
};

describe('New users profiles', () => {
  before(() => {
    cy.visit('/xdamman');
  });

  it('Should have no-index meta', () => {
    cy.get('meta[name="robots"]').should('have.attr', 'content', 'none');
  });

  describe('Contributions section', () => {
    it('Shows contributions with date since and amount contributed', () => {
      cy.get('a[href="#category-CONTRIBUTIONS"]').click();
      cy.wait(50);
      cy.hash().should('eq', '#category-CONTRIBUTIONS');
      cy.get('[data-cy=contribution-date-since]').first().contains('Admin since');
      cy.get('[data-cy=contribution-date-since]').first().contains('August 2016');
      cy.get('[data-cy=amount-contributed]').first().contains('Amount contributed');
      cy.get('[data-cy=amount-contributed]').first().contains('€267');
    });

    it.skip('Can load more', () => {
      // TODO
    });

    it('Can filter by contribution type (admin, financial...etc)', () => {
      cy.get('[data-cy=filters]');
      cy.get('[data-cy="filter-button core"]').click();
      cy.get('[data-cy=collective-contribution]').first().get('[data-cy=caption]').contains('Admin since');
      cy.get('[data-cy="filter-button financial"]').click();
      cy.get('[data-cy=collective-contribution]')
        .first()
        .get('[data-cy=caption]')
        .contains('Financial Contributor since');
      cy.get('[data-cy="filter-button events"]').click();
      cy.get('[data-cy=collective-contribution]').first().get('[data-cy=caption]').contains('Attendee since');
    });
  });

  describe('Transactions section', () => {
    it('Can filter by expense/contributions', () => {
      scrollToSection('transactions');
      cy.get('button[data-cy="filter-button expenses"]').click();
      cy.wait(300);
      cy.get('[data-cy="transaction-sign"]').first().contains('+');
      cy.get('button[data-cy="filter-button contributions"]').click();
      cy.wait(300);
      cy.get('[data-cy="transaction-sign"]').first().contains('-');
    });

    it('Show transactions with all info and links', () => {
      cy.get('[data-cy="transaction-item"]:first a[href="/brusselstogether"]').should('exist');
      cy.get('[data-cy="transaction-item"]')
        .first()
        .get('[data-cy=transaction-description]')
        .contains('monthly recurring subscription');
      cy.get('[data-cy="transaction-item"]')
        .first()
        .get('[data-cy=transaction-details] > span[data-cy=transaction-date]')
        .contains('November 30, 2017');
      cy.get('[data-cy="transaction-item"]').first().get('[data-cy=transaction-amount] > span').eq(0).contains('-');
      cy.get('[data-cy="transaction-item"]')
        .first()
        .get('[data-cy=transaction-amount] > span')
        .eq(1)
        .contains('€10.00');
      cy.get('[data-cy="transaction-item"]').first().get('[data-cy=transaction-amount] > span').eq(2).contains('EUR');
    });
  });
});
