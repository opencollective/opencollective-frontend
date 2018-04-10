import { Then } from 'cucumber';
import { expect } from 'chai';

Then('{int} is zero', function(number) {
  expect(number).to.equal(0);
});
