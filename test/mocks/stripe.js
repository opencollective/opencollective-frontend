export default {

  "accounts": {

    "create": {
      "id": "stripeid",
      "email": "philippe.modard+customer@gmail.com",
      "keys": {
          "secret": "stripesecret",
          "publishable": "stripepublishable"
      }
    }

  },

  "customers": {

    "create": {
      "object": "customer",
      "created": 1432412123,
      "id": "cus_6IJf9vLMFVsKzX",
      "livemode": false,
      "description": "Customer for test@example.com",
      "email": "philippe.modard+customer@gmail.com",
      "delinquent": false,
      "metadata": {
        "accountId": "stripeid"
      },
      "subscriptions": {},
      "discount": null,
      "account_balance": 0,
      "currency": null,
      "sources": {},
      "default_source": "card_165j1jIqnMN1wWwOzm6Cjmea"
    },

    "createError": {
      "type": "StripePaymentMethodError",
      "rawType": "card_error",
      "code": "card_declined",
      "message": "Your paymentMethod was declined",
      "detail": {},
      "raw": {}
    }

  },

  "charges": {

    "create": {
      "id": "ch_165j8nIqnMN1wWwOw9BcxMMR",
      "object": "charge",
      "created": 1432412561,
      "livemode": false,
      "paid": true,
      "status": "succeeded",
      "amount": 1230,
      "currency": "EUR",
      "refunded": false,
      "source": {
        "id": "card_165j1jIqnMN1wWwOzm6Cjmea",
        "object": "paymentMethod",
        "last4": "4242",
        "brand": "Visa",
        "funding": "credit",
        "exp_month": 8,
        "exp_year": 2016,
        "fingerprint": "QgShyKJhtqpJa9D7",
        "country": "US",
        "customer": "cus_6IJf9vLMFVsKzX"
      },
      "captured": true,
      "balance_transaction": "txn_165j8oIqnMN1wWwOKlPn1D4y",
      "customer": "cus_6IJf9vLMFVsKzX",
      "metadata": {}
    },

    "createError": {
      "type": "StripePaymentMethodError",
      "rawType": "card_error",
      "code": "card_declined",
      "message": "Your paymentMethod was declined",
      "detail": {},
      "raw": {}
    }

  },

  "balance": {
    "id": "txn_165j8oIqnMN1wWwOKlPn1D4y",
    "object": "balance_transaction",
    "source": "ch_2OEK6e5bc72wce",
    "amount": 140000,
    "currency": "usd",
    "net": 117500,
    "type": "charge",
    "created": 1376577420,
    "available_on": 1377129600,
    "status": "pending",
    "fee": 22500,
    "fee_details": [
      {
        "amount": 2500,
        "currency": "usd",
        "type": "stripe_fee",
        "description": "Stripe currency conversion fee",
        "application": null
      },
      {
        "amount": 7000,
        "currency": "usd",
        "type": "application_fee",
        "description": "VAT",
        "application": null
      },
      {
        "amount": 13000,
        "currency": "usd",
        "type": "stripe_fee",
        "description": "Stripe processing fees",
        "application": null
      }
    ],
    "description": "EUR charge on a USD account"
  },

  "plans": {
    "create": {
      "id": "test",
      "object": "plan",
      "amount": 1233,
      "created": 1450088389,
      "currency": "usd",
      "interval": "month",
      "interval_count": 1,
      "livemode": false,
      "metadata": {
      },
      "name": "test",
      "statement_descriptor": null,
      "trial_period_days": null
    },

    "create_not_found": {
      "type": "invalid_request_error",
      "message": "No such plan: month-5000",
      "param": "id",
      "requestId": "req_7Y8TeQytYKcs1k"
    }
  },

  "subscriptions": {
    "create": {
      "id": "sub_7Y8hSfCDvJ4TnD",
      "object": "subscription",
      "application_fee_percent": null,
      "cancel_at_period_end": false,
      "canceled_at": null,
      "current_period_end": 1453039696,
      "current_period_start": 1450361296,
      "customer": "cus_7Y8htG0P2iod3U",
      "discount": null,
      "ended_at": null,
      "metadata": {
      },
      "plan": {
        "id": "gold21323",
        "object": "plan",
        "amount": 2000,
        "created": 1386247539,
        "currency": "EUR",
        "interval": "month",
        "interval_count": 1,
        "livemode": false,
        "metadata": {
        },
        "name": "New plan name",
        "statement_descriptor": null,
        "trial_period_days": null
      },
      "quantity": 1,
      "start": 1450361296,
      "status": "active",
      "tax_percent": null,
      "trial_end": null,
      "trial_start": null
    }
  },

  "event": {
    "id": "evt_17KUJnDjPFcHOcTmSRN6fSHV",
    "object": "event",
    "api_version": "2015-04-07",
    "created": 1450706839,
    "data": {
      "object": {
        "id": "fee_7ZdaSJ4Su7nE1l",
        "object": "application_fee",
        "account": "acct_17IMd4BgJgc4Ba6u",
        "amount": 25,
        "amount_refunded": 0,
        "application": "ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue",
        "balance_transaction": "txn_165j8oIqnMN1wWwOKlPn1D4y",
        "charge": "ch_17KUJnBgJgc4Ba6uvdu1hxm4",
        "customer": "cus_6IJf9vLMFVsKzX",
        "created": 1450706839,
        "currency": "usd",
        "livemode": false,
        "originating_transaction": null,
        "refunded": false,
        "refunds": {
          "object": "list",
          "data": [

          ],
          "has_more": false,
          "total_count": 0,
          "url": "/v1/application_fees/fee_7ZdaSJ4Su7nE1l/refunds"
        }
      }
    },
    "livemode": false,
    "pending_webhooks": 0,
    "request": "req_7Zda4QEgFk8UMV",
    "type": "invoice.payment_succeeded"
  },

  "webhook": {
    "created": 1326853478,
    "livemode": false,
    "id": "evt_00000000000000",
    "type": "invoice.payment_succeeded",
    "object": "event",
    "request": null,
    "pending_webhooks": 1,
    "api_version": "2015-04-07",
    "data": {
      "object": {
        "id": "in_00000000000000",
        "object": "invoice",
        "amount_due": 1000,
        "application_fee": null,
        "attempt_count": 0,
        "attempted": true,
        "charge": "_00000000000000",
        "closed": true,
        "currency": "usd",
        "customer": "cus_6IJf9vLMFVsKzX",
        "date": 1450707776,
        "description": null,
        "discount": null,
        "ending_balance": null,
        "forgiven": false,
        "lines": {
          "data": [
            {
              "id": "sub_7ZdqElVkS7b8Ep",
              "object": "line_item",
              "amount": 35000,
              "currency": "usd",
              "description": null,
              "discountable": true,
              "livemode": true,
              "metadata": {
              },
              "period": {
                "start": 1453386176,
                "end": 1456064576
              },
              "plan": {
                "id": "USD-MONTH-1000",
                "object": "plan",
                "amount": 1000,
                "created": 1450088389,
                "currency": "usd",
                "interval": "month",
                "interval_count": 1,
                "livemode": false,
                "metadata": {
                },
                "name": "test",
                "statement_descriptor": null,
                "trial_period_days": null
              },
              "proration": false,
              "quantity": 1,
              "subscription": null,
              "type": "subscription"
            }
          ],
          "total_count": 1,
          "object": "list",
          "url": "/v1/invoices/in_17KUYuDjPFcHOcTmtBymgNST/lines"
        },
        "livemode": false,
        "metadata": {
        },
        "next_payment_attempt": 1450711376,
        "paid": true,
        "period_end": 1450707776,
        "period_start": 1450707776,
        "receipt_number": null,
        "starting_balance": 0,
        "statement_descriptor": null,
        "subscription": null,
        "subtotal": 0,
        "tax": null,
        "tax_percent": null,
        "total": 0,
        "webhooks_delivered_at": null,
        "payment": null
      }
    }
  }

}
