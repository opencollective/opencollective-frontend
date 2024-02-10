import httpProxy from 'http-proxy';

const baseApiUrl = process.env.INTERNAL_API_URL || process.env.API_URL;

export const config = {
  api: {
    externalResolver: true,
    bodyParser: false,
  },
};

export default (req, res) => {
  req.headers['oc-frontend-api-proxy'] = '1';
  req.headers['oc-frontend-ip'] = req.ip;
  req.headers['X-Forwarded-For'] = req.ip;

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
