describe('Accept financial contributions flow', () => {
  //   describe('Myself', () => {
  //     let collectiveSlug;

  //     beforeEach(() => {
  //       cy.login();
  //       return cy.createHostedCollective({ type: 'COLLECTIVE' }).then(collective => {
  //         collectiveSlug = collective.slug;
  //       });
  //     });

  //     it('Can add bank account info and self host', () => {
  //       cy.visit(`/${collectiveSlug}/accept-financial-contributions`);
  //       cy.getByDataCy('afc-picker-myself-button').click();
  //       cy.getByDataCy('afc-add-bank-button').click();
  //       cy.getByDataCy('afc-add-bank-info-submit').click();
  //       cy.url().should('include', '/myself/bank');
  //       cy.getByDataCy('afc-add-bank-info-field').type('Some bank info here');
  //       cy.getByDataCy('afc-add-bank-info-submit').click();
  //       cy.url().should('include', '/success');
  //       cy.getByDataCy('afc-success-host-settings-link')
  //         .should('have.attr', 'href')
  //         .and('include', '/testuseradmin/edit/fiscal-hosting');
  //     });

  //     it('Knows if bank account info is already added and can self host', () => {
  //       cy.visit(`/${collectiveSlug}/accept-financial-contributions/myself`);
  //       cy.getByDataCy('afc-finish-button').click();
  //       cy.url().should('include', '/success');
  //       cy.getByDataCy('afc-success-host-tiers-link')
  //         .should('have.attr', 'href')
  //         .and('include', `/${collectiveSlug}/edit/tiers`);
  //     });
  //   });

  describe('Organization', () => {
    let collectiveSlug;

    beforeEach(() => {
      cy.login();
      return cy.createHostedCollective({ type: 'COLLECTIVE' }).then(collective => {
        collectiveSlug = collective.slug;
      });
    });

    it('Hosts with an already created org', () => {
      cy.visit(`/${collectiveSlug}/accept-financial-contributions`);
      cy.getByDataCy('afc-picker-organization-button').click();
      cy.getByDataCy('afc-organization-org-card').contains('Brussels').click();
      cy.getByDataCy('afc-finish-button').click();
      cy.getByDataCy('afc-success-host-settings-link')
        .should('have.attr', 'href')
        .and('include', '/brusselstogetherasbl/edit/fiscal-hosting');
    });

    it('Creates an org and then hosts with it', () => {
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
        .and('include', '/3-bees/edit/fiscal-hosting');
    });
  });

  //   describe('Apply to fiscal host', () => {
  //     it.skip('', () => {
  //       // test here
  //     });
  //   });
});
