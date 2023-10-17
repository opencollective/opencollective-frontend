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

    // ---- Percentage based ----

    // Defaults to 15%
    cy.contains('[data-cy="platform-tip-options"] button', '15%').should('have.class', 'selected');
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$3.00 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$23.00 USD');

    // Changing the amount changes the tip (because it's a percentage)
    cy.contains('[data-cy="amount-picker"] button', '$50').click();
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$7.50 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$57.50 USD');

    // Switch to the 10% percentage preset
    cy.contains('[data-cy="platform-tip-options"] button', '10%').click();
    cy.contains('[data-cy="platform-tip-options"] button', '10%').should('have.class', 'selected');
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$5.00 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$55.00 USD');

    // Changing the amount changes the tip
    cy.contains('[data-cy="amount-picker"] button', '$10').click();
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$1.00 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$11.00 USD');

    // Use a custom amount
    cy.contains('[data-cy="amount-picker"] button', 'Other').click();
    cy.get('input[name="custom-amount"]').type('{backspace}{backspace}');
    cy.get('[data-cy="platform-tip-options"] button').should('be.disabled'); // When empty, the tip input is disabled
    cy.get('input[name="custom-amount"]').type('12');
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$1.20 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$13.20 USD');

    // Stays percentage-based when switching to a fixed amount
    cy.contains('[data-cy="amount-picker"] button', '$10').click();
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$1.00 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$11.00 USD');

    // ---- Custom tip ----
    cy.contains('[data-cy="platform-tip-options"] button', 'Other').click();

    // Can empty
    cy.get('[data-cy="platform-tip-other-amount"]').type('{backspace}{backspace}{backspace}');
    cy.getByDataCy('ContributionSummary-Tip').should('not.exist');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$10.00 USD');

    // Can set some amount
    cy.get('[data-cy="platform-tip-other-amount"]').type('4.2');
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$4.20 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$14.20 USD');

    // Custom tip stays when changing amount
    cy.contains('[data-cy="amount-picker"] button', '$50').click();
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$4.20 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$54.20 USD');

    // Shows a warning if the tip is too high
    const confirmStub = cy.stub();
    confirmStub.returns(false); // Do not accept
    cy.on('window:confirm', confirmStub);
    cy.get('[data-cy="platform-tip-other-amount"]').type('{backspace}{backspace}{backspace}48');
    cy.getByDataCy('cf-next-step')
      .click()
      .then(() => {
        expect(confirmStub).to.be.calledOnce;
        expect(confirmStub).to.be.calledWith(
          'You are about to make a contribution of $98.00 to TestCollective that includes a $48.00 tip to the Open Collective platform. The tip amount looks unusually high.\n\nAre you sure you want to do this?',
        );
      });

    // ---- Opt out ----
    cy.contains('[data-cy="platform-tip-options"] button', 'No thank you').click();

    // Removes the tip
    cy.getByDataCy('ContributionSummary-Tip').should('not.exist');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$50.00 USD');

    // Stays opt-out when changing amount
    cy.contains('[data-cy="amount-picker"] button', '$10').click();
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
    cy.checkToast({ variant: 'success', message: 'Tier updated.' });
    cy.visit(`/${collective.slug}/contribute`);
    cy.get('[data-cy="contribute-btn"]:first').click();

    // Displayed by default (because the amount is not 0)
    cy.get('[data-cy="platform-tip-container"]').invoke('css', 'display').should('equal', 'block');
    cy.getByDataCy('ContributionSummary-Tip').should('contain', '$0.75 USD');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$5.75 USD');

    // But the tip disappears when the amount is 0
    cy.contains('[data-cy="amount-picker"] button', 'Other').click();
    cy.get('input[name="custom-amount"]').type('{backspace}{backspace}0');
    cy.get('[data-cy="platform-tip-container"]').invoke('css', 'display').should('equal', 'none');
    cy.getByDataCy('ContributionSummary-Tip').should('not.exist');
    cy.getByDataCy('ContributionSummary-TodaysCharge').should('contain', '$0.00 USD');
  });
});
