Default:

```js
amountOptions = [500, 1000, 2000, 5000, 10000];
currency = 'USD';
<ContributeDetails onChange={console.log} amountOptions={amountOptions} currency={currency} />;
```

Set with initial value:

```js
amountOptions = [500, 1000, 2000, 5000, 10000];
currency = 'USD';
initialValue = {
  defaultAmount: 10000,
  defaultInterval: 'month',
};
<ContributeDetails onChange={console.log} amountOptions={amountOptions} currency={currency} {...initialValue} />;
```

Set with min amount (`$42`):

```js
amountOptions = [5000, 10000, 50000, 75000];
currency = 'USD';
<ContributeDetails onChange={console.log} amountOptions={amountOptions} currency={currency} minAmount={4200} />;
```

Without presets:

```js
currency = 'USD';
<ContributeDetails onChange={console.log} currency={currency} defaultAmount={500} />;
```

Disabled interval:

```js
amountOptions = [500, 1000, 2000, 5000, 10000];
currency = 'USD';
<ContributeDetails onChange={console.log} amountOptions={amountOptions} currency={currency} disabledInterval />;
```

Force value (disabledAmount):

```js
currency = 'USD';
<ContributeDetails onChange={console.log} currency={currency} defaultAmount={500} disabledInterval disabledAmount />;
```
