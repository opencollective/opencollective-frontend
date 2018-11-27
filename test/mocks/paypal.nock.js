import nock from 'nock';

export default () => {
  nock('https://api.sandbox.paypal.com:443')
    .post('/v1/oauth2/token', 'grant_type=client_credentials')
    .reply(
      200,
      {
        scope:
          'https://uri.paypal.com/services/subscriptions https://api.paypal.com/v1/payments/.* https://api.paypal.com/v1/vault/credit-card https://uri.paypal.com/services/applications/webhooks openid https://uri.paypal.com/payments/payouts https://api.paypal.com/v1/vault/credit-card/.*',
        nonce: '2016-08-03T21:01:22ZcIbqjVI2MPTodCz4VkKZptGUDo0l77kE0W9HJCarniE',
        access_token:
          'A101.gP5cjIGBF4eAVuq_hTrafQ7F_DqZ0FPqNgi_OnDAP31Pf8r-9GRbtYR5HyN-bjQ0.LeHej6pGR28T6nKme0E1MCB-3cC',
        token_type: 'Bearer',
        app_id: 'APP-80W284485P519543T',
        expires_in: 31244,
      },
      {
        date: 'Wed, 03 Aug 2016 21:20:38 GMT',
        server: 'Apache',
        proxy_server_info: 'host=slcsbplatformapiserv3002.slc.paypal.com;threadId=1401',
        'paypal-debug-id': 'b0f91a413f6f1, b0f91a413f6f1',
        'correlation-id': 'b0f91a413f6f1',
        'x-paypal-token-service': 'IAAS',
        connection: 'close',
        'set-cookie': [
          'X-PP-SILOVER=name%3DSANDBOX3.API.1%26silo_version%3D1880%26app%3Dplatformapiserv%26TIME%3D643867223%26HTTP_X_PP_AZ_LOCATOR%3D; Expires=Wed, 03 Aug 2016 21:50:38 GMT; domain=.paypal.com; path=/; Secure; HttpOnly',
          'X-PP-SILOVER=; Expires=Thu, 01 Jan 1970 00:00:01 GMT',
        ],
        vary: 'Authorization',
        'content-length': '550',
        'content-type': 'application/json',
      },
    );

  nock('https://api.sandbox.paypal.com:443')
    .post('/v1/payments/billing-plans/', {
      description: 'donation of USD 10 / month to WWCode Austin',
      name: 'Plan for donation of USD 10 / month to WWCode Austin',
      merchant_preferences: {
        cancel_url: 'http://localhost:3060/collectives/1/transactions/1/callback',
        return_url: 'http://localhost:3060/collectives/1/transactions/1/callback',
      },
      payment_definitions: [
        {
          amount: { currency: 'USD', value: 10 },
          cycles: '0',
          frequency: 'MONTH',
          frequency_interval: '1',
          name: 'Regular payment',
          type: 'REGULAR',
        },
      ],
      type: 'INFINITE',
    })
    .reply(
      201,
      {
        id: 'P-5XV712416S7754716XCYHPFI',
        state: 'CREATED',
        name: 'Plan for donation of USD 10 / month to WWCode Austin',
        description: 'donation of USD 10 / month to WWCode Austin',
        type: 'INFINITE',
        payment_definitions: [
          {
            id: 'PD-2BF62477UT6951926XCYHPFI',
            name: 'Regular payment',
            type: 'REGULAR',
            frequency: 'Month',
            amount: { currency: 'USD', value: '10' },
            cycles: '0',
            charge_models: [],
            frequency_interval: '1',
          },
        ],
        merchant_preferences: {
          setup_fee: { currency: 'USD', value: '0' },
          max_fail_attempts: '0',
          return_url: 'http://localhost:3060/collectives/1/transactions/1/callback',
          cancel_url: 'http://localhost:3060/collectives/1/transactions/1/callback',
          auto_bill_amount: 'NO',
          initial_fail_amount_action: 'CONTINUE',
        },
        create_time: '2016-08-23T18:36:27.925Z',
        update_time: '2016-08-23T18:36:27.925Z',
        links: [
          {
            href: 'https://api.sandbox.paypal.com/v1/payments/billing-plans/P-5XV712416S7754716XCYHPFI',
            rel: 'self',
            method: 'GET',
          },
        ],
      },
      {
        date: 'Tue, 23 Aug 2016 18:36:27 GMT',
        server: 'Apache',
        proxy_server_info: 'host=slcsbplatformapiserv3001.slc.paypal.com;threadId=776',
        'paypal-debug-id': '9cb7ce06d858b, 9cb7ce06d858b',
        'correlation-id': '9cb7ce06d858b',
        'content-language': '*',
        connection: 'close',
        'set-cookie': [
          'X-PP-SILOVER=name%3DSANDBOX3.API.1%26silo_version%3D1880%26app%3Dplatformapiserv%26TIME%3D2878848087%26HTTP_X_PP_AZ_LOCATOR%3D; Expires=Tue, 23 Aug 2016 19:06:27 GMT; domain=.paypal.com; path=/; Secure; HttpOnly',
          'X-PP-SILOVER=; Expires=Thu, 01 Jan 1970 00:00:01 GMT',
        ],
        vary: 'Authorization',
        'content-length': '925',
        'content-type': 'application/json',
      },
    );

  nock('https://api.sandbox.paypal.com:443')
    .patch('/v1/payments/billing-plans/P-5XV712416S7754716XCYHPFI', [
      { op: 'replace', path: '/', value: { state: 'ACTIVE' } },
    ])
    .reply(200, '', {
      date: 'Tue, 23 Aug 2016 18:36:28 GMT',
      server: 'Apache',
      proxy_server_info: 'host=slcsbplatformapiserv3001.slc.paypal.com;threadId=385',
      'paypal-debug-id': '5fea6c8a7fb63, 5fea6c8a7fb63',
      'correlation-id': '5fea6c8a7fb63',
      'content-language': '*',
      connection: 'close',
      'set-cookie': [
        'X-PP-SILOVER=name%3DSANDBOX3.API.1%26silo_version%3D1880%26app%3Dplatformapiserv%26TIME%3D2895625303%26HTTP_X_PP_AZ_LOCATOR%3D; Expires=Tue, 23 Aug 2016 19:06:29 GMT; domain=.paypal.com; path=/; Secure; HttpOnly',
        'X-PP-SILOVER=; Expires=Thu, 01 Jan 1970 00:00:01 GMT',
      ],
      vary: 'Authorization',
      'content-length': '0',
      'content-type': 'text/xml',
    });

  nock('https://api.sandbox.paypal.com:443')
    .post('/v1/payments/billing-agreements/')
    .reply(
      201,
      {
        name: 'Agreement for donation of USD 10 / month to WWCode Austin',
        description: 'donation of USD 10 / month to WWCode Austin',
        plan: {
          id: 'P-5XV712416S7754716XCYHPFI',
          state: 'ACTIVE',
          name: 'Plan for donation of USD 10 / month to WWCode Austin',
          description: 'donation of USD 10 / month to WWCode Austin',
          type: 'INFINITE',
          payment_definitions: [
            {
              id: 'PD-2BF62477UT6951926XCYHPFI',
              name: 'Regular payment',
              type: 'REGULAR',
              frequency: 'Month',
              amount: { currency: 'USD', value: '10' },
              cycles: '0',
              charge_models: [],
              frequency_interval: '1',
            },
          ],
          merchant_preferences: {
            setup_fee: { currency: 'USD', value: '0' },
            max_fail_attempts: '0',
            return_url: 'http://localhost:3060/collectives/1/transactions/1/callback',
            cancel_url: 'http://localhost:3060/collectives/1/transactions/1/callback',
            auto_bill_amount: 'NO',
            initial_fail_amount_action: 'CONTINUE',
          },
        },
        links: [
          {
            href: 'https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=EC-9AN89060FV238992F',
            rel: 'approval_url',
            method: 'REDIRECT',
          },
          {
            href:
              'https://api.sandbox.paypal.com/v1/payments/billing-agreements/EC-9AN89060FV238992F/agreement-execute',
            rel: 'execute',
            method: 'POST',
          },
        ],
        start_date: '2016-08-23T18:36:33.479Z',
      },
      {
        date: 'Tue, 23 Aug 2016 18:36:29 GMT',
        server: 'Apache',
        proxy_server_info: 'host=slcsbplatformapiserv3001.slc.paypal.com;threadId=276',
        'paypal-debug-id': 'd4213fa6b3fdd, d4213fa6b3fdd',
        'correlation-id': 'd4213fa6b3fdd',
        'content-language': '*',
        connection: 'close',
        'set-cookie': [
          'X-PP-SILOVER=name%3DSANDBOX3.API.1%26silo_version%3D1880%26app%3Dplatformapiserv%26TIME%3D2912402519%26HTTP_X_PP_AZ_LOCATOR%3D; Expires=Tue, 23 Aug 2016 19:06:30 GMT; domain=.paypal.com; path=/; Secure; HttpOnly',
          'X-PP-SILOVER=; Expires=Thu, 01 Jan 1970 00:00:01 GMT',
        ],
        vary: 'Authorization',
        'content-length': '1186',
        'content-type': 'application/json',
      },
    );

  nock('https://api.sandbox.paypal.com:443')
    .post('/v1/payments/payment/', {
      intent: 'sale',
      payer: { payment_method: 'paypal' },
      redirect_urls: {
        return_url: 'http://localhost:3060/collectives/1/transactions/1/callback',
        cancel_url: 'http://localhost:3060/collectives/1/transactions/1/callback',
      },
      transactions: [
        {
          amount: { currency: 'USD', total: 10 },
          description: 'Donation to WWCode Austin (USD 10)',
        },
      ],
    })
    .reply(
      201,
      {
        id: 'PAY-5RY21717AN749961CK66JPNI',
        intent: 'sale',
        state: 'created',
        payer: { payment_method: 'paypal' },
        transactions: [
          {
            amount: { total: '10.00', currency: 'USD' },
            description: 'Donation to WWCode Austin (USD 10)',
            related_resources: [],
          },
        ],
        create_time: '2016-08-23T18:36:36Z',
        links: [
          {
            href: 'https://api.sandbox.paypal.com/v1/payments/payment/PAY-5RY21717AN749961CK66JPNI',
            rel: 'self',
            method: 'GET',
          },
          {
            href: 'https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=EC-81Y986204V302830H',
            rel: 'approval_url',
            method: 'REDIRECT',
          },
          {
            href: 'https://api.sandbox.paypal.com/v1/payments/payment/PAY-5RY21717AN749961CK66JPNI/execute',
            rel: 'execute',
            method: 'POST',
          },
        ],
      },
      {
        date: 'Tue, 23 Aug 2016 18:36:36 GMT',
        server: 'Apache',
        proxy_server_info: 'host=slcsbplatformapiserv3002.slc.paypal.com;threadId=581',
        'paypal-debug-id': '18368873d4512, 18368873d4512',
        'correlation-id': '18368873d4512',
        'content-language': '*',
        connection: 'close',
        'set-cookie': [
          'X-PP-SILOVER=name%3DSANDBOX3.API.1%26silo_version%3D1880%26app%3Dplatformapiserv%26TIME%3D3029843031%26HTTP_X_PP_AZ_LOCATOR%3D; Expires=Tue, 23 Aug 2016 19:06:37 GMT; domain=.paypal.com; path=/; Secure; HttpOnly',
          'X-PP-SILOVER=; Expires=Thu, 01 Jan 1970 00:00:01 GMT',
        ],
        vary: 'Authorization',
        'content-length': '688',
        'content-type': 'application/json',
      },
    );
};
