module.exports = {
  USD: value => `$${value}`,
  EUR: value => `€${value}`,
  GBP: value => `£${value}`,
  SEK: value => `kr ${value}`,
  UYU: value => `$U ${value}`,
  INR: value => `₹${value}`
};
