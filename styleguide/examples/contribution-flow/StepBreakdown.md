### Don't show payment method fees (contribution flow's default)

```js
const [countryISO, setCountryISO] = React.useState(null);
<div>
  <StepBreakdown
    amount={500000}
    currency="USD"
    hostFeePercent={5}
    showFees={false}
    onChange={({ countryISO }) => setCountryISO(countryISO)}
    userTaxInfo={{ countryISO }}
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

Following example is resizable.

```js
import { creditCard } from '../../mocks/payment_methods';
const [countryISO, setCountryISO] = React.useState('BE');
<div
  style={{ resize: 'horizontal', padding: '15px', overflow: 'auto', width: '80%', minWidth: '100px', maxWidth: '95%' }}
>
  <StepBreakdown
    quantity={5}
    amount={500000}
    currency="USD"
    hostFeePercent={5}
    paymentMethod={creditCard}
    onChange={({ countryISO }) => setCountryISO(countryISO)}
    userTaxInfo={{ countryISO }}
    collectiveTaxInfo={{ countryISO }}
    applyTaxes
  />
</div>;
```

### Without tax

```js
import { creditCard } from '../../mocks/payment_methods';
<StepBreakdown amount={500000} currency="USD" hostFeePercent={5} paymentMethod={creditCard} />;
```

### Simple version

No tax, no host fee, no payment processor fee ☮️

```js
<StepBreakdown amount={500000} currency="USD" />
```

### Paypal

Paypal fee cannot be guessed in advance, so we prepend a `~` to the amount to show
the user that we're not sure about this one.

```js
import { paypal } from '../../mocks/payment_methods';
<StepBreakdown amount={500000} currency="USD" paymentMethod={paypal} />;
```
