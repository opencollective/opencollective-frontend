import nock from 'nock';

export default function() {
  nock('https://backyourstack.com:443', { encodedQueryParams: true })
    .get('/test/backing.json')
    .reply(200, [
      {
        weight: 100,
        opencollective: {
          id: 2,
          slug: 'test1',
        },
      },
      {
        weight: 100,
        opencollective: {
          id: 3,
          slug: 'test2',
        },
      },
    ]);
}
