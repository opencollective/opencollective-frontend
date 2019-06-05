import { expect } from 'chai';
import { SequelizeValidationError } from 'sequelize';
import models from '../server/models';
import * as utils from '../test/utils';

const { LegalDocument, User } = models;

describe('LegalDocument model', () => {
  const documentData = {};

  const users = [
    {
      username: 'xdamman',
      email: 'xdamman@opencollective.com',
    },
    {
      username: 'piamancini',
      email: 'pia@opencollective.com',
    },
  ];

  before(() => utils.resetTestDB());

  it('can be created', () => {
    return expect(models.LegalDocument.create({})).to.be.fulfilled;
  });
});
