import { centsAmountToFloat, floatAmountToCents } from '../../lib/currency-utils';

export const ContributionFlowUrlParameters = {
  amount: { type: 'amount' },
  platformContribution: { type: 'amount' },
  quantity: { type: 'integer' },
  interval: { type: 'interval' },
};

export const decodeContributionFlowQuery = query => {
  const decoded = {};
  Object.keys(ContributionFlowUrlParameters).forEach(key => {
    const param = ContributionFlowUrlParameters[key];
    const value = query[key];
    if (value) {
      if (param.type === 'amount') {
        decoded[key] = !value ? null : floatAmountToCents(parseFloat(value));
      } else if (param.type === 'integer') {
        decoded[key] = !value ? null : parseInt(value);
      } else if (param.type === 'interval') {
        const cleanStr = value?.trim()?.replace('ly', '');
        if (['month', 'year'].includes(cleanStr)) {
          decoded[key] = cleanStr;
        }
      } else {
        decoded[key] = value;
      }
    }
  });

  return decoded;
};

export const encodeContributionFlowQuery = query => {
  const encoded = {};
  Object.keys(query).forEach(key => {
    const param = ContributionFlowUrlParameters[key];
    if (!param) {
      return;
    }

    const value = query[key];
    if (param.type === 'amount') {
      encoded[key] = centsAmountToFloat(value);
    } else {
      encoded[key] = value;
    }
  });

  return encoded;
};
