import models, { Op } from '../../models';
import { createDataLoaderWithOptions, sortResults } from './helpers';
import DataLoader from 'dataloader';

export default {
  findAllByAttribute: (_, cache) => (attribute: string): DataLoader<string | number, object> => {
    return createDataLoaderWithOptions(
      (values, attribute) => {
        return models.Comment.findAll({
          where: {
            [attribute]: { [Op.in]: values },
          },
          order: [['createdAt', 'DESC']],
        }).then(results => sortResults(values, results, attribute, []));
      },
      cache,
      attribute,
      'comments',
    );
  },
  countByExpenseId: (): DataLoader<number, number> =>
    new DataLoader(ExpenseIds =>
      models.Comment.count({
        attributes: ['ExpenseId'],
        where: { ExpenseId: { [Op.in]: ExpenseIds } },
        group: ['ExpenseId'],
      })
        .then(results => sortResults(ExpenseIds, results, 'ExpenseId', { count: 0 }))
        .map(result => result.count),
    ),
};
