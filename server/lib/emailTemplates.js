import fs from 'fs';
import moment from 'moment';
import handlebars from 'handlebars';

/*
* Loads all the email templates
*/

const templates = {};

const templateNames = [
  'email.approve',
  'email.message',
  'github.signup',
  'group.created',
  'group.expense.created',
  'group.donation.created',
  'group.monthlyreport',
  'thankyou',
  'thankyou.wwcode',
  'thankyou.brusselstogether',
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
const toplogo = fs.readFileSync(`${templatesPath}/partials/toplogo.hbs`, 'utf8');
const relatedgroups = fs.readFileSync(`${templatesPath}/partials/relatedgroups.hbs`, 'utf8');

handlebars.registerPartial('header', header);
handlebars.registerPartial('footer', footer);
handlebars.registerPartial('subscriptions', subscriptions);
handlebars.registerPartial('toplogo', toplogo);
handlebars.registerPartial('relatedgroups', relatedgroups);

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
  const { currency } = props.hash;
  if (!value || !currency || currency.length !== 3) {
    console.error("currency hbs helper called with invalid inputs", "value:", value, "currency:", currency);
    return value || 0;
  }
  value = value/100; // converting cents

  return value.toLocaleString(currency, {
    style: 'currency',
    currency,
    minimumFractionDigits : 2,
    maximumFractionDigits : 2
  });

});

handlebars.registerHelper('encodeURIComponent', (str) => {
  return encodeURIComponent(str);
});

templateNames.forEach((template) => {
  const source = fs.readFileSync(`${templatesPath}/emails/${template}.hbs`, 'utf8');
  templates[template] = handlebars.compile(source);
});

export default templates;
