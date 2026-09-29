import type { NextApiRequest, NextApiResponse } from 'next';

import buttonHandler from '../../../pages/api/legacy/button';

type MockResponse = {
  headers: Record<string, string>;
  statusCode: number;
  body: string | null;
  set: (name: string, value: string) => MockResponse;
  setHeader: (name: string, value: string) => MockResponse;
  removeHeader: (name: string) => MockResponse;
  status: (code: number) => MockResponse;
  send: (body: string) => MockResponse;
};

function createMockRes(): MockResponse {
  const res: MockResponse = {
    headers: {},
    statusCode: 200,
    body: null,
    set(name: string, value: string) {
      res.headers[name.toLowerCase()] = String(value);
      return res;
    },
    setHeader(name: string, value: string) {
      res.headers[name.toLowerCase()] = String(value);
      return res;
    },
    removeHeader(name: string) {
      delete res.headers[name.toLowerCase()];
      return res;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    send(body: string) {
      res.body = body;
      return res;
    },
  };
  return res;
}

function makeStubDom({
  readyState = 'loading',
  scriptSrc = null,
}: { readyState?: string; scriptSrc?: string | null } = {}) {
  const alertCalls: string[] = [];
  const alert = (...args: unknown[]) => {
    alertCalls.push(args.map(a => String(a)).join(','));
  };
  const fakeScriptNode = scriptSrc
    ? {
        attributes: [{ name: 'src', value: scriptSrc }],
        getAttribute: (name: string) => (name === 'src' ? scriptSrc : null),
        parentNode: { insertBefore() {} },
      }
    : null;
  const document = {
    domain: 'staging.opencollective.com',
    readyState,
    addEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => (scriptSrc ? [fakeScriptNode] : []),
    createElement: () => ({ className: '', innerHTML: '', appendChild() {} }),
  };
  const window = {
    addEventListener() {},
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
  };
  return { window, document, alert, alertCalls };
}

function evaluateScript(body: string, dom: ReturnType<typeof makeStubDom>) {
  const fn = new Function('window', 'document', 'alert', body);
  fn(dom.window, dom.document, dom.alert);
}

describe('GET /api/legacy/button.js', () => {
  const originalEnvWebsiteUrl = process.env.WEBSITE_URL;

  beforeAll(() => {
    process.env.WEBSITE_URL = 'https://staging.opencollective.com';
  });

  afterAll(() => {
    process.env.WEBSITE_URL = originalEnvWebsiteUrl;
  });

  it('serves benign embed with expected headers and valid executable JS', () => {
    const req = { query: { collectiveSlug: 'babel', verb: 'donate' } } as unknown as NextApiRequest;
    const res = createMockRes();

    buttonHandler(req, res as unknown as NextApiResponse);

    expect(res.headers['content-type']).toBe('application/javascript');
    expect(res.headers['cache-control']).toBe('public, max-age=86400');
    expect(res.headers['x-frame-options']).toBeUndefined();
    expect(res.body).toContain('opencollective-donate-button');
    expect(res.body).toContain('/babel/${verb}/button?color=');

    const dom = makeStubDom({
      readyState: 'complete',
      scriptSrc: 'https://staging.opencollective.com/babel/donate/button.js',
    });
    expect(() => evaluateScript(res.body!, dom)).not.toThrow();
    expect(dom.alertCalls).toHaveLength(0);
  });

  it.each(['donate', 'contribute'])('accepts allowlisted verb parameter: %s', verb => {
    const req = { query: { collectiveSlug: 'webpack', verb } } as unknown as NextApiRequest;
    const res = createMockRes();

    buttonHandler(req, res as unknown as NextApiResponse);

    expect(res.body).toContain(`opencollective-${verb}-button`);
    const dom = makeStubDom({
      readyState: 'complete',
      scriptSrc: `https://staging.opencollective.com/webpack/${verb}/button.js`,
    });
    expect(() => evaluateScript(res.body!, dom)).not.toThrow();
    expect(dom.alertCalls).toHaveLength(0);
  });

  it('falls back to "collective" on invalid or breakout collectiveSlug parameter', () => {
    const slugBreakouts = [
      'x`;alert(document.domain);//',
      "x';alert(document.domain)//",
      'x";alert(document.domain)//',
      'x</script><script>alert(1)</script>',
      'x\\;alert(1)//',
      'slug with spaces',
      'a'.repeat(129),
    ];

    for (const payload of slugBreakouts) {
      const req = { query: { collectiveSlug: payload, verb: 'donate' } } as unknown as NextApiRequest;
      const res = createMockRes();

      buttonHandler(req, res as unknown as NextApiResponse);

      expect(res.body).toContain('/collective/${verb}/button?color=');
      expect(res.body).not.toContain(payload);

      const dom = makeStubDom({
        readyState: 'complete',
        scriptSrc: 'https://staging.opencollective.com/collective/donate/button.js',
      });
      expect(() => evaluateScript(res.body!, dom)).not.toThrow();
      expect(dom.alertCalls).toHaveLength(0);
    }
  });

  it('falls back to "donate" on invalid or breakout verb parameter', () => {
    const verbBreakouts = [
      "x';alert(document.domain)//",
      'x`;alert(document.domain);//',
      'x";alert(document.domain)//',
      'x</script><script>alert(1)</script>',
      'x\\;alert(1)//',
      'invalidVerb',
    ];

    for (const payload of verbBreakouts) {
      const req = { query: { collectiveSlug: 'babel', verb: payload } } as unknown as NextApiRequest;
      const res = createMockRes();

      buttonHandler(req, res as unknown as NextApiResponse);

      expect(res.body).toContain('opencollective-donate-button');
      expect(res.body).not.toContain(payload);

      const dom = makeStubDom({
        readyState: 'complete',
        scriptSrc: 'https://staging.opencollective.com/babel/donate/button.js',
      });
      expect(() => evaluateScript(res.body!, dom)).not.toThrow();
      expect(dom.alertCalls).toHaveLength(0);
    }
  });

  it('does not allow overriding host', () => {
    const req = {
      query: {
        collectiveSlug: 'babel',
        verb: 'donate',
        host: 'https://attacker.example.com',
      },
    } as unknown as NextApiRequest;
    const res = createMockRes();

    buttonHandler(req, res as unknown as NextApiResponse);

    expect(res.body).not.toContain('https://attacker.example.com');
    expect(res.body).toContain('https://staging.opencollective.com');
  });
});
