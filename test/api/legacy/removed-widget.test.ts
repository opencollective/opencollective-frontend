import type { NextApiRequest, NextApiResponse } from 'next';

import removedWidgetHandler from '../../../pages/api/legacy/removed-widget';

function createMockRes() {
  const res = {
    headers: {} as Record<string, string>,
    statusCode: 200,
    body: null as string | null,
    set(name: string, value: string) {
      res.headers[name.toLowerCase()] = String(value);
      return res;
    },
    setHeader(name: string, value: string) {
      res.headers[name.toLowerCase()] = String(value);
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

describe('GET /:collectiveSlug/(collectives|widget).html (removed widget)', () => {
  it('answers 410 with an empty, transparent page', () => {
    const req = { query: { collectiveSlug: 'opencollective', role: 'host' } } as unknown as NextApiRequest;
    const res = createMockRes();

    removedWidgetHandler(req, res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(410);
    expect(res.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(res.headers['cache-control']).toBe('public, max-age=86400');
    expect(res.body).toContain('<body></body>');
    expect(res.body).toContain('background: transparent');
    expect(res.body).toContain('noindex');
  });
});
