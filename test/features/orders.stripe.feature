Feature: Place orders via Stripe

  Background:
    Given a Host "Open Source Collective" in "USD" and charges "5%" of fee
    And "Open Source Collective" connects a "Stripe" account
    And "Stripe" payment processor fee is "3%"
    And platform fee is "5%"

  Scenario: User makes a donation to Collective
    Given a Collective "Apex" in "USD" hosted by "Open Source Collective"
    And a User "Sherman"
    When "Sherman" donates "1000 USD" to "Apex" via "Stripe"
    Then "Apex" should have "870 USD" in their balance
    And "Sherman" should have "-1000 USD" in their balance

    # Host Fee:
    #And "Open Source Collective" should have "50 USD" in their balance
    # Platform Fee
    #And "Platform" should have "50 USD" in their balance
    # Payment Method Fee
    #And "Stripe" should have "30 USD" in their balance
