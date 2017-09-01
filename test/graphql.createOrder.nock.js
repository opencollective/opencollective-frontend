import nock from 'nock';

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "card%5Bnumber%5D=4242424242424242&card%5Bexp_month%5D=12&card%5Bexp_year%5D=2028&card%5Bcvc%5D=222")
  .reply(200, {"id":"tok_1AxKT2DjPFcHOcTmfCxCpyZP","object":"token","card":{"id":"card_1AxKT1DjPFcHOcTmOKGr2Yjz","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"unchecked","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292772,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:12 GMT',
  'content-type': 'application/json',
  'content-length': '782',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_cTieVet9EuS0Bq',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('http://api.fixer.io:80')
  .get('/latest')
  .query({"base":"EUR","symbols":"USD"})
  .reply(200, {"base":"EUR","date":"2017-09-01","rates":{"USD":1.192}}, { server: 'nginx/1.11.13',
  date: 'Fri, 01 Sep 2017 19:06:13 GMT',
  'content-type': 'application/json',
  'content-length': '56',
  connection: 'close',
  'cache-control': 'public, must-revalidate, max-age=900',
  'last-modified': 'Fri, 01 Sep 2017 00:00:00 GMT',
  vary: 'Origin',
  'x-content-type-options': 'nosniff' });

nock('https://api.stripe.com:443')
  .post('/v1/customers', "source=tok_1AxKT2DjPFcHOcTmfCxCpyZP&description=https%3A%2F%2Fopencollective.com%2Fjsmith&email=jsmith%40email.com")
  .reply(200, {"id":"cus_BJyPTmamzhTAA6","object":"customer","account_balance":0,"created":1504292774,"currency":null,"default_source":"card_1AxKT1DjPFcHOcTmOKGr2Yjz","delinquent":false,"description":"https://opencollective.com/jsmith","discount":null,"email":"jsmith@email.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1AxKT1DjPFcHOcTmOKGr2Yjz","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":"cus_BJyPTmamzhTAA6","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BJyPTmamzhTAA6/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BJyPTmamzhTAA6/subscriptions"}}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:14 GMT',
  'content-type': 'application/json',
  'content-length': '1425',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_ZTNBFRGt7kIkO5',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "customer=cus_BJyPTmamzhTAA6")
  .reply(200, {"id":"tok_1AxKT5D8MNtzsDcgvYij5uhg","object":"token","card":{"id":"card_1AxKT5D8MNtzsDcgJDLbUaL1","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292775,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:15 GMT',
  'content-type': 'application/json',
  'content-length': '777',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_PUOgJxpgfpk6YV',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/charges', "amount=154300&currency=EUR&source=tok_1AxKT5D8MNtzsDcgvYij5uhg&description=Donation%20to%20BrusselsTogether%20(donor)&application_fee=7715&metadata%5Bfrom%5D=http%3A%2F%2Flocalhost%3A3030%2Fjsmith&metadata%5Bto%5D=http%3A%2F%2Flocalhost%3A3030%2Fbrusselstogether&metadata%5BcustomerEmail%5D=jsmith%40email.com&metadata%5BPaymentMethodId%5D=4168")
  .reply(200, {"id":"ch_1AxKT5D8MNtzsDcg8rQ3dhmS","object":"charge","amount":154300,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1AxKT5D8MNtzsDcglgMkSN8N","balance_transaction":"txn_1AxKT5D8MNtzsDcgnrbjh49r","captured":true,"created":1504292775,"currency":"eur","customer":null,"description":"Donation to BrusselsTogether (donor)","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"http://localhost:3030/jsmith","to":"http://localhost:3030/brusselstogether","customerEmail":"jsmith@email.com","PaymentMethodId":"4168"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1AxKT5D8MNtzsDcg8rQ3dhmS/refunds"},"review":null,"shipping":null,"source":{"id":"card_1AxKT5D8MNtzsDcgJDLbUaL1","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:16 GMT',
  'content-type': 'application/json',
  'content-length': '2006',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_cZjFceiGzZSMTy',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/balance/history/txn_1AxKT5D8MNtzsDcgnrbjh49r')
  .reply(200, {"id":"txn_1AxKT5D8MNtzsDcgnrbjh49r","object":"balance_transaction","amount":154300,"available_on":1504828800,"created":1504292775,"currency":"eur","description":"Donation to BrusselsTogether (donor)","fee":12215,"fee_details":[{"amount":4500,"application":null,"currency":"eur","description":"Stripe processing fees","type":"stripe_fee"},{"amount":7715,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","currency":"eur","description":"OpenCollective application fee","type":"application_fee"}],"net":142085,"source":"ch_1AxKT5D8MNtzsDcg8rQ3dhmS","sourced_transfers":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers?source_transaction=ch_1AxKT5D8MNtzsDcg8rQ3dhmS"},"status":"pending","type":"charge"}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:16 GMT',
  'content-type': 'application/json',
  'content-length': '928',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_KB5hKCiZOZ8gzK',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/charges/ch_1AxKT5D8MNtzsDcg8rQ3dhmS')
  .reply(200, {"id":"ch_1AxKT5D8MNtzsDcg8rQ3dhmS","object":"charge","amount":154300,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1AxKT5D8MNtzsDcglgMkSN8N","balance_transaction":"txn_1AxKT5D8MNtzsDcgnrbjh49r","captured":true,"created":1504292775,"currency":"eur","customer":null,"description":"Donation to BrusselsTogether (donor)","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"http://localhost:3030/jsmith","to":"http://localhost:3030/brusselstogether","customerEmail":"jsmith@email.com","PaymentMethodId":"4168"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1AxKT5D8MNtzsDcg8rQ3dhmS/refunds"},"review":null,"shipping":null,"source":{"id":"card_1AxKT5D8MNtzsDcgJDLbUaL1","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:17 GMT',
  'content-type': 'application/json',
  'content-length': '2006',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_4antQsVa6XRDzj',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "card%5Bnumber%5D=4242424242424242&card%5Bexp_month%5D=12&card%5Bexp_year%5D=2028&card%5Bcvc%5D=222")
  .reply(200, {"id":"tok_1AxKTFDjPFcHOcTmXfeIlswP","object":"token","card":{"id":"card_1AxKTEDjPFcHOcTmrI7GIz4f","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"unchecked","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292785,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:25 GMT',
  'content-type': 'application/json',
  'content-length': '782',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_kzl7F69BPEkskT',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('http://api.fixer.io:80')
  .get('/latest')
  .query({"base":"EUR","symbols":"USD"})
  .reply(200, {"base":"EUR","date":"2017-09-01","rates":{"USD":1.192}}, { server: 'nginx/1.11.13',
  date: 'Fri, 01 Sep 2017 19:06:25 GMT',
  'content-type': 'application/json',
  'content-length': '56',
  connection: 'close',
  'cache-control': 'public, must-revalidate, max-age=900',
  'last-modified': 'Fri, 01 Sep 2017 00:00:00 GMT',
  vary: 'Origin',
  'x-content-type-options': 'nosniff' });

nock('https://api.stripe.com:443')
  .post('/v1/customers', "source=tok_1AxKTFDjPFcHOcTmXfeIlswP&description=https%3A%2F%2Fopencollective.com%2Fxdamman&email=fd81e8b367fee82f45af1816e5ec9147%40gmail.com")
  .reply(200, {"id":"cus_BJyQ3EVC7JrNwk","object":"customer","account_balance":0,"created":1504292786,"currency":null,"default_source":"card_1AxKTEDjPFcHOcTmrI7GIz4f","delinquent":false,"description":"https://opencollective.com/xdamman","discount":null,"email":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1AxKTEDjPFcHOcTmrI7GIz4f","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":"cus_BJyQ3EVC7JrNwk","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BJyQ3EVC7JrNwk/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BJyQ3EVC7JrNwk/subscriptions"}}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:26 GMT',
  'content-type': 'application/json',
  'content-length': '1452',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_EjkCewkpinIHw5',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "customer=cus_BJyQ3EVC7JrNwk")
  .reply(200, {"id":"tok_1AxKTHD8MNtzsDcgo0VrtcqF","object":"token","card":{"id":"card_1AxKTHD8MNtzsDcgHNgqWc0p","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292787,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:27 GMT',
  'content-type': 'application/json',
  'content-length': '777',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_jZU7O10nsdGLVT',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/charges', "amount=154300&currency=EUR&source=tok_1AxKTHD8MNtzsDcgo0VrtcqF&description=Donation%20to%20BrusselsTogether%20(donor)&application_fee=7715&metadata%5Bfrom%5D=http%3A%2F%2Flocalhost%3A3030%2Fxdamman&metadata%5Bto%5D=http%3A%2F%2Flocalhost%3A3030%2Fbrusselstogether&metadata%5BcustomerEmail%5D=fd81e8b367fee82f45af1816e5ec9147%40gmail.com&metadata%5BPaymentMethodId%5D=4167")
  .reply(200, {"id":"ch_1AxKTID8MNtzsDcgGnof1E6E","object":"charge","amount":154300,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1AxKTID8MNtzsDcgqKurBIIp","balance_transaction":"txn_1AxKTID8MNtzsDcgamyXbheG","captured":true,"created":1504292788,"currency":"eur","customer":null,"description":"Donation to BrusselsTogether (donor)","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"http://localhost:3030/xdamman","to":"http://localhost:3030/brusselstogether","customerEmail":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","PaymentMethodId":"4167"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1AxKTID8MNtzsDcgGnof1E6E/refunds"},"review":null,"shipping":null,"source":{"id":"card_1AxKTHD8MNtzsDcgHNgqWc0p","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:29 GMT',
  'content-type': 'application/json',
  'content-length': '2033',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_85mWhnLh5AFc61',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/balance/history/txn_1AxKTID8MNtzsDcgamyXbheG')
  .reply(200, {"id":"txn_1AxKTID8MNtzsDcgamyXbheG","object":"balance_transaction","amount":154300,"available_on":1504828800,"created":1504292788,"currency":"eur","description":"Donation to BrusselsTogether (donor)","fee":12215,"fee_details":[{"amount":4500,"application":null,"currency":"eur","description":"Stripe processing fees","type":"stripe_fee"},{"amount":7715,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","currency":"eur","description":"OpenCollective application fee","type":"application_fee"}],"net":142085,"source":"ch_1AxKTID8MNtzsDcgGnof1E6E","sourced_transfers":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers?source_transaction=ch_1AxKTID8MNtzsDcgGnof1E6E"},"status":"pending","type":"charge"}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:29 GMT',
  'content-type': 'application/json',
  'content-length': '928',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_0YHFlTn97PINkV',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/charges/ch_1AxKTID8MNtzsDcgGnof1E6E')
  .reply(200, {"id":"ch_1AxKTID8MNtzsDcgGnof1E6E","object":"charge","amount":154300,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1AxKTID8MNtzsDcgqKurBIIp","balance_transaction":"txn_1AxKTID8MNtzsDcgamyXbheG","captured":true,"created":1504292788,"currency":"eur","customer":null,"description":"Donation to BrusselsTogether (donor)","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"http://localhost:3030/xdamman","to":"http://localhost:3030/brusselstogether","customerEmail":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","PaymentMethodId":"4167"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1AxKTID8MNtzsDcgGnof1E6E/refunds"},"review":null,"shipping":null,"source":{"id":"card_1AxKTHD8MNtzsDcgHNgqWc0p","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:30 GMT',
  'content-type': 'application/json',
  'content-length': '2033',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_5OONu0L1thWse7',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "card%5Bnumber%5D=4242424242424242&card%5Bexp_month%5D=12&card%5Bexp_year%5D=2028&card%5Bcvc%5D=222")
  .reply(200, {"id":"tok_1AxKTRDjPFcHOcTmmOJe3XqM","object":"token","card":{"id":"card_1AxKTRDjPFcHOcTmJrmwggZr","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"unchecked","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292797,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:37 GMT',
  'content-type': 'application/json',
  'content-length': '782',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_LANBPkKCSC7P3c',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/customers', "source=tok_1AxKTRDjPFcHOcTmmOJe3XqM&description=https%3A%2F%2Fopencollective.com%2Fundefined&email=")
  .reply(200, {"id":"cus_BJyQCvyvaeXZw0","object":"customer","account_balance":0,"created":1504292797,"currency":null,"default_source":"card_1AxKTRDjPFcHOcTmJrmwggZr","delinquent":false,"description":"https://opencollective.com/undefined","discount":null,"email":null,"livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1AxKTRDjPFcHOcTmJrmwggZr","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":"cus_BJyQCvyvaeXZw0","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BJyQCvyvaeXZw0/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BJyQCvyvaeXZw0/subscriptions"}}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:38 GMT',
  'content-type': 'application/json',
  'content-length': '1414',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_gIx34rNlsHhqSc',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('http://api.fixer.io:80')
  .get('/latest')
  .query({"base":"EUR","symbols":"USD"})
  .reply(200, {"base":"EUR","date":"2017-09-01","rates":{"USD":1.192}}, { server: 'nginx/1.11.13',
  date: 'Fri, 01 Sep 2017 19:06:39 GMT',
  'content-type': 'application/json',
  'content-length': '56',
  connection: 'close',
  'cache-control': 'public, must-revalidate, max-age=900',
  'last-modified': 'Fri, 01 Sep 2017 00:00:00 GMT',
  vary: 'Origin',
  'x-content-type-options': 'nosniff' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "customer=cus_BJyQCvyvaeXZw0")
  .reply(200, {"id":"tok_1AxKTTD8MNtzsDcg96oBoHNz","object":"token","card":{"id":"card_1AxKTTD8MNtzsDcga9hXPAN4","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292799,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:39 GMT',
  'content-type': 'application/json',
  'content-length': '777',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_wlJVmLaQknxYjz',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/charges', "amount=154300&currency=EUR&source=tok_1AxKTTD8MNtzsDcg96oBoHNz&description=Donation%20to%20BrusselsTogether%20(donor)&application_fee=7715&metadata%5Bfrom%5D=http%3A%2F%2Flocalhost%3A3030%2Fxdamman&metadata%5Bto%5D=http%3A%2F%2Flocalhost%3A3030%2Fbrusselstogether&metadata%5BcustomerEmail%5D=fd81e8b367fee82f45af1816e5ec9147%40gmail.com&metadata%5BPaymentMethodId%5D=4167")
  .reply(200, {"id":"ch_1AxKTUD8MNtzsDcgHZvcumEW","object":"charge","amount":154300,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1AxKTUD8MNtzsDcgAZfB9A27","balance_transaction":"txn_1AxKTUD8MNtzsDcgobnIYezy","captured":true,"created":1504292800,"currency":"eur","customer":null,"description":"Donation to BrusselsTogether (donor)","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"http://localhost:3030/xdamman","to":"http://localhost:3030/brusselstogether","customerEmail":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","PaymentMethodId":"4167"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1AxKTUD8MNtzsDcgHZvcumEW/refunds"},"review":null,"shipping":null,"source":{"id":"card_1AxKTTD8MNtzsDcga9hXPAN4","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:40 GMT',
  'content-type': 'application/json',
  'content-length': '2033',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_7AjvIgSmNyRaO3',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/balance/history/txn_1AxKTUD8MNtzsDcgobnIYezy')
  .reply(200, {"id":"txn_1AxKTUD8MNtzsDcgobnIYezy","object":"balance_transaction","amount":154300,"available_on":1504828800,"created":1504292800,"currency":"eur","description":"Donation to BrusselsTogether (donor)","fee":12215,"fee_details":[{"amount":7715,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","currency":"eur","description":"OpenCollective application fee","type":"application_fee"},{"amount":4500,"application":null,"currency":"eur","description":"Stripe processing fees","type":"stripe_fee"}],"net":142085,"source":"ch_1AxKTUD8MNtzsDcgHZvcumEW","sourced_transfers":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers?source_transaction=ch_1AxKTUD8MNtzsDcgHZvcumEW"},"status":"pending","type":"charge"}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:41 GMT',
  'content-type': 'application/json',
  'content-length': '928',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_ERxvuOvFFGS1r4',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/charges/ch_1AxKTUD8MNtzsDcgHZvcumEW')
  .reply(200, {"id":"ch_1AxKTUD8MNtzsDcgHZvcumEW","object":"charge","amount":154300,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1AxKTUD8MNtzsDcgAZfB9A27","balance_transaction":"txn_1AxKTUD8MNtzsDcgobnIYezy","captured":true,"created":1504292800,"currency":"eur","customer":null,"description":"Donation to BrusselsTogether (donor)","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"http://localhost:3030/xdamman","to":"http://localhost:3030/brusselstogether","customerEmail":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","PaymentMethodId":"4167"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1AxKTUD8MNtzsDcgHZvcumEW/refunds"},"review":null,"shipping":null,"source":{"id":"card_1AxKTTD8MNtzsDcga9hXPAN4","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:42 GMT',
  'content-type': 'application/json',
  'content-length': '2033',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_Nh0GlcfCD8aZyv',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "card%5Bnumber%5D=4242424242424242&card%5Bexp_month%5D=12&card%5Bexp_year%5D=2028&card%5Bcvc%5D=222")
  .reply(200, {"id":"tok_1AxKTdDjPFcHOcTmA8wkYgpR","object":"token","card":{"id":"card_1AxKTcDjPFcHOcTmCJm1HfAw","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"unchecked","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292809,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:49 GMT',
  'content-type': 'application/json',
  'content-length': '782',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_PUkIFKU9ewHumc',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('http://api.fixer.io:80')
  .get('/latest')
  .query({"base":"EUR","symbols":"USD"})
  .reply(200, {"base":"EUR","date":"2017-09-01","rates":{"USD":1.192}}, { server: 'nginx/1.11.13',
  date: 'Fri, 01 Sep 2017 19:06:49 GMT',
  'content-type': 'application/json',
  'content-length': '56',
  connection: 'close',
  'cache-control': 'public, must-revalidate, max-age=900',
  'last-modified': 'Fri, 01 Sep 2017 00:00:00 GMT',
  vary: 'Origin',
  'x-content-type-options': 'nosniff' });

nock('https://api.stripe.com:443')
  .post('/v1/customers', "source=tok_1AxKTdDjPFcHOcTmA8wkYgpR&description=https%3A%2F%2Fopencollective.com%2Fxdamman&email=fd81e8b367fee82f45af1816e5ec9147%40gmail.com")
  .reply(200, {"id":"cus_BJyQ7nTUwrMxHM","object":"customer","account_balance":0,"created":1504292810,"currency":null,"default_source":"card_1AxKTcDjPFcHOcTmCJm1HfAw","delinquent":false,"description":"https://opencollective.com/xdamman","discount":null,"email":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1AxKTcDjPFcHOcTmCJm1HfAw","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":"cus_BJyQ7nTUwrMxHM","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BJyQ7nTUwrMxHM/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BJyQ7nTUwrMxHM/subscriptions"}}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:50 GMT',
  'content-type': 'application/json',
  'content-length': '1452',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_UL7AW40cI1Yv3N',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "customer=cus_BJyQ7nTUwrMxHM")
  .reply(200, {"id":"tok_1AxKTfD8MNtzsDcgCWYKPPyf","object":"token","card":{"id":"card_1AxKTfD8MNtzsDcgnonW3zaf","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292811,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:51 GMT',
  'content-type': 'application/json',
  'content-length': '777',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_nB86cod3HIQ9Cc',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/charges', "amount=1000&currency=EUR&source=tok_1AxKTfD8MNtzsDcgCWYKPPyf&description=Monthly%20donation%20to%20BrusselsTogether%20(donor)&application_fee=50&metadata%5Bfrom%5D=http%3A%2F%2Flocalhost%3A3030%2Fxdamman&metadata%5Bto%5D=http%3A%2F%2Flocalhost%3A3030%2Fbrusselstogether&metadata%5BcustomerEmail%5D=fd81e8b367fee82f45af1816e5ec9147%40gmail.com&metadata%5BPaymentMethodId%5D=4167")
  .reply(200, {"id":"ch_1AxKTfD8MNtzsDcgLkWZ9E2d","object":"charge","amount":1000,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1AxKTgD8MNtzsDcg8rQGp2sK","balance_transaction":"txn_1AxKTgD8MNtzsDcgext1znat","captured":true,"created":1504292811,"currency":"eur","customer":null,"description":"Monthly donation to BrusselsTogether (donor)","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"http://localhost:3030/xdamman","to":"http://localhost:3030/brusselstogether","customerEmail":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","PaymentMethodId":"4167"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1AxKTfD8MNtzsDcgLkWZ9E2d/refunds"},"review":null,"shipping":null,"source":{"id":"card_1AxKTfD8MNtzsDcgnonW3zaf","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:52 GMT',
  'content-type': 'application/json',
  'content-length': '2039',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_aZ9BYfBSbJDyP0',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/balance/history/txn_1AxKTgD8MNtzsDcgext1znat')
  .reply(200, {"id":"txn_1AxKTgD8MNtzsDcgext1znat","object":"balance_transaction","amount":1000,"available_on":1504828800,"created":1504292811,"currency":"eur","description":"Monthly donation to BrusselsTogether (donor)","fee":104,"fee_details":[{"amount":54,"application":null,"currency":"eur","description":"Stripe processing fees","type":"stripe_fee"},{"amount":50,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","currency":"eur","description":"OpenCollective application fee","type":"application_fee"}],"net":896,"source":"ch_1AxKTfD8MNtzsDcgLkWZ9E2d","sourced_transfers":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers?source_transaction=ch_1AxKTfD8MNtzsDcgLkWZ9E2d"},"status":"pending","type":"charge"}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:53 GMT',
  'content-type': 'application/json',
  'content-length': '925',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_BXCkcVLxrCz9g1',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/plans/EUR-MONTH-1000')
  .reply(200, {"id":"EUR-MONTH-1000","object":"plan","amount":1000,"created":1503518941,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-1000","statement_descriptor":null,"trial_period_days":null}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:53 GMT',
  'content-type': 'application/json',
  'content-length': '287',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_rG6m4QfNVoiuoa',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "customer=cus_BJyQ7nTUwrMxHM")
  .reply(200, {"id":"tok_1AxKTiD8MNtzsDcgCDfLCOCX","object":"token","card":{"id":"card_1AxKTiD8MNtzsDcg6Yh3qizm","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292814,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:54 GMT',
  'content-type': 'application/json',
  'content-length': '777',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_lZGJPGggDQJh6m',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/customers', "source=tok_1AxKTiD8MNtzsDcgCDfLCOCX&description=https%3A%2F%2Fopencollective.com%2Fxdamman&email=fd81e8b367fee82f45af1816e5ec9147%40gmail.com")
  .reply(200, {"id":"cus_BJyQVA8hlDFlWT","object":"customer","account_balance":0,"created":1504292814,"currency":null,"default_source":"card_1AxKTiD8MNtzsDcg6Yh3qizm","delinquent":false,"description":"https://opencollective.com/xdamman","discount":null,"email":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1AxKTiD8MNtzsDcg6Yh3qizm","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":"cus_BJyQVA8hlDFlWT","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BJyQVA8hlDFlWT/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BJyQVA8hlDFlWT/subscriptions"}}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:54 GMT',
  'content-type': 'application/json',
  'content-length': '1452',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_K4k9TXN5vrZWFh',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/customers/cus_BJyQVA8hlDFlWT/subscriptions', /plan=EUR-MONTH-1000&application_fee_percent=5&trial_end=[0-9]{10}&metadata%5Bfrom%5D=http%3A%2F%2Flocalhost%3A3030%2Fxdamman&metadata%5Bto%5D=http%3A%2F%2Flocalhost%3A3030%2Fbrusselstogether&metadata%5BPaymentMethodId%5D=4167/)
  .reply(200, {"id":"sub_BJyQGzLbysaPvz","object":"subscription","application_fee_percent":5,"cancel_at_period_end":false,"canceled_at":null,"created":1504292815,"current_period_end":1506884809,"current_period_start":1504292815,"customer":"cus_BJyQVA8hlDFlWT","discount":null,"ended_at":null,"items":{"object":"list","data":[{"id":"si_1AxKTjD8MNtzsDcgioUK57sH","object":"subscription_item","created":1504292816,"metadata":{},"plan":{"id":"EUR-MONTH-1000","object":"plan","amount":1000,"created":1503518941,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-1000","statement_descriptor":null,"trial_period_days":null},"quantity":1}],"has_more":false,"total_count":1,"url":"/v1/subscription_items?subscription=sub_BJyQGzLbysaPvz"},"livemode":false,"metadata":{"from":"http://localhost:3030/xdamman","to":"http://localhost:3030/brusselstogether","PaymentMethodId":"4167"},"plan":{"id":"EUR-MONTH-1000","object":"plan","amount":1000,"created":1503518941,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-1000","statement_descriptor":null,"trial_period_days":null},"quantity":1,"start":1504292815,"status":"trialing","tax_percent":null,"trial_end":1506884809,"trial_start":1504292815}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:56 GMT',
  'content-type': 'application/json',
  'content-length': '1721',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_KnHyxoE4Iulh3y',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/subscriptions/sub_BJyQGzLbysaPvz')
  .reply(200, {"id":"sub_BJyQGzLbysaPvz","object":"subscription","application_fee_percent":5,"cancel_at_period_end":false,"canceled_at":null,"created":1504292815,"current_period_end":1506884809,"current_period_start":1504292815,"customer":"cus_BJyQVA8hlDFlWT","discount":null,"ended_at":null,"items":{"object":"list","data":[{"id":"si_1AxKTjD8MNtzsDcgioUK57sH","object":"subscription_item","created":1504292816,"metadata":{},"plan":{"id":"EUR-MONTH-1000","object":"plan","amount":1000,"created":1503518941,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-1000","statement_descriptor":null,"trial_period_days":null},"quantity":1}],"has_more":false,"total_count":1,"url":"/v1/subscription_items?subscription=sub_BJyQGzLbysaPvz"},"livemode":false,"metadata":{"from":"http://localhost:3030/xdamman","to":"http://localhost:3030/brusselstogether","PaymentMethodId":"4167"},"plan":{"id":"EUR-MONTH-1000","object":"plan","amount":1000,"created":1503518941,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-1000","statement_descriptor":null,"trial_period_days":null},"quantity":1,"start":1504292815,"status":"trialing","tax_percent":null,"trial_end":1506884809,"trial_start":1504292815}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:06:56 GMT',
  'content-type': 'application/json',
  'content-length': '1721',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_aNLINtvCzsuk78',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "card%5Bnumber%5D=4242424242424242&card%5Bexp_month%5D=12&card%5Bexp_year%5D=2028&card%5Bcvc%5D=222")
  .reply(200, {"id":"tok_1AxKTrDjPFcHOcTm2LucVJ2A","object":"token","card":{"id":"card_1AxKTrDjPFcHOcTmtcSuYyiJ","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"unchecked","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292823,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:04 GMT',
  'content-type': 'application/json',
  'content-length': '782',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_dD5lWnU1GGYOSY',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('http://api.fixer.io:80')
  .get('/latest')
  .query({"base":"EUR","symbols":"USD"})
  .reply(200, {"base":"EUR","date":"2017-09-01","rates":{"USD":1.192}}, { server: 'nginx/1.11.13',
  date: 'Fri, 01 Sep 2017 19:07:04 GMT',
  'content-type': 'application/json',
  'content-length': '56',
  connection: 'close',
  'cache-control': 'public, must-revalidate, max-age=900',
  'last-modified': 'Fri, 01 Sep 2017 00:00:00 GMT',
  vary: 'Origin',
  'x-content-type-options': 'nosniff' });

nock('https://api.stripe.com:443')
  .post('/v1/customers', "source=tok_1AxKTrDjPFcHOcTm2LucVJ2A&description=https%3A%2F%2Fopencollective.com%2Fnewco&email=jsmith%40email.com")
  .reply(200, {"id":"cus_BJyQGTr6Kbw1HH","object":"customer","account_balance":0,"created":1504292825,"currency":null,"default_source":"card_1AxKTrDjPFcHOcTmtcSuYyiJ","delinquent":false,"description":"https://opencollective.com/newco","discount":null,"email":"jsmith@email.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1AxKTrDjPFcHOcTmtcSuYyiJ","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":"cus_BJyQGTr6Kbw1HH","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BJyQGTr6Kbw1HH/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BJyQGTr6Kbw1HH/subscriptions"}}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:05 GMT',
  'content-type': 'application/json',
  'content-length': '1424',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_vFO6DSgM27c52j',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "customer=cus_BJyQGTr6Kbw1HH")
  .reply(200, {"id":"tok_1AxKTuD8MNtzsDcg7pkCMQzd","object":"token","card":{"id":"card_1AxKTuD8MNtzsDcgD6sAi0lQ","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292826,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:06 GMT',
  'content-type': 'application/json',
  'content-length': '777',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_kWlB07aUM20KBD',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/charges', "amount=1000&currency=EUR&source=tok_1AxKTuD8MNtzsDcg7pkCMQzd&description=Monthly%20donation%20to%20BrusselsTogether%20(donor)&application_fee=50&metadata%5Bfrom%5D=http%3A%2F%2Flocalhost%3A3030%2Fnewco&metadata%5Bto%5D=http%3A%2F%2Flocalhost%3A3030%2Fbrusselstogether&metadata%5BcustomerEmail%5D=jsmith%40email.com&metadata%5BPaymentMethodId%5D=4169")
  .reply(200, {"id":"ch_1AxKTvD8MNtzsDcg0aVnrVIC","object":"charge","amount":1000,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1AxKTvD8MNtzsDcgh9AMBq6f","balance_transaction":"txn_1AxKTvD8MNtzsDcgRhYjvp10","captured":true,"created":1504292827,"currency":"eur","customer":null,"description":"Monthly donation to BrusselsTogether (donor)","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"http://localhost:3030/newco","to":"http://localhost:3030/brusselstogether","customerEmail":"jsmith@email.com","PaymentMethodId":"4169"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1AxKTvD8MNtzsDcg0aVnrVIC/refunds"},"review":null,"shipping":null,"source":{"id":"card_1AxKTuD8MNtzsDcgD6sAi0lQ","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:07 GMT',
  'content-type': 'application/json',
  'content-length': '2011',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_F1B9ZcbpHRNJKS',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/balance/history/txn_1AxKTvD8MNtzsDcgRhYjvp10')
  .reply(200, {"id":"txn_1AxKTvD8MNtzsDcgRhYjvp10","object":"balance_transaction","amount":1000,"available_on":1504828800,"created":1504292827,"currency":"eur","description":"Monthly donation to BrusselsTogether (donor)","fee":104,"fee_details":[{"amount":54,"application":null,"currency":"eur","description":"Stripe processing fees","type":"stripe_fee"},{"amount":50,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","currency":"eur","description":"OpenCollective application fee","type":"application_fee"}],"net":896,"source":"ch_1AxKTvD8MNtzsDcg0aVnrVIC","sourced_transfers":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers?source_transaction=ch_1AxKTvD8MNtzsDcg0aVnrVIC"},"status":"pending","type":"charge"}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:08 GMT',
  'content-type': 'application/json',
  'content-length': '925',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_urooz63T0QTcBc',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/plans/EUR-MONTH-1000')
  .reply(200, {"id":"EUR-MONTH-1000","object":"plan","amount":1000,"created":1503518941,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-1000","statement_descriptor":null,"trial_period_days":null}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:08 GMT',
  'content-type': 'application/json',
  'content-length': '287',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_qYuIZTXhzD2Kvv',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "customer=cus_BJyQGTr6Kbw1HH")
  .reply(200, {"id":"tok_1AxKTwD8MNtzsDcgGOyx17t6","object":"token","card":{"id":"card_1AxKTwD8MNtzsDcgn2tTnroz","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292828,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:09 GMT',
  'content-type': 'application/json',
  'content-length': '777',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_qjq3iLSaIThI6A',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/customers', "source=tok_1AxKTwD8MNtzsDcgGOyx17t6&description=https%3A%2F%2Fopencollective.com%2Fnewco&email=jsmith%40email.com")
  .reply(200, {"id":"cus_BJyQ7BydrxggVO","object":"customer","account_balance":0,"created":1504292829,"currency":null,"default_source":"card_1AxKTwD8MNtzsDcgn2tTnroz","delinquent":false,"description":"https://opencollective.com/newco","discount":null,"email":"jsmith@email.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1AxKTwD8MNtzsDcgn2tTnroz","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":"cus_BJyQ7BydrxggVO","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BJyQ7BydrxggVO/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BJyQ7BydrxggVO/subscriptions"}}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:09 GMT',
  'content-type': 'application/json',
  'content-length': '1424',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_4D2DuRtydd3gkN',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/customers/cus_BJyQ7BydrxggVO/subscriptions', /plan=EUR-MONTH-1000&application_fee_percent=5&trial_end=[0-9]{10}&metadata%5Bfrom%5D=http%3A%2F%2Flocalhost%3A3030%2Fnewco&metadata%5Bto%5D=http%3A%2F%2Flocalhost%3A3030%2Fbrusselstogether&metadata%5BPaymentMethodId%5D=4169/)
  .reply(200, {"id":"sub_BJyQ89tfURY8V5","object":"subscription","application_fee_percent":5,"cancel_at_period_end":false,"canceled_at":null,"created":1504292830,"current_period_end":1506884824,"current_period_start":1504292830,"customer":"cus_BJyQ7BydrxggVO","discount":null,"ended_at":null,"items":{"object":"list","data":[{"id":"si_1AxKTyD8MNtzsDcgPj64F6wk","object":"subscription_item","created":1504292830,"metadata":{},"plan":{"id":"EUR-MONTH-1000","object":"plan","amount":1000,"created":1503518941,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-1000","statement_descriptor":null,"trial_period_days":null},"quantity":1}],"has_more":false,"total_count":1,"url":"/v1/subscription_items?subscription=sub_BJyQ89tfURY8V5"},"livemode":false,"metadata":{"from":"http://localhost:3030/newco","to":"http://localhost:3030/brusselstogether","PaymentMethodId":"4169"},"plan":{"id":"EUR-MONTH-1000","object":"plan","amount":1000,"created":1503518941,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-1000","statement_descriptor":null,"trial_period_days":null},"quantity":1,"start":1504292830,"status":"trialing","tax_percent":null,"trial_end":1506884824,"trial_start":1504292830}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:10 GMT',
  'content-type': 'application/json',
  'content-length': '1719',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_dAkn6h3C5IGlXU',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "card%5Bnumber%5D=4242424242424242&card%5Bexp_month%5D=12&card%5Bexp_year%5D=2028&card%5Bcvc%5D=222")
  .reply(200, {"id":"tok_1AxKU6DjPFcHOcTmh1MFbuNH","object":"token","card":{"id":"card_1AxKU5DjPFcHOcTmIhS7VFOR","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"unchecked","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292838,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:18 GMT',
  'content-type': 'application/json',
  'content-length': '782',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_QumuOXY61xYbNH',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('http://api.fixer.io:80')
  .get('/latest')
  .query({"base":"EUR","symbols":"USD"})
  .reply(200, {"base":"EUR","date":"2017-09-01","rates":{"USD":1.192}}, { server: 'nginx/1.11.13',
  date: 'Fri, 01 Sep 2017 19:07:18 GMT',
  'content-type': 'application/json',
  'content-length': '56',
  connection: 'close',
  'cache-control': 'public, must-revalidate, max-age=900',
  'last-modified': 'Fri, 01 Sep 2017 00:00:00 GMT',
  vary: 'Origin',
  'x-content-type-options': 'nosniff' });

nock('https://api.stripe.com:443')
  .post('/v1/customers', "source=tok_1AxKU6DjPFcHOcTmh1MFbuNH&description=https%3A%2F%2Fopencollective.com%2Fnewco&email=fd81e8b367fee82f45af1816e5ec9147%40gmail.com")
  .reply(200, {"id":"cus_BJyQWc8yn6V32a","object":"customer","account_balance":0,"created":1504292839,"currency":null,"default_source":"card_1AxKU5DjPFcHOcTmIhS7VFOR","delinquent":false,"description":"https://opencollective.com/newco","discount":null,"email":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1AxKU5DjPFcHOcTmIhS7VFOR","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":"cus_BJyQWc8yn6V32a","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BJyQWc8yn6V32a/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BJyQWc8yn6V32a/subscriptions"}}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:19 GMT',
  'content-type': 'application/json',
  'content-length': '1450',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_Xg5yu4ECi7O2xe',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "customer=cus_BJyQWc8yn6V32a")
  .reply(200, {"id":"tok_1AxKU8D8MNtzsDcgHcpYef7U","object":"token","card":{"id":"card_1AxKU8D8MNtzsDcg5CoUzTwY","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292840,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:20 GMT',
  'content-type': 'application/json',
  'content-length': '777',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_68HvXPukofCEwS',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/charges', "amount=1000&currency=EUR&source=tok_1AxKU8D8MNtzsDcgHcpYef7U&description=Monthly%20donation%20to%20BrusselsTogether%20(donor)&application_fee=50&metadata%5Bfrom%5D=http%3A%2F%2Flocalhost%3A3030%2Fnewco&metadata%5Bto%5D=http%3A%2F%2Flocalhost%3A3030%2Fbrusselstogether&metadata%5BcustomerEmail%5D=fd81e8b367fee82f45af1816e5ec9147%40gmail.com&metadata%5BPaymentMethodId%5D=4168")
  .reply(200, {"id":"ch_1AxKU8D8MNtzsDcgrMcieD5j","object":"charge","amount":1000,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1AxKU9D8MNtzsDcgMLaS7dyJ","balance_transaction":"txn_1AxKU9D8MNtzsDcgOciLwOdn","captured":true,"created":1504292840,"currency":"eur","customer":null,"description":"Monthly donation to BrusselsTogether (donor)","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"http://localhost:3030/newco","to":"http://localhost:3030/brusselstogether","customerEmail":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","PaymentMethodId":"4168"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1AxKU8D8MNtzsDcgrMcieD5j/refunds"},"review":null,"shipping":null,"source":{"id":"card_1AxKU8D8MNtzsDcg5CoUzTwY","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:21 GMT',
  'content-type': 'application/json',
  'content-length': '2037',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_kV2jaMrQMi3Z3A',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/balance/history/txn_1AxKU9D8MNtzsDcgOciLwOdn')
  .reply(200, {"id":"txn_1AxKU9D8MNtzsDcgOciLwOdn","object":"balance_transaction","amount":1000,"available_on":1504828800,"created":1504292840,"currency":"eur","description":"Monthly donation to BrusselsTogether (donor)","fee":104,"fee_details":[{"amount":50,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","currency":"eur","description":"OpenCollective application fee","type":"application_fee"},{"amount":54,"application":null,"currency":"eur","description":"Stripe processing fees","type":"stripe_fee"}],"net":896,"source":"ch_1AxKU8D8MNtzsDcgrMcieD5j","sourced_transfers":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers?source_transaction=ch_1AxKU8D8MNtzsDcgrMcieD5j"},"status":"pending","type":"charge"}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:22 GMT',
  'content-type': 'application/json',
  'content-length': '925',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_CAeLwjs6qJPKta',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/plans/EUR-MONTH-1000')
  .reply(200, {"id":"EUR-MONTH-1000","object":"plan","amount":1000,"created":1503518941,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-1000","statement_descriptor":null,"trial_period_days":null}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:22 GMT',
  'content-type': 'application/json',
  'content-length': '287',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_dlaLppEM5klFGB',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "customer=cus_BJyQWc8yn6V32a")
  .reply(200, {"id":"tok_1AxKUBD8MNtzsDcg4VamLqiV","object":"token","card":{"id":"card_1AxKUBD8MNtzsDcgXw7LQum7","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292843,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:23 GMT',
  'content-type': 'application/json',
  'content-length': '777',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_gZ3Rzk7nS9b46D',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/customers', "source=tok_1AxKUBD8MNtzsDcg4VamLqiV&description=https%3A%2F%2Fopencollective.com%2Fnewco&email=fd81e8b367fee82f45af1816e5ec9147%40gmail.com")
  .reply(200, {"id":"cus_BJyREFua2PXSEx","object":"customer","account_balance":0,"created":1504292843,"currency":null,"default_source":"card_1AxKUBD8MNtzsDcgXw7LQum7","delinquent":false,"description":"https://opencollective.com/newco","discount":null,"email":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1AxKUBD8MNtzsDcgXw7LQum7","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":"cus_BJyREFua2PXSEx","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BJyREFua2PXSEx/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BJyREFua2PXSEx/subscriptions"}}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:24 GMT',
  'content-type': 'application/json',
  'content-length': '1450',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_WKWoCsnieqwdVl',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/customers/cus_BJyREFua2PXSEx/subscriptions', /plan=EUR-MONTH-1000&application_fee_percent=5&trial_end=[0-9]{10}&metadata%5Bfrom%5D=http%3A%2F%2Flocalhost%3A3030%2Fnewco&metadata%5Bto%5D=http%3A%2F%2Flocalhost%3A3030%2Fbrusselstogether&metadata%5BPaymentMethodId%5D=4168/)
  .reply(200, {"id":"sub_BJyRMWn7IBCLbm","object":"subscription","application_fee_percent":5,"cancel_at_period_end":false,"canceled_at":null,"created":1504292844,"current_period_end":1506884838,"current_period_start":1504292844,"customer":"cus_BJyREFua2PXSEx","discount":null,"ended_at":null,"items":{"object":"list","data":[{"id":"si_1AxKUCD8MNtzsDcgAlpaq0je","object":"subscription_item","created":1504292845,"metadata":{},"plan":{"id":"EUR-MONTH-1000","object":"plan","amount":1000,"created":1503518941,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-1000","statement_descriptor":null,"trial_period_days":null},"quantity":1}],"has_more":false,"total_count":1,"url":"/v1/subscription_items?subscription=sub_BJyRMWn7IBCLbm"},"livemode":false,"metadata":{"from":"http://localhost:3030/newco","to":"http://localhost:3030/brusselstogether","PaymentMethodId":"4168"},"plan":{"id":"EUR-MONTH-1000","object":"plan","amount":1000,"created":1503518941,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-1000","statement_descriptor":null,"trial_period_days":null},"quantity":1,"start":1504292844,"status":"trialing","tax_percent":null,"trial_end":1506884838,"trial_start":1504292844}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:25 GMT',
  'content-type': 'application/json',
  'content-length': '1719',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_gSkbMj85ypvVrh',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "card%5Bnumber%5D=4242424242424242&card%5Bexp_month%5D=12&card%5Bexp_year%5D=2028&card%5Bcvc%5D=222")
  .reply(200, {"id":"tok_1AxKUKDjPFcHOcTm2kqHDqUj","object":"token","card":{"id":"card_1AxKUKDjPFcHOcTmTKtxhoI8","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"unchecked","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292852,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:32 GMT',
  'content-type': 'application/json',
  'content-length': '782',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_gmFR9tAPGe9siA',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('http://api.fixer.io:80')
  .get('/latest')
  .query({"base":"EUR","symbols":"USD"})
  .reply(200, {"base":"EUR","date":"2017-09-01","rates":{"USD":1.192}}, { server: 'nginx/1.11.13',
  date: 'Fri, 01 Sep 2017 19:07:33 GMT',
  'content-type': 'application/json',
  'content-length': '56',
  connection: 'close',
  'cache-control': 'public, must-revalidate, max-age=900',
  'last-modified': 'Fri, 01 Sep 2017 00:00:00 GMT',
  vary: 'Origin',
  'x-content-type-options': 'nosniff' });

nock('http://api.fixer.io:80')
  .get('/latest')
  .query({"base":"EUR","symbols":"USD"})
  .reply(200, {"base":"EUR","date":"2017-09-01","rates":{"USD":1.192}}, { server: 'nginx/1.11.13',
  date: 'Fri, 01 Sep 2017 19:07:34 GMT',
  'content-type': 'application/json',
  'content-length': '56',
  connection: 'close',
  'cache-control': 'public, must-revalidate, max-age=900',
  'last-modified': 'Fri, 01 Sep 2017 00:00:00 GMT',
  vary: 'Origin',
  'x-content-type-options': 'nosniff' });

nock('https://api.stripe.com:443')
  .post('/v1/customers', "source=tok_1AxKUKDjPFcHOcTm2kqHDqUj&description=https%3A%2F%2Fopencollective.com%2Fnewco&email=fd81e8b367fee82f45af1816e5ec9147%40gmail.com")
  .reply(200, {"id":"cus_BJyRwH3hkX6XDI","object":"customer","account_balance":0,"created":1504292855,"currency":null,"default_source":"card_1AxKUKDjPFcHOcTmTKtxhoI8","delinquent":false,"description":"https://opencollective.com/newco","discount":null,"email":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1AxKUKDjPFcHOcTmTKtxhoI8","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":"cus_BJyRwH3hkX6XDI","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BJyRwH3hkX6XDI/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BJyRwH3hkX6XDI/subscriptions"}}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:35 GMT',
  'content-type': 'application/json',
  'content-length': '1450',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_uABaPmoCyqe6n3',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "customer=cus_BJyRwH3hkX6XDI")
  .reply(200, {"id":"tok_1AxKUOD8MNtzsDcgjv9rdStf","object":"token","card":{"id":"card_1AxKUOD8MNtzsDcgkorVl8IX","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292856,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:36 GMT',
  'content-type': 'application/json',
  'content-length': '777',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_9tVpcdAwIZb6TO',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/charges', "amount=20000&currency=EUR&source=tok_1AxKUOD8MNtzsDcgjv9rdStf&description=Monthly%20donation%20to%20BrusselsTogether%20(donor)&application_fee=1000&metadata%5Bfrom%5D=http%3A%2F%2Flocalhost%3A3030%2Fnewco&metadata%5Bto%5D=http%3A%2F%2Flocalhost%3A3030%2Fbrusselstogether&metadata%5BcustomerEmail%5D=fd81e8b367fee82f45af1816e5ec9147%40gmail.com&metadata%5BPaymentMethodId%5D=4168")
  .reply(200, {"id":"ch_1AxKUOD8MNtzsDcg0T2pD53i","object":"charge","amount":20000,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1AxKUOD8MNtzsDcghsOcstZn","balance_transaction":"txn_1AxKUPD8MNtzsDcgfuzkYdAq","captured":true,"created":1504292856,"currency":"eur","customer":null,"description":"Monthly donation to BrusselsTogether (donor)","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"http://localhost:3030/newco","to":"http://localhost:3030/brusselstogether","customerEmail":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","PaymentMethodId":"4168"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1AxKUOD8MNtzsDcg0T2pD53i/refunds"},"review":null,"shipping":null,"source":{"id":"card_1AxKUOD8MNtzsDcgkorVl8IX","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:37 GMT',
  'content-type': 'application/json',
  'content-length': '2038',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_dEf1PhejMr0rzh',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/balance/history/txn_1AxKUPD8MNtzsDcgfuzkYdAq')
  .reply(200, {"id":"txn_1AxKUPD8MNtzsDcgfuzkYdAq","object":"balance_transaction","amount":20000,"available_on":1504828800,"created":1504292856,"currency":"eur","description":"Monthly donation to BrusselsTogether (donor)","fee":1605,"fee_details":[{"amount":605,"application":null,"currency":"eur","description":"Stripe processing fees","type":"stripe_fee"},{"amount":1000,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","currency":"eur","description":"OpenCollective application fee","type":"application_fee"}],"net":18395,"source":"ch_1AxKUOD8MNtzsDcg0T2pD53i","sourced_transfers":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers?source_transaction=ch_1AxKUOD8MNtzsDcg0T2pD53i"},"status":"pending","type":"charge"}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:37 GMT',
  'content-type': 'application/json',
  'content-length': '932',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_16LgoJzcH3oRQ7',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/plans/EUR-MONTH-20000')
  .reply(200, {"id":"EUR-MONTH-20000","object":"plan","amount":20000,"created":1504282114,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-20000","statement_descriptor":null,"trial_period_days":null}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:38 GMT',
  'content-type': 'application/json',
  'content-length': '290',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_mVryR2Qe0g4WRx',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "customer=cus_BJyRwH3hkX6XDI")
  .reply(200, {"id":"tok_1AxKUQD8MNtzsDcgXXERSEUr","object":"token","card":{"id":"card_1AxKUQD8MNtzsDcglFTDZkvH","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"187.162.203.97","created":1504292858,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:38 GMT',
  'content-type': 'application/json',
  'content-length': '777',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_Etvm5iElytzFJx',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/customers', "source=tok_1AxKUQD8MNtzsDcgXXERSEUr&description=https%3A%2F%2Fopencollective.com%2Fnewco&email=fd81e8b367fee82f45af1816e5ec9147%40gmail.com")
  .reply(200, {"id":"cus_BJyR9LjYdo11nW","object":"customer","account_balance":0,"created":1504292859,"currency":null,"default_source":"card_1AxKUQD8MNtzsDcglFTDZkvH","delinquent":false,"description":"https://opencollective.com/newco","discount":null,"email":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1AxKUQD8MNtzsDcglFTDZkvH","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":"cus_BJyR9LjYdo11nW","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BJyR9LjYdo11nW/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BJyR9LjYdo11nW/subscriptions"}}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:39 GMT',
  'content-type': 'application/json',
  'content-length': '1450',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_4Qu7LBPXq36FLf',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/customers/cus_BJyR9LjYdo11nW/subscriptions', /plan=EUR-MONTH-20000&application_fee_percent=5&trial_end=[0-9]{10}&metadata%5Bfrom%5D=http%3A%2F%2Flocalhost%3A3030%2Fnewco&metadata%5Bto%5D=http%3A%2F%2Flocalhost%3A3030%2Fbrusselstogether&metadata%5BPaymentMethodId%5D=4168/)
  .reply(200, {"id":"sub_BJyRI8rCNWCu2z","object":"subscription","application_fee_percent":5,"cancel_at_period_end":false,"canceled_at":null,"created":1504292860,"current_period_end":1506884853,"current_period_start":1504292860,"customer":"cus_BJyR9LjYdo11nW","discount":null,"ended_at":null,"items":{"object":"list","data":[{"id":"si_1AxKUSD8MNtzsDcg6wPqdzCE","object":"subscription_item","created":1504292860,"metadata":{},"plan":{"id":"EUR-MONTH-20000","object":"plan","amount":20000,"created":1504282114,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-20000","statement_descriptor":null,"trial_period_days":null},"quantity":1}],"has_more":false,"total_count":1,"url":"/v1/subscription_items?subscription=sub_BJyRI8rCNWCu2z"},"livemode":false,"metadata":{"from":"http://localhost:3030/newco","to":"http://localhost:3030/brusselstogether","PaymentMethodId":"4168"},"plan":{"id":"EUR-MONTH-20000","object":"plan","amount":20000,"created":1504282114,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-20000","statement_descriptor":null,"trial_period_days":null},"quantity":1,"start":1504292860,"status":"trialing","tax_percent":null,"trial_end":1506884853,"trial_start":1504292860}, { server: 'nginx',
  date: 'Fri, 01 Sep 2017 19:07:40 GMT',
  'content-type': 'application/json',
  'content-length': '1725',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'X-Stripe-Privileged-Session-Required,stripe-manage-version,X-Stripe-External-Auth-Required',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_SCuOIBUsZExqNi',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('http://api.fixer.io:80')
  .get('/2017-09-01')
  .query({"base":"EUR","symbols":"USD"})
  .reply(200, {"base":"EUR","date":"2017-09-01","rates":{"USD":1.192}}, { server: 'nginx/1.11.13',
  date: 'Fri, 01 Sep 2017 19:07:41 GMT',
  'content-type': 'application/json',
  'content-length': '56',
  connection: 'close',
  'cache-control': 'public, must-revalidate, max-age=900',
  'last-modified': 'Fri, 01 Sep 2017 00:00:00 GMT',
  vary: 'Origin',
  'x-content-type-options': 'nosniff' });

nock('http://api.fixer.io:80')
  .get('/latest')
  .query({"base":"EUR","symbols":"USD"})
  .reply(200, {"base":"EUR","date":"2017-09-01","rates":{"USD":1.192}}, { server: 'nginx/1.11.13',
  date: 'Fri, 01 Sep 2017 19:07:41 GMT',
  'content-type': 'application/json',
  'content-length': '56',
  connection: 'close',
  'cache-control': 'public, must-revalidate, max-age=900',
  'last-modified': 'Fri, 01 Sep 2017 00:00:00 GMT',
  vary: 'Origin',
  'x-content-type-options': 'nosniff' });