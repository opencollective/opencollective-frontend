const addTier = tier => {
  cy.get('.addTier').click();

  const fields = [
    { type: 'input', name: 'name' },
    { type: 'textarea', name: 'description' },
    { type: 'select', name: 'amountType' },
    { type: 'input', name: 'maxQuantity' },
    { type: 'input', name: 'amount' },
    { type: 'select', name: 'interval' },
  ];

  fields.map(field => {
    const action = field.type === 'select' ? 'select' : 'type';
    const value = action === 'type' ? `{selectall}${tier[field.name]}` : tier[field.name];
    cy.get(`.EditTiers .tier:last .${field.name}.inputField ${field.type}`)[action](value);
  });
};

describe('edit collective', () => {
  let collectiveSlug = null;

  before(() => {
    cy.createHostedCollective().then(({ slug }) => {
      collectiveSlug = slug;
    });
  });

  beforeEach(() => {
    cy.login({ redirect: `/${collectiveSlug}/edit` });
  });

  it('edit info', () => {
    cy.get('.name.inputField input', { timeout: 10000 }).type(' edited');
    cy.get('.description.inputField input').type(' edited');
    cy.get('.twitterHandle.inputField input').type('{selectall}opencollect');
    cy.get('.githubHandle.inputField input').type('{selectall}@AwesomeHandle');
    cy.get('.website.inputField input').type('{selectall}opencollective.com');
    cy.wait(500);
    cy.get('.actions > .btn').click(); // save changes
    cy.get('.backToProfile a').click(); // back to profile
    cy.wait(500);
    cy.get('[data-cy="collective-hero"] [data-cy="collective-title"]').contains('edited');
    cy.get('[data-cy="collective-hero"] [title="Twitter"][href="https://twitter.com/opencollect"]');
    cy.get('[data-cy="collective-hero"] [title="Github"][href="https://github.com/AwesomeHandle"]');
    cy.get('[data-cy="collective-hero"] [title="Website"][href="https://opencollective.com"]');
  });

  it('edit tiers', () => {
    cy.getByDataCy('menu-item-tiers').click();
    cy.get('.EditTiers .tier:first .name.inputField input').type('{selectall}Backer edited');
    cy.get('.EditTiers .tier:first .description.inputField textarea').type('{selectall}New description for backers');
    cy.get('.EditTiers .tier:first .amount.inputField input').type('{selectall}5');
    cy.get('.EditTiers .tier:first .amountType.inputField select').select('FLEXIBLE');
    cy.get('.EditTiers .tier:first .currency1.inputField input').type('{selectall}5');
    cy.get('.EditTiers .tier:first .currency2.inputField input').type('{selectall}10');
    cy.get('.EditTiers .tier:first .currency3.inputField input').type('{selectall}20');
    cy.get('.EditTiers .tier:first .minimumAmount.inputField input').type('{selectall}5');
    cy.get('.EditTiers .tier:first .currency0.inputField input').type('{selectall}{backspace}');
    addTier({
      name: 'Donor (one time donation)',
      type: 'DONATION',
      amount: 500,
      amountType: 'FIXED',
      interval: 'onetime',
      description: 'New description for donor',
    });
    addTier({
      type: 'SERVICE',
      name: 'Priority Support',
      description: 'Get priority support from the core contributors',
      amount: 1000,
      amountType: 'FIXED',
      interval: 'month',
      maxQuantity: 10,
    });
    cy.wait(500);
    cy.get('.actions > .btn').click(); // save changes
    cy.get('.backToProfile a').click(); // back to profile
    const tierCardSelector = '[data-cy="financial-contributions"] [data-cy="contribute-card-tier"]';
    cy.disableSmoothScroll();
    cy.get(tierCardSelector, { timeout: 5000 });
    cy.screenshot('tierEdited');
    cy.get(tierCardSelector)
      .first()
      .find('[data-cy="contribute-title"]')
      .contains('Backer edited');
    cy.get(tierCardSelector)
      .first()
      .find('[data-cy="contribute-description"]')
      .contains('New description for backers');
    cy.get(tierCardSelector)
      .first()
      .contains('$5 USD / month');
    cy.screenshot('tierAdded');
    cy.get(tierCardSelector)
      .should('have.length', 4)
      .last()
      .should('contain', 'Priority Support');
    cy.get(tierCardSelector)
      .first()
      .find('[data-cy="contribute-btn"]')
      .click();

    // Ensure the new tiers are properly displayed on order form
    cy.contains('button', 'Next step', { timeout: 20000 }).click();
    cy.get('#interval').contains('Monthly');
    cy.get('#amount > button').should('have.length', 3);

    cy.visit(`/${collectiveSlug}/edit/tiers`);
    cy.get('.EditTiers .tier')
      .first()
      .find('.amountType select')
      .select('FIXED');
    cy.get('.EditTiers .tier')
      .last()
      .find('.removeTier')
      .click();
    cy.get('.EditTiers .tier')
      .last()
      .find('.removeTier')
      .click();
    cy.wait(500);
    cy.get('.actions > .btn').click(); // save changes
    cy.get('.backToProfile a').click(); // back to profile
    cy.wait(500);
    cy.get(tierCardSelector, { timeout: 10000 }).should('have.length', 2);
  });
});
