describe('Contribution Flow: contribute with platform tips', () => {
  let collective;

  before(() => {
    cy.createHostedCollectiveV2({
      testPayload: {
        data: { platformTips: true },
      },
    }).then(c => (collective = c));
  });

  it('can edit the tip on a regular contribution', () => {
    cy.visit(`/${collective.slug}/donate`);
    cy.contains('[data-cy="amount-picker"] button', '$20').should('have.attr', 'aria-pressed', 'true');

    // Register some aliases
    cy.get('[data-cy="PlatformTipInput"] [data-cy="select"]').as('tipSelect');

    // ---- Percentage based ----

    // Defaults to 15%
    cy.get('@tipSelect').should('contain', '$3.00 (15%)');
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$3.00 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$23.00 USD');

    // Changing the amount changes the tip (because it's a percentage)
    cy.contains('[data-cy="amount-picker"] button', '$50').click();
    cy.get('@tipSelect').should('contain', '$7.50 (15%)');
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$7.50 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$57.50 USD');

    // Switch to the 10% percentage preset
    cy.get('@tipSelect').click();
    cy.contains('[data-cy=select-option]', '$5.00 (10%)').click();
    cy.get('@tipSelect').should('contain', '$5.00 (10%)');
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$5.00 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$55.00 USD');

    // Changing the amount changes the tip
    cy.contains('[data-cy="amount-picker"] button', '$10').click();
    cy.get('@tipSelect').should('contain', '$1.00 (10%)');
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$1.00 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$11.00 USD');

    // Use a custom amount
    cy.contains('[data-cy="amount-picker"] button', 'Other').click();
    cy.get('input[name="custom-amount"]').type('{backspace}{backspace}');
    cy.get('@tipSelect').find('input').should('be.disabled'); // When empty, the tip input is disabled
    cy.get('input[name="custom-amount"]').type('12');
    cy.get('@tipSelect').should('contain', '$1.20 (10%)');
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$1.20 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$13.20 USD');

    // Stays percentage-based when switching to a fixed amount
    cy.contains('[data-cy="amount-picker"] button', '$10').click();
    cy.get('@tipSelect').should('contain', '$1.00 (10%)');
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$1.00 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$11.00 USD');

    // ---- Custom tip ----
    cy.get('@tipSelect').click();
    cy.contains('[data-cy=select-option]', 'Other').click();

    // Can empty
    cy.get('input[name="platformTip"]').type('{backspace}{backspace}{backspace}');
    cy.get('@tipSelect').should('contain', 'Other');
    cy.getByDataCy('ContributionSummary-Tip').should('not.exist');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$10.00 USD');

    // Can set some amount
    cy.get('input[name="platformTip"]').type('4.2');
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$4.20 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$14.20 USD');

    // Custom tip stays when changing amount
    cy.contains('[data-cy="amount-picker"] button', '$50').click();
    cy.get('@tipSelect').should('contain', 'Other');
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$4.20 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$54.20 USD');

    // Shows a warning if the tip is too high
    const confirmStub = cy.stub();
    confirmStub.returns(false); // Do not accept
    cy.on('window:confirm', confirmStub);
    cy.get('input[name="platformTip"]').type('{backspace}{backspace}{backspace}48');
    cy.getByDataCy('cf-next-step')
      .click()
      .then(() => {
        expect(confirmStub).to.be.calledOnce;
        expect(confirmStub).to.be.calledWith(
          'You are about to make a contribution of $50.00 to TestCollective, with a tip to the Open Collective platform of $48.00. The tip amount looks unusually high.\n\nAre you sure you want to do this?',
        );
      });

    // ---- Opt out ----
    cy.get('@tipSelect').click();
    cy.contains('[data-cy=select-option]', 'No thank you').click();

    // Removes the tip
    cy.get('@tipSelect').should('contain', 'No thank you');
    cy.getByDataCy('ContributionSummary-Tip').should('not.exist');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$50.00 USD');

    // Stays opt-out when changing amount
    cy.contains('[data-cy="amount-picker"] button', '$10').click();
    cy.get('@tipSelect').should('contain', 'No thank you');
    cy.getByDataCy('ContributionSummary-Tip').should('not.exist');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$10.00 USD');
  });

  it('Is not displayed when contribution amount is 0', () => {
    // Create a special tier to allow free contributions
    // TODO: Would be great to have that as a cypress command for that part, but there's no mutation to edit tiers on GQLV2 yet
    cy.login({ redirect: `/${collective.slug}/admin/tiers` });
    cy.getByDataCy('contribute-card-tier').first().find('button').click();
    cy.get('[data-cy="minimumAmount"]input').type('{backspace}{backspace}{backspace}0');
    cy.getByDataCy('confirm-btn').click();
    cy.checkToast({ type: 'SUCCESS', message: 'Tier updated.' });
    cy.visit(`/${collective.slug}/contribute`);
    cy.get('[data-cy="contribute-btn"]:first').click();

    // Register some aliases
    cy.get('[data-cy="PlatformTipInput"] [data-cy="select"]').as('tipSelect');

    // Displayed by default (because the amount is not 0)
    cy.get('@tipSelect').should('contain', '$0.75 (15%)');
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$0.75 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$5.75 USD');

    // But the tip disappears when the amount is 0
    cy.contains('[data-cy="amount-picker"] button', 'Other').click();
    cy.get('input[name="custom-amount"]').type('{backspace}{backspace}0');
    cy.getByDataCy('PlatformTipInput').invoke('css', 'display').should('equal', 'none');
    cy.getByDataCy('ContributionSummary-Tip').should('not.exist');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$0.00 USD');
  });
});
