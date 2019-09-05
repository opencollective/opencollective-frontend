type CurrenciesMap = {
  [s: string]: {
    fxrate: Number;
    format: (value: string | Number) => string;
  };
};

// FX Rates as of 10/3/2017
const fxRates: CurrenciesMap = {
  AUD: { fxrate: 1.25, format: value => `${value} AUD` },
  CAD: { fxrate: 1.23, format: value => `${value} CAD` },
  EUR: { fxrate: 0.83, format: value => `€${value}` },
  GBP: { fxrate: 0.74, format: value => `£${value}` },
  INR: { fxrate: 64.29, format: value => `₹${value}` },
  MXN: { fxrate: 17.74, format: value => `${value} MXN` },
  SEK: { fxrate: 7.96, format: value => `kr ${value}` },
  USD: { fxrate: 1, format: value => `$${value}` },
  UYU: { fxrate: 29.17, format: value => `$U ${value}` },
};

export default fxRates;
