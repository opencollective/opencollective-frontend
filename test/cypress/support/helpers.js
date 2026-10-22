import { flatten } from 'lodash-es';

/** Base URL of the API, as exposed in `cypress.config.js` */
export const getApiUrl = () => Cypress.expose('API_URL');

/** Query params for fixture requests sent directly to the API, to bypass its rate limiter like the former proxy did */
export const getApiKeyParams = () => ({ api_key: Cypress.expose('API_KEY') });

/** Helper to loop on specific test */
// keep for future use?
// ts-unused-exports:disable-next-line
export const repeatIt = (testName, count, func) => {
  const range = Array(count).fill();
  const tests = range.map((_, testNum) => it(`${testName} - ${testNum}`, func));
  describe(`${testName} - Loop result 🙏`, () => giveResult(tests));
};

/** Helper to loop on specific describe */
// keep for future use?
// ts-unused-exports:disable-next-line
export const repeatDescribe = (describeName, count, func) => {
  const range = Array(count).fill();
  const describes = range.map((_, testNum) => describe(`${describeName} - ${testNum}`, func));
  const tests = flatten(describes.map(d => d.tests));
  describe(`${describeName} - Loop result 🙏`, () => giveResult(tests));
};

const giveResult = tests => {
  it('Has a 100% success rate', () => {
    const successCount = tests.reduce((total, t) => (t.state !== 'failed' ? total + 1 : total), 0);
    const successRate = successCount / tests.length;
    cy.log(`Success rate: ${successCount}/${tests.length} (${successRate * 100}%)`);
    assert.equal(successRate, 1, 'Tests should never fail!');
  });
};
