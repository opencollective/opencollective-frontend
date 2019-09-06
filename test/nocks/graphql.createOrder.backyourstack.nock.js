import nock from 'nock';

export default function() {
  nock('https://backyourstack.com:443', { encodedQueryParams: true })
    .get('/578a0a70-cef3-11e9-82be-21fd8ed699cb/file/backing.json')
    .reply(
      200,
      [
        '1f8b08000000000000038cd23b6f83301000e0ffe299888781268c952a5555874a1dab0e3c2ee000b6654c231af1df6bd26093c883c77b589fefecaf0b3a03a91b89b230083cc438d092751d9492fc00ca2e8854284bf6aa44f35e25d0735e40873c347463adc2e21ace1eaa896cc66239c1c4a6307b4e4294621c6ae3e5f39d50691018ba25b6286bc59189f7c113d6cceb38b493519a6b788708e04c55e4c449c92af06f2d8e5a98c68119ea0d86cd48a725b259c7bc8482b1d6ffef70a42265a59a5a76b21b645e4365c46dd206b3965190fe5d9ba31e063889b44ed5a67a468dbc266caa807ef27583a387719a981ff921404a02c2807ccd587e8ca93962716a28017929779560fc572dcb800f79fba0db16fff184e365a2e87088f575464a8e64fbc66bc232f7ad741a9c2d1c98373d43c1f3b235d29ab048ba347fff010000ffff',
        '03006cb3d6475f040000',
      ],
      [
        'Date',
        'Fri, 06 Sep 2019 07:38:34 GMT',
        'Content-Type',
        'application/json; charset=utf-8',
        'Transfer-Encoding',
        'chunked',
        'Connection',
        'close',
        'X-Powered-By',
        'Express',
        'ETag',
        'W/"45f-jMCVgBmVKgNAQhWFX7ovISYuFDY"',
        'x-now-trace',
        'bru1',
        'server',
        'now',
        'x-now-id',
        'bru1:hx1l6-1567755514113-4e93a5327d80',
        'strict-transport-security',
        'max-age=63072000',
        'cache-control',
        's-maxage=0',
        'X-Now-Instance',
        '45358256',
        'Content-Encoding',
        'gzip',
      ],
    );
}
