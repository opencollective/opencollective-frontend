import handlebars from 'handlebars';
import moment from 'moment-timezone';
import { resizeImage, capitalize, formatCurrencyObject, pluralize } from './utils';

// from https://stackoverflow.com/questions/8853396/logical-operator-in-a-handlebars-js-if-conditional
handlebars.registerHelper('ifCond', function(v1, operator, v2, options) {
  switch (operator) {
    case '==':
      return v1 == v2 ? options.fn(this) : options.inverse(this);
    case '===':
      return v1 === v2 ? options.fn(this) : options.inverse(this);
    case '!=':
      return v1 != v2 ? options.fn(this) : options.inverse(this);
    case '!==':
      return v1 !== v2 ? options.fn(this) : options.inverse(this);
    case '<':
      return v1 < v2 ? options.fn(this) : options.inverse(this);
    case '<=':
      return v1 <= v2 ? options.fn(this) : options.inverse(this);
    case '>':
      return v1 > v2 ? options.fn(this) : options.inverse(this);
    case '>=':
      return v1 >= v2 ? options.fn(this) : options.inverse(this);
    case '&&':
      return v1 && v2 ? options.fn(this) : options.inverse(this);
    case '||':
      return v1 || v2 ? options.fn(this) : options.inverse(this);
    default:
      return options.inverse(this);
  }
});

handlebars.registerHelper('sign', value => {
  if (value >= 0) {
    return '+';
  } else {
    return '';
  }
});

handlebars.registerHelper('toLowerCase', str => {
  if (!str) {
    return '';
  }
  return str.toLowerCase();
});

handlebars.registerHelper('increment', str => {
  if (isNaN(str)) {
    return '';
  }
  return `${Number(str) + 1}`;
});

const col = (str, size, trim = true) => {
  if (str.length >= size) {
    if (str.match(/[0-9]\.00$/)) {
      return col(str.replace(/\.00$/, ''), size, trim);
    }
    return trim ? `${str.substr(0, size - 1)}…` : str;
  }
  while (str.length < size) {
    str += ' ';
  }
  return str;
};

handlebars.registerHelper('col', (str, props) => {
  if (!str || !props) {
    return str;
  }
  const size = props.hash.size;
  return col(str, size);
});

handlebars.registerHelper('json', obj => {
  if (!obj) {
    return '';
  }
  return JSON.stringify(obj);
});

handlebars.registerHelper('moment', (value, props) => {
  const format = (props && props.hash.format) || 'MMMM Do YYYY';
  const d = moment(value);
  if (props && props.hash.timezone) {
    d.tz(props.hash.timezone);
  }
  return d.format(format);
});

handlebars.registerHelper('currency', (value, props) => {
  const { currency, precision, size, sign } = props.hash;

  if (isNaN(value)) {
    return '';
  }

  let res = (function() {
    if (!currency) {
      return value / 100;
    }
    value = value / 100; // converting cents

    let locale = 'en-US';
    if (currency === 'EUR') {
      locale = 'fr-FR';
    }

    return value.toLocaleString(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: precision || 0,
      maximumFractionDigits: precision || 0,
    });
  })();

  if (sign && value > 0) {
    res = `+${res}`;
  }
  // If we are limited in space, no need to show the trailing .00
  if (size && precision == 2) {
    res = res.replace(/\.00$/, '');
  }
  if (size) {
    res = col(`${res}`, size, false);
  }

  return res;
});

handlebars.registerHelper('number', (value, props) => {
  const { precision, currency } = props.hash;
  let locale = 'en-US';
  if (currency === 'EUR') {
    locale = 'fr-FR';
  }
  return value.toLocaleString(locale, {
    minimumFractionDigits: precision || 0,
    maximumFractionDigits: precision || 0,
  });
});

handlebars.registerHelper('resizeImage', (imageUrl, props) => resizeImage(imageUrl, props.hash));
handlebars.registerHelper('capitalize', str => capitalize(str));
handlebars.registerHelper('pluralize', (str, props) => pluralize(str, props.hash.n || props.hash.count));

handlebars.registerHelper('encodeURIComponent', str => {
  return encodeURIComponent(str);
});

handlebars.registerHelper('formatCurrencyObject', (obj, props) => formatCurrencyObject(obj, props.hash));

handlebars.registerHelper('debug', console.log);

export default handlebars;
