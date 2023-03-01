import { Sections } from '../../../components/collective-page/_constants';

import mockRecaptcha from '../mocks/recaptcha';

const scrollToSection = section => {
  // Wait for collective page to load before disabling smooth scroll
  cy.get('[data-cy=collective-page-main]');
  cy.get(`#section-${section}`).scrollIntoView();
};

const uploadImage = ({ dropzone, fileName }) => {
  const mimeType = 'image/'.concat(fileName.includes('.png') ? 'png' : 'jpeg');
  cy.get(dropzone).selectFile(
    {
      contents: `test/cypress/fixtures/images/${fileName}`,
      mimeType,
      fileName,
    },
    {
      action: 'drag-drop',
      force: true,
    },
  );

  cy.wait(900);
};

describe('Collective page', () => {
  let collectiveSlug = null;
  before(() => {
    cy.createHostedCollective({
      twitterHandle: 'testCollective',
      githubHandle: 'testCollective',
      website: 'opencollective.com/testCollective',
    })
      .then(({ slug }) => (collectiveSlug = slug))
      .then(() => cy.visit(`/${collectiveSlug}`));
  });

  beforeEach(() => {
    cy.login({ redirect: `/${collectiveSlug}` });
    cy.wait(900);
  });

  it('Should not have no-index meta', () => {
    // Wait for page to be loaded
    cy.getByDataCy('collective-title');
    cy.get('meta[name="robots"]').should('not.exist');
  });

  describe('Hero', () => {
    it('Must have links to twitter, github and website', () => {
      cy.get('[data-cy=twitterProfileUrl]').should('have.attr', 'href', 'https://twitter.com/testCollective');
      cy.get('[data-cy=repositoryUrl]').should('have.attr', 'href', 'https://github.com/testCollective');
      cy.get('[data-cy=collectiveWebsite]').should('have.attr', 'href', 'https://opencollective.com/testCollective');
    });

    it('Must have the fiscal host displayed', () => {
      cy.get('[data-cy=fiscalHostName]').contains('Open Source Collective');
    });

    it('Can change avatar', () => {
      const invalidResolutionMsg = 'Image resolution needs to be between 200x200 and 3000x3000';

      // Check size
      uploadImage({ dropzone: '[data-cy=heroAvatarDropzone]', fileName: 'small-15x15.jpg' });
      cy.contains('[data-cy="toast-notification"]', invalidResolutionMsg);

      // Valid avatar
      uploadImage({ dropzone: '[data-cy=heroAvatarDropzone]', fileName: 'gophercon.jpg' });
      cy.contains('[data-cy="toast-notification"]', invalidResolutionMsg).should('not.exist'); // Previous toast should be cleared out
      cy.get('[data-cy=collective-avatar-image-preview]').invoke('attr', 'src').should('not.be.empty');
      cy.get('[data-cy=heroAvatarDropzoneSave]').click();
    });

    it('Can edit primary color', () => {
      cy.get('[data-cy=edit-collective-display-features] [data-cy=edit-main-color-btn]').click();
      cy.get('[data-cy=collective-color-picker-card] [data-cy=collective-color-picker-options-btn]:first').click();
      cy.get('[data-cy=collective-color-picker-save-btn]').then($saveBtn => {
        cy.wrap($saveBtn).should('have.css', 'background-color', 'rgb(191, 40, 33)');
        cy.wrap($saveBtn).click();
      });
    });

    it('Can change cover background image', () => {
      cy.get('[data-cy=edit-collective-display-features] [data-cy=edit-cover-btn]').click();
      uploadImage({
        dropzone: '[data-cy=heroBackgroundDropzone]',
        fileName: 'gopherBack.png',
      });

      cy.get('[data-cy=collective-background-image-styledBackground]').within(() => {
        cy.get('img').invoke('attr', 'src').should('not.be.empty');
      });

      cy.get('[data-cy=heroBackgroundDropzoneSave]').click();
    });
  });

  describe('Contribute section', () => {
    it('Show tiers with default descriptions', () => {
      const oneTimeContributionMsg = 'Make a custom one-time or recurring contribution.';
      cy.contains('#section-contribute', 'Custom contribution');
      cy.contains('#section-contribute', 'Donation');
      cy.contains('#section-contribute', oneTimeContributionMsg);
      cy.contains('#section-contribute', 'backer');
      cy.contains('#section-contribute', 'Become a backer for $5.00 per month and support us');
      cy.contains('#section-contribute', 'sponsor');
      cy.contains('#section-contribute', 'Become a sponsor for $100.00 per month and support us');
    });

    it('Has a link to show all tiers', () => {
      cy.contains(`#section-contribute a[href="/${collectiveSlug}/contribute"]`, 'All ways to contribute');
    });

    it('Has a link to create new tiers and events if admin', () => {
      cy.get('[data-cy=create-contribute-tier]').should('be.visible');
      cy.get('[data-cy=create-event]').should('be.visible');
    });

    it('Displays top contributors', () => {
      scrollToSection(Sections.CONTRIBUTORS);
      cy.get('[data-cy=Contributors] [data-cy=ContributorsGrid_ContributorCard]').should('be.visible');
    });
  });

  describe('Updates section', () => {
    it('Has a link to create new update and one to view all updates', () => {
      scrollToSection(Sections.UPDATES);
      cy.get('[data-cy=create-new-update-btn]').click();
      cy.wait(3000);
      cy.get('[data-cy=edit-update-form]').within(() => {
        cy.get('[data-cy=titleInput]').type('Sample Update');
        cy.get('[data-cy="update-content-editor"] trix-editor').type('Hello World');
        cy.get('[data-cy=edit-update-submit-btn]').click();
      });
      cy.get('[data-cy=PublishUpdateBtn] button').click();
      cy.visit(`/${collectiveSlug}`);
      scrollToSection(Sections.UPDATES);
      cy.get('[data-cy=view-all-updates-btn]').should('be.visible');
    });

    it('Shows latest updates', () => {
      scrollToSection(Sections.UPDATES);
      cy.get('[data-cy=view-all-updates-btn]').click();
      cy.get('[data-cy=updatesList]').should('have.length', 1);
    });
  });

  describe('Contributors section', () => {
    it('Shows contributors with role, public message and total amount contributor', () => {
      cy.get('[data-cy=ContributorsGrid_ContributorCard]').then($contributorCard => {
        cy.wrap($contributorCard).should('have.length', 1);
        cy.wrap($contributorCard).contains('Admin');
      });
    });
  });

  describe('About section', () => {
    it('Can add description to about section', () => {
      const richDescription = 'Hello world!';
      scrollToSection(Sections.ABOUT);
      cy.contains('#section-about button', 'Add description').click();
      // {ctrl}b fails on macos
      // {ctrl} maps control key & {meta} maps command key
      const ctrlOrMetaKey = Cypress.platform === 'darwin' ? '{meta}' : '{ctrl}';
      cy.get('#section-about [data-cy="RichTextEditor"] trix-editor')
        .type(richDescription)
        .type('{selectall}')
        .type(`${ctrlOrMetaKey}b`);
      cy.get('[data-cy="InlineEditField-Btn-Save"]').click();
      cy.get('[data-cy="longDescription"]').should('have.html', '<div><strong>Hello world!</strong></div>');
    });
  });
});

