import { escape, startCase, toUpper } from 'lodash';

export const formatAccountDetails = (
  payoutMethodData: Record<string, unknown>,
  { asSafeHTML = false } = {},
): string => {
  if (!payoutMethodData) {
    return '';
  }

  const separator = asSafeHTML ? '<br />' : '\n';
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

  const escapeValue = (value: unknown): string => {
    return asSafeHTML ? escape(String(value)) : String(value);
  };

  const renderObject = (object, prefix = '', isTopLevel = true) =>
    Object.entries(object)
      .sort(a => (typeof a[1] === 'object' ? 1 : -1))
      .reduce((acc, [key, value]) => {
        if (ignoredKeys.includes(key)) {
          return acc;
        }
        const formattedKey = formatKey(key);
        const escapedKey = asSafeHTML ? escape(formattedKey) : formattedKey;

        if (typeof value === 'object') {
          if (key === 'details') {
            return [...acc, ...renderObject(value, '', isTopLevel)];
          }
          const keyLabel = asSafeHTML && isTopLevel ? `<strong>${escapedKey}</strong>` : escapedKey;
          return [...acc, keyLabel, ...renderObject(value, '  ', false)];
        }

        const escapedValue = escapeValue(value);
        const keyLabel = asSafeHTML && isTopLevel ? `<strong>${escapedKey}</strong>` : escapedKey;
        return [...acc, `${prefix}${keyLabel}${escapedValue}`];
      }, []);

  const lines = renderObject(payoutMethodData);

  return lines.join(separator);
};
