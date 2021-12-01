import { CollectiveType } from '../../../lib/collective-sections';
import expenseTypes from '../../../lib/constants/expenseTypes';

export const checkRequiresAddress = values => {
  const collectiveTypesNotRequiringAddress = [
    CollectiveType.COLLECTIVE,
    CollectiveType.EVENT,
    CollectiveType.PROJECT,
    CollectiveType.FUND,
  ];
  const expenseTypesRequiringAddress = [expenseTypes.INVOICE, expenseTypes.FUNDING_REQUEST, expenseTypes.GRANT];

  return (
    values.payee &&
    (!collectiveTypesNotRequiringAddress.includes(values.payee.type) || values.payee.isHost) &&
    !values.payee.isInvite &&
    expenseTypesRequiringAddress.includes(values.type)
  );
};
