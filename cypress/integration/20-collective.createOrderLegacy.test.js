describe('collective.createOrder page', () => {
  it('loads custom donate page', () => {
    cy.visit('/apex/donate?amount=50&interval=month&description=custom%20description');
    cy.get('.tier .description').contains('custom description');
    cy.get('.tier .amount').contains('$50');
    cy.get('.tier .amount').contains('per month');
  });

  it('makes an order logged out as a new user', () => {
    const email = `testuser+${Math.round(Math.random() * 1000000)}@gmail.com`;
    cy.visit('/apex/donate?test=e2e');
    cy.get(".inputField textarea[name='publicMessage']").type('public message');
    cy.fillInputField('email', email);
    cy.fillInputField('firstName', 'Xavier');
    cy.fillInputField('lastName', 'Damman');
    cy.fillInputField('website', 'http://xdamman.com');
    cy.fillInputField('twitterHandle', 'xdamman');
    cy.fillInputField('description', 'short description');
    cy.get('.submit button').click();
    cy.wait(6500);
    cy.location().should(location => {
      expect(location.search).to.match(
        /\?status=PAID&CollectiveId=[0-9]+&collectiveType=COLLECTIVE&OrderId=[0-9]+&totalAmount=5000&paymentMethodType=creditcard/,
      );
    });
    cy.get('p.thankyou');
    cy.get('.message').contains('apex');
  });

  it('makes an order logged out as a new user with a manual payment method', () => {
    const email = `testuser+${Math.round(Math.random() * 1000000)}@gmail.com`;
    cy.visit('/veganizerbxl/donate?amount=100');
    cy.get(".inputField textarea[name='publicMessage']").type('public message');
    cy.fillInputField('email', email);
    cy.fillInputField('firstName', 'Xavier');
    cy.fillInputField('lastName', 'Damman');
    cy.fillInputField('website', 'http://xdamman.com');
    cy.fillInputField('twitterHandle', 'xdamman');
    cy.fillInputField('description', 'short description');
    cy.get('select[name="paymentMethodTypeSelector"]').select('manual');
    cy.get('.manualPaymentMethod .instructions').contains(
      'Instructions to make the payment of €100.00 will be sent to your email address',
    );
    cy.get('.manualPaymentMethod .instructions').contains(
      'Your order will be pending until the funds have been received by the host (BrusselsTogether ASBL)',
    );
    cy.get('.submit button').click();
    cy.wait(1000);
    cy.location().should(location => {
      expect(location.search).to.match(
        /\?status=PENDING&CollectiveId=[0-9]+&collectiveType=COLLECTIVE&OrderId=[0-9]+&totalAmount=10000&paymentMethodType=manual/,
      );
    });
    cy.get('p.thankyou');
    cy.get('.message').contains(
      'Your donation is pending. Please follow the instructions in the confirmation email to manually pay the host of the collective.',
    );
  });

  it('makes an order logged out as a new user with a redirect url', () => {
    const email = `testuser+${Math.round(Math.random() * 1000000)}@gmail.com`;
    cy.visit('/apex/donate?test=e2e&redirect=http://localhost:3000/callback');
    cy.get(".inputField textarea[name='publicMessage']").type('public message');
    cy.fillInputField('email', email);
    cy.fillInputField('firstName', 'Xavier');
    cy.fillInputField('lastName', 'Damman');
    cy.fillInputField('website', 'http://xdamman.com');
    cy.fillInputField('twitterHandle', 'xdamman');
    cy.fillInputField('description', 'short description');
    cy.get('.submit button').click();
    cy.wait(2500);
    cy.get('.result .success').contains('Order processed successfully. Redirecting you to localhost...');
    cy.location().should(location => {
      expect(location.search).to.match(/\?transactionid=[0-9]+/);
    });
  });

  it('makes an order as a new organization', () => {
    const email = `testuser+${Math.round(Math.random() * 1000000)}@gmail.com`;
    cy.visit('/apex/donate');
    cy.get('.inputField.email input').type(email);
    cy.wait(400);
    cy.get('.actions .submit button').click();
    cy.get('.result .error').contains('Credit card missing');
    cy.get('.fromCollectiveSelector select')
      .select('organization')
      .blur();
    cy.wait(500);
    cy.get('.actions .submit button').click();
    cy.get('.result .error').contains('Please provide a name for the new organization');
    cy.get('.organizationDetailsForm .organization_name input')
      .type('new org')
      .blur();
    cy.wait(400);
    cy.get('.actions .submit button').click();
    cy.get('.result .error').contains('Please provide a website for the new organization');
    cy.get('.organizationDetailsForm .organization_website input').type('neworg.com');
    cy.wait(400);
    cy.get('.actions .submit button').click();
    cy.get('.result .error').contains('Credit card missing');
  });
});
