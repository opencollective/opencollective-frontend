### Default

```js
const { default: paymentMethods } = require('../mocks/payment_methods');
<ContributePayment onChange={console.log} paymentMethods={paymentMethods} />;
```

### Without Paypal

```js
const { default: paymentMethods } = require('../mocks/payment_methods');
<ContributePayment withPaypal={false} onChange={console.log} paymentMethods={paymentMethods} />;
```
