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

  "tokens": {
    "create": {
      "id": "tok_6IJf9vLMFVsKzX"
    }
  },

  "customers": {

    "create": {
      "object": "customer",
      "created": 1432412123,
      "id": "cus_BM7mGwp1Ea8RtL",
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
    "succeeded": {
      id: 'py_1Bat4MDjPFcHOcTmnnycJGQn',
      object: 'charge',
      amount: 5000,
      amount_refunded: 0,
      application: null,
      application_fee: null,
      balance_transaction: 'txn_1Bat4NDjPFcHOcTm13n12JZ1',
      captured: true,
      created: 1513720574,
      currency: 'usd',
      customer: 'cus_ByqlQqWYQok45w',
      description: 'Donation to MochaJS',
      destination: 'acct_18KWlTLzdXg9xKNS',
      dispute: null,
      failure_code: null,
      failure_message: null,
      fraud_details: {},
      invoice: null,
      livemode: false,
      metadata: {},
      on_behalf_of: 'acct_18KWlTLzdXg9xKNS',
      order: null,
      outcome:
       { network_status: 'approved_by_network',
         reason: null,
         risk_level: 'not_assessed',
         seller_message: 'Payment complete.',
         type: 'authorized' },
      paid: true,
      receipt_email: null,
      receipt_number: null,
      refunded: false,
      refunds:
       { object: 'list',
         data: [],
         has_more: false,
         total_count: 0,
         url: '/v1/charges/py_1Bat4MDjPFcHOcTmnnycJGQn/refunds' },
      review: null,
      shipping: null,
      source:
       { id: 'src_1Bat47DjPFcHOcTmzDd7G6hq',
         object: 'source',
         amount: 5000,
         client_secret: 'src_client_secret_ByqlujbwCVmzyjMJtPjyprEi',
         created: 1513720575,
         currency: 'usd',
         flow: 'receiver',
         livemode: false,
         metadata: { CollectiveId: '58' },
         owner:
          { address: null,
            email: '2342@23423.com',
            name: null,
            phone: null,
            verified_address: null,
            verified_email: null,
            verified_name: null,
            verified_phone: null },
         receiver:
          { address: 'test_1MBhWS3uv4ynCfQXF3xQjJkzFPukr4K56N',
            amount_charged: 5000,
            amount_received: 5000,
            amount_returned: 0,
            refund_attributes_method: 'email',
            refund_attributes_status: 'missing' },
         statement_descriptor: null,
         status: 'consumed',
         type: 'bitcoin',
         usage: 'single_use',
         bitcoin:
          { address: 'test_1MBhWS3uv4ynCfQXF3xQjJkzFPukr4K56N',
            amount: 11855000,
            amount_charged: 11855000,
            amount_received: 11855000,
            amount_returned: 0,
            uri: 'bitcoin:test_1MBhWS3uv4ynCfQXF3xQjJkzFPukr4K56N?amount=0.11855000',
            refund_address: null } },
      source_transfer: null,
      statement_descriptor: null,
      status: 'succeeded',
      transfer: 'tr_1Bat4NDjPFcHOcTmchrFP1LJ',
      transfer_group: 'group_py_1Bat4MDjPFcHOcTmnnycJGQn'
    },
    "create": {
      "id": "ch_17KUJnBgJgc4Ba6uvdu1hxm4",
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
        "customer": "cus_BM7mGwp1Ea8RtL"
      },
      "captured": true,
      "balance_transaction": "txn_1AzPXID8MNtzsDcgpAUVjNJm",
      "customer": "cus_BM7mGwp1Ea8RtL",
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

  "bitcoin": {
    "balanceTransaction": {
      "id":"txn_1Bat4NDjPFcHOcTm13n12JZ1",
      "object":"balance_transaction",
      "amount":5000,
      "available_on":1513814400,
      "created":1513720575,
      "currency":"usd",
      "description":"Donation to MochaJS",
      "fee":40,
      "fee_details":[{"amount":40,"application":null,"currency":"usd","description":"Stripe processing fees","type":"stripe_fee"}],
      "net":4960,
      "source":"py_1Bat4MDjPFcHOcTmnnycJGQn","sourced_transfers":{"object":"list","data":[{"id":"tr_1Bat4NDjPFcHOcTmchrFP1LJ","object":"transfer","amount":4710,"amount_reversed":0,"balance_transaction":"txn_1Bat4NDjPFcHOcTmW1PlPnIc","created":1513720575,"currency":"usd","description":null,"destination":"acct_18KWlTLzdXg9xKNS","destination_payment":"py_1Bat4NLzdXg9xKNS69FR7eDE","livemode":false,"metadata":{},"reversals":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers/tr_1Bat4NDjPFcHOcTmchrFP1LJ/reversals"},"reversed":false,"source_transaction":"py_1Bat4MDjPFcHOcTmnnycJGQn","source_type":"card","transfer_group":"group_py_1Bat4MDjPFcHOcTmnnycJGQn","date":1513720575,"status":"paid","type":"stripe_account","method":"standard","failure_message":null,"failure_code":null,"statement_descriptor":null,"recipient":null,"application_fee":null}],"has_more":false,"total_count":1,"url":"/v1/transfers?source_transaction=py_1Bat4MDjPFcHOcTmnnycJGQn"},"status":"pending","type":"payment"
    }
  },

  "balance": {
    "id": "txn_1AzPXID8MNtzsDcgpAUVjNJm",
    "object": "balance_transaction",
    "source": "ch_17KUJnBgJgc4Ba6uvdu1hxm4",
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
      "amount": 1099,
      "created": 1450088389,
      "currency": "EUR",
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

  "createSubscription": {"id":"sub_BM7mrzF0w129va","object":"subscription","application_fee_percent":5,"cancel_at_period_end":false,"canceled_at":null,"created":1506398222,"current_period_end":1506916617,"current_period_start":1506398222,"customer":"cus_BT6ORKojThuNLn","discount":null,"ended_at":null,"items":{"object":"list","data":[{"id":"si_1B6ABuD8MNtzsDcgL7axnWRL","object":"subscription_item","created":1506398222,"metadata":{},"plan":{"id":"USD-MONTH-35000","object":"plan","amount":35000,"created":1504702187,"currency":"usd","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"USD-MONTH-35000","statement_descriptor":null,"trial_period_days":null},"quantity":1}],"has_more":false,"total_count":1,"url":"/v1/subscription_items?subscription=sub_BM7mrzF0w129va"},"livemode":false,"metadata":{"from":"http://localhost:3000/philmod","to":"http://localhost:3000/scouts","PaymentMethodId":"4"},"plan":{"id":"USD-MONTH-35000","object":"plan","amount":35000,"created":1504702187,"currency":"usd","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"USD-MONTH-35000","statement_descriptor":null,"trial_period_days":null},"quantity":1,"start":1506398222,"status":"trialing","tax_percent":null,"trial_end":1506916617,"trial_start":1506398222},

  "webhook_payment_succeeded": {
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
        "charge": "ch_17KUJnBgJgc4Ba6uvdu1hxm4",
        "closed": true,
        "currency": "usd",
        "customer": "cus_BM7mGwp1Ea8RtL",
        "date": 1450707776,
        "description": null,
        "discount": null,
        "ending_balance": null,
        "forgiven": false,
        "lines": {
          "data": [
            {
              "id": "sub_BM7mrzF0w129va",
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
  },

  "event_source_chargeable": {
    id: "evt_00000000000000",
    type: 'source.chargeable',
    "data": {
      "object": {
        "id": "src_1BaqqSDjPFcHOcTm4RAZ6yTY",
        "object": "source",
        "amount": 5000,
        "client_secret": "src_client_secret_ByoTEVAbJw0rlzn8Zkfcs804",
        "created": 1513712024,
        "currency": "usd",
        "flow": "receiver",
        "livemode": false,
        "metadata": {
          "CollectiveId": "3"
        },
        "owner": {
          "address": null,
          "email": "fdsf@fsds.com",
          "name": null,
          "phone": null,
          "verified_address": null,
          "verified_email": null,
          "verified_name": null,
          "verified_phone": null
        },
        "receiver": {
          "address": "test_1MBhWS3uv4ynCfQXF3xQjJkzFPukr4K56N",
          "amount_charged": 0,
          "amount_received": 5000,
          "amount_returned": 0,
          "refund_attributes_method": "email",
          "refund_attributes_status": "missing"
        },
        "statement_descriptor": null,
        "status": "chargeable",
        "type": "bitcoin",
        "usage": "single_use",
        "bitcoin": {
          "address": "test_1MBhWS3uv4ynCfQXF3xQjJkzFPukr4K56N",
          "amount": 11855000,
          "amount_charged": 0,
          "amount_received": 11855000,
          "amount_returned": 0,
          "uri": "bitcoin:test_1MBhWS3uv4ynCfQXF3xQjJkzFPukr4K56N?amount=0.11855000",
          "refund_address": null
        }
      },
      "previous_attributes": null
    }
  },

  "webhook_source_chargeable": {
    "id":"evt_xxxxxx",
    "object":"event",
    "account":"acct_15vekcDjPFcHOcTm",
    "api_version":"2015-04-07",
    "created":1513525204,
    "data":{
      "object":{
        "id":"src_1Ba4FADjPFcHOcTmCJWTbV5H",
        "object":"source",
        "amount":5000,
        "client_secret":"src_client_secret_xxxxxxxxx",
        "created":1513525200,
        "currency":"usd",
        "flow":"receiver",
        "livemode":false,
        "metadata":{"CollectiveId":"58"},
        "owner":{
          "address":null,
          "email":"adasdf@asdadf.com",
          "name":null,
          "phone":null,
          "verified_address":null,
          "verified_email":null,
          "verified_name":null,
          "verified_phone":null},
          "receiver":{
            "address":"test_1MBhWS3uv4ynCfQXF3xQjJkzFPukr4K56N",
            "amount_charged":0,
            "amount_received":5000,
            "amount_returned":0,
            "refund_attributes_method":"email",
            "refund_attributes_status":"missing"
          },
          "statement_descriptor":null,
          "status":"chargeable",
          "type":"bitcoin",
          "usage":"single_use",
          "bitcoin":{
            "address":"test_1MBhWS3uv4ynCfQXF3xQjJkzFPukr4K56N",
            "amount":11855000,
            "amount_charged":0,
            "amount_received":11855000,
            "amount_returned":0,
            "uri":"bitcoin:test_1MBhWS3uv4ynCfQXF3xQjJkzFPukr4K56N?amount=0.11855000",
            "refund_address":null
          }
        }
      }
  }
}
