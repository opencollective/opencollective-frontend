import chai from 'chai';
import chaiJestSnapshot from 'chai-jest-snapshot';

chai.use(chaiJestSnapshot);

before(() => {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }
  chaiJestSnapshot.resetSnapshotRegistry();
});

beforeEach(function() {
  chaiJestSnapshot.configureUsingMochaContext(this);
});
