import httpProxy from 'http-proxy';
import type { NextApiRequest, NextApiResponse } from 'next';
import requestIp from 'request-ip';

const baseApiUrl = process.env.INTERNAL_API_URL || process.env.API_URL;

// ignore unused exports default, config
// next.js export

export const config = {
  api: {
    externalResolver: true,
    bodyParser: false,
  },
};

export default (req: NextApiRequest, res: NextApiResponse) => {
  const ip = requestIp.getClientIp(req);
  req.headers['oc-frontend-ip'] = ip;
  req.headers['X-Forwarded-For'] = ip;
  req.headers['oc-frontend-api-proxy'] = '1';

  const [pathname, search] = req.url.split('?');
  const searchParams = new URLSearchParams(search);
  searchParams.set('api_key', process.env.API_KEY);
  req.url = `${pathname.replace(/api\//, '')}?${searchParams.toString()}`;

  return new Promise((resolve, reject) => {
    const proxy = httpProxy.createProxy({
      changeOrigin: true,
      target: baseApiUrl,
    });

    proxy.once('proxyRes', resolve).once('error', reject);

    proxy.web(req, res);
  });
};
