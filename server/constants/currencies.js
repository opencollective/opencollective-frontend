// FX Rates as of 11/1/2016
export default {
  AUD: { fxrate: 1.31, format: value => `${value} AUD` },
  CAD: { fxrate: 1.33, format: value => `${value} CAD` },
  EUR: { fxrate: 0.92, format: value => `€${value}` },
  GBP: { fxrate: 0.82, format: value => `£${value}` },
  INR: { fxrate: 66.78, format: value => `₹${value}` },
  MXN: { fxrate: 18.49, format: value => `${value} MXN` },
  SEK: { fxrate: 8.93, format: value => `kr ${value}` },
  USD: { fxrate: 1, format: value => `$${value}` },
  UYU: { fxrate: 28.23, format: value => `$U ${value}` }
};