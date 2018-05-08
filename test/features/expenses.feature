Feature: Pay expenses in kind

  Scenario: Create a donation expense but don't approve it
    Given a Collective "Webpack" with a host in "USD"
    And a User "Jane"
    When "Jane" expenses "50 USD" for "Pizza" to "Webpack" via "Donation"
    Then "Jane" should have contributed "0 USD" to "Webpack"

  Scenario: Approve a newly created donation expense
    Given a Collective "Buttercup" with a host in "USD"
    And a User "Chen"
    When "Chen" expenses "50 USD" for "Pizza" to "Buttercup" via "Donation"
    And expense for "Pizza" is approved by "Buttercup"
    And expense for "Pizza" is paid by "Buttercup"
    #Then "Chen" should have contributed "50 USD" to "Buttercup"
    #And "Buttercup" should have "0 USD" in their balance
