import chai from 'chai';
import chaiJestSnapshot from 'chai-jest-snapshot';
import chaiAsPromised from 'chai-as-promised';

// setting up NODE_ENV to test when running the tests.
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

chai.use(chaiAsPromised);
chai.use(chaiJestSnapshot);

before(() => {
  chaiJestSnapshot.resetSnapshotRegistry();
});

beforeEach(function() {
  chaiJestSnapshot.configureUsingMochaContext(this);
});
