### Don't show payment method fees (contribution flow's default)

```js
initialState = { countryISO: 'BE' };
<div>
  <ContributionBreakdown
    amount={500000}
    currency="USD"
    hostFeePercent={5}
    showFees={false}
    onChange={setState}
    userTaxInfo={state}
    tierType="PRODUCT"
    hostCountry="FR"
    applyTaxes
  />
  <br />
  <hr />
  <br />
  <strong>Dispatched onChange event</strong>
  <blockquote style={{ whiteSpace: 'pre', background: '#232323', color: 'lime', padding: '1em', margin: 0 }}>
    {JSON.stringify(state, null, 4)}
  </blockquote>
</div>;
```

### Full breakdown

Folowing example is resizable.

```js
const { creditCard } = require('../mocks/payment_methods');
initialState = { countryISO: 'FR' };
<div
  style={{ resize: 'horizontal', padding: '15px', overflow: 'auto', width: '80%', minWidth: '100px', maxWidth: '95%' }}
>
  <ContributionBreakdown
    quantity={5}
    amount={500000}
    currency="USD"
    hostFeePercent={5}
    paymentMethod={creditCard}
    collectiveTaxInfo={state}
    onChange={setState}
    applyTaxes
    userTaxInfo={{
      countryISO: 'FR',
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
