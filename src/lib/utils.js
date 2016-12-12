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

export { isValidEmail, formatCurrency };