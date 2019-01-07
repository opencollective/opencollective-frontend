import models from '../models';
import errors from '../lib/errors';
import { exportToPDF } from '../lib/utils';
import { getTransactions } from '../lib/transactions';
import moment from 'moment';

const envsAndDatabases = {
  development: 'opencollective_test',
  circleci: 'circle_test',
};

export const getTestUserLoginUrl = function(req, res, next) {
  if (envsAndDatabases[process.env.NODE_ENV]) {
    return models.User.findOne({
      where: { email: 'testuser@opencollective.com' },
    })
      .then(user => user.generateLoginLink(''))
      .then(link => link.replace('signin', 'login'))
      .then(link => res.redirect(link))
      .catch(next);
  }
  return next(
    new errors.BadRequest(`Unsupported NODE_ENV ${process.env.NODE_ENV} for retreiving test API login token`),
  );
};

export const exportPDF = function(req, res, next) {
  if (!envsAndDatabases[process.env.NODE_ENV]) {
    return next(new errors.BadRequest(`Unsupported NODE_ENV ${process.env.NODE_ENV} for testing export PDF`));
  }

  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const month = moment(d).format('MMMM');

  const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
  const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);

  console.log('startDate', startDate, 'endDate', endDate);

  const paper = req.query.papaer || 'Letter';
  const format = req.query.format || 'html';
  const wwcodeids = [
    '524',
    '47',
    '292',
    '275',
    '521',
    '525',
    '522',
    '262',
    '51',
    '295',
    '280',
    '283',
    '286',
    '510',
    '14',
    '515',
    '516',
    '518',
    '519',
    '520',
    '523',
    '512',
    '511',
    '513',
    '517',
    '59',
    '584',
    '299',
    '430',
    '48',
    '260',
    '261',
    '298',
    '272',
    '293',
    '273',
    '294',
    '263',
    '274',
    '276',
    '277',
    '301',
    '195',
    '241',
    '265',
    '297',
    '259',
    '266',
    '279',
    '267',
    '278',
    '12',
    '269',
    '270',
    '281',
    '10',
    '282',
    '3',
    '284',
    '264',
    '287',
    '268',
    '4',
    '300',
    '289',
    '13',
    '291',
    '285',
    '288',
    '271',
    '290',
    '15',
    '2',
  ];
  getTransactions(wwcodeids, startDate, endDate, {
    where: { type: 'DEBIT' },
    include: ['User', 'Expense', 'Collective'],
  }).then(transactions => {
    console.log('transactions', JSON.stringify(transactions));
    const data = {
      host: { name: 'WWCode', currency: 'USD' },
      year: new Date().getFullYear(),
      month,
    };
    let page = 1;
    let currentPage = 0;
    const transactionsPerTOCPage = 30; // number of transaction per page of the Table Of Content (for PDF export)
    const note = 'using fxrate of the day of the transaction as provided by the ECB. Your effective fxrate may vary.';
    data.expensesPerPage = [[]];
    data.totalPaidExpenses = transactions.length;
    data.transactions = transactions.map(t => {
      t.page = page++;
      t.collective = t.Collective;
      t.collective.shortSlug = t.collective.slug.replace(/^wwcode-?(.)/, '$1');
      t.privateMessage = t.Expense && t.Expense.privateMessage;
      if (t.data && t.data.fxrateSource) {
        t.privateMessage = t.privateMessage ? `${t.privateMessage} (${note})` : note;
        data.privateMessage = note;
      }
      if (page - (1 % transactionsPerTOCPage) === 0) {
        currentPage++;
        data.expensesPerPage[currentPage] = [];
      }
      data.expensesPerPage[currentPage].push(t);
      return t;
    });
    exportToPDF('expenses', data, { format, paper }).then(html => {
      if (format === 'pdf') {
        res.setHeader('content-type', 'application/pdf');
      }
      res.send(html);
    });
  });
};
