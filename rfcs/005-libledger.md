# REQUEST FOR COMMENTS 005 - API to interact with the ledger

## Ledger API (`libocledger`)

The Ledger API will now provide the following tools:

* `Promise<Number> balance(Number CollectiveId)`

  Return the amount of funds in a ledger after summing up all the
  transactions.

  ```javascript
  > await libledger.balance(665)
  { usd: 4325 }
  ```

* `Promise<Object> summary(String TransactionGroup)`

  Return an object describing all the rows related to a single
  transaction.

  ```javascript
  > await libledger.summary('d3e36baa-69a2-4f6e-ac44-f93981e51c97')
  { usd: { user: -5000, collective: 4075, host: 500, platform: 250, paymentProvider: 175 } }
  ```

* `Promise<Object> fees(String TransactionGroup)`

  Return an `Object` with keys containing the names of the fees and
  their respective values.

  ```javascript
  > await libledger.fees('d3e36baa-69a2-4f6e-ac44-f93981e51c97')
  { usd: { platform: -25, host: -25, paymentProvider: -45 } }
  ```

* `Object<String,Number> rows(String TransactionGroup)`

  Return an `Object` describing all the rows related to a single
  transaction.

  ```javascript
  > libledger.rows('d3e36baa-69a2-4f6e-ac44-f93981e51c97')
  [
    { fromCollective: 10165, collective: 90000, amount: -5000 }, // from User to Payment Provider
    { fromCollective: 90000, collective: 1, amount: 250 },       // from Payment Provider to Platform
    { fromCollective: 90000, collective: 11004, amount: 4575 },  // from Payment Provider to Host
    { fromCollective: 11004, collective: 58, amount: 4325 },     // from Host to Collective
  ]
   ```
