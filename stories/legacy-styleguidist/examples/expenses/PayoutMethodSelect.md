```jsx
<PayoutMethodSelect
  collective={{ host: { transferwise: true } }}
  payoutMethods={[
    { id: '0', type: 'PAYPAL', data: { email: 'test-account@opencollective.com' } },
    { id: '1', type: 'PAYPAL', data: { email: 'test-account-2@opencollective.com' } },
    {
      id: '3',
      type: 'PAYPAL',
      data: { email: 'test-account-2-xxxxxxxxxxxxsssssssssssaaaaaaaaaaaaaaaaaa@opencollective.com' },
    },
    {
      id: '4',
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
    },
  ]}
/>
```
