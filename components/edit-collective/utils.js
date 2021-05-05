import { startCase, toUpper } from 'lodash';

export const formatAccountDetails = payoutMethodData => {
  const ignoredKeys = ['type', 'isManualBankTransfer', 'currency'];
  const labels = {
    abartn: 'Routing Number: ',
    firstLine: '',
  };

  const formatKey = s => {
    if (labels[s] !== undefined) {
      return labels[s];
    }
    if (toUpper(s) === s) {
      return `${s}: `;
    }
    return `${startCase(s)}: `;
  };

  const renderObject = (object, prefix = '') =>
    Object.entries(object)
      .sort(a => (typeof a[1] == 'object' ? 1 : -1))
      .reduce((acc, [key, value]) => {
        if (ignoredKeys.includes(key)) {
          return acc;
        }
        if (typeof value === 'object') {
          if (key === 'details') {
            return [...acc, ...renderObject(value, '')];
          }
          return [...acc, formatKey(key), ...renderObject(value, '  ')];
        }
        return [...acc, `${prefix}${formatKey(key)}${value}`];
      }, []);

  const lines = renderObject(payoutMethodData);

  return lines.join('\n');
};
