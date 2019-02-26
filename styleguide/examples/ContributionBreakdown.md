### Full breakdown

Folowing example is resizable.

```js
const { creditCard } = require('../mocks/payment_methods');
initialState = { countryISO: 'FR' };
<div
  style={{ resize: 'horizontal', padding: '15px', overflow: 'auto', width: '80%', minWidth: '100px', maxWidth: '95%' }}
>
  <ContributionBreakdown
    amount={500000}
    currency="USD"
    hostFeePercent={5}
    paymentMethod={creditCard}
    collectiveTaxInfo={state}
    onChange={setState}
    tax={{
      name: 'VAT',
      percentage: 11,
      countries: ['FR', 'BE', 'DE'],
      identificationNumberRegex:
        '^((AT)?U[0-9]{8}|(BE)?0[0-9]{9}|(BG)?[0-9]{9,10}|(CY)?[0-9]{8}L(CZ)?[0-9]{8,10}|(DE)?[0-9]{9}|(DK)?[0-9]{8}|(EE)?[0-9]{9}(EL|GR)?[0-9]{9}|(ES)?[0-9A-Z][0-9]{7}[0-9A-Z]|(FI)?[0-9]{8}(FR)?[0-9A-Z]{2}[0-9]{9}|(GB)?([0-9]{9}([0-9]{3})?|[A-Z]{2}[0-9]{3})(HU)?[0-9]{8}|(IE)?[0-9]S[0-9]{5}L|(IT)?[0-9]{11}(LT)?([0-9]{9}|[0-9]{12})|(LU)?[0-9]{8}|(LV)?[0-9]{11}|(MT)?[0-9]{8}(NL)?[0-9]{9}B[0-9]{2}|(PL)?[0-9]{10}|(PT)?[0-9]{9}|(RO)?[0-9]{2,10}(SE)?[0-9]{12}|(SI)?[0-9]{8}|(SK)?[0-9]{10})$',
    }}
  />
</div>;
```

### Don't show payment method fees (contribution flow's default)

```js
<div>
  <ContributionBreakdown
    amount={500000}
    currency="USD"
    hostFeePercent={5}
    showFees={false}
    collectiveTaxInfo={state}
    onChange={setState}
    tax={{
      name: 'VAT',
      percentage: 11,
      countries: ['FR', 'BE', 'DE', 'AF'],
      identificationNumberRegex:
        '^((AT)?U[0-9]{8}|(BE)?0[0-9]{9}|(BG)?[0-9]{9,10}|(CY)?[0-9]{8}L(CZ)?[0-9]{8,10}|(DE)?[0-9]{9}|(DK)?[0-9]{8}|(EE)?[0-9]{9}(EL|GR)?[0-9]{9}|(ES)?[0-9A-Z][0-9]{7}[0-9A-Z]|(FI)?[0-9]{8}(FR)?[0-9A-Z]{2}[0-9]{9}|(GB)?([0-9]{9}([0-9]{3})?|[A-Z]{2}[0-9]{3})(HU)?[0-9]{8}|(IE)?[0-9]S[0-9]{5}L|(IT)?[0-9]{11}(LT)?([0-9]{9}|[0-9]{12})|(LU)?[0-9]{8}|(LV)?[0-9]{11}|(MT)?[0-9]{8}(NL)?[0-9]{9}B[0-9]{2}|(PL)?[0-9]{10}|(PT)?[0-9]{9}|(RO)?[0-9]{2,10}(SE)?[0-9]{12}|(SI)?[0-9]{8}|(SK)?[0-9]{10})$',
    }}
  />
  <br />
  <hr />
  <br />
  <strong>Dispatched onChange event</strong>
  <blockquote style={{ whiteSpace: 'pre', background: '#232323', color: 'lime', padding: '1em', margin: 0 }}>
    {JSON.stringify(state, null, 4)}
  </blockquote>
</div>
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
