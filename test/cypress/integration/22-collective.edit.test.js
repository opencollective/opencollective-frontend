import speakeasy from 'speakeasy';

import { randomEmail, randomSlug } from '../support/faker';

describe('edit collective', () => {
  let collectiveSlug = null;

  before(() => {
    cy.createHostedCollective({ name: 'CollectiveToEdit' }).then(({ slug }) => {
      collectiveSlug = slug;
    });
    // Give it a few ms to actually receive the email before we clean the inbox
    cy.wait(200);
    cy.clearInbox();
  });

  beforeEach(() => {
    cy.login({ redirect: `/${collectiveSlug}/admin` });
  });

  it('edit members', () => {
    const invitedUserEmail = randomEmail();

    // Add a new member by creating it inline with the collective picker
    cy.getByDataCy('menu-item-team').click();
    cy.wait(200);
    cy.getByDataCy('invite-member-btn').click();
    cy.wait(200);
    cy.getByDataCy('member-collective-picker').click();
    cy.getByDataCy('collective-type-picker-USER').click();
    cy.getByDataCy('create-collective-mini-form').then($form => {
      cy.wrap($form).find('input[name="email"]').type(invitedUserEmail);
      cy.wrap($form).find('input[name="name"]').type('AmazingNewUser');
      cy.wrap($form).find('button[type="submit"]').click();
    });
    cy.wait(200);
    cy.getByDataCy('create-collective-mini-form').should('not.exist'); // Wait for form to be submitted
    cy.getByDataCy('confirmation-modal-continue').click();
    cy.get('[data-cy="member-1"] [data-cy="member-pending-tag"]').should('exist');
    cy.getEmail(({ subject }) => subject.includes('Invitation to join CollectiveToEdit'));

    // Re-send the invitation email
    cy.clearInbox();
    cy.getByDataCy('resend-invite-btn').should('exist').first().click({ force: true });

    // Check invitation email
    cy.openEmail(({ subject }) => subject.includes('Invitation to join CollectiveToEdit'));
    cy.contains('Test User Admin just invited you to the role of Administrator of CollectiveToEdit on Open Collective');

    // Accept invitation as new user
    cy.login({ email: invitedUserEmail, redirect: `/member-invitations` });
    cy.getByDataCy('member-invitation-card').contains('CollectiveToEdit');
    cy.getByDataCy('member-invitation-accept-btn').click();

    // Should be redirected to the collective page and added to the team section
    cy.url().should('eq', `${Cypress.config().baseUrl}/${collectiveSlug}`);
    cy.contains('#section-our-team', 'AmazingNewUser');

    cy.visit(`/${collectiveSlug}/admin/team`);
    cy.get('[data-cy="member-1"]').find('[data-cy="member-pending-tag"]').should('not.exist');
    cy.getByDataCy('resend-invite-btn').should('not.exist');
  });

  it('edit info', () => {
    cy.get('.name.inputField input', { timeout: 10000 }).type(' edited');
    cy.get('.description.inputField input').type(' edited');
    cy.contains('Add social link').click();
    cy.focused().type('https://opencollective.com/');
    cy.contains('Add social link').click();
    cy.focused().type('https://twitter.com/opencollective');
    cy.contains('Add social link').click();
    cy.focused().type('https://github.com/opencollective');
    cy.wait(500);
    cy.get('.actions > [data-cy="collective-save"]').click(); // save changes
    cy.get('.backToProfile a').click(); // back to profile
    cy.wait(500);
    cy.get('[data-cy="collective-hero"] [data-cy="collective-title"]').contains('edited');
    cy.get('[data-cy="social-link-0"]').should('have.attr', 'href', 'https://opencollective.com/');
    cy.get('[data-cy="social-link-1"]').should('have.attr', 'href', 'https://twitter.com/opencollective');
    cy.get('[data-cy="social-link-2"]').should('have.attr', 'href', 'https://github.com/opencollective');
  });

  it('edit tiers', () => {
    cy.getByDataCy('menu-item-tiers').click();
    cy.getByDataCy('contribute-card-tier').should('have.length', 2);

    // Create a new fixed tier
    cy.getByDataCy('create-contribute-tier').click();
    cy.getByDataCy('confirm-btn').click();
    cy.get('input[name="name"]')
      .invoke('prop', 'validity')
      .should('deep.include', { valid: false, valueMissing: true });
    cy.getByDataCy('select-type').click();
    cy.contains('[data-cy=select-option]', 'product').click();
    cy.get('[data-cy=name]').click();
    cy.get('[data-cy=name]').type('Tshirt');
    cy.get('[data-cy=description]').type('Made with love');
    cy.getByDataCy('confirm-btn').click();
    cy.getByDataCy('edit-tier-modal-form').should('contain', 'This field is required');
    cy.get('input[data-cy=amount]').type('25.00');
    cy.get('input[data-cy=maxQuantity]').type('100');
    cy.get('input[data-cy=button]').type('Buy it!');
    cy.getByDataCy('confirm-btn').click();
    cy.checkToast({ type: 'SUCCESS', message: 'Tier created.' });
    cy.getByDataCy('contribute-card-tier').should('have.length', 3);

    // TODO: Also do the check below on the profile page (need https://github.com/opencollective/opencollective/issues/6331)
    cy.getByDataCy('contribute-card-tier')
      .last()
      .should('contain', 'Tshirt')
      .should('contain', 'LIMITED: 100 LEFT OUT OF 100') // FIXME Quantity is missing, see https://github.com/opencollective/opencollective/issues/6332
      .should('contain', 'Made with love')
      .should('contain', '$25 USD');

    // Edit it
    cy.getByDataCy('contribute-card-tier').last().find('button').click();
    cy.get('[data-cy=name]').click();
    cy.get('[data-cy=name]').type('{selectall}Potatoes');
    cy.get('[data-cy=description]').type('!');
    cy.get('[data-cy=amountType]').click();
    cy.contains('[data-cy=select-option]', 'Flexible').click();
    cy.get('.currency1.inputField input').type('{selectall}25');
    cy.get('.currency2.inputField input').type('{selectall}50');
    cy.getByDataCy('confirm-btn').click();
    cy.checkToast({ type: 'SUCCESS', message: 'Tier updated.' });
    cy.getByDataCy('contribute-card-tier')
      .last()
      .should('contain', 'Potatoes')
      .should('contain', 'LIMITED: 100 LEFT OUT OF 100') // FIXME Quantity is missing, see https://github.com/opencollective/opencollective/issues/6332
      .should('contain', 'Made with love!')
      .should('not.contain', '$25 USD'); // No amount displayed since there's no default nor minimum amounts set

    // TODO: Check profile page (need https://github.com/opencollective/opencollective/issues/6331)

    // Delete it
    cy.getByDataCy('contribute-card-tier').last().find('button').click();
    cy.getByDataCy('delete-btn').click();
    cy.getByDataCy('confirm-delete-btn').click();
    cy.checkToast({ type: 'SUCCESS', message: 'Tier deleted.' });

    // TODO: Check profile page (need https://github.com/opencollective/opencollective/issues/6331)
  });

  it('enables VAT', () => {
    cy.contains('[data-cy="country-select"]', 'Please select your country').click();
    cy.contains('[data-cy="select-option"]', 'Belgium').click();
    cy.getByDataCy('VAT').click();
    cy.contains('[data-cy="select-option"]', 'Use my own VAT number').click();
    cy.contains('button', 'Save').click();
    cy.contains('Saved');
    cy.visit(`${collectiveSlug}/admin/tiers`);
    cy.getByDataCy('contribute-card-tier').first().find('button').click();
    cy.getByDataCy('select-type').click();
    cy.contains('[data-cy=select-option]', 'product').click();
    cy.contains('[data-cy="edit-tier-modal-form"]:first', 'Value-added tax (VAT): 21%');
    // TODO save and make sure it's enabled
  });
});

