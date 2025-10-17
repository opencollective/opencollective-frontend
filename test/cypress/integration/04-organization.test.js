import mockRecaptcha from '../mocks/recaptcha';

const scrollToSection = section => {
  // Wait for collective page to load before disabling smooth scroll
  cy.get('[data-cy=collective-page-main]');
  cy.get(`#section-${section}`).scrollIntoView();
};

describe('New organization profile', () => {
  /**
   * Contributions section is already tested in `05-user.test.js`
   * About section is already tested in `04-collective.test.js`
   */
  beforeEach(() => {
    cy.createCollective({ type: 'ORGANIZATION' }).then(collective => {
      const collectiveSlug = collective.slug;
      cy.visit(`/${collectiveSlug}/`);
    });
  });

  it('Should have no-index meta if no activity', () => {
    // Wait for page to be loaded
    cy.getByDataCy('collective-title');
    cy.get('meta[name="robots"]').should('exist');
  });

  it('Has a team section', () => {
    cy.getByDataCy('section-our-team').contains('Our team');
    cy.getByDataCy('section-our-team').contains('Test User Admin');
  });

  describe('Transactions section', () => {
    it('is not there if no financial activity', () => {
      cy.get('#section-transactions').should('not.exist');
    });

    it('Can filter by expense/contributions', () => {
      cy.visit('/idonethis');
      scrollToSection('transactions');
      cy.get('meta[name="robots"]').should('not.exist'); // Should not have it since there's soe financial activity

      // Filter for expenses
      cy.get('button[data-cy="filter-button expenses"]').click();
      cy.wait(300);
      cy.get('[data-cy="transaction-sign"]').first().contains('+');

      // Filter for contributions
      cy.get('button[data-cy="filter-button contributions"]').click();
      cy.wait(300);
      cy.get('[data-cy="transaction-sign"]').first().contains('-');

      // Check transaction details
      cy.get('[data-cy="transaction-item"]:first').as('firstItem');
      cy.get('@firstItem').find('a[href="/opensourced"]').should('exist');
      cy.get('@firstItem').find('a[href="/idonethis"]').should('exist');
      cy.get('@firstItem').find('[data-cy=transaction-description]').contains('monthly recurring subscription');
      cy.get('@firstItem')
        .find('[data-cy=transaction-details] > [data-cy=transaction-date]')
        .contains('September 18, 2017');
      cy.get('@firstItem').get('[data-cy=transaction-amount] > span').eq(0).contains('-');
      cy.get('@firstItem').get('[data-cy=transaction-amount] > span').eq(1).contains('$500.00');
      cy.get('@firstItem').get('[data-cy=transaction-amount] > span').eq(2).contains('USD');
    });
  });
});

describe('Create Organization Form', () => {
  it('should create a new organization with a new user', () => {
    const visitParams = { onBeforeLoad: mockRecaptcha };
    cy.visit('/signup/organization', visitParams);

    cy.get('[data-cy="create-organization-form"]').as('form');
    cy.get('@form').find('input[name="individual.name"]').type('John Malkovich');
    cy.get('@form').find('input[name="individual.email"]').type('john.malkovich@hotmail.com');
    cy.getByDataCy('tos-agreement-button').click();
    cy.getByDataCy('organization-country-trigger').click();
    cy.getByDataCy('organization-country-search').focus().type('Puerto');
    cy.getByDataCy('organization-country-list').find('[data-cy="organization-country-PR"]').click();

    cy.get('@form').find('input[name="organization.legalName"]').type('Cool Stuff Inc.');
    cy.get('@form').find('input[name="organization.name"]').type('Cool Stuff');
    cy.get('@form').find('input[name="organization.description"]').type('We do super cool stuff');
    cy.get('@form').find('button[data-cy="add-team-member"]').click();
    cy.get('@form').find('input[name="invitedAdmins.0.name"]').type('Leo');
    cy.get('@form').find('input[name="invitedAdmins.0.email"]').type('leo@opencollective.com');

    cy.get('@form').find('button[type="submit"]').click();
    cy.get('main').contains('Welcome, Cool Stuff!');
    cy.get('main').contains(
      "Your organization has been successfully created. We've sent you a confirmation email, please proceed from there!",
    );
  });

  it('should create a new organization using an existing user', () => {
    const visitParams = { onBeforeLoad: mockRecaptcha };
    cy.login({ redirect: '/signup/organization', visitParams });

    cy.get('[data-cy="create-organization-form"]').as('form');
    cy.getByDataCy('organization-country-trigger').click();
    cy.getByDataCy('organization-country-search').focus().type('Puerto');
    cy.getByDataCy('organization-country-list').find('[data-cy="organization-country-PR"]').click();

    cy.get('@form').find('input[name="organization.legalName"]').type('Cool Stuff 2 Inc.');
    cy.get('@form').find('input[name="organization.name"]').type('Cool Stuff 2');
    cy.get('@form').find('input[name="organization.description"]').type('We also do super cool stuff');

    cy.get('@form').find('button[type="submit"]').click();
    cy.get('main').contains('Welcome, Cool Stuff 2!');
    cy.get('main').contains('Your organization has been successfully created.');
  });
});
