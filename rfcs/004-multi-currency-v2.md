# REQUEST FOR COMMENTS 004 - Multi Currency v2.0

## Overview

Currently, each collective has their own currency. And every
transaction between collectives of different currency generate a
currency conversion.

The goal of this RFC is to spec out a flow for the use cases we
support that 0. Guarantee the accuracy of the ledger, 1. Minimize the
number of conversions between exchanges to avoid fees.

## Goals

1. Store amounts in Host Currency
2. Define storage for ledger
3. Where currency conversion happens
4. Multi Wallets

### Store amounts in Host Currency

The ledger of Collectives without a bank account is virtual. They all
need a host to actually store money. Each Collective under a host
knows how much they have in their ledger and the Host knows how much
each collective has as well as its own balance.

The currency of the Host is attached to which currency their bank
account support. The currency of the Collective under a host is mostly
informative to their members since the funds are stored in the Host's
currency.

An amount only has to be converted to the Collective's currency
whenever a transference moving funds out of the Collective is
started. Which could be either through paying an expense or
transferring funds to another collective under another host of
different currency.

#### Use case example (Order)

Given a transaction that represents moving $50 USD from User to
Collective with 5% of platform fee, 10% of host fee and 2.9%+30c of
payment processor fee and the Host account receiving it is in MXN and
the exchange rate is 1 USD to 18.43 MXN.

##### How it is currently stored

Collective Ledger (CREDIT)

* **amount**: Store the value in the received currency (USD)
* **amountInHostCurrency**: Store the amount converted to the Host
  currency (MXN)
* **netAmountInCollectiveCurrency**: Store the amount in the
  Collective currency (which could be different from the Host & the
  User).
* **hostCurrencyFxRate**: Store the rate between the **amount** and
  **amountInHostCurrency**.

##### How it should look like after this change

To document the purchase of an amount of a different currency, the
following changes are necessary:

The following fields will be renamed
 * **amountInHostCurrency** to **fromAmount**
 * **hostCurrency** to **fromCurrency**
 * **hostCurrencyFxRate** to **fromCurrencyRate**

And the following fields are going to be deleted:
 * **netAmountInCollectiveCurrency**

|             from |               to |   type | amount | currency | fromAmount | fromCurrency | fromCurrencyRate |
|-----------------:|-----------------:|-------:|-------:|---------:|-----------:|-------------:|-----------------:|
|             User |       Collective |  DEBIT |  -5000 |      USD |     -92150 |          MXN |            18.43 |
|       Collective |             User | CREDIT |  +5000 |      USD |     +92150 |          MXN |            18.43 |
|       Collective |             Host |  DEBIT |   -500 |      USD |            |              |                  |
|             Host |       Collective | CREDIT |   +500 |      USD |            |              |                  |
|       Collective |         Platform |  DEBIT |   -250 |      USD |            |              |                  |
|         Platform |       Collective | CREDIT |   +250 |      USD |            |              |                  |
|       Collective | Payment Provider |  DEBIT |   -175 |      USD |            |              |                  |
| Payment Provider |       Collective | CREDIT |   +175 |      USD |            |              |                  |

### Where currency conversion happens

Stripe's policy on multi-currency
 * If there is a bank account for that currency, no conversion occurs
 * If there are multiple bank accounts available for a given currency,
   Stripe uses the one set as =default_for_currency=
 * If there is not a bank account for that currency, we automatically
   convert those funds to your default currency

Paypal's Policy on multi-currency
 * ??

### Multi Wallets

Consider a collective with two wallets: `USD` & `ETH`. Now consider
that it receives one donation in each wallet:

#### Donation to the `USD` wallet in `USD`

##### Transaction
|             from |               to |   type | amount | currency | fromAmount | fromCurrency | fromCurrencyRate |
|-----------------:|-----------------:|-------:|-------:|---------:|-----------:|-------------:|-----------------:|
|             User |       Collective |  DEBIT |  -5000 |      USD |            |              |                  |
|       Collective |             User | CREDIT |  +5000 |      USD |            |              |                  |
|       Collective |             Host |  DEBIT |   -500 |      USD |            |              |                  |
|             Host |       Collective | CREDIT |   +500 |      USD |            |              |                  |
|       Collective |         Platform |  DEBIT |   -250 |      USD |            |              |                  |
|         Platform |       Collective | CREDIT |   +250 |      USD |            |              |                  |
|       Collective | Payment Provider |  DEBIT |   -175 |      USD |            |              |                  |
| Payment Provider |       Collective | CREDIT |   +175 |      USD |            |              |                  |

##### Balance
|      User | Collective |     Host | Platform | Payment Provider |
|----------:|-----------:|---------:|---------:|-----------------:|
| -5000 USD |  +4075 USD | +500 USD | +250 USD |         +175 USD |

#### Donation to the `USD` wallet in `MXN`

This one is almost the same as the above. The exception is that the
fields **fromAmount**, **fromCurrency** and **fromCurrencyRate** will
be filled in with the meta data about the original amount of `MXN`
used to buy that amount of `USD`.

##### Transaction
|             from |               to |   type | amount | currency | fromAmount | fromCurrency | fromCurrencyRate |
|-----------------:|-----------------:|-------:|-------:|---------:|-----------:|-------------:|-----------------:|
|             User |       Collective |  DEBIT |  -5000 |      USD |     -92150 |          MXN |            18.43 |
|       Collective |             User | CREDIT |  +5000 |      USD |     +92150 |          MXN |            18.43 |
|       Collective |             Host |  DEBIT |   -500 |      USD |            |              |                  |
|             Host |       Collective | CREDIT |   +500 |      USD |            |              |                  |
|       Collective |         Platform |  DEBIT |   -250 |      USD |            |              |                  |
|         Platform |       Collective | CREDIT |   +250 |      USD |            |              |                  |
|       Collective | Payment Provider |  DEBIT |   -175 |      USD |            |              |                  |
| Payment Provider |       Collective | CREDIT |   +175 |      USD |            |              |                  |

##### Balance
|                 User |           Collective |     Host | Platform | Payment Provider |
|---------------------:|---------------------:|---------:|---------:|-----------------:|
| -5000 USD/-92150 MXN | +4075 USD/+92150 MXN | +500 USD | +250 USD |         +175 USD |

#### Donation to the `MXN` wallet in `MXN` but fees in `USD`

|             from |               to |   type | amount | currency | fromAmount | fromCurrency | fromCurrencyRate |
|-----------------:|-----------------:|-------:|-------:|---------:|-----------:|-------------:|-----------------:|
|             User |       Collective |  DEBIT | -92150 |      MXN |            |              |                  |
|       Collective |             User | CREDIT | +92150 |      MXN |            |              |                  |
|       Collective |             Host |  DEBIT |   -500 |      USD |      -9215 |          MXN |            18.43 |
|             Host |       Collective | CREDIT |   +500 |      USD |      +9215 |          MXN |            18.43 |
|       Collective |         Platform |  DEBIT |   -250 |      USD |      -4608 |          MXN |            18.43 |
|         Platform |       Collective | CREDIT |   +250 |      USD |      +4608 |          MXN |            18.43 |
|       Collective | Payment Provider |  DEBIT |   -175 |      USD |      -2702 |          MXN |            18.43 |
| Payment Provider |       Collective | CREDIT |   +175 |      USD |      +2702 |          MXN |            18.43 |
