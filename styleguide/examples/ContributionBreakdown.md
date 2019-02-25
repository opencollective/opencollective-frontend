### Full breakdown

Folowing example is resizable.

```js
const { creditCard } = require('../mocks/payment_methods');
<div
  style={{ resize: 'horizontal', padding: '15px', overflow: 'auto', width: '80%', minWidth: '100px', maxWidth: '95%' }}
>
  <ContributionBreakdown
    amount={500000}
    currency="USD"
    hostFeePercent={5}
    paymentMethod={creditCard}
    tax={{
      name: 'VAT',
      percentage: 11,
    }}
  />
</div>;
```

### Without tax

```js
const { creditCard } = require('../mocks/payment_methods');
<ContributionBreakdown amount={500000} currency="USD" hostFeePercent={5} paymentMethod={creditCard} />;
```

### Simple version

No tax, no host fee, no payment processor fee ☮️

```js
<ContributionBreakdown amount={500000} currency="USD" />
```

### Paypal

Paypal fee cannot be guessed in advance, so we prepend a `~` to the amount to show
the user that we're not sure about this one.

```js
const { paypal } = require('../mocks/payment_methods');
<ContributionBreakdown amount={500000} currency="USD" paymentMethod={paypal} />;
```
