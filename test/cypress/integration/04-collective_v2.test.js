import { disableSmoothScroll } from '../support/helpers';
import { Sections } from '../../../components/collective-page/_constants';
import mockRecaptcha from '../mocks/recaptcha';

const scrollToSection = section => {
  // Wait for new collective page to load before disabling smooth scroll
  cy.contains('Become a financial contributor');
  disableSmoothScroll();
  cy.get(`#section-${section}`).scrollIntoView();
};

describe('New collective page', () => {
  let collectiveSlug = null;

  before(() => {
    cy.createHostedCollective()
      .then(({ slug }) => (collectiveSlug = slug))
      .then(() => cy.visit(`/${collectiveSlug}/v2`));
  });

  describe('Hero', () => {
    it.skip('Must have links to twitter, github and website', () => {
      // TODO
    });

    it.skip('Must have the fiscal host displayed', () => {
      // TODO
    });

    it.skip('Can change avatar', () => {
      // TODO
    });

    it.skip('Can edit primary color', () => {
      // TODO - must check hero or buttons CSS to ensure primary color is properly applied
    });

    it.skip('Can change cover background image', () => {
      // TODO
    });
  });

  describe('Contribute section', () => {
    it('Show tiers with default descriptions', () => {
      const oneTimeContributionMsg = 'Make a custom one time or recurring contribution to support this collective.';
      cy.contains('#section-contribute', 'Custom contribution');
      cy.contains('#section-contribute', 'Donation');
      cy.contains('#section-contribute', oneTimeContributionMsg);
      cy.contains('#section-contribute', 'backer');
      cy.contains('#section-contribute', 'Become a backer for $5.00 per month and help us sustain our activities!');
      cy.contains('#section-contribute', 'sponsor');
      cy.contains('#section-contribute', 'Become a sponsor for $100.00 per month and help us sustain our activities!');
    });

    it('Has a link to show all tiers', () => {
      cy.contains(`#section-contribute a[href="/${collectiveSlug}/contribute"]`, 'View all the ways to contribute');
    });

    it.skip('Has a link to create new tiers and events if admin', () => {
      // TODO
    });

    it.skip('Displays top contributors', () => {
      // TODO
    });
  });

  describe('Updates section', () => {
    it.skip('Has a link to create new update and one to view all updates', () => {
      // TODO
    });

    it.skip('Shows latest updates', () => {
      // TODO
    });
  });

  describe('Budget section', () => {
    it.skip('Shows latest transactions with amount and type (credit/debit)', () => {
      // TODO
    });

    it.skip('Has button to view all transactions and expenses', () => {
      // TODO
    });

    it.skip("Shows today's balance and estimated annual budget", () => {
      // TODO
    });
  });

  describe('Contributors section', () => {
    it.skip('Shows contributors with role, public message and total amount contributor', () => {
      // TODO
    });

    it.skip('Can filter contributors', () => {
      // TODO
    });
  });

  describe('About section', () => {
    it('Can add description to about section', () => {
      const richDescription = 'Hello world!{selectall}{ctrl}b';
      cy.login({ redirect: `/${collectiveSlug}/v2` });
      scrollToSection(Sections.ABOUT);
      cy.contains('#section-about button', 'Add a description').click();
      cy.get('#section-about [data-cy="RichTextEditor"] trix-editor').type(richDescription);
      cy.get('[data-cy="InlineEditField-Btn-Save"]').click();
      cy.get('[data-cy="longDescription"]').should('have.html', '<div><strong>Hello world!</strong></div>');
    });
  });
});

describe('New Collective page with euro currency', () => {
  before(() => {
    cy.visit('/brusselstogether/v2');
  });

  it('contributors amount in euro', () => {
    cy.get('[data-cy=ContributorsGrid_ContributorCard]')
      .first()
      .contains('€5,140 EUR');
  });
});

describe('Edit public message after contribution', () => {
  it('can edit public message', () => {
    cy.createHostedCollective().then(({ slug }) => {
      /** Make a donation by a new user */
      cy.signup({ redirect: `/${slug}/donate`, visitParams: { onBeforeLoad: mockRecaptcha } }).then(() => {
        // SECTION: Make a donation to the collective
        cy.contains('button', 'Next step').click();
        cy.wait(50);
        cy.contains('button', 'Next step').click();
        cy.wait(1000); // Wait for stripe to be loaded
        cy.fillStripeInput();
        cy.contains('button', 'Make contribution').click();
        cy.wait(1000); // It takes a little bit of time to create the order.
        // Wait for the popup to appear before moving to the collective page.
        cy.get('[data-cy=EditPublicMessagePopup]');

        // SECTION: Go to the collective page and change the public message
        cy.visit(`/${slug}/v2`);
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
