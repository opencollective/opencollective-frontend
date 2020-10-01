import speakeasy from 'speakeasy';

import { randomEmail } from '../support/faker';

const isNewContributionFlow = Cypress.env('NEW_CONTRIBUTION_FLOW');

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
    cy.createHostedCollective({ name: 'CollectiveToEdit' }).then(({ slug }) => {
      collectiveSlug = slug;
    });
  });

  beforeEach(() => {
    cy.login({ redirect: `/${collectiveSlug}/edit` });
  });

  it('edit members', () => {
    const invitedUserEmail = randomEmail();

    // Add a new member by creating it inline with the collective picker
    cy.getByDataCy('menu-item-members').click();
    cy.getByDataCy('add-member-btn').click();
    cy.get('[data-cy="member-1"] [data-cy="member-collective-picker"]').click();
    cy.getByDataCy('collective-type-picker-USER').click();
    cy.getByDataCy('create-collective-mini-form').then($form => {
      cy.wrap($form).find('input[name="email"]').type(invitedUserEmail);
      cy.wrap($form).find('input[name="name"]').type('AmazingNewUser');
      cy.wrap($form).find('button[type="submit"]').click();
    });
    cy.getByDataCy('create-collective-mini-form').should('not.exist'); // Wait for form to be submitted
    cy.getByDataCy('save-members-btn').click();
    cy.get('[data-cy="member-1"] [data-cy="member-pending-tag"]').should('exist');

    // Check invitation email
    cy.openEmail(({ subject }) => subject.includes('Invitation to join CollectiveToEdit'));
    cy.contains('Test User Admin just invited you to join CollectiveToEdit with the role "Administrator"');

    // Accept invitation as new user
    cy.login({ email: invitedUserEmail, redirect: `/member-invitations` });
    cy.getByDataCy('member-invitation-card').contains('CollectiveToEdit');
    cy.getByDataCy('member-invitation-accept-btn').click();
    cy.getByDataCy('member-invitation-card').contains('Accepted');
    cy.visit(`/${collectiveSlug}/edit/members`);
    cy.get('[data-cy="member-1"]').find('[data-cy="member-pending-tag"]').should('not.exist');
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
    cy.contains('.actions > .btn', 'Saved');
    cy.get('.backToProfile a').click(); // back to profile
    const tierCardSelector = '[data-cy="admin-contribute-cards"] [data-cy="contribute-card-tier"]';
    cy.disableSmoothScroll();
    cy.get(tierCardSelector);
    cy.get(tierCardSelector).first().find('[data-cy="contribute-title"]').contains('Backer edited');
    cy.get(tierCardSelector).first().find('[data-cy="contribute-description"]').contains('New description for backers');
    cy.get(tierCardSelector).first().contains('$5 USD / month');
    cy.get(tierCardSelector).should('have.length', 4).last().should('contain', 'Priority Support');
    cy.get(tierCardSelector).first().find('[data-cy="contribute-btn"]').click();

    if (!isNewContributionFlow) {
      // Skip the step profile on the old contribution flow
      cy.contains('button', 'Next step', { timeout: 20000 }).click();
    }

    // Ensure the new tiers are properly displayed on order form
    cy.get('#interval').contains('Monthly');
    cy.get('#amount > button').should('have.length', 4); // 3 presets + "Other"

    cy.visit(`/${collectiveSlug}/edit/tiers`);
    cy.get('.EditTiers .tier').first().find('.amountType select').select('FIXED');
    cy.get('.EditTiers .tier').last().find('.removeTier').click();
    cy.get('.EditTiers .tier').last().find('.removeTier').click();
    cy.wait(500);
    cy.get('.actions > .btn').click(); // save changes
    cy.contains('.actions > .btn', 'Saved');
    cy.get('.backToProfile a').click(); // back to profile
    cy.get(tierCardSelector).should('have.length', 2);
  });
});

describe('edit user collective', () => {
  let user = null;
  let secret;
  let TOTPCode;

  before(() => {
    cy.signup({ user: { settings: { features: { twoFactorAuth: true } } }, redirect: `/` }).then(u => (user = u));
  });

  it('adds two-factor authentication', () => {
    cy.visit(`/${user.collective.slug}/edit`).then(() => {
      cy.getByDataCy('menu-item-two-factor-auth').click();
      cy.getByDataCy('qr-code').should('exist');
      cy.getByDataCy('manual-entry-2fa-token')
        .invoke('text')
        .then(text => {
          expect(text.trim()).to.have.lengthOf(117);
          secret = text.split(':')[1].trim();
          // typing the wrong code fails
          cy.getByDataCy('add-two-factor-auth-totp-code-field').type('123456');
          cy.getByDataCy('add-two-factor-auth-totp-code-button').click();
          cy.getByDataCy('add-two-factor-auth-error').should('exist');
          // typing the right code passes
          TOTPCode = speakeasy.totp({
            algorithm: 'SHA1',
            encoding: 'base32',
            secret,
          });
          cy.getByDataCy('add-two-factor-auth-totp-code-field').clear().type(TOTPCode);
          cy.getByDataCy('add-two-factor-auth-totp-code-button').click();
          cy.getByDataCy('add-two-factor-auth-success').should('exist');
        });
    });
  });
});
