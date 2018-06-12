import chai from 'chai';
import chaiJestSnapshot from 'chai-jest-snapshot';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
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
