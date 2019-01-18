### With PayPal and Manual

```js
const { default: paymentMethods } = require('../mocks/payment_methods');
<ContributePayment
  withPaypal
  onChange={console.log}
  paymentMethods={paymentMethods}
  manual={{
    title: 'Bank transfer',
    instructions:
      'Please make a bank transfer for the amount of $42.00 to the bank account: IBAN: BE11 4242 4242 4242 with the following communication: "fzappa order 125238". Please note that it will take a few days to process your payment.',
  }}
/>;
```
