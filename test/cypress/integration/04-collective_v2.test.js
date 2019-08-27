/**
 * Disable css smooth scroll, that doesn't plays nice with cypress.
 * See https://github.com/cypress-io/cypress/issues/3200
 */
const disableSmoothScroll = () => {
  cy.document().then(document => {
    const node = document.createElement('style');
    node.innerHTML = 'html { scroll-behavior: inherit !important; }';
    document.body.appendChild(node);
  });
};

describe('New collective page', () => {
  let collectiveSlug = null;

  before(() => {
    cy.createHostedCollective()
      .then(({ slug }) => (collectiveSlug = slug))
      .then(() => cy.visit(`/${collectiveSlug}/v2`));
  });

  describe('Initial state for new collective', () => {
    it('Show tiers with default descriptions', () => {
      cy.contains('#section-contribute', 'Custom contribution');
      cy.contains('#section-contribute', 'Donation');
      cy.contains(
        '#section-contribute',
        'Make a custom one time or recurring contribution to support this collective.',
      );
      cy.contains('#section-contribute', 'backer');
      cy.contains('#section-contribute', 'Become a backer for $5.00 per month and help us sustain our activities!');
      cy.contains('#section-contribute', 'sponsor');
      cy.contains('#section-contribute', 'Become a sponsor for $100.00 per month and help us sustain our activities!');
    });

    it('Has a link to show all tiers', () => {
      cy.contains(`#section-contribute a[href="/${collectiveSlug}/contribute"]`, 'View all the ways to contribute');
    });
  });

  describe('Edit page as collective admin', () => {
    before(() => {
      cy.login({ redirect: `/${collectiveSlug}/v2` });
      // Wait for new collective page to load before disabling smooth scroll
      cy.contains('Become a financial contributor');
      disableSmoothScroll();
    });

    it('Can add description to about section', () => {
      const richDescription = 'Hello{selectall}{ctrl}B{rightarrow}{ctrl}B world!';
      cy.get('#section-about').scrollIntoView();
      cy.contains('#section-about button', 'Add your mission').click();
      cy.get('#section-about [data-cy="HTMLEditor"] .ql-editor').type(richDescription);
      cy.get('[data-cy="InlineEditField-Btn-Save"]').click();
      cy.get('[data-cy="longDescription"]').should('have.html', '<p><strong>Hello</strong> world!</p>');
    });
  });
});
