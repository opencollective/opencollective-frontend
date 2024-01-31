export const payoutMethodPaypal = {
  id: '4a5af568-5232-11ea-8d77-2e728ce88125',
  type: 'PAYPAL',
  data: {
    email: 'test@doohicollective.org',
  },
};

export const payoutMethodBankAccount = {
  id: '4a5a2568-5232-11ea-8d77-2e728ce88125',
  type: 'BANK_ACCOUNT',
  data: {
    type: 'iban',
    details: {
      IBAN: 'FR7600000000000066666666666',
      legalType: 'BUSINESS',
    },
    currency: 'EUR',
    accountHolderName: 'Benjamin Piouffle',
  },
};

export const payoutMethodOther = {
  id: 'cab7f950-5231-11ea-8d77-2e728ce88125',
  type: 'OTHER',
  data: {
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Recte dicis; Ea possunt paria non esse.',
  },
};
