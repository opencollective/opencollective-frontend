import nock from 'nock';

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "card%5Bnumber%5D=4242424242424242&card%5Bexp_month%5D=11&card%5Bexp_year%5D=2025&card%5Bcvc%5D=222")
  .reply(200, {"id":"tok_1Au77SDjPFcHOcTmoy0oMRzt","object":"token","card":{"id":"card_1Au77SDjPFcHOcTmEPUWX8Uy","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"unchecked","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"74.73.151.59","created":1503526478,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:14:38 GMT',
  'content-type': 'application/json',
  'content-length': '780',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_2uZ12m9PhenxHD',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/customers', "source=tok_1Au77SDjPFcHOcTmoy0oMRzt&description=https%3A%2F%2Fopencollective.com%2Fjohn-smith&email=jsmith%40email.com")
  .reply(200, {"id":"cus_BGeQytV1BsII2Y","object":"customer","account_balance":0,"created":1503526479,"currency":null,"default_source":"card_1Au77SDjPFcHOcTmEPUWX8Uy","delinquent":false,"description":"https://opencollective.com/john-smith","discount":null,"email":"jsmith@email.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1Au77SDjPFcHOcTmEPUWX8Uy","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":"cus_BGeQytV1BsII2Y","cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BGeQytV1BsII2Y/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BGeQytV1BsII2Y/subscriptions"}}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:14:39 GMT',
  'content-type': 'application/json',
  'content-length': '1429',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_IqVf5YxZkWjdQW',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "customer=cus_BGeQytV1BsII2Y")
  .reply(200, {"id":"tok_1Au77UD8MNtzsDcgopE9IUYv","object":"token","card":{"id":"card_1Au77UD8MNtzsDcgmIDs9Cmu","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"74.73.151.59","created":1503526480,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:14:40 GMT',
  'content-type': 'application/json',
  'content-length': '775',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_lS8sMQMaOv8dYt',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/charges', "amount=154300&currency=EUR&source=tok_1Au77UD8MNtzsDcgopE9IUYv&description=Donation%20to%20BrusselsTogether%20(donor)&application_fee=7715&metadata%5Bfrom%5D=https%3A%2F%2Fopencollective.com%2Fjohn-smith&metadata%5Bto%5D=https%3A%2F%2Fopencollective.com%2Fbrusselstogether&metadata%5BcustomerEmail%5D=jsmith%40email.com&metadata%5BpaymentMethodId%5D=4167")
  .reply(200, {"id":"ch_1Au77UD8MNtzsDcg7vzBvnyI","object":"charge","amount":154300,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1Au77VD8MNtzsDcgSWyFjdah","balance_transaction":"txn_1Au77VD8MNtzsDcgjZMs3SoW","captured":true,"created":1503526480,"currency":"eur","customer":null,"description":"Donation to BrusselsTogether (donor)","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"https://opencollective.com/john-smith","to":"https://opencollective.com/brusselstogether","customerEmail":"jsmith@email.com","paymentMethodId":"4167"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1Au77UD8MNtzsDcg7vzBvnyI/refunds"},"review":null,"shipping":null,"source":{"id":"card_1Au77UD8MNtzsDcgmIDs9Cmu","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:14:41 GMT',
  'content-type': 'application/json',
  'content-length': '2020',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_eQz4abnO0qiYGG',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/balance/history/txn_1Au77VD8MNtzsDcgjZMs3SoW')
  .reply(200, {"id":"txn_1Au77VD8MNtzsDcgjZMs3SoW","object":"balance_transaction","amount":154300,"available_on":1504051200,"created":1503526480,"currency":"eur","description":"Donation to BrusselsTogether (donor)","fee":12215,"fee_details":[{"amount":7715,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","currency":"eur","description":"OpenCollective application fee","type":"application_fee"},{"amount":4500,"application":null,"currency":"eur","description":"Stripe processing fees","type":"stripe_fee"}],"net":142085,"source":"ch_1Au77UD8MNtzsDcg7vzBvnyI","sourced_transfers":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers?source_transaction=ch_1Au77UD8MNtzsDcg7vzBvnyI"},"status":"pending","type":"charge"}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:14:41 GMT',
  'content-type': 'application/json',
  'content-length': '928',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_oEy7JZROAadRPr',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });


nock('https://api.stripe.com:443')
  .get('/v1/charges/ch_1Au77UD8MNtzsDcg7vzBvnyI')
  .reply(200, {"id":"ch_1Au77UD8MNtzsDcg7vzBvnyI","object":"charge","amount":154300,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1Au77VD8MNtzsDcgSWyFjdah","balance_transaction":"txn_1Au77VD8MNtzsDcgjZMs3SoW","captured":true,"created":1503526480,"currency":"eur","customer":null,"description":"Donation to BrusselsTogether (donor)","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"https://opencollective.com/john-smith","to":"https://opencollective.com/brusselstogether","customerEmail":"jsmith@email.com","paymentMethodId":"4167"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1Au77UD8MNtzsDcg7vzBvnyI/refunds"},"review":null,"shipping":null,"source":{"id":"card_1Au77UD8MNtzsDcgmIDs9Cmu","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:14:43 GMT',
  'content-type': 'application/json',
  'content-length': '2020',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_otYTWZYuGS1bxP',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "card%5Bnumber%5D=4242424242424242&card%5Bexp_month%5D=11&card%5Bexp_year%5D=2025&card%5Bcvc%5D=222")
  .reply(200, {"id":"tok_1Au77eDjPFcHOcTmQMewqJ2y","object":"token","card":{"id":"card_1Au77eDjPFcHOcTmF9YXumTp","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"unchecked","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"74.73.151.59","created":1503526490,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:14:50 GMT',
  'content-type': 'application/json',
  'content-length': '780',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_KXoAJxXSFNvDx6',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/customers', "source=tok_1Au77eDjPFcHOcTmQMewqJ2y&description=https%3A%2F%2Fopencollective.com%2Fxdamman&email=fd81e8b367fee82f45af1816e5ec9147%40gmail.com")
  .reply(200, {"id":"cus_BGeQm2XaO4ARoS","object":"customer","account_balance":0,"created":1503526491,"currency":null,"default_source":"card_1Au77eDjPFcHOcTmF9YXumTp","delinquent":false,"description":"https://opencollective.com/xdamman","discount":null,"email":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1Au77eDjPFcHOcTmF9YXumTp","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":"cus_BGeQm2XaO4ARoS","cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BGeQm2XaO4ARoS/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BGeQm2XaO4ARoS/subscriptions"}}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:14:51 GMT',
  'content-type': 'application/json',
  'content-length': '1452',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_hGx0Kx7LW7wRB6',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "customer=cus_BGeQm2XaO4ARoS")
  .reply(200, {"id":"tok_1Au77gD8MNtzsDcg1uB3DBHy","object":"token","card":{"id":"card_1Au77gD8MNtzsDcgm8ss8Efz","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"74.73.151.59","created":1503526492,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:14:52 GMT',
  'content-type': 'application/json',
  'content-length': '775',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_PiMcWRedrZxZkA',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/charges', "amount=154300&currency=EUR&source=tok_1Au77gD8MNtzsDcg1uB3DBHy&description=Donation%20to%20BrusselsTogether%20(donor)&application_fee=7715&metadata%5Bfrom%5D=https%3A%2F%2Fopencollective.com%2Fxdamman&metadata%5Bto%5D=https%3A%2F%2Fopencollective.com%2Fbrusselstogether&metadata%5BcustomerEmail%5D=fd81e8b367fee82f45af1816e5ec9147%40gmail.com&metadata%5BpaymentMethodId%5D=4167")
  .reply(200, {"id":"ch_1Au77gD8MNtzsDcgDjlkDPxE","object":"charge","amount":154300,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1Au77gD8MNtzsDcgiOwR3rMq","balance_transaction":"txn_1Au77hD8MNtzsDcgKdSzMyrC","captured":true,"created":1503526492,"currency":"eur","customer":null,"description":"Donation to BrusselsTogether (donor)","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"https://opencollective.com/xdamman","to":"https://opencollective.com/brusselstogether","customerEmail":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","paymentMethodId":"4167"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1Au77gD8MNtzsDcgDjlkDPxE/refunds"},"review":null,"shipping":null,"source":{"id":"card_1Au77gD8MNtzsDcgm8ss8Efz","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:14:53 GMT',
  'content-type': 'application/json',
  'content-length': '2043',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_oiI6fOu51g1wBm',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/balance/history/txn_1Au77hD8MNtzsDcgKdSzMyrC')
  .reply(200, {"id":"txn_1Au77hD8MNtzsDcgKdSzMyrC","object":"balance_transaction","amount":154300,"available_on":1504051200,"created":1503526492,"currency":"eur","description":"Donation to BrusselsTogether (donor)","fee":12215,"fee_details":[{"amount":7715,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","currency":"eur","description":"OpenCollective application fee","type":"application_fee"},{"amount":4500,"application":null,"currency":"eur","description":"Stripe processing fees","type":"stripe_fee"}],"net":142085,"source":"ch_1Au77gD8MNtzsDcgDjlkDPxE","sourced_transfers":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers?source_transaction=ch_1Au77gD8MNtzsDcgDjlkDPxE"},"status":"pending","type":"charge"}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:14:54 GMT',
  'content-type': 'application/json',
  'content-length': '928',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_ls62QscDafzzGF',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/charges/ch_1Au77gD8MNtzsDcgDjlkDPxE')
  .reply(200, {"id":"ch_1Au77gD8MNtzsDcgDjlkDPxE","object":"charge","amount":154300,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1Au77gD8MNtzsDcgiOwR3rMq","balance_transaction":"txn_1Au77hD8MNtzsDcgKdSzMyrC","captured":true,"created":1503526492,"currency":"eur","customer":null,"description":"Donation to BrusselsTogether (donor)","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"https://opencollective.com/xdamman","to":"https://opencollective.com/brusselstogether","customerEmail":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","paymentMethodId":"4167"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1Au77gD8MNtzsDcgDjlkDPxE/refunds"},"review":null,"shipping":null,"source":{"id":"card_1Au77gD8MNtzsDcgm8ss8Efz","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:14:54 GMT',
  'content-type': 'application/json',
  'content-length': '2043',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_4Rxe4exdKKGDhL',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "card%5Bnumber%5D=4242424242424242&card%5Bexp_month%5D=11&card%5Bexp_year%5D=2025&card%5Bcvc%5D=222")
  .reply(200, {"id":"tok_1Au77qDjPFcHOcTmMOrXbsqJ","object":"token","card":{"id":"card_1Au77qDjPFcHOcTmHwQP0AZz","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"unchecked","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"74.73.151.59","created":1503526502,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:15:02 GMT',
  'content-type': 'application/json',
  'content-length': '780',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_fatYvbPIvCLHM7',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/customers', "source=tok_1Au77qDjPFcHOcTmMOrXbsqJ&description=https%3A%2F%2Fopencollective.com%2Fundefined&email=")
  .reply(200, {"id":"cus_BGeQdU4UafyLIt","object":"customer","account_balance":0,"created":1503526503,"currency":null,"default_source":"card_1Au77qDjPFcHOcTmHwQP0AZz","delinquent":false,"description":"https://opencollective.com/undefined","discount":null,"email":null,"livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1Au77qDjPFcHOcTmHwQP0AZz","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":"cus_BGeQdU4UafyLIt","cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BGeQdU4UafyLIt/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BGeQdU4UafyLIt/subscriptions"}}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:15:03 GMT',
  'content-type': 'application/json',
  'content-length': '1414',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_fHa16Y3w3pnTrn',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "customer=cus_BGeQdU4UafyLIt")
  .reply(200, {"id":"tok_1Au77sD8MNtzsDcgnf8SsC9P","object":"token","card":{"id":"card_1Au77sD8MNtzsDcgw2SpdID3","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"74.73.151.59","created":1503526504,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:15:05 GMT',
  'content-type': 'application/json',
  'content-length': '775',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_PwFEI5jIslqgkp',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/charges', "amount=154300&currency=EUR&source=tok_1Au77sD8MNtzsDcgnf8SsC9P&description=Donation%20to%20BrusselsTogether%20(donor)&application_fee=7715&metadata%5Bfrom%5D=https%3A%2F%2Fopencollective.com%2Fxdamman&metadata%5Bto%5D=https%3A%2F%2Fopencollective.com%2Fbrusselstogether&metadata%5BcustomerEmail%5D=fd81e8b367fee82f45af1816e5ec9147%40gmail.com&metadata%5BpaymentMethodId%5D=4167")
  .reply(200, {"id":"ch_1Au77tD8MNtzsDcgE05k6m2A","object":"charge","amount":154300,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1Au77tD8MNtzsDcgXTjqWtgC","balance_transaction":"txn_1Au77uD8MNtzsDcgsqcORgfw","captured":true,"created":1503526505,"currency":"eur","customer":null,"description":"Donation to BrusselsTogether (donor)","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"https://opencollective.com/xdamman","to":"https://opencollective.com/brusselstogether","customerEmail":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","paymentMethodId":"4167"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1Au77tD8MNtzsDcgE05k6m2A/refunds"},"review":null,"shipping":null,"source":{"id":"card_1Au77sD8MNtzsDcgw2SpdID3","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:15:06 GMT',
  'content-type': 'application/json',
  'content-length': '2043',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_KQXGM5O3Aqddkx',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/balance/history/txn_1Au77uD8MNtzsDcgsqcORgfw')
  .reply(200, {"id":"txn_1Au77uD8MNtzsDcgsqcORgfw","object":"balance_transaction","amount":154300,"available_on":1504051200,"created":1503526505,"currency":"eur","description":"Donation to BrusselsTogether (donor)","fee":12215,"fee_details":[{"amount":7715,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","currency":"eur","description":"OpenCollective application fee","type":"application_fee"},{"amount":4500,"application":null,"currency":"eur","description":"Stripe processing fees","type":"stripe_fee"}],"net":142085,"source":"ch_1Au77tD8MNtzsDcgE05k6m2A","sourced_transfers":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers?source_transaction=ch_1Au77tD8MNtzsDcgE05k6m2A"},"status":"pending","type":"charge"}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:15:06 GMT',
  'content-type': 'application/json',
  'content-length': '928',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_iFDuB9QbID9hVk',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/charges/ch_1Au77tD8MNtzsDcgE05k6m2A')
  .reply(200, {"id":"ch_1Au77tD8MNtzsDcgE05k6m2A","object":"charge","amount":154300,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1Au77tD8MNtzsDcgXTjqWtgC","balance_transaction":"txn_1Au77uD8MNtzsDcgsqcORgfw","captured":true,"created":1503526505,"currency":"eur","customer":null,"description":"Donation to BrusselsTogether (donor)","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"https://opencollective.com/xdamman","to":"https://opencollective.com/brusselstogether","customerEmail":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","paymentMethodId":"4167"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1Au77tD8MNtzsDcgE05k6m2A/refunds"},"review":null,"shipping":null,"source":{"id":"card_1Au77sD8MNtzsDcgw2SpdID3","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:15:07 GMT',
  'content-type': 'application/json',
  'content-length': '2043',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_DDpLleefLmWYNW',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "card%5Bnumber%5D=4242424242424242&card%5Bexp_month%5D=11&card%5Bexp_year%5D=2025&card%5Bcvc%5D=222")
  .reply(200, {"id":"tok_1Au782DjPFcHOcTmA1ClUcRQ","object":"token","card":{"id":"card_1Au782DjPFcHOcTmzgRFS6P6","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"unchecked","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"74.73.151.59","created":1503526514,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:15:14 GMT',
  'content-type': 'application/json',
  'content-length': '780',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_Blak1ejhsHB57k',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/customers', "source=tok_1Au782DjPFcHOcTmA1ClUcRQ&description=https%3A%2F%2Fopencollective.com%2Fxdamman&email=fd81e8b367fee82f45af1816e5ec9147%40gmail.com")
  .reply(200, {"id":"cus_BGeQBcZD7CgU7e","object":"customer","account_balance":0,"created":1503526515,"currency":null,"default_source":"card_1Au782DjPFcHOcTmzgRFS6P6","delinquent":false,"description":"https://opencollective.com/xdamman","discount":null,"email":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1Au782DjPFcHOcTmzgRFS6P6","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":"cus_BGeQBcZD7CgU7e","cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BGeQBcZD7CgU7e/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BGeQBcZD7CgU7e/subscriptions"}}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:15:16 GMT',
  'content-type': 'application/json',
  'content-length': '1452',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_lI9ASLDHzJcHk6',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "customer=cus_BGeQBcZD7CgU7e")
  .reply(200, {"id":"tok_1Au784D8MNtzsDcgpbMFs4Un","object":"token","card":{"id":"card_1Au784D8MNtzsDcg1OUMLsEj","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"74.73.151.59","created":1503526516,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:15:16 GMT',
  'content-type': 'application/json',
  'content-length': '775',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_8fiHEhRdecLHlH',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/charges', "amount=1000&currency=EUR&source=tok_1Au784D8MNtzsDcgpbMFs4Un&description=Monthly%20donation%20to%20BrusselsTogether%20(donor)&application_fee=50&metadata%5Bfrom%5D=https%3A%2F%2Fopencollective.com%2Fxdamman&metadata%5Bto%5D=https%3A%2F%2Fopencollective.com%2Fbrusselstogether&metadata%5BcustomerEmail%5D=fd81e8b367fee82f45af1816e5ec9147%40gmail.com&metadata%5BpaymentMethodId%5D=4167")
  .reply(200, {"id":"ch_1Au785D8MNtzsDcgLFd7Jv7p","object":"charge","amount":1000,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1Au785D8MNtzsDcgGXc68wv7","balance_transaction":"txn_1Au785D8MNtzsDcgZrkzNGeb","captured":true,"created":1503526517,"currency":"eur","customer":null,"description":"Monthly donation to BrusselsTogether (donor)","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"https://opencollective.com/xdamman","to":"https://opencollective.com/brusselstogether","customerEmail":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","paymentMethodId":"4167"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1Au785D8MNtzsDcgLFd7Jv7p/refunds"},"review":null,"shipping":null,"source":{"id":"card_1Au784D8MNtzsDcg1OUMLsEj","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:15:18 GMT',
  'content-type': 'application/json',
  'content-length': '2049',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_5Gm9ckzmWprRPW',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/balance/history/txn_1Au785D8MNtzsDcgZrkzNGeb')
  .reply(200, {"id":"txn_1Au785D8MNtzsDcgZrkzNGeb","object":"balance_transaction","amount":1000,"available_on":1504051200,"created":1503526517,"currency":"eur","description":"Monthly donation to BrusselsTogether (donor)","fee":104,"fee_details":[{"amount":50,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","currency":"eur","description":"OpenCollective application fee","type":"application_fee"},{"amount":54,"application":null,"currency":"eur","description":"Stripe processing fees","type":"stripe_fee"}],"net":896,"source":"ch_1Au785D8MNtzsDcgLFd7Jv7p","sourced_transfers":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers?source_transaction=ch_1Au785D8MNtzsDcgLFd7Jv7p"},"status":"pending","type":"charge"}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:15:18 GMT',
  'content-type': 'application/json',
  'content-length': '925',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_Hxk6ZBjkM3pqqh',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/plans/EUR-MONTH-1000')
  .reply(200, {"id":"EUR-MONTH-1000","object":"plan","amount":1000,"created":1503518941,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-1000","statement_descriptor":null,"trial_period_days":null}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:15:19 GMT',
  'content-type': 'application/json',
  'content-length': '287',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_JytJLxFgWyeC2J',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/tokens', "customer=cus_BGeQBcZD7CgU7e")
  .reply(200, {"id":"tok_1Au787D8MNtzsDcgZYpeJwg0","object":"token","card":{"id":"card_1Au787D8MNtzsDcg51qm48ZD","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"74.73.151.59","created":1503526519,"livemode":false,"type":"card","used":false}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:15:19 GMT',
  'content-type': 'application/json',
  'content-length': '775',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_2cWKZPIQHJNvTL',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/customers', "source=tok_1Au787D8MNtzsDcgZYpeJwg0&description=https%3A%2F%2Fopencollective.com%2Fxdamman&email=fd81e8b367fee82f45af1816e5ec9147%40gmail.com")
  .reply(200, {"id":"cus_BGeRvyFtKudcwG","object":"customer","account_balance":0,"created":1503526520,"currency":null,"default_source":"card_1Au787D8MNtzsDcg51qm48ZD","delinquent":false,"description":"https://opencollective.com/xdamman","discount":null,"email":"fd81e8b367fee82f45af1816e5ec9147@gmail.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1Au787D8MNtzsDcg51qm48ZD","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":"cus_BGeRvyFtKudcwG","cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2025,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BGeRvyFtKudcwG/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BGeRvyFtKudcwG/subscriptions"}}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:15:20 GMT',
  'content-type': 'application/json',
  'content-length': '1452',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_yvIaNETUY5haHy',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .post('/v1/customers/cus_BGeRvyFtKudcwG/subscriptions', /plan=EUR-MONTH-1000&application_fee_percent=5&trial_end=[0-9]+&metadata%5Bfrom%5D=https%3A%2F%2Fopencollective.com%2Fxdamman&metadata%5Bto%5D=https%3A%2F%2Fopencollective.com%2Fbrusselstogether&metadata%5BPaymentMethodId%5D=4167/)
  .reply(200, {"id":"sub_BGeRtp47X2LbeS","object":"subscription","application_fee_percent":5,"cancel_at_period_end":false,"canceled_at":null,"created":1503526520,"current_period_end":1504304115,"current_period_start":1503526520,"customer":"cus_BGeRvyFtKudcwG","discount":null,"ended_at":null,"items":{"object":"list","data":[{"id":"si_1Au788D8MNtzsDcgVfYDP22m","object":"subscription_item","created":1503526521,"metadata":{},"plan":{"id":"EUR-MONTH-1000","object":"plan","amount":1000,"created":1503518941,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-1000","statement_descriptor":null,"trial_period_days":null},"quantity":1}],"has_more":false,"total_count":1,"url":"/v1/subscription_items?subscription=sub_BGeRtp47X2LbeS"},"livemode":false,"metadata":{"from":"https://opencollective.com/xdamman","to":"https://opencollective.com/brusselstogether","PaymentMethodId":"4167"},"plan":{"id":"EUR-MONTH-1000","object":"plan","amount":1000,"created":1503518941,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-1000","statement_descriptor":null,"trial_period_days":null},"quantity":1,"start":1503526520,"status":"trialing","tax_percent":null,"trial_end":1504304115,"trial_start":1503526520}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:15:21 GMT',
  'content-type': 'application/json',
  'content-length': '1731',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_KTT4NUuLx3gYnj',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });

nock('https://api.stripe.com:443')
  .get('/v1/subscriptions/sub_BGeRtp47X2LbeS')
  .reply(200, {"id":"sub_BGeRtp47X2LbeS","object":"subscription","application_fee_percent":5,"cancel_at_period_end":false,"canceled_at":null,"created":1503526520,"current_period_end":1504304115,"current_period_start":1503526520,"customer":"cus_BGeRvyFtKudcwG","discount":null,"ended_at":null,"items":{"object":"list","data":[{"id":"si_1Au788D8MNtzsDcgVfYDP22m","object":"subscription_item","created":1503526521,"metadata":{},"plan":{"id":"EUR-MONTH-1000","object":"plan","amount":1000,"created":1503518941,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-1000","statement_descriptor":null,"trial_period_days":null},"quantity":1}],"has_more":false,"total_count":1,"url":"/v1/subscription_items?subscription=sub_BGeRtp47X2LbeS"},"livemode":false,"metadata":{"from":"https://opencollective.com/xdamman","to":"https://opencollective.com/brusselstogether","PaymentMethodId":"4167"},"plan":{"id":"EUR-MONTH-1000","object":"plan","amount":1000,"created":1503518941,"currency":"eur","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"EUR-MONTH-1000","statement_descriptor":null,"trial_period_days":null},"quantity":1,"start":1503526520,"status":"trialing","tax_percent":null,"trial_end":1504304115,"trial_start":1503526520}, { server: 'nginx',
  date: 'Wed, 23 Aug 2017 22:15:22 GMT',
  'content-type': 'application/json',
  'content-length': '1731',
  connection: 'close',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'access-control-allow-origin': '*',
  'access-control-max-age': '300',
  'cache-control': 'no-cache, no-store',
  'request-id': 'req_wUGmhUOqGkf0na',
  'stripe-account': 'acct_198T7jD8MNtzsDcg',
  'stripe-version': '2015-04-07',
  'strict-transport-security': 'max-age=31556926; includeSubDomains' });
