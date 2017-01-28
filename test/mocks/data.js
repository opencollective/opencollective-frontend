export default {
  "user1": {
    "firstName": "Phil",
    "lastName": "Mod",
    "name": "Phil Mod",
    "username": "philmod",
    "email": "User1@opencollective.com",
    "paypalEmail": "User1+paypal@opencollective.com",
    "password": "passpass",
    "description": "engineer",
    "longDescription": "This is a long description with some *markdown* **style**",
    "isOrganization": false,
    "twitterHandle": "philmod",
    "billingAddress": "Paradize street\nSan Francisco CA 94100\nUSA"
  },

  "user2": {
    "firstName": "Anish",
    "lastName": "Bas",
    "username": "abas",
    "email": "Xdam@opencollective.com",
    "password": "ssapssap"
  },

  "user3": {
    "firstName": "Xavier",
    "lastName": "Damman",
    "username": "xdamman",
    "email": "User3@opencollective.com",
    "password": "passssap",
    "billingAddress": "Rue du paradis\n1000 Brussels\nBelgium"
  },

  "user4": {
    "firstName": "Bo",
    "lastName": "Ki",
    "username": "boki",
    "email": "user4@opencollective.com",
    "password": "passssas"
  },

  "user5": {
    "firstName": "Bo",
    "lastName": "Ki",
    "username": "boki",
    "email": "uSer5@opencollective.org"
  },

  "user6": {
    "firstName": "internal",
    "lastName": "user",
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
    "tiers": [{
      "name": "backer",
      "title": "Backers",
      "description": "One time tier",
      "range": [0, 100],
      "button": "Become a backer",
      "interval": "one-time"
    }, {
      "name": "sponsor",
      "title":" Sponsors",
      "description": "Monthly tier",
      "range": [50, 10000],
      "interval": "monthly",
      "button": "Become a sponsor"
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
    "settings": {
      "superCollectiveTag": "meetup"
    },
    "isSupercollective": true
  },

  "group5": {
    "name": "Brussels Together",
    "slug": "brusselstogether",
    "settings": {
      "superCollectiveTag": "#brusselstogether"
    },
    "isSupercollective": true
  },

  "relatedGroups": [
    {
      name: 'Reinventing Brussels',
      slug: 'reinventingbrussels',
      mission: 'connect all the initiatives that create a welcoming &amp; sustainable city with deep human values',
      logo: 'https://opencollective-production.s3-us-west-1.amazonaws.com/1738fae0-9a20-11e6-8650-f92e594d5de8.png',
      currency: 'EUR',
      settings: { "style": { "hero": { "cover": { "background": "rgb(36,189,213)" } } } },
      tags: ['#brusselstogether']
    },
    {
      name: 'Refugees Got Talent',
      slug: 'refugeesgottalent',
      mission: 'offer a space and artistic material to refugees artists, so they can practice their art again.',
      logo: 'https://cl.ly/0Q3N193Z1e3u/BrusselsTogetherLogo.png',
      currency: 'EUR',
      tags: ['#brusselstogether']
    },
    {
      name: 'Brussels Smart City',
      slug: 'brusselssmartcity',
      mission: 'improve the life of Brussels Citizens by the use of technology',
      logo: 'https://cl.ly/0Q3N193Z1e3u/BrusselsTogetherLogo.png',
      currency: 'EUR',
      tags: ['#brusselstogether'],
      backgroundImage: 'http://www.hiddendistrict.be/wp-content/uploads/2015/01/Brussels_view-1000x500.jpg'
    }
  ],

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
      {"type": "user.created", "UserId": 1, "data": {"user": {"firstName": "John", "lastName": "Doe", "name": "John Doe", "email": "john@doe.com", "twitterHandle":"johndoe", "websiteUrl": "opencollective.com"}}},
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
        "type": "group.expense.paid",
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
          "donation": {
            "amount": 1234,
            "currency": "EUR"
          },
          "subscription": {
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
        "type": "subscription.canceled",
        "data": {
          "user": {
            "email":"jussi@kuohujoki.fi",
            "twitterHandle": "xdamman"
          },
          "donation": {
            "amount": 1234,
            "currency": "EUR"
          },
          "subscription": {
            "interval": "month",
            "id": 4
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

  "donations": [
      {
        "title": "Donation to that great project",
        "amount": 100,
        "currency": "USD",
        "paypalEmail": "userpaypal@gmail.com",
        "createdAt": "2015-05-29T07:00:00.000Z"
      },
      {
        "title": "Donation to that other great project",
        "amount": 999,
        "currency": "USD",
        "paypalEmail": "userpaypal@gmail.com",
        "createdAt": "2015-05-29T07:00:00.000Z"
      },
      {
        "title": "Donation to that amazing project",
        "amount": 12000,
        "currency": "USD",
        "paypalEmail": "user2paypal@gmail.com",
        "createdAt": "2016-09-29T07:00:00.000Z"
      }
  ],

  "comments": [
    {
      "text": "Where did you buy this?"
    },
    {
      "text": "I think we should go with a V-neck model"
    },
    {
      "text": "No way!"
    }
  ],

  "transactions1": {
    "transactions": [
      {
        "description": "Homepage design",
        "tags": ["consultancy"],
        "amount": -20000,
        "amountInTxnCurrency": -20000,
        "currency": "USD",
        "txnCurrency": "USD",
        "createdAt": "2015-01-23T08:00:00.000Z",
      },
      {
        "description": "Flight SFO-BRU",
        "amount": -91859,
        "currency": "USD",
        "createdAt": "2015-02-22T08:00:00.000Z"
      },
      {
        "description": "Byword",
        "amount": -1199,
        "currency": "USD",
        "createdAt": "2015-03-04T08:00:00.000Z",
      },
      {
        "description": "Tipbox.is domain + dedicated server",
        "amount": -58861,
        "currency": "USD",
        "createdAt": "2015-04-06T07:00:00.000Z"
      },
      {
        "description": "Working lunch with @mdp",
        "tags": ["food"],
        "amount": -3600,
        "currency": "USD",
        "createdAt": "2015-04-07T07:00:00.000Z"
      },
      {
        "description": "Homepage design end",
        "amount": -30000,
        "currency": "USD",
        "createdAt": "2015-04-28T07:00:00.000Z"
      },
      {
        "description": "Homepage frontend code",
        "amount": -30000,
        "currency": "USD",
        "createdAt": "2015-04-29T07:00:00.000Z"
      },
      {
        "description": "Donation to that great project",
        "amount": 999,
        "currency": "USD",
        "createdAt": "2015-05-29T07:00:00.000Z"
      },
      {
        "description": "Donation to that great project",
        "amount": 99900,
        "currency": "USD",
        "paypalEmail": "userpaypal@gmail.com",
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
      "tags": ["Donation"],
      "status": null,
      "comment":null,
      "link": null,
      "createdAt": "2016-01-30T07:31:37.965Z",
      "UserId": 1,
      "GroupId": 1,
      "isExpense": false,
      "isDonation": true
    },

    "user": {
      "id":1,
      "firstName":"Phil",
      "lastName":"Mod",
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
      "slug": "WWCodeAtl",
      "website": "http://scouts.org.uk/home/",
      "twitterHandle": "scouts"
    }
  },
  "subscription1": {
    "amount": 2000,
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
    "paypalEmail": "newPaypal2@gmail.com",
    "incurredAt": "2016-03-06 UTC+0300",
    "payoutMethod": "paypal",
    "attachment": "https://opencollective-production.s3-us-west-1.amazonaws.com/d6618050-82be-11e6-a262-73c13d37e1af.JPG"
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
  },
  "expense3": {
    "title": "Lunch with Jenn",
    "notes": "Some very long and super interesting extra notes for the whole world to see",
    "category": "Engineering",
    "amount": 12000,
    "currency": "USD",
    "incurredAt": "2016-03-06 UTC+0300",
    "payoutMethod": "paypal",
    "attachment": "https://opencollective-production.s3-us-west-1.amazonaws.com/d6618050-82be-11e6-a262-73c13d37e1af.JPG"
  },

  "event1": {
    name: "January meetup",
    slug: "jan-meetup",
    description: "January monthly meetup",
    startsAt: "2017-01-06 UTC+0300",
    endsAt: "2017-01-07 UTC+300",
    locationName: "Balanced NYC",
    address: "547 Broadway, NY 10012",
    backgroundImage: "http://opencollective.com/backgroundimage.png",
    maxQuantity: 200,
    geoLocationLatLong: { type: 'Point', coordinates: [39.807222,-76.984722]}
  },

  "event2": {
    name: "Feb meetup",
    slug: "feb-meetup",
    description: "February monthly meetup",
    startsAt: "2017-02-06 UTC+0300",
    endsAt: "2017-02-07 UTC+300",
    locationName: "Puck Fair",
    address: "505 Broadway, NY 10012",
  },

  "tier1": {
    name: "Free tier",
    description: "free tickets for all",
    amount: 0,
    currency: "USD",
    maxQuantity: 10,
  },

  "tier2": {
    name: "paid tier",
    description: "$20 ticket",
    amount: 2000,
    currency: "USD",
    maxQuantity: 100
  },

  "response1": {
    status: "INTERESTED",
    quantity: 1,
    description: "I work on bitcoin"
  },

  "response2": {
    status: "YES",
    quantity: 2,
    description: "I have been working on open source for over a decade"
  },

  "response3": {
    status: "NO",
    quantity: 2
  }
}
