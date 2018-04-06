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

*Fig 1.0 - Payment Flow*
![Payment Flow](./imgs/payment-flow.svg "Payment Flow")

## Goals

1. Increase accuracy of the ledger
   1. Create collective type "Payment Provider"
   2. Create separate transactions for fees
2. Make it easier to build new features that depend on the ledger
   1. `libocledger`: wrap the most common operations related to the
      ledger under a library that can be used across all the places
      that interact with the ledger and decrease duplicated code in
      the repository.

### Create collective type "Payment Provider"

As mentioned before, the amount of the payment processor fee is stored
in the field `paymentProcessorFeeInHostCurrency` in the `Transactions`
table. To find out to which specific payment method the fee went to,
the `Transactions` table also records the `PaymentMethodId`.

This is different from how transactions are tracked between User &
Collective. To address this difference, the Payment Provider needs to
have a ledger as well.

### Create separate transactions for fees

#### Use case example (Order)

Given a transaction that represents moving $50 dollars from User to
Collective with 5% of platform fee, 10% of host fee and 2.9%+30c of
payment processor fee.

##### How it is currently stored

|            |  User | Collective |
|------------|------:|-----------:|
| Type       | DEBIT |     CREDIT |
| Amount     | -4075 |       5000 |
| Host Fee   |  -500 |       -500 |
| Plat Fee   |  -250 |       -250 |
| PP Fee     |  -175 |       -175 |
| Net Amount | -5000 |       4075 |

##### How it should look like after this change

|      User | Collective |     Host | Platform | Payment Provider |
|----------:|-----------:|---------:|---------:|-----------------:|
| -5000 USD |  +5000 USD |          |          |                  |
|           |   -500 USD | +500 USD |          |                  |
|           |   -250 USD |          | +250 USD |                  |
|           |   -175 USD |          |          |         +175 USD |

#### Use case example (Expense)

Given a transaction that represents moving $50 dollars from Collective
to User with 2.9%+30c of payment processor fee.

##### How it is currently stored

|            | Collective |   User |
|------------|-----------:|-------:|
| Type       |      DEBIT | CREDIT |
| Amount     |      -5000 |   5000 |
| PP Fee     |       -175 |   -175 |
| Net Amount |      -5175 |   5000 |

##### How it should look like after this change

| Collective |      User | Payment Provider |
|-----------:|----------:|-----------------:|
|  -5000 USD | +5000 USD |                  |
|   -175 USD |           |         +175 USD |

#### Where did the net amount go

The net amount won't be a static value in the database anymore. The
next section introduces an API that provides core operations to the
ledger including calculate (& cache) the balance, getting fees etc.

#### Table Format

The example shown in the section "Create separate transactions for
fees" would be represented in the database by the following rows:

|             from |               to |   type | amount | currency |
|-----------------:|-----------------:|-------:|-------:|---------:|
|             User |       Collective |  DEBIT |  -5000 |      USD |
|       Collective |             User | CREDIT |  +5000 |      USD |
|       Collective |             Host |  DEBIT |   -500 |      USD |
|             Host |       Collective | CREDIT |   +500 |      USD |
|       Collective |         Platform |  DEBIT |   -250 |      USD |
|         Platform |       Collective | CREDIT |   +250 |      USD |
|       Collective | Payment Provider |  DEBIT |   -175 |      USD |
| Payment Provider |       Collective | CREDIT |   +175 |      USD |

After this operation, if there are no other transactions for the
entities involved, the output of the `balance()` call for each ledger
should be:

```javascript
> (await libledger.balance(userCollective.id))['usd']
-5000
> (await libledger.balance(collective.id)))['usd']
+4075
> (await libledger.balance(hostCollective.id)))['usd']
+500
> (await libledger.balance(platformCollective.id)))['usd']
+250
> (await libledger.balance(paymentProviderCollective.id)))['usd']
+175
```
