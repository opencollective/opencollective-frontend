### Full component

```js
const amountOptions = [500, 1000, 2000, 5000, 10000];
const [state, setState] = React.useState({ amount: 500, quantity: 1, totalAmount: 500, interval: null });
<div>
  <StepDetails onChange={setState} amountOptions={amountOptions} currency="USD" showQuantity {...state} />
  <br />
  <hr />
  <div style={{ margin: 24, maxWidth: 300 }}>
    <strong>State</strong>
    <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(state, null, 2)}</pre>
  </div>
</div>;
```

### Quantity hidden by default

```js
const amountOptions = [500, 1000, 2000, 5000, 10000];
const [state, setState] = React.useState({ amount: 500, quantity: 1, totalAmount: 500, interval: null });
<StepDetails onChange={setState} amountOptions={amountOptions} currency="EUR" {...state} />;
```

### Set with min amount (`$42`)

```js
const amountOptions = [5000, 10000, 50000, 75000];
const [state, setState] = React.useState({ amount: 5000, quantity: 1, totalAmount: 500, interval: null });
<StepDetails onChange={setState} amountOptions={amountOptions} currency="USD" minAmount={4200} {...state} />;
```

### Without presets

```js
const [state, setState] = React.useState({ amount: 5000, quantity: 1, totalAmount: 500, interval: null });
<StepDetails onChange={setState} currency="USD" {...state} />;
```

### Disabled interval:

```js
const amountOptions = [500, 1000, 2000, 5000, 10000];
const [state, setState] = React.useState({ amount: 5000, quantity: 1, totalAmount: 500, interval: null });
<StepDetails onChange={setState} amountOptions={amountOptions} currency="USD" disabledInterval {...state} />;
```

### Force value (disabledAmount):

```js
const [state, setState] = React.useState({ amount: 5000, quantity: 1, totalAmount: 500, interval: null });
<StepDetails onChange={setState} currency="USD" defaultAmount={500} disabledInterval disabledAmount {...state} />;
```
