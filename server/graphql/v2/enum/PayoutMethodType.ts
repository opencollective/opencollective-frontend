import { PayoutMethodTypes } from '../../../models/PayoutMethod';
import { GraphQLEnumType } from 'graphql';

const PayoutMethodType = new GraphQLEnumType({
  name: 'PayoutMethodType',
  values: Object.keys(PayoutMethodTypes).reduce((values, key) => {
    return { ...values, [key]: { value: PayoutMethodTypes[key] } };
  }, {}),
});

export default PayoutMethodType;