describe('edit user collective', () => {
  it('adds two-factor authentication', () => {
    const userSlug = randomSlug();
    cy.signup({
      user: { name: userSlug, settings: { features: { twoFactorAuth: true } } },
      redirect: `/${userSlug}/admin`,
    });

    cy.getByDataCy('menu-item-user-security').click();
    cy.getByDataCy('qr-code').should('exist');
    cy.getByDataCy('manual-entry-2fa-token')
      .invoke('text')
      .then(text => {
        expect(text.trim()).to.have.lengthOf(117);
        const secret = text.split(':')[1].trim();
        // typing the wrong code fails
        cy.getByDataCy('add-two-factor-auth-totp-code-field').type('123456');
        cy.getByDataCy('add-two-factor-auth-totp-code-button').click();
        cy.getByDataCy('add-two-factor-auth-error').should('exist');
        // typing the right code passes
        const TOTPCode = speakeasy.totp({
          algorithm: 'SHA1',
          encoding: 'base32',
          secret,
        });
        cy.getByDataCy('add-two-factor-auth-totp-code-field').clear().type(TOTPCode);
        cy.getByDataCy('add-two-factor-auth-totp-code-button').click();
        cy.getByDataCy('recovery-codes-container').should('exist');
        cy.getByDataCy('recovery-codes-container').children().should('have.length', 6);
        cy.getByDataCy('add-two-factor-auth-confirm-recovery-codes-button').click();
        cy.getByDataCy('confirmation-modal-continue').click();
        cy.getByDataCy('add-two-factor-auth-success').should('exist');
      });
  });
});
