describe('Pledges', () => {
  beforeEach(() => {
    cy.login({ redirect: `/pledges/new` });
  });

  describe('creating an individual pledge', () => {
    it('Create the pledge', () => {
      cy.get('[id=name]', { timeout: 200000 }).clear().type('samcaspus');
      cy.get('[id=slug]', { timeout: 200000 }).clear().type('opencollective');
      cy.get('[id=githubHandle]', { timeout: 200000 }).clear().type('opencollective/opencollective-frontend');
      cy.get('[id=publicMessage]', { timeout: 200000 }).clear().type('publicMessage');
      cy.get('[type="submit"]', { timeout: 200000 }).click();
      cy.get('span', { timeout: 200000 })
        .should('have.class', 'Text__P-sc-3suny7-0-span')
        .and('have.class', 'kTfuAH')
        .contains('$');
    });

    it('join an existing pledge individual pledge', () => {
      cy.get('[id=name]', { timeout: 200000 }).clear().type('samcaspus2');
      cy.get('[id=slug]', { timeout: 200000 }).clear().type('opencollective');
      cy.get('[id=githubHandle]', { timeout: 200000 }).clear().type('opencollective/opencollective-frontend');
      cy.get('[id=publicMessage]', { timeout: 200000 }).clear().type('publicMessage');
      cy.get('[type="submit"]', { timeout: 200000 }).click();
      cy.get('span', { timeout: 200000 })
        .should('have.class', 'Text__P-sc-3suny7-0-span')
        .and('have.class', 'kTfuAH')
        .contains('$');
    });
  });

  describe('check FAQ context in each pledge is valid or not', () => {
    it('verift what is pledge ?', () => {
      cy.get('.createPledge__Details-f3btza-0', { timeout: 200000 }).eq(0).click();
      cy.get('.createPledge__Details-f3btza-0', { timeout: 200000 })
        .eq(0)
        .contains(
          'A pledge allows supporters (companies and individuals) to pledge funds towards a collective that hasn’t been created yet. If you can’t find a collective you want to support, pledge to it!',
        );
    });
    it('verift what happends after i pledge ?', () => {
      cy.get('.createPledge__Details-f3btza-0', { timeout: 200000 }).eq(1).click();
      cy.get('.createPledge__Details-f3btza-0', { timeout: 200000 })
        .eq(1)
        .contains(
          'Once someone makes a pledge to a collective, we automatically create a pledged collective. We don’t spam folks, so please help us reach out to the community via twitter / github or, if you can, via email.',
        );
    });
    it('verift when do i pay?', () => {
      cy.get('.createPledge__Details-f3btza-0', { timeout: 200000 }).eq(2).click();
      cy.get('.createPledge__Details-f3btza-0', { timeout: 200000 })
        .eq(2)
        .contains('Once that pledged collective is claimed, we will email you to fulfill your pledge.');
    });
    it('verift what is pledge ?', () => {
      cy.get('.createPledge__Details-f3btza-0', { timeout: 200000 }).eq(3).click();
      cy.get('.createPledge__Details-f3btza-0', { timeout: 200000 })
        .eq(3)
        .contains(
          'You’ll need to authenticate with the github profile that owns / admins that project. Just click on the Claim Collective button in the pledged collective. We will be rolling out other forms of authentication in the future.',
        );
    });
  });
});
