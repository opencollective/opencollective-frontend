import nock from 'nock';

export default function() {
  const platformToken = "tok_1AzPXBDjPFcHOcTmeXZjqoJP";
  const platformCustomer = "cus_BM7mGwp1Ea8RtL";
  const hostToken = "tok_1AzPXGD8MNtzsDcgwaltZuvp";
  const hostCustomer = "cus_BM7mwnm6mLe271";
  const hostChargeId1 = "ch_17KUJnBgJgc4Ba6uvdu1hxm4"; // same than on test/mocks/stripe.js
 
  nock('https://api.stripe.com:443', {"encodedQueryParams":true})
    .post('/v1/tokens', "card%5Bnumber%5D=4242424242424242&card%5Bexp_month%5D=12&card%5Bexp_year%5D=2028&card%5Bcvc%5D=222")
    .reply(200, {"id": platformToken,"object":"token","card":{"id":"card_1AzPXADjPFcHOcTm0SU3o9IW","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"unchecked","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"217.136.35.207","created":1504788905,"livemode":false,"type":"card","used":false});

  // create the customer at platform level
  nock('https://api.stripe.com:443', {"encodedQueryParams":true})
    .post('/v1/customers', `source=${platformToken}&description=https%3A%2F%2Fopencollective.com%2Fphilmod&email=user1%40opencollective.com`)
    .times(5)
    .reply(200, {"id": platformCustomer,"object":"customer","account_balance":0,"created":1504788909,"currency":null,"default_source":"card_1AzPXADjPFcHOcTm0SU3o9IW","delinquent":false,"description":"https://opencollective.com/philmod","discount":null,"email":"user1@opencollective.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1AzPXADjPFcHOcTm0SU3o9IW","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer": platformCustomer,"cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"ftgJeBXvQSZ4HMCg","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BM7mGwp1Ea8RtL/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BM7mGwp1Ea8RtL/subscriptions"}});

  nock('https://api.stripe.com:443', {"encodedQueryParams":true})
    .post('/v1/tokens', `customer=${platformCustomer}`)
    .times(10)
    .reply(200, {"id": hostToken,"object":"token","card":{"id":"card_1AzPXGD8MNtzsDcgy7M2jlds","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"client_ip":"217.136.35.207","created":1504788910,"livemode":false,"type":"card","used":false});

  nock('https://api.stripe.com:443', {"encodedQueryParams":true})
    .post('/v1/charges', new RegExp(`amount=35000&currency=USD&source=${hostToken}&description=&application_fee=1750&metadata%5Bfrom%5D=http%3A%2F%2Flocalhost%3A3000%2Fphilmod&metadata%5Bto%5D=http%3A%2F%2Flocalhost%3A3000%2Fscouts&metadata%5BcustomerEmail%5D=user1%40opencollective.com&metadata%5BPaymentMethodId%5D=[0-9]+`))
    .reply(200, {"id": hostChargeId1,"object":"charge","amount":35000,"amount_refunded":0,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","application_fee":"fee_1AzPXID8MNtzsDcg1BHfiZjW","balance_transaction":"txn_1AzPXID8MNtzsDcgpAUVjNJm","captured":true,"created":1504788911,"currency":"usd","customer":null,"description":"","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{"from":"http://localhost:3000/philmod","to":"http://localhost:3000/scouts","customerEmail":"user1@opencollective.com","PaymentMethodId":"4"},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1AzPXHD8MNtzsDcgXpUhv4pm/refunds"},"review":null,"shipping":null,"source":{"id":"card_1AzPXGD8MNtzsDcgy7M2jlds","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null});

  nock('https://api.stripe.com:443', {"encodedQueryParams":true})
    .get('/v1/balance/history/txn_1AzPXID8MNtzsDcgpAUVjNJm')
    .times(12)
    .reply(200, {"id":"txn_1AzPXID8MNtzsDcgpAUVjNJm","object":"balance_transaction","amount":28652,"available_on":1505347200,"created":1504788911,"currency":"eur","description":"","fee":2289,"fee_details":[{"amount":1433,"application":"ca_68FQcZXEcV66Kjg7egLnR1Ce87cqwoue","currency":"eur","description":"OpenCollective application fee","type":"application_fee"},{"amount":856,"application":null,"currency":"eur","description":"Stripe processing fees","type":"stripe_fee"}],"net":26363,"source": hostChargeId1,"sourced_transfers":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers?source_transaction=ch_1AzPXHD8MNtzsDcgXpUhv4pm"},"status":"pending","type":"charge"});

  nock('https://api.stripe.com:443', {"encodedQueryParams":true})
    .get('/v1/plans/USD-MONTH-35000')
    .times(6)
    .reply(200, {"id":"USD-MONTH-35000","object":"plan","amount":35000,"created":1504702187,"currency":"usd","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"USD-MONTH-35000","statement_descriptor":null,"trial_period_days":null});

    // create customer at host level
  nock('https://api.stripe.com:443', {"encodedQueryParams":true})
    .post('/v1/customers', `source=${hostToken}&description=https%3A%2F%2Fopencollective.com%2Fphilmod&email=user1%40opencollective.com`)
    .times(6)
    .reply(200, {"id": hostCustomer,"object":"customer","account_balance":0,"created":1504788915,"currency":null,"default_source":"card_1AzPXKD8MNtzsDcgo9JVURh1","delinquent":false,"description":"https://opencollective.com/philmod","discount":null,"email":"user1@opencollective.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_1AzPXKD8MNtzsDcgo9JVURh1","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer": hostCustomer,"cvc_check":"pass","dynamic_last4":null,"exp_month":12,"exp_year":2028,"fingerprint":"nt4eriIIhN3fiPZF","funding":"credit","last4":"4242","metadata":{},"name":null,"tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_BM7mwnm6mLe271/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BM7mwnm6mLe271/subscriptions"}});

  nock('https://api.stripe.com:443', {"encodedQueryParams":true})
    .post(`/v1/customers/${hostCustomer}/subscriptions`, /plan=USD-MONTH-35000&application_fee_percent=5&trial_end=[0-9]{10}&metadata%5Bfrom%5D=http%3A%2F%2Flocalhost%3A3000%2Fphilmod&metadata%5Bto%5D=http%3A%2F%2Flocalhost%3A3000%2Fscouts&metadata%5BPaymentMethodId%5D=4/)
    .times(6)
    .reply(200, {"id":"sub_BM7mrzF0w129va","object":"subscription","application_fee_percent":5,"cancel_at_period_end":false,"canceled_at":null,"created":1504788916,"current_period_end":1506862509,"current_period_start":1504788916,"customer": hostCustomer,"discount":null,"ended_at":null,"items":{"object":"list","data":[{"id":"si_1AzPXMD8MNtzsDcgKFxPC80y","object":"subscription_item","created":1504788917,"metadata":{},"plan":{"id":"USD-MONTH-35000","object":"plan","amount":35000,"created":1504702187,"currency":"usd","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"USD-MONTH-35000","statement_descriptor":null,"trial_period_days":null},"quantity":1}],"has_more":false,"total_count":1,"url":"/v1/subscription_items?subscription=sub_BM7mrzF0w129va"},"livemode":false,"metadata":{"from":"http://localhost:3000/philmod","to":"http://localhost:3000/scouts","PaymentMethodId":"4"},"plan":{"id":"USD-MONTH-35000","object":"plan","amount":35000,"created":1504702187,"currency":"usd","interval":"month","interval_count":1,"livemode":false,"metadata":{},"name":"USD-MONTH-35000","statement_descriptor":null,"trial_period_days":null},"quantity":1,"start":1504788916,"status":"trialing","tax_percent":null,"trial_end":1506862509,"trial_start":1504788916});
}