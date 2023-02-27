describe('Accept financial contributions flow', () => {
  describe('Myself', () => {
    let collectiveSlug;

    beforeEach(() => {
      cy.login();
      return cy.createHostedCollective({ type: 'COLLECTIVE' }).then(collective => {
        collectiveSlug = collective.slug;
      });
    });

    it.skip('Can add bank account info and self host', () => {
      cy.visit(`/${collectiveSlug}/accept-financial-contributions`);
      cy.getByDataCy('afc-picker-myself-button').click();
      cy.getByDataCy('afc-add-bank-button').click();
      cy.getByDataCy('afc-add-bank-info-submit').click();
      cy.url().should('include', '/myself/bank');
      cy.getByDataCy('afc-add-bank-info-field').type('Some bank info here');
      cy.getByDataCy('afc-add-bank-info-submit').click();
      cy.url().should('include', '/success');
      cy.getByDataCy('afc-success-host-settings-link')
        .should('have.attr', 'href')
        .and('include', '/testuseradmin/admin/fiscal-hosting');
    });

    it.skip('Knows if bank account info is already added and can self host', () => {
      cy.visit(`/${collectiveSlug}/accept-financial-contributions/myself`);
      cy.getByDataCy('afc-finish-button').click();
      cy.url().should('include', '/success');
      cy.getByDataCy('afc-success-host-tiers-link')
        .should('have.attr', 'href')
        .and('include', `/${collectiveSlug}/admin/tiers`);
    });
  });

  describe('Organization', () => {
    let collectiveSlug;

    beforeEach(() => {
      cy.login();
      return cy.createHostedCollective({ type: 'COLLECTIVE' }).then(collective => {
        collectiveSlug = collective.slug;
      });
    });

    it.skip('Hosts with an already created org', () => {
      cy.visit(`/${collectiveSlug}/accept-financial-contributions`);
      cy.getByDataCy('afc-picker-organization-button').click();
      cy.getByDataCy('afc-organization-org-card').contains('Brussels').click();
      cy.getByDataCy('afc-finish-button').click();
      cy.getByDataCy('afc-success-host-settings-link')
        .should('have.attr', 'href')
        .and('include', '/brusselstogetherasbl/admin/fiscal-hosting');
    });

    it.skip('Creates an org and then hosts with it', () => {
      cy.visit(`/${collectiveSlug}/accept-financial-contributions/organization`);
      cy.getByDataCy('afc-organization-create-new').click();
      cy.getByDataCy('mini-form-name-field').type('3 Bees');
      cy.getByDataCy('mini-form-website-field').type('3bees.com');
      cy.getByDataCy('mini-form-save-button').click();
      cy.getByDataCy('afc-add-bank-button').click();
      cy.getByDataCy('afc-add-bank-info-field').type('Some bank info here');
      cy.getByDataCy('afc-add-bank-info-submit').click();
      cy.url().should('include', '/success');
      cy.getByDataCy('afc-success-host-settings-link')
        .should('have.attr', 'href')
        .and('include', '/3-bees/admin/fiscal-hosting');
    });
  });

  describe('Apply to fiscal host', () => {
    let collectiveSlug;

    beforeEach(() => {
      cy.login();
      return cy.createHostedCollective({ type: 'COLLECTIVE' }).then(collective => {
        collectiveSlug = collective.slug;
      });
    });
    it('Successfully applies to a host', () => {
      cy.visit(`/${collectiveSlug}/accept-financial-contributions`);
      cy.getByDataCy('afc-picker-host-button').click();
      cy.getByDataCy('afc-host-collective-card').should('have.length', 5);
      cy.get(':nth-child(2) > [data-cy="afc-host-collective-card"]').within(() => {
        cy.getByDataCy('afc-host-apply-button').click();
      });
      cy.contains('BrusselsTogether is a platform for the new generation of associations transparent by design.');
      cy.getByDataCy('host-apply-modal-next').click();
      cy.getByDataCy('afc-host-submit-button').click();
      cy.url().should('include', '/success');
      cy.contains('You have applied to be hosted by BrusselsTogether ASBL');
      cy.getByDataCy('afc-success-host-settings-link').should('not.exist');
    });
  });
});
