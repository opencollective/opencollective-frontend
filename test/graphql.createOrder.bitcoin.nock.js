import nock from 'nock';

export default function() {

nock('https://api.stripe.com:443', {"encodedQueryParams":true})
  .post('/v1/customers', "email=jsmith%40email.com")
  .reply(200, {"id":"cus_BykOG8ivma78f2","object":"customer","account_balance":0,"created":1513696866,"currency":null,"default_source":null,"delinquent":false,"description":null,"discount":null,"email":"jsmith@email.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BykOG8ivma78f2/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BykOG8ivma78f2/subscriptions"}}, [ 'Server'
    ]);

nock('https://api.stripe.com:443', {"encodedQueryParams":true})
  .post('/v1/customers', "email=b74fedb3732584297fc08de53f30e6db%40gmail.com")
  .reply(200, {"id":"cus_BykOG8ivma78f2","object":"customer","account_balance":0,"created":1513696866,"currency":null,"default_source":null,"delinquent":false,"description":null,"discount":null,"email":"jsmith@email.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BykOG8ivma78f2/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BykOG8ivma78f2/subscriptions"}}, [ 'Server'
    ]);

nock('https://api.stripe.com:443', {"encodedQueryParams":true})
  .post('/v1/customers', "email=1ba6c325827d7d1b99a1651fdbd55a5f%40gmail.com")
  .reply(200, {"id":"cus_BykOG8ivma78f2","object":"customer","account_balance":0,"created":1513696866,"currency":null,"default_source":null,"delinquent":false,"description":null,"discount":null,"email":"jsmith@email.com","livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BykOG8ivma78f2/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_BykOG8ivma78f2/subscriptions"}}, [ 'Server'
    ]);

}