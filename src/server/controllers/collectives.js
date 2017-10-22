import r2 from 'r2';
import { GraphQLClient } from 'graphql-request';

const graphqlServerUrl = `${process.env.API_URL}/graphql?api_key=${process.env.API_KEY}`;
console.log(">>> connecting to ", graphqlServerUrl);

const client = new GraphQLClient(graphqlServerUrl, { headers: {} })

export async function badge(req, res) {
  try {

    const { style } = req.query;
    const color = req.query.color || 'brightgreen';
    
    const query = `
    query Collective($slug: String!) {
      Collective(slug:$slug) {
        stats {
          backers
          sponsors
        }
      }
    }
    `;
    try {
      const result = await client.request(query, { slug: req.params.collectiveSlug });
      const backerType = req.params.backerType.match(/sponsor/i) ? 'sponsors' : 'backers';
      const count = result.Collective.stats[backerType];
      const filename = `${backerType}-${count}-${color}.svg`;
      const imageUrl = `https://img.shields.io/badge/${filename}?style=${style}`;
      console.log(">>> badge imageUrl", imageUrl);
      try {
        const imageRequest = await r2(imageUrl).text;
        res.setHeader('content-type','image/svg+xml;charset=utf-8');
        res.setHeader('cache-control','max-age=600');
        return res.send(imageRequest);
      } catch (e) {
        console.error(">>> error while fetching", imageUrl, e);
        res.setHeader('cache-control','max-age=30');
        return res.status(500).send(`Unable to fetch ${imageUrl}`);
      }
    } catch (e) {
      console.error(">>> error caught in graphql query", e);
    }
  } catch (e) {
    console.error("Catching an error in controllers.collectives.badge", e);
  }
}