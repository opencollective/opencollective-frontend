import { GraphQLEnumType } from 'graphql';

export const Currency = new GraphQLEnumType({
  name: 'Currency',
  description: 'All supported currencies',
  values: {
    USD: { description: 'US Dollar' },
    EUR: { description: 'Euro' },
    GBP: { description: 'British Pound' },
    MXN: { description: 'Mexican Peso' },
    CAD: { description: 'Canadian Dollar' },
    CHF: { description: 'Swiss Franc' },
    UYU: { description: 'Uruguayan Peso' },
    AUD: { description: 'Australian Dollar' },
    INR: { description: 'Indian Rupee' },
    JPY: { description: 'Japanese Yen' },
    NZD: { description: 'New Zealand Dollar' },
  },
});
