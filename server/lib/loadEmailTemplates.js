const fs = require('fs');
const moment = require('moment');
const handlebars = require('handlebars');
const currencies = require('../constants/currencies');

/*
* Loads all the email templates
*/
module.exports = () => {

  var templates = {};

  const templateNames = [
    'github.signup',
    'group.expense.created',
    'group.donation.created',
    'group.monthlyreport',
    'thankyou',
    'thankyou.wwcode',
    'thankyou.ispcwa',
    'thankyou.fr',
    'thankyou.laprimaire',
    'user.forgot.password',
    'user.new.token'
  ];

  const templatesPath = `${__dirname}/../../templates`;

  // Register partials
  const header = fs.readFileSync(`${templatesPath}/partials/header.hbs`, 'utf8');
  const footer = fs.readFileSync(`${templatesPath}/partials/footer.hbs`, 'utf8');
  const subscriptions = fs.readFileSync(`${templatesPath}/partials/subscriptions.hbs`, 'utf8');

  handlebars.registerPartial('header', header);
  handlebars.registerPartial('footer', footer);
  handlebars.registerPartial('subscriptions', subscriptions);

  handlebars.registerHelper('sign', (value) => {
    if (value >= 0) return '+';
    else return '';
  });

  handlebars.registerHelper('toLowerCase', (str) => {
    return str.toLowerCase();
  });

  handlebars.registerHelper('moment', (value, props) => {
    if (props && props.hash.format)
      return moment(value).format(props.hash.format);
    else
      return moment(value).format('MMMM Do YYYY');
  });

  handlebars.registerHelper('currency', (value, props) => {
    const currency = props.hash.currency;
    value = value/100; // converting cents
    if (currencies[currency]) {
      let str = currencies[currency](value);
      if (str.indexOf('-') !== -1) {
        // we move the minus sign to the beginning: $-10 -> -$10
        str = `-${str.replace('-','')}`;
      }
      return str;
    }
  });

  handlebars.registerHelper('encodeURIComponent', (str) => {
    return encodeURIComponent(str);
  });

  templateNames.forEach((template) => {
    const source = fs.readFileSync(`${templatesPath}/emails/${template}.hbs`, 'utf8');
    templates[template] = handlebars.compile(source);
  });

  return templates;
};