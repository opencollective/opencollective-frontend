import type { NextApiRequest, NextApiResponse } from 'next';

import widgetHandler from '../../../pages/api/legacy/widget';

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

describe('GET /api/legacy/widget.js', () => {
  const originalEnvWebsiteUrl = process.env.WEBSITE_URL;

  beforeAll(() => {
    process.env.WEBSITE_URL = 'https://staging.opencollective.com';
  });

  afterAll(() => {
    process.env.WEBSITE_URL = originalEnvWebsiteUrl;
  });

  it('serves benign embed with expected headers and valid executable JS', () => {
    const req = { query: { widget: 'events', style: '{}' } } as unknown as NextApiRequest;
    const res = createMockRes();

    widgetHandler(req, res as unknown as NextApiResponse);

    expect(res.headers['content-type']).toBe('application/javascript');
    expect(res.headers['cache-control']).toBe('public, max-age=86400');
    expect(res.body).toContain("window.OC.widgets['events']");
    expect(res.body).toContain("'{}'");

    const dom = makeStubDom({ readyState: 'loading' });
    expect(() => evaluateScript(res.body!, dom)).not.toThrow();
    expect(dom.alertCalls).toHaveLength(0);
  });

  it.each(['widget', 'events', 'collectives', 'banner'])('accepts allowlisted widget parameter: %s', widgetName => {
    const req = { query: { widget: widgetName } } as unknown as NextApiRequest;
    const res = createMockRes();

    widgetHandler(req, res as unknown as NextApiResponse);

    expect(res.body).toContain(`window.OC.widgets['${widgetName}']`);
    const dom = makeStubDom({ readyState: 'loading' });
    expect(() => evaluateScript(res.body!, dom)).not.toThrow();
  });

  it('falls back to "banner" on invalid or breakout widget parameter', () => {
    const breakoutPayloads = [
      "x';alert(document.domain)//",
      'x"onclick="alert(1)"',
      'x`+alert(1)+`',
      'x</script><script>alert(1)</script>',
      'x\\;alert(1)//',
      'invalidWidget',
    ];

    for (const payload of breakoutPayloads) {
      const req = { query: { widget: payload } } as unknown as NextApiRequest;
      const res = createMockRes();

      widgetHandler(req, res as unknown as NextApiResponse);

      expect(res.body).toContain("window.OC.widgets['banner']");
      expect(res.body).not.toContain(payload);

      const dom = makeStubDom({ readyState: 'loading' });
      expect(() => evaluateScript(res.body!, dom)).not.toThrow();
      expect(dom.alertCalls).toHaveLength(0);
    }
  });

  it('falls back to "{}" on non-JSON style parameter breakout attempts', () => {
    const nonJsonPayloads = [
      "';alert(document.domain)//",
      '`+alert(document.domain)+`',
      '";alert(document.domain)//',
      '</script><script>alert(1)</script>',
      'not valid json',
    ];

    for (const payload of nonJsonPayloads) {
      const req = { query: { widget: 'events', style: payload } } as unknown as NextApiRequest;
      const res = createMockRes();

      widgetHandler(req, res as unknown as NextApiResponse);

      expect(res.body).toContain("'{}'");
      const dom = makeStubDom({ readyState: 'loading' });
      expect(() => evaluateScript(res.body!, dom)).not.toThrow();
      expect(dom.alertCalls).toHaveLength(0);
    }
  });

  it('supports production style parameters', () => {
    const prodExamples = [
      {
        name: 'example 1: basic custom font, weight, color',
        input: '{"a":{"color":"red"},"h2":{"fontFamily":"Verdana","fontWeight":"normal","fontSize":"20px"}}',
        expectedProps: ['red', 'Verdana', 'normal', '20px'],
      },
      {
        name: 'example 2: display none and color',
        input: '{"a":{"display":"none"}, "h2":{"color":"white"}}',
        expectedProps: ['none', 'white'],
      },
      {
        name: 'example 3: tosdr banner with css vars, rems, multi-font stack and elements',
        input: JSON.stringify({
          body: { background: 'transparent' },
          h2: {
            fontFamily:
              '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen-Sans, Ubuntu, Cantarell, Helvetica Neue, sans-serif',
            fontSize: '1.5rem',
            fontWeight: '600',
            color: 'var(--text-color)',
          },
          p: {
            fontFamily:
              '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen-Sans, Ubuntu, Cantarell, Helvetica Neue, sans-serif',
            color: 'var(--text-color)',
          },
          a: { color: 'var(--link-color)' },
        }),
        expectedProps: ['transparent', 'var(--text-color)', 'var(--link-color)', '1.5rem', '600'],
      },
    ];

    for (const { input, expectedProps } of prodExamples) {
      const req = { query: { widget: 'events', style: input } } as unknown as NextApiRequest;
      const res = createMockRes();

      widgetHandler(req, res as unknown as NextApiResponse);

      for (const prop of expectedProps) {
        expect(res.body).toContain(prop);
      }

      const dom = makeStubDom({ readyState: 'loading' });
      expect(() => evaluateScript(res.body!, dom)).not.toThrow();
      expect(dom.alertCalls).toHaveLength(0);
    }
  });

  it('removes unwanted/malicious keys and values without erroring, keeping valid properties', () => {
    const mixedInput = JSON.stringify({
      a: {
        color: 'red',
        evilProp: "';alert(document.domain)//",
        'bad;key': 'value',
      },
      'bad;selector': {
        color: 'blue',
      },
      __proto__: {
        polluted: true,
      },
      h2: {
        fontFamily: 'Verdana',
        fontSize: '20px',
        danger: '<script>alert(1)</script>',
      },
    });

    const req = { query: { widget: 'events', style: mixedInput } } as unknown as NextApiRequest;
    const res = createMockRes();

    widgetHandler(req, res as unknown as NextApiResponse);

    // Malicious content stripped
    expect(res.body).not.toContain('alert(document.domain)');
    expect(res.body).not.toContain('bad;key');
    expect(res.body).not.toContain('bad;selector');
    expect(res.body).not.toContain('polluted');
    expect(res.body).not.toContain('<script>');

    // Valid properties retained
    expect(res.body).toContain('red');
    expect(res.body).toContain('Verdana');
    expect(res.body).toContain('20px');

    const dom = makeStubDom({ readyState: 'loading' });
    expect(() => evaluateScript(res.body!, dom)).not.toThrow();
    expect(dom.alertCalls).toHaveLength(0);
  });

  it('safely serializes and escapes valid JSON style containing breakout characters', () => {
    const jsonStyles = [
      { body: { fontFamily: "';alert(document.domain)//" } },
      { body: { color: '";alert(document.domain)//' } },
      { body: { fontSize: '`+alert(document.domain)+`' } },
      { body: { content: '</script><script>alert(1)</script>' } },
      { body: { backslash: '\\\\\\\'";alert(1)//' } },
    ];

    for (const styleObj of jsonStyles) {
      const req = { query: { widget: 'events', style: JSON.stringify(styleObj) } } as unknown as NextApiRequest;
      const res = createMockRes();

      widgetHandler(req, res as unknown as NextApiResponse);

      expect(res.body).not.toContain('</script>');
      const dom = makeStubDom({ readyState: 'loading' });
      expect(() => evaluateScript(res.body!, dom)).not.toThrow();
      expect(dom.alertCalls).toHaveLength(0);
    }
  });

  it('does not spread query parameters or allow overriding host', () => {
    const req = {
      query: {
        widget: 'events',
        host: 'https://attacker.example.com',
        extraParam: 'malicious',
      },
    } as unknown as NextApiRequest;
    const res = createMockRes();

    widgetHandler(req, res as unknown as NextApiResponse);

    expect(res.body).not.toContain('https://attacker.example.com');
    expect(res.body).not.toContain('malicious');
    expect(res.body).toContain('https://staging.opencollective.com');
  });
});
