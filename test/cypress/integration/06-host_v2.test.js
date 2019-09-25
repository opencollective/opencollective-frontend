describe('New host page', () => {
  /**
   * About section is already tested in `04-collective_v2.test.js`
   */

  describe('Contributions section', () => {
    // The rest of the contributions section is already tested in `05-user_v2.test.js`
    it.skip('Show fiscally hosted collectives', () => {
      // TODO
    });
  });

  describe('Contributors section', () => {
    it.skip('Only shows core contributors without any filter', () => {
      // TODO
    });
  });

  describe('Transactions section', () => {
    // The rest of the transactions section tests are in `05-user_v2.test.js`
    it.skip("Has no filters (because hosts don't create expenses)", () => {
      // TODO
    });
  });
});
