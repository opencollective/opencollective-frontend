const notFoundSlug = 'a-collective-that-does-not-exist';
const notFoundURL = `/${notFoundSlug}/v2`;

it("fetching a collective page that doesn't exist returns a 404", () => {
  cy.request({ url: notFoundURL, failOnStatusCode: false }).then(resp => {
    expect(resp.status).to.eq(404);
  });
});

describe('the NotFound page when logged out', () => {
  before(() => {
    cy.visit(notFoundURL, { failOnStatusCode: false });
  });

  it('show the proper error message', () => {
    cy.get('[data-cy="not-found"]').contains('Not found');
  });

  it('has a nice comforting little buddy', () => {
    cy.get('[data-cy="not-found"]').should('contain', '¯\\\\_(ツ)_/¯');
  });

  it('includes a button to search for the collective', () => {
    cy.contains('Search for').should('contain', notFoundSlug).click();

    // Search page shows an error in tests and dev so we don't have an
    // observable element to watch, fallback on cy.wait
    cy.wait(1000);
    cy.location().should(location => {
      expect(location.pathname).to.equal('/search');
      expect(location.search).to.equal(`?q=${notFoundSlug}`);
    });
  });
});

describe('the NotFound page when logged in', () => {
  before(() => {
    cy.login({ redirect: notFoundURL });
  });

  it('has the user properly logged in', () => {
    cy.get('.LoginTopBarProfileButton-name').should('contain', 'testuseradmin');
  });
});
