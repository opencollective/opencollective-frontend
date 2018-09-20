import nock from 'nock';

nock('https://api.mailgun.net:443')
  .get('/v3/lists')
  .reply(
    200,
    { items: [], total_count: 11 },
    {
      server: 'nginx',
      date: 'Fri, 29 Jul 2016 14:40:32 GMT',
      'content-type': 'application/json',
      'content-length': '38',
      connection: 'close',
      'content-disposition': 'inline',
      'access-control-allow-origin': '*',
      'access-control-max-age': '600',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-requested-with',
    },
  );

nock('https://api.mailgun.net:443')
  .post(
    '/v3/lists',
    'address=backers%40testcollective.opencollective.com&description=Mailing%20list%20for%20all%20the%20backers%20of%20Test%20Collective',
  )
  .reply(
    200,
    {
      list: {
        access_level: 'readonly',
        address: 'backers@testcollective.opencollective.com',
        created_at: 'Fri, 29 Jul 2016 14:40:32 -0000',
        description: 'Mailing list for all the backers of Test Collective',
        members_count: 0,
        name: '',
      },
      message: 'Mailing list has been created',
    },
    {
      server: 'nginx',
      date: 'Fri, 29 Jul 2016 14:40:32 GMT',
      'content-type': 'application/json',
      'content-length': '323',
      connection: 'close',
      'content-disposition': 'inline',
      'access-control-allow-origin': '*',
      'access-control-max-age': '600',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-requested-with',
    },
  );

nock('https://api.mailgun.net:443')
  .delete('/v3/lists/backers@testcollective.opencollective.com')
  .reply(
    200,
    {
      address: 'backers@testcollective.opencollective.com',
      message: 'Mailing list has been removed',
    },
    {
      server: 'nginx',
      date: 'Fri, 29 Jul 2016 14:40:33 GMT',
      'content-type': 'application/json',
      'content-length': '106',
      connection: 'close',
      'content-disposition': 'inline',
      'access-control-allow-origin': '*',
      'access-control-max-age': '600',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-requested-with',
    },
  );

nock('https://api.mailgun.net:443')
  .post(
    '/v3/lists',
    'address=backers%40testcollective.opencollective.com&description=Mailing%20list%20for%20all%20the%20backers%20of%20Test%20Collective',
  )
  .reply(
    200,
    {
      list: {
        access_level: 'readonly',
        address: 'backers@testcollective.opencollective.com',
        created_at: 'Fri, 29 Jul 2016 14:40:33 -0000',
        description: 'Mailing list for all the backers of Test Collective',
        members_count: 0,
        name: '',
      },
      message: 'Mailing list has been created',
    },
    {
      server: 'nginx',
      date: 'Fri, 29 Jul 2016 14:40:33 GMT',
      'content-type': 'application/json',
      'content-length': '323',
      connection: 'close',
      'content-disposition': 'inline',
      'access-control-allow-origin': '*',
      'access-control-max-age': '600',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-requested-with',
    },
  );

nock('https://api.mailgun.net:443')
  .post(
    '/v3/lists/backers@testcollective.opencollective.com/members',
    'address=asood123%40gmail.com&name=Aseem%20Sood&subscribed=true&upsert=yes',
  )
  .reply(
    200,
    {
      member: {
        address: 'asood123@gmail.com',
        name: 'Aseem Sood',
        subscribed: true,
        vars: {},
      },
      message: 'Mailing list member has been created',
    },
    {
      server: 'nginx',
      date: 'Fri, 29 Jul 2016 14:40:33 GMT',
      'content-type': 'application/json',
      'content-length': '176',
      connection: 'close',
      'content-disposition': 'inline',
      'access-control-allow-origin': '*',
      'access-control-max-age': '600',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-requested-with',
    },
  );

nock('https://api.mailgun.net:443')
  .delete('/v3/lists/backers@testcollective.opencollective.com')
  .reply(
    200,
    {
      address: 'backers@testcollective.opencollective.com',
      message: 'Mailing list has been removed',
    },
    {
      server: 'nginx',
      date: 'Fri, 29 Jul 2016 14:40:33 GMT',
      'content-type': 'application/json',
      'content-length': '106',
      connection: 'close',
      'content-disposition': 'inline',
      'access-control-allow-origin': '*',
      'access-control-max-age': '600',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-requested-with',
    },
  );

