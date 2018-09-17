import nock from 'nock';

export default function() {
  nock('https://api.stripe.com:443', { encodedQueryParams: true })
    .post(
      '/v1/customers',
      'source=tok_1BvCA5DjPFcHOcTmg1234567&description=https%3A%2F%2Fopencollective.com%2Fundefined&email=',
    )
    .reply(
      200,
      {
        id: 'cus_BSeRpSPOYo1234',
        object: 'customer',
        account_balance: 0,
        created: 1506294253,
        currency: null,
        default_source: 'card_1B5j8xDjPFcHOcTmDV3bGhAI',
        delinquent: false,
        description: 'https://opencollective.com/john-smith',
        discount: null,
        email: '',
        livemode: false,
        metadata: {},
        shipping: null,
        sources: {
          object: 'list',
          data: [
            {
              id: 'card_1B5j8xDjPFcHOcTmDV3bGhAI',
              object: 'card',
              address_city: null,
              address_country: null,
              address_line1: null,
              address_line1_check: null,
              address_line2: null,
              address_state: null,
              address_zip: null,
              address_zip_check: null,
              brand: 'Visa',
              country: 'US',
              customer: 'cus_BSeRpSPOYoLmLY',
              cvc_check: 'pass',
              dynamic_last4: null,
              exp_month: 12,
              exp_year: 2028,
              fingerprint: 'ftgJeBXvQSZ4HMCg',
              funding: 'credit',
              last4: '4242',
              metadata: {},
              name: null,
              tokenization_method: null,
            },
          ],
          has_more: false,
          total_count: 1,
          url: '/v1/customers/cus_BSeRpSPOYoLmLY/sources',
        },
        subscriptions: {
          object: 'list',
          data: [],
          has_more: false,
          total_count: 0,
          url: '/v1/customers/cus_BSeRpSPOYoLmLY/subscriptions',
        },
      },
      ['Server'],
    );
}
