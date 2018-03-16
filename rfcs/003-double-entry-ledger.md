# REQUEST FOR COMMENTS 003 - Double Entry Ledger


## Overview

Transferring funds from User to Collective is currently represented as
two rows in the `Transactions` table. One to add up to the Collective
ledger (CREDIT) and the other to subtract from the User's ledger
(DEBIT).

However the transactions between the collective and the host, the
platform and the payment processor (fees) don't have their own
separate rows. The fees are stored as fields in both database rows but
that don't quite describe the flow of funds between the collective and
the institutions that are receiving the fees.

This change will increase accuracy because it will simplify the way we
store the transactions. It will also decrease duplicated code (likely
reducing bugs) because it will provide a library that implements all
the basic operations related to the ledger.

## Goals

1. Increase accuracy of the ledger
   1. [ ] Create collective type "Payment Provider"
   2. [ ] Create separate transactions for fees
2. Make it easier to build new features that depend on data from the
   ledger
   1. [ ] `libocledger`: wrap the most common operations related to
           the ledger under a library that can be used across all the
           places that interact with the ledger and decrease
           duplicated code in the repository.

### Create collective type "Payment Provider"

As mentioned before, the amount of the payment processor fee is stored
in the field `paymentProcessorFeeInHostCurrency` in the `Transactions`
table. To find out to which specific payment method the fee went to,
the `Transactions` table also records the `PaymentMethodId`.

This is different from how transactions are tracked between User &
Collective. To address this difference, the Payment Provider needs to
have a ledger as well.

### Create separate transactions for fees

#### Use case example

Given a transaction that represents moving $50 dollars from User to
Collective with 5% of platform fee, 10% of host fee and 2.9%+30c of
payment processor fee.

##### How it is currently stored
|            | User Ledger | Collective Ledger |
|------------|------------:|------------------:|
| Type       |       DEBIT |            CREDIT |
| Amount     |       -4075 |              5000 |
| Host Fee   |        -500 |              -500 |
| Plat Fee   |        -250 |              -250 |
| PP Fee     |        -175 |              -175 |
| Net Amount |       -5000 |              4075 |

##### How it should look like after this change

|        |  User | Collective | Collective | Platform | Collective | Host | Collective | Payment Provider |
|--------|------:|-----------:|-----------:|---------:|-----------:|-----:|-----------:|-----------------:|
| Amount | -5000 |       5000 |       -250 |      250 |       -500 |  500 |       -175 |              175 |

##### Where did the net amount go

The net amount won't be a static value in the database anymore. The
next section introduces an API that provides core operations to the
ledger including calculate (& cache) the balance, getting fees etc.

## Ledger API (`libocledger`)

The Ledger API will now provide the following tools:

 * `Number balance(Number CollectiveId)`

   Return the amount of funds in a ledger after summing up all the
   transactions.

   ```javascript
   > libledger.balance(665)
   4325
   ```

 * `Object<String,Number> summary(String TransactionGroup)`

   Return an object describing all the rows related to a single
   transaction.

   ```javascript
   > libledger.summary('d3e36baa-69a2-4f6e-ac44-f93981e51c97')
   { amount: 500, sumfees: 95, netAmount: 405 }
   ```

 * `Object<String,Number> fees(String TransactionGroup)`
 
   Return an `Object` with keys containing the names of the fees and
   their respective values.

   ```javascript
   > libledger.fees('d3e36baa-69a2-4f6e-ac44-f93981e51c97')
   { platformFeeInHostCurrency: -25, hostFeeInHostCurrency: -25, paymentProcessorFeeInHostCurrency: -45 }
   ```

 * `Object<String,Number> rows(String TransactionGroup)`

   Return an `Object` describing all the rows related to a single
   transaction.

   ```javascript
   > libledger.rows('d3e36baa-69a2-4f6e-ac44-f93981e51c97')
   [
     { fromCollective: 10165, collective: 58, amount: -5000 }, // from User to Collective
     { fromCollective: 58, collective: 1, amount: -250 },      // from Collective to Platform
     { fromCollective: 58, collective: 11004, amount: -250 },  // from Collective to Host
     { fromCollective: 58, collective: 90000, amount: -175 },  // from Collective to Payment Provider
   ]
   ```
