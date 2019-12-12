import nock from 'nock';

export default function() {
  nock('https://data.fixer.io', { encodedQueryParams: true })
    .get('/latest')
    .times(2)
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1532557927,
      historical: true,
      base: 'EUR',
      date: '2018-07-25',
      rates: { USD: 1.173428 },
    });
  nock('https://data.fixer.io', { encodedQueryParams: true })
    .get('/latest')
    .times(2)
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1532557927,
      historical: true,
      base: 'EUR',
      date: '2018-07-25',
      rates: { USD: 1.173428 },
    });
  nock('https://data.fixer.io', { encodedQueryParams: true })
    .get('/latest')
    .times(2)
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1532557927,
      historical: true,
      base: 'EUR',
      date: '2018-07-25',
      rates: { USD: 1.173428 },
    });
  nock('https://data.fixer.io', { encodedQueryParams: true })
    .get('/latest')
    .times(2)
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1532557927,
      historical: true,
      base: 'EUR',
      date: '2018-07-25',
      rates: { USD: 1.173428 },
    });
}
