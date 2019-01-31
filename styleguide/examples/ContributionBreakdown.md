### Full breakdown

Folowing example is resizable.

```js
<div style={{ resize: 'horizontal', padding: '15px', overflow: 'auto', width: '80%', maxWidth: '95%' }}>
  <ContributionBreakdown amount={500000} currency="USD" hostFee={5} taxName="VAT" tax={11} paymentFee={2.9} />
</div>
```

### Without tax

```js
<ContributionBreakdown amount={500000} currency="USD" hostFee={5} paymentFee={2.9} />
```

### Simple version

No tax, no host fee, no payment processor fee.

```js
<ContributionBreakdown amount={500000} currency="USD" />
```
