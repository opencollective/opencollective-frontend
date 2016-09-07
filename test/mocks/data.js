export default {
  "applicationSuper": {
    "name": "webapp",
    "api_key": "0ac43519edcf4421d80342403fb5985d",
    "_access": 1
  },

  "application2": {
    "name": "tipbox_app",
    "api_key": "920cb291778adad8a563f488239968b4"
  },

  "application3": {
    "name": "scouts_app",
    "api_key": "1c96ce6b1119bec18e4a4680d25883da",
    "_access": 0.5
  },

  "user1": {
    "name": "Phil Mod",
    "username": "philmod",
    "email": "User1@opencollective.com",
    "paypalEmail": "User1+paypal@opencollective.com",
    "password": "passpass",
    "description": "engineer",
    "longDescription": "This is a long description with some *markdown* **style**",
    "isOrganization": false,
    "twitterHandle": "philmod"
  },

  "user2": {
    "name": "Anish Bas",
    "username": "abas",
    "email": "Xdam@opencollective.com",
    "password": "ssapssap"
  },

  "user3": {
    "name": "Xavier Damman",
    "username": "xdamman",
    "email": "User3@opencollective.com",
    "password": "passssap"
  },

  "user4": {
    "name": "Bo Ki",
    "username": "boki",
    "email": "User4@opencollective.com",
    "password": "passssas"
  },

  "user5": {
    "name": "Bo Ki",
    "username": "boki",
    "email": "uSer5@opencollective.org"
  },

  "user6": {
    "name": "internal user",
    "username": "interno",
    "email": "internal_user@opencollective.com"
  },

  "group1": {
    "name": "Scouts d'Arlon",
    "mission": "toujours prêt",
    "description": "Troupe Scoute Albert Schweitzer",
    "budget": 1000000,
    "burnrate": 10000,
    "twitterHandle": "scouts",
    "website": "http://scouts.org.uk/home/",
    "slug": "scouts",
    "isPublic": true,
    "tiers": [{
      "name": "backer",
      "title": "Backers",
      "description": "One time tier",
      "range": [0, 100],
      "button": "Become a sponsor",
      "interval": "one-time"
    }, {
      "name": "sponsor",
      "title":" Sponsors",
      "description": "Monthly tier",
      "range": [50, 10000],
      "interval": "monthly",
      "button": "Become a member"
    }],
    "hostFeePercent": 10,
    "tags": ["open source", "test"],
    "isSupercollective": false
  },

  "group2": {
    "name": "WWCode Austin",
    "slug": "wwcode-austin",
    "mission": "more women in tech",
    "website": "http://womenwhocode.com",
    "currency": "EUR",
    "budget": 1000000,
    "burnrate": 1000,
    "isPublic": false,
    "tiers": [{
      "name": "donor",
      "title": "Donors",
      "description": "One time tier",
      "range": [0, 100],
      "interval": "one-time",
      "button": "Become a sponsor"
    }, {
      "name": "sponsor",
      "title": "Sponsors",
      "description": "Monthly tier",
      "range": [0, 100],
      "interval": "monthly",
      "button": "Become a member"
    }],
    "hostFeePercent": 0,
    "tags": ["meetup", "test"],
    "isSupercollective": false
  },

  "group3": {
    "name": "Yeoman"
  },

  "group4": {
    "name": "Open source collective",
    "slug": "meetups",
    "isPublic": true,
    "settings": {
      "superCollectiveTag": "meetup"
    },
    "isSupercollective": true
  },

  "paymentMethod1": {
    "token": "PA-1B0110758V169653C",
    "service": "paypal"
  },

  "paymentMethod2": {
    "token": "stripetoken123",
    "service": "stripe",
    "customerId": "cus_123"
  },

  "activities1": {
    "activities": [
      {"type": "user.created", "UserId": 1, "data": {"user": {"name": "john doe", "email": "john@doe.com", "twitterHandle":"johndoe", "websiteUrl": "opencollective.com"}}},
      {"type": "user.created", "UserId": 2, "data": {"user": {"email": "john@doe.com"}}},
      {"type": "user.created", "UserId": 3, "data": {}},
      {"type": "group.created", "UserId": 1, "GroupId": 1, "data": {}},
      {"type": "group.user.added", "UserId": 1, "GroupId": 1, "data": {}},
      {"type": "group.user.added", "UserId": 3, "GroupId": 1, "data": {}},
      {"type": "group.updated", "UserId": 1, "GroupId": 1, "data": {}},
      {"type": "group.updated", "UserId": 3, "GroupId": 1, "data": {}},
      {"type": "group.updated", "UserId": 1, "GroupId": 1, "data": {}},
      {"type": "group.updated", "UserId": 3, "GroupId": 1, "data": {}},
      {"type": "group.updated", "UserId": 1, "GroupId": 1, "data": {}},
      {"type": "group.deleted", "UserId": 3, "GroupId": 1, "data": {}},
      {
        "type": "group.transaction.created",
        "userId": 3,
        "GroupId": 1,
        "data": {
          "user": {
            "email":"john@doe.com"
            },
          "transaction": {
            "isDonation": true,
            "amount":10.42,
            "currency": "USD"
            },
          "group": {
            "name": "Pub quiz",
            "slug": "pubquiz",
            "publicUrl": "https://opencollective.com/pubquiz"
          }
        }
      },
      {
        "type": "group.transaction.created",
        "userId": 3,
        "GroupId": 1,
        "data": {
          "user":{
            "email":"john@doe.com"
            },
          "transaction": {
            "isExpense": true,
            "amount":-12.98,
            "currency": "USD",
            "description": "pizza"
            },
          "group": {
            "name": "Pub quiz",
            "slug": "pubquiz",
            "publicUrl": "https://opencollective.com/pubquiz"
          }
        }
      },
      {
        "type": "group.transaction.paid",
        "userId": 3,
        "GroupId": 1,
        "data": {
          "user":{
            "email":"john@doe.com"
            },
          "transaction": {
            "isExpense": true,
            "amount":-12.98,
            "currency": "USD",
            "description": "pizza"
            },
          "group": {
            "name": "Pub quiz",
            "slug": "pubquiz",
            "publicUrl": "https://opencollective.com/pubquiz"
          },
          "preapprovalDetails": {
            "maxTotalAmountOfAllPayments": 200,
            "curPaymentsAmount": 50
          }
        }
      },
      {
        "type": "webhook.stripe.received",
        "data": {
          "event": {
            "type": "invoice.payment_succeeded"
          }
        }
      },
      {
        "type": "subscription.confirmed",
        "data": {
          "user": {
            "email":"jussi@kuohujoki.fi"
          },
          "transaction": {
            "amount": 12.34,
            "currency": "EUR"
          },
          "group": {
            "name": "Blah",
            "slug": "blah",
            "publicUrl": "https://opencollective.com/blah"
          }
        }
      },
      {
        "type": "subscription.confirmed",
        "data": {
          "user": {
            "email":"jussi@kuohujoki.fi",
            "twitterHandle": "xdamman"
          },
          "transaction": {
            "amount": 12.34,
            "currency": "EUR",
            "interval": "month"
          },
          "group": {
            "name": "Yeoman",
            "slug": "yeoman",
            "twitterHandle": "yeoman",
            "publicUrl": "https://opencollective.com/yeoman"
          }
        }
      },
      {
        "type": "group.created",
        "data": {
          "user": {
            "email":"jussi@kuohujoki.fi"
          },
          "group": {
            "name": "Blah",
            "slug": "blah",
            "publicUrl": "https://opencollective.com/blah"
          }
        }
      },
      {
        "type": "group.user.added",
        "data": {
          "user": {
            "avatar": "http://avatar.githubusercontent.com/asood123",
            "id": 2
          },
          "group": {
            "name": "Blah",
            "slug": "blah",
            "publicUrl": "https://opencollective.com/blah"
          }
        }
      },
      {
        "type": "group.expense.created",
        "data": {
          "user": {
            "avatar": "http://avatar.githubusercontent.com/asood123",
            "id": 2
          },
          "group": {
            "name": "Blah",
            "publicUrl": "blah.com"
          },
          "expense": {
            "amount": 12.34,
            "currency": "EUR",
            "title": "for pizza"
          }
        }
      },
      {
        "type": "group.expense.rejected",
        "data": {
          "user": {
            "avatar": "http://avatar.githubusercontent.com/asood123",
            "id": 2
          },
          "group": {
            "name": "Blah",
            "publicUrl": "blah.com"
          },
          "expense": {
            "amount": 12.34,
            "currency": "EUR",
            "title": "for pizza",
            "lastEditedById": 2
          }
        }
      },
      {
        "type": "group.expense.approved",
        "data": {
          "user": {
            "avatar": "http://avatar.githubusercontent.com/asood123",
            "id": 2
          },
          "group": {
            "name": "Blah",
            "publicUrl": "blah.com"
          },
          "expense": {
            "amount": 12.34,
            "currency": "EUR",
            "title": "for pizza",
            "lastEditedById": 2
          }
        }
      }
    ]
  },

  "transactions1": {
    "transactions": [
      {
        "description": "Homepage design",
        "tags": ["consultancy"],
        "amount": -200.00,
        "amountInTxnCurrency": -200.00,
        "currency": "USD",
        "txnCurrency": "USD",
        "vat": 0.20,
        "paidby": "@xdamman",
        "status": "paid back on 4/17/15",
        "comment": "this is the reason why I bought this",
        "link": "https://opencollective-production.s3-us-west-1.amazonaws.com/Invoice_14417_OpenCollectivepdf_a1b3cfa0-c0ce-11e5-ab37-9d9c8fc41dba.pdf",
        "createdAt": "2015-01-23T08:00:00.000Z",
        "payoutMethod": "paypal"
      },
      {
        "description": "Flight SFO-BRU",
        "tags": ["travel"],
        "amount": -918.59,
        "currency": "USD",
        "paidby": "@xdamman",
        "status": "paid back on 4/17/15",
        "comment": "",
        "link": "https://www.dropbox.com/s/2egws2rq0kvreei/2015-04-06%2016.04.50.jpg?dl=0",
        "createdAt": "2015-02-22T08:00:00.000Z"
      },
      {
        "description": "Byword",
        "tags": ["software"],
        "amount": -11.99,
        "currency": "USD",
        "paidby": "@xdamman",
        "status": "paid back on 4/17/15",
        "comment": "",
        "link": "http://cl.ly/image/39212o302x2c",
        "createdAt": "2015-03-04T08:00:00.000Z",
        "payoutMethod": "paypal"
      },
      {
        "description": "Tipbox.is domain + dedicated server",
        "tags": ["hosting"],
        "amount": -588.61,
        "currency": "USD",
        "paidby": "@xdamman",
        "status": "paid back on 4/17/15",
        "comment": "",
        "link": "http://cl.ly/image/1B25353p221L",
        "createdAt": "2015-04-06T07:00:00.000Z"
      },
      {
        "description": "Working lunch with @mdp",
        "tags": ["food"],
        "amount": -36.00,
        "currency": "USD",
        "paidby": "@xdamman",
        "status": "paid back on 4/17/15",
        "comment": "",
        "link": "https://www.dropbox.com/s/pxoi887e71923z9/2015-04-07%2012.59.10.jpg?dl=0",
        "createdAt": "2015-04-07T07:00:00.000Z"
      },
      {
        "description": "Homepage design end",
        "tags": ["consultancy"],
        "amount": -300.00,
        "currency": "USD",
        "paidby": "@xdamman",
        "status": "waiting for KF reimbursement",
        "comment": "",
        "link": "",
        "createdAt": "2015-04-28T07:00:00.000Z"
      },
      {
        "description": "Homepage frontend code",
        "tags": ["consultancy"],
        "amount": -300.00,
        "currency": "USD",
        "paidby": "@xdamman",
        "status": "waiting for KF reimbursement",
        "comment": "",
        "link": "",
        "createdAt": "2015-04-29T07:00:00.000Z"
      },
      {
        "description": "Donation to that great project",
        "tags": ["donation"],
        "amount": 9.99,
        "currency": "USD",
        "paypalEmail": "userpaypal@gmail.com",
        "comment": "",
        "link": "",
        "createdAt": "2015-05-29T07:00:00.000Z"
      },
      {
        "description": "Donation to that great project",
        "tags": ["donation"],
        "amount": 999,
        "currency": "USD",
        "paypalEmail": "userpaypal@gmail.com",
        "comment": "",
        "link": "",
        "createdAt": "2015-05-29T07:00:00.000Z",
        "PaymentMethodId": 1
      }
    ]
  },

  "emailData": {
    "transaction": {
      "id": 1,
      "type": "payment",
      "description": "Donation to Scouts d'Arlon",
      "amount": 10.99,
      "vat": null,
      "currency": "USD",
      "paidby": "1",
      "tags": ["Donation"],
      "status": null,
      "comment":null,
      "link": null,
      "approved": true,
      "createdAt": "2016-01-30T07:31:37.965Z",
      "approvedAt": null,
      "reimbursedAt": null,
      "UserId": 1,
      "GroupId": 1,
      "payoutMethod": null,
      "isExpense": false,
      "isRejected": false,
      "isDonation": true,
      "isManual": false,
      "isReimbursed": false
    },

    "user": {
      "id":1,
      "name":"Phil Mod",
      "username":"philmod",
      "email":"user1@opencollective.com",
      "avatar":null,
      "twitterHandle":"philmod",
      "website":"http://startupmanifesto.be",
      "description": "engineer",
      "isOrganization": false,
      "createdAt":"2016-01-30T07:31:37.747Z",
      "updatedAt":"2016-01-30T07:31:37.889Z",
      "paypalEmail":"philmod+paypal@email.com"
    },

    "group": {
      "id": 1,
      "name": "Scouts d'Arlon",
      "mission": "toujours prêt",
      "description": "Troupe Scoute Albert Schweitzer",
      "longDescription": null,
      "budget": 100000,
      "burnrate": 1000,
      "currency": "USD",
      "logo": "http://photos4.meetupstatic.com/photos/event/9/a/f/a/highres_18399674.jpeg",
      "video": null,
      "image": null,
      "backgroundImage": null,
      "expensePolicy": null,
      "createdAt": "2016-01-30T07:31:37.802Z",
      "updatedAt": "2016-01-30T07:31:37.802Z",
      "isPublic": false,
      "slug": "WWCodeAtl",
      "website": "http://scouts.org.uk/home/",
      "twitterHandle": "scouts"
    }
  },
  "subscription1": {
    "amount": 20,
    "currency": "EUR",
    "interval": "month",
    "isActive": true,
    "stripeSubscriptionId": "sub_tokentest"
  },
  "expense1": {
    "title": "Lunch with Jenn",
    "notes": "Some very long and super interesting extra notes for the whole world to see",
    "category": "Engineering",
    "amount": 12000,
    "currency": "USD",
    "paypalEmail": "uSerpaypal@gmail.com",
    "incurredAt": "2016-03-06 UTC+0300",
    "payoutMethod": "paypal"
  },
  "expense2": {
    "title": "tshirts",
    "notes": "longgggg note",
    "category": "Engineering",
    "amount": 3737,
    "currency": "USD",
    "paypalEmail": "Userpaypal2@gmail.com",
    "incurredAt": "2016-03-09 UTC+0300",
    "payoutMethod": "manual"
  }
}