nock('https://api.mailgun.net:443')
  .post(
    '/v3/lists',
    'address=backers%40testcollective.opencollective.com&description=Mailing%20list%20for%20all%20the%20backers%20of%20Test%20Collective',
  )
  .reply(
    200,
    {
      list: {
        access_level: 'readonly',
        address: 'backers@testcollective.opencollective.com',
        created_at: 'Fri, 29 Jul 2016 14:40:33 -0000',
        description: 'Mailing list for all the backers of Test Collective',
        members_count: 0,
        name: '',
      },
      message: 'Mailing list has been created',
    },
    {
      server: 'nginx',
      date: 'Fri, 29 Jul 2016 14:40:33 GMT',
      'content-type': 'application/json',
      'content-length': '323',
      connection: 'close',
      'content-disposition': 'inline',
      'access-control-allow-origin': '*',
      'access-control-max-age': '600',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-requested-with',
    },
  );

nock('https://api.mailgun.net:443')
  .post(
    '/v3/lists',
    'address=sponsors%40testcollective.opencollective.com&description=Mailing%20list%20for%20all%20the%20sponsors%20of%20Test%20Collective',
  )
  .reply(
    200,
    {
      list: {
        access_level: 'readonly',
        address: 'sponsors@testcollective.opencollective.com',
        created_at: 'Fri, 29 Jul 2016 14:40:33 -0000',
        description: 'Mailing list for all the sponsors of Test Collective',
        members_count: 0,
        name: '',
      },
      message: 'Mailing list has been created',
    },
    {
      server: 'nginx',
      date: 'Fri, 29 Jul 2016 14:40:33 GMT',
      'content-type': 'application/json',
      'content-length': '325',
      connection: 'close',
      'content-disposition': 'inline',
      'access-control-allow-origin': '*',
      'access-control-max-age': '600',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-requested-with',
    },
  );

nock('https://api.mailgun.net:443')
  .post(
    '/v3/lists',
    'address=backers%40testcollective.opencollective.com&description=Mailing%20list%20for%20all%20the%20backers%20of%20Test%20Collective',
  )
  .reply(
    200,
    {
      list: {
        access_level: 'readonly',
        address: 'backers@testcollective.opencollective.com',
        created_at: 'Fri, 29 Jul 2016 14:40:33 -0000',
        description: 'Mailing list for all the backers of Test Collective',
        members_count: 0,
        name: '',
      },
      message: 'Mailing list has been created',
    },
    {
      server: 'nginx',
      date: 'Fri, 29 Jul 2016 14:40:33 GMT',
      'content-type': 'application/json',
      'content-length': '323',
      connection: 'close',
      'content-disposition': 'inline',
      'access-control-allow-origin': '*',
      'access-control-max-age': '600',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-requested-with',
    },
  );

nock('https://api.mailgun.net:443')
  .post(
    '/v3/lists',
    'address=organizers%40testcollective.opencollective.com&description=Mailing%20list%20for%20all%20the%20organizers%20of%20Test%20Collective',
  )
  .reply(
    200,
    {
      list: {
        access_level: 'readonly',
        address: 'organizers@testcollective.opencollective.com',
        created_at: 'Fri, 29 Jul 2016 14:40:33 -0000',
        description: 'Mailing list for all the organizers of Test Collective',
        members_count: 0,
        name: '',
      },
      message: 'Mailing list has been created',
    },
    {
      server: 'nginx',
      date: 'Fri, 29 Jul 2016 14:40:33 GMT',
      'content-type': 'application/json',
      'content-length': '323',
      connection: 'close',
      'content-disposition': 'inline',
      'access-control-allow-origin': '*',
      'access-control-max-age': '600',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-requested-with',
    },
  );

nock('https://api.mailgun.net:443')
  .post(
    '/v3/lists/backers@testcollective.opencollective.com/organizers',
    'address=asood123%40gmail.com&name=Aseem%20Sood&subscribed=true&upsert=yes',
  )
  .reply(
    200,
    {
      member: {
        address: 'asood123@gmail.com',
        name: 'Aseem Sood',
        subscribed: true,
        vars: {},
      },
      message: 'Mailing list member has been created',
    },
    {
      server: 'nginx',
      date: 'Fri, 29 Jul 2016 14:40:33 GMT',
      'content-type': 'application/json',
      'content-length': '176',
      connection: 'close',
      'content-disposition': 'inline',
      'access-control-allow-origin': '*',
      'access-control-max-age': '600',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-requested-with',
    },
  );

