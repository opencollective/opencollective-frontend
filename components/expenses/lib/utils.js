import { CollectiveType } from '../../../lib/collective-sections';
import expenseTypes from '../../../lib/constants/expenseTypes';

export const checkRequiresAddress = values => {
  const collectiveTypesRequiringAddress = [CollectiveType.INDIVIDUAL, CollectiveType.USER, CollectiveType.ORGANIZATION];
  const expenseTypesRequiringAddress = [expenseTypes.INVOICE, expenseTypes.FUNDING_REQUEST, expenseTypes.GRANT];

  return (
    values.payee &&
    (collectiveTypesRequiringAddress.includes(values.payee.type) || values.payee.isHost) &&
    !values.payee.isInvite &&
    expenseTypesRequiringAddress.includes(values.type)
  );
};
