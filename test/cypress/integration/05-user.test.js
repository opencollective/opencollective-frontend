const scrollToSection = section => {
  // Wait for collective page to load before disabling smooth scroll
  cy.get('[data-cy=collective-page-main]');
  cy.get(`#section-${section}`).scrollIntoView();
};

describe('New users profiles', () => {
  beforeEach(() => {
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
    });

    // Deactivating this due to lack of dummy date on our DB
    xit('Can load more', () => {
      cy.get('a[href="#category-CONTRIBUTIONS"]').click();
      cy.wait(50);
      cy.get('[data-cy=collective-contribution]').its('length').should('eq', 15);

      cy.get('[data-cy=load-more]').click();
      cy.wait(300);
      cy.get('[data-cy=collective-contribution]').its('length').should('eq', 19);
    });

    it('Can filter by contribution type (admin, financial...etc)', () => {
      cy.get('[data-cy=filters]');
      cy.get('[data-cy="filter-button core"]').click();
      cy.wait(300);
      cy.get('[data-cy=contribution-date-since]').first().contains('Admin since');
      cy.get('[data-cy=contribution-date-since]').first().contains('August 2016');

      cy.get('[data-cy="filter-button financial"]').click();
      cy.wait(300);
      cy.get('[data-cy=contribution-date-since]').first().contains('Financial Contributor since');
      cy.get('[data-cy=amount-contributed]').first().contains('Amount contributed');
      cy.get('[data-cy=amount-contributed]').first().contains('€5,140');
    });
  });

  describe('Budget section', () => {
    it('Can filter by expense/contributions', () => {
      scrollToSection('budget');

      // Default view = mixed contributions/expenses
      cy.get('#section-budget button[data-cy="filter-button all"]').should('have.attr', 'data-selected', 'true');
      cy.get('#section-budget [data-cy=single-budget-item]').its('length').should('eq', 3);

      // Expenses
      cy.get('#section-budget button[data-cy="filter-button expenses"]').click();
      cy.contains('#section-budget a[href="/xdamman/submitted-expenses"]', 'View all expenses');
      cy.get('#section-budget [data-cy=single-budget-item]').its('length').should('eq', 3);
      cy.get('#section-budget [data-cy^=expense-container-]').its('length').should('eq', 3);

      // Contributions
      cy.get('#section-budget button[data-cy="filter-button transactions"]').click();
      cy.contains('#section-budget a[href^="/xdamman/transactions"]', 'View all contributions').should(
        'have.attr',
        'href',
        '/xdamman/transactions?kind=ADDED_FUNDS,CONTRIBUTION,PLATFORM_TIP',
      );
      cy.get('#section-budget [data-cy=single-budget-item]').its('length').should('eq', 3);
      cy.get('#section-budget [data-cy=transaction-item]').its('length').should('eq', 3);
    });
  });
});
