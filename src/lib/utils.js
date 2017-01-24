import filter from 'lodash/filter';
import values from 'lodash/values';

function isValidEmail(email) {
  return (email.match(/.+@.+\..+/));
}

function formatCurrency(amount, currency = 'USD') {
  if (!amount) return 'free';
  amount = amount / 100;
  return amount.toLocaleString(currency, {
    style: 'currency',
    currency,
    minimumFractionDigits : 0,
    maximumFractionDigits : 2
  })
};

function filterCollection(collection, validator) {
  return filter(values(collection), validator);
}

export { isValidEmail, formatCurrency, filterCollection };