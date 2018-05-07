import { Then } from 'cucumber';
import { expect } from 'chai';

// This is the canary test of our test suite. If this test fails it
// means the test suite is broken, not the application.
//
// Since this step is not using the world object, it's fine to use an
// arrow function.
Then('{int} is zero', (number) => {
  expect(number).to.equal(0);
});
