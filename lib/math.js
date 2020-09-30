/*
* Shortens a number to the abbreviated thousands, millions, billions, etc
* https://stackoverflow.com/a/40724354

* @param {number} number: value to shorten
* @returns {string|number}

* @example
* // return '12.3k'
* abbreviateNumber(12345, 1)
*/

const SI_PREFIXES = ['', 'k', 'M', 'G', 'T', 'P', 'E'];

export const abbreviateNumber = (number, precision = 0) => {
  // what tier? (determines SI prefix)
  const tier = (Math.log10(number) / 3) | 0;

  const round = value => {
    return precision === 0 ? Math.round(value) : value.toFixed(precision);
  };

  // if zero, we don't need a prefix
  if (tier == 0) {
    return round(number);
  }

  // get prefix and determine scale
  const scale = Math.pow(10, tier * 3);

  // scale the number
  const scaled = number / scale;

  return round(scaled) + SI_PREFIXES[tier];
};

export const floatAmountToCents = floatAmount => {
  if (isNaN(floatAmount) || floatAmount === null) {
    return floatAmount;
  } else {
    return Math.round(floatAmount * 100);
  }
};
