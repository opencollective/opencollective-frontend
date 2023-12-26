describe('Internationalization', () => {
  it('Can switch language from the footer', () => {
    cy.visit('/');
    cy.getByDataCy('language-switcher').click();
    cy.contains('[data-cy="language-option"]', 'French').click();
    // Let's not make too much assumptions on the translation as they can easily change.
    // `Collectif` is the way we translate `Collective` in French and the word doesn't
    // exist in English, so it should be safe to look for that on the home page.
    cy.contains('Collectif');
  });
});
