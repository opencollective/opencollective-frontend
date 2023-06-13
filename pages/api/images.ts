import { URL } from 'url';

import { pick } from 'lodash';
import type { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const apiUrl = new URL(`${process.env.API_URL}/images?api_key=${process.env.API_KEY}`);
  console.log('complete?', req.complete);
  req.on('data', () => console.log('data'));
  req.on('end', () => console.log('end'));
  req.on('error', () => console.log('error'));
  req.on('close', () => console.log('close'));
  req.on('drain', () => console.log('drain'));
  req.on('ready', () => console.log('ready'));
  req.on('timeout', () => console.log('timeout'));

  setTimeout(async () => {
    try {
      const result = await fetch(apiUrl, {
        method: 'POST',
        body: req.body,
        headers: <Record<string, string>>(
          pick(req.headers, [
            'Accept',
            'Accept-Language',
            'authorization',
            'Content-Type',
            'Content-Length',
            'User-Agent',
          ])
        ),
      });

      const body = await result.json();
      res.status(result.status).json(body);
      return;
    } catch (error) {
      res.status(500).send('Internal Server Error');
    }

    res.status(405);
    res.send('Method Not Allowed');
  }, 5000);
};

export default handler;
