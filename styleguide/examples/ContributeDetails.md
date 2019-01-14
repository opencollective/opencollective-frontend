Default:

```js
amountOptions = [500, 1000, 2000, 5000, 10000];
currency = 'USD';
<ContributeDetails onChange={console.log} amountOptions={amountOptions} currency={currency} />;
```

Disabled interval:

```js
amountOptions = [500, 1000, 2000, 5000, 10000];
currency = 'USD';
<ContributeDetails onChange={console.log} amountOptions={amountOptions} currency={currency} disabledInterval />;
```

Set with initial value:

```js
amountOptions = [500, 1000, 2000, 5000, 10000];
currency = 'USD';
initialValue = {
  totalAmount: 2000,
  interval: 'month',
};
<ContributeDetails
  onChange={console.log}
  amountOptions={amountOptions}
  currency={currency}
  showFrequency
  {...initialValue}
/>;
```