describe('Collective page with euro currency', () => {
  beforeEach(() => {
    cy.visit('/brusselstogether');
  });

  it('contributors amount in euro', () => {
    cy.get('[data-cy=ContributorsGrid_ContributorCard]').first().contains('€5,140 EUR');
  });

  it('Can filter contributors', () => {
    cy.get('[data-cy=filters] [data-cy="filter-button all"]').should('be.visible');
    cy.get('[data-cy=filters] [data-cy="filter-button core"]').should('be.visible');
    cy.get('[data-cy=filters] [data-cy="filter-button financial"]').should('be.visible');
  });

  describe('Budget section', () => {
    it('Shows latest transactions with amount and type (credit/debit)', () => {
      scrollToSection(Sections.BUDGET);
      cy.get('[data-cy="transaction-item"] [data-cy=transaction-amount]')
        .first()
        .within($firstTransactionAmount => {
          cy.get('[data-cy=transaction-sign]').should('have.text', '+');
          cy.wrap($firstTransactionAmount).contains('€10.00');
        });
    });

    it('Has button to view all transactions and expenses', () => {
      scrollToSection(Sections.BUDGET);
      cy.get('[data-cy="section-budget"] [data-cy="filter-button expenses"]').click();
      cy.get('[data-cy="section-budget"] [data-cy=view-all-expenses-link]').should('be.visible');

      cy.get('[data-cy="section-budget"] [data-cy="filter-button transactions"]').click();
      cy.get('[data-cy="section-budget"] [data-cy=view-all-transactions-link]').should('be.visible');
    });
  });
});

describe('Edit public message after contribution', () => {
  it('can edit public message', () => {
    cy.createHostedCollective().then(({ slug }) => {
      /** Make a donation by a new user */
      cy.signup({ redirect: `/${slug}/donate`, visitParams: { onBeforeLoad: mockRecaptcha } }).then(() => {
        // SECTION: Make a donation to the collective
        cy.get('button[data-cy="cf-next-step"]').click();
        cy.wait(50);
        cy.get('button[data-cy="cf-next-step"]').click();
        cy.wait(2000); // Wait for stripe to be loaded
        cy.fillStripeInput();
        cy.contains('button', 'Contribute').click();
        cy.wait(1000); // It takes a little bit of time to create the order.
        // Wait for the order to succeed
        cy.getByDataCy('order-success', { timeout: 20000 });

        // SECTION: Go to the collective page and change the public message
        cy.visit(`/${slug}#${Sections.CONTRIBUTORS}`);
        /** Cypress can't find the public message text unless we do this.
         * Probably related to this issue: https://github.com/cypress-io/cypress/issues/695
         */
        cy.wait(1000);
        scrollToSection(Sections.CONTRIBUTORS);
        cy.get('[data-cy=ContributorCard_EditPublicMessageButton]').click();
        const publicMessage = 'Writing a long public message!';
        cy.get('[data-cy=EditPublicMessagePopup]').within(() => {
          cy.get('textarea').type(publicMessage);
          cy.get('[data-cy=EditPublicMessagePopup_SubmitButton]').click();
        });
        cy.get('[data-cy=EditPublicMessagePopup]').should('not.exist');
        cy.contains('[data-cy=ContributorsGrid_ContributorCard]', publicMessage);
        cy.reload();
        // Makes sure the cache in the backend was deleted.
        cy.contains('[data-cy=ContributorsGrid_ContributorCard]', publicMessage);
      });
    });
  });
});
