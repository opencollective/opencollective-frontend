import chai from 'chai';
import chaiJestSnapshot from 'chai-jest-snapshot';
import chaiAsPromised from 'chai-as-promised';
import Sequelize from 'sequelize';
import { mapValues } from 'lodash';

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

// Chai plugins

const sortDeep = item => {
  if (Array.isArray(item)) {
    return item.sort();
  } else if (item && typeof item === 'object') {
    return mapValues(item, sortDeep);
  } else {
    return item;
  }
};

chai.util.addMethod(chai.Assertion.prototype, 'eqInAnyOrder', function equalInAnyOrder(b, m) {
  const a = this.__flags.object;
  const { negate, message } = this.__flags;

  const msg = m || message;

  if (negate) {
    new chai.Assertion(sortDeep(a), msg).to.not.deep.equal(sortDeep(b));
  } else {
    new chai.Assertion(sortDeep(a), msg).to.deep.equal(sortDeep(b));
  }
});

/**
 * Custom chai assertion to ensure that sequelize object is soft deleted
 */
chai.util.addProperty(chai.Assertion.prototype, 'softDeleted', async function() {
  // Make sure we are working with a sequelize model
  new chai.Assertion(this._obj).to.be.instanceOf(Sequelize.Model, 'softDeleted');

  // Check if `deletedAt` is set after reloading
  const promiseGetEntityDeletedAt = this._obj
    .reload({ paranoid: false })
    .then(updatedEntity => updatedEntity.dataValues.deletedAt);

  if (this.__flags.negate) {
    await new chai.Assertion(promiseGetEntityDeletedAt, 'Entity should not be deleted in DB').to.eventually.not.exist;
  } else {
    await new chai.Assertion(promiseGetEntityDeletedAt, 'Entity should be deleted in DB').to.eventually.exist;
  }
});
