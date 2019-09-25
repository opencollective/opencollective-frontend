import { flatten } from 'lodash';

/** Helper to loop on specific test */
export const repeatIt = (testName, count, func) => {
  const range = Array(count).fill();
  const tests = range.map((_, testNum) => it(`${testName} - ${testNum}`, func));
  describe(`${testName} - Loop result 🙏`, () => giveResult(tests));
};

/** Helper to loop on specific describe */
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

/**
 * Disable css smooth scroll, that doesn't plays nice with cypress.
 * See https://github.com/cypress-io/cypress/issues/3200
 */
export const disableSmoothScroll = () => {
  cy.document().then(document => {
    const node = document.createElement('style');
    node.innerHTML = 'html { scroll-behavior: inherit !important; }';
    document.body.appendChild(node);
  });
};