nock('https://api.mailgun.net:443')
  .post(
    '/v3/lists/backers@testcollective.opencollective.com/organizers',
    'address=pia%40opencollective.com&name=Pia%20Mancini&subscribed=true&upsert=yes',
  )
  .reply(
    200,
    {
      member: {
        address: 'pia@opencollective.com',
        name: 'Pia Mancini',
        subscribed: true,
        vars: {},
      },
      message: 'Mailing list member has been created',
    },
    {
      server: 'nginx',
      date: 'Fri, 29 Jul 2016 14:40:33 GMT',
      'content-type': 'application/json',
      'content-length': '181',
      connection: 'close',
      'content-disposition': 'inline',
      'access-control-allow-origin': '*',
      'access-control-max-age': '600',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-requested-with',
    },
  );

nock('https://api.mailgun.net:443')
  .post(
    '/v3/lists/sponsors@testcollective.opencollective.com/organizers',
    'address=github%40opencollective.com&name=github&subscribed=true&upsert=yes',
  )
  .reply(
    200,
    {
      member: {
        address: 'github@opencollective.com',
        name: 'github',
        subscribed: true,
        vars: {},
      },
      message: 'Mailing list member has been created',
    },
    {
      server: 'nginx',
      date: 'Fri, 29 Jul 2016 14:40:33 GMT',
      'content-type': 'application/json',
      'content-length': '179',
      connection: 'close',
      'content-disposition': 'inline',
      'access-control-allow-origin': '*',
      'access-control-max-age': '600',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-requested-with',
    },
  );

nock('https://api.mailgun.net:443')
  .post(
    '/v3/lists/organizers@testcollective.opencollective.com/organizers',
    'address=xdamman%40gmail.com&name=Xavier%20Damman&subscribed=true&upsert=yes',
  )
  .reply(
    200,
    {
      member: {
        address: 'xdamman@gmail.com',
        name: 'Xavier Damman',
        subscribed: true,
        vars: {},
      },
      message: 'Mailing list member has been created',
    },
    {
      server: 'nginx',
      date: 'Fri, 29 Jul 2016 14:40:33 GMT',
      'content-type': 'application/json',
      'content-length': '178',
      connection: 'close',
      'content-disposition': 'inline',
      'access-control-allow-origin': '*',
      'access-control-max-age': '600',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-requested-with',
    },
  );

nock('https://api.mailgun.net:443')
  .delete('/v3/lists/backers@testcollective.opencollective.com')
  .reply(
    200,
    {
      address: 'backers@testcollective.opencollective.com',
      message: 'Mailing list has been removed',
    },
    {
      server: 'nginx',
      date: 'Fri, 29 Jul 2016 14:40:33 GMT',
      'content-type': 'application/json',
      'content-length': '106',
      connection: 'close',
      'content-disposition': 'inline',
      'access-control-allow-origin': '*',
      'access-control-max-age': '600',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-requested-with',
    },
  );

nock('https://api.mailgun.net:443')
  .delete('/v3/lists/organizers@testcollective.opencollective.com')
  .reply(
    200,
    {
      address: 'organizers@testcollective.opencollective.com',
      message: 'Mailing list has been removed',
    },
    {
      server: 'nginx',
      date: 'Fri, 29 Jul 2016 14:40:33 GMT',
      'content-type': 'application/json',
      'content-length': '106',
      connection: 'close',
      'content-disposition': 'inline',
      'access-control-allow-origin': '*',
      'access-control-max-age': '600',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-requested-with',
    },
  );

nock('https://api.mailgun.net:443')
  .delete('/v3/lists/sponsors@testcollective.opencollective.com')
  .reply(
    200,
    {
      address: 'sponsors@testcollective.opencollective.com',
      message: 'Mailing list has been removed',
    },
    {
      server: 'nginx',
      date: 'Fri, 29 Jul 2016 14:40:34 GMT',
      'content-type': 'application/json',
      'content-length': '107',
      connection: 'close',
      'content-disposition': 'inline',
      'access-control-allow-origin': '*',
      'access-control-max-age': '600',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, x-requested-with',
    },
  );
