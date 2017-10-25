import r2 from 'r2';
import sizeOf from 'image-size';
import request from 'request';
import { queryString, getCloudinaryUrl, svg2png } from '../lib/utils';
import { fetchMembersStats, fetchMembers } from '../lib/graphql';
import cachedRequestLib from 'cached-request';
import Promise from 'bluebird';
import url from 'url';

const cachedRequest = cachedRequestLib(request);
cachedRequest.setCacheDirectory('/tmp');
const requestPromise = Promise.promisify(cachedRequest, { multiArgs: true });

// Cache the list of members of a collective to avoid requesting it for every single /:collectiveSlug/backers/:position/avatar
const cache = require('lru-cache')({
  max: 100,
  maxAge: 1000 * 60 * 10
});

const WEBSITE_URL = process.env.WEBSITE_URL || "https://opencollective.com";

/**
 * Generates a github badge for a backerType (backers|sponsors) or for a tierSlug
 */
export async function badge(req, res) {
  try {
    const { style } = req.query;
    const color = req.query.color || 'brightgreen';
    
    const stats = await fetchMembersStats(req.params);

    const filename = `${stats.name}-${stats.count}-${color}.svg`;
    const imageUrl = `https://img.shields.io/badge/${filename}?style=${style}`;

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
    console.error("Catching an error in controllers.collectives.badge", e);
  }
}

export async function banner(req, res) {
  const { collectiveSlug, tierSlug, backerType } = req.params;
  const format = req.params.format || 'svg';
  const style = req.query.style || 'rounded';
  const limit = Number(req.query.limit) || Infinity;
  const imageWidth = Number(req.query.width) || 0;
  const imageHeight = Number(req.query.height) || 0;
  const showBtn = (req.query.button === 'false') ? false : true;
  
  let users = cache.get(queryString.stringify(req.params));
  if (!users) {
    users = await fetchMembers(req.params);
    cache.set(queryString.stringify(req.params), users);
  }

  const count = Math.min(limit, users.length);

  let defaultAvatarHeight = 64;
  let defaultMargin = 5;
  if ( users.length > 50) {
    defaultAvatarHeight = 48;
    defaultMargin = 3;
  }
  if ( users.length > 150) {
    defaultAvatarHeight = 24;
    defaultMargin = 2;
  }

  const avatarHeight = Number(req.query.avatarHeight) || defaultAvatarHeight;
  const margin = Number(req.query.margin) || defaultMargin;

  const params = (style === 'rounded') ? { query: `/c_thumb,g_face,h_${avatarHeight*2},r_max,w_${avatarHeight*2},bo_3px_solid_white/c_thumb,h_${avatarHeight*2},r_max,w_${avatarHeight*2},bo_2px_solid_rgb:66C71A/e_trim/f_auto/` } : { width: avatarHeight * 2, height: avatarHeight * 2};

  const promises = [];
  for (let i = 0 ; i < count ; i++) {
    let image = users[i].image;
    if (image) {
      if (users[i].type === 'USER') {
        image = getCloudinaryUrl(image, params);
      }
      const options = {url: image, encoding: null, ttl: 60 * 60 * 24 * 30 * 1000}; // 30 days caching
      promises.push(requestPromise(options));
    } else {
      promises.push(Promise.resolve());
    }
  }

  const selector = tierSlug || backerType;
  if (showBtn && selector.length > 0) {
    const btnImage = (selector.match(/sponsor/)) ? 'sponsor' : 'backer';
    const btn = {
      url: `${WEBSITE_URL}/public/images/become_${btnImage}.svg`,
      encoding: null,
      ttl: 60 * 60 * 24 * 30 * 1000
    };

    users.push({
      slug: collectiveSlug,
      website: `${WEBSITE_URL}/${collectiveSlug}#support`
    })

    promises.push(requestPromise(btn));
  }

  let posX = margin;
  let posY = margin;

  Promise.all(promises)
  .then(responses => {
    const images = [];
    for (let i=0;i<responses.length;i++) {
      if (!responses[i]) continue;
      const { headers } = responses[i][0];
      const rawData = responses[i][1];
      const user = users[i];
      if (!user) continue;

      const contentType = headers['content-type'];
      const website = (user.website && (selector === 'contributors' || selector == 'sponsors')) ? user.website : `${WEBSITE_URL}/${user.slug}`;
      const base64data = new Buffer(rawData).toString('base64');
      let avatarWidth = avatarHeight;
      try {
        // We make sure the image loaded properly
        const dimensions = sizeOf(rawData);
        avatarWidth = Math.round(dimensions.width / dimensions.height * avatarHeight);
      } catch (e) {
        // Otherwise, we skip it
        console.error(`Cannot get the dimensions of the avatar of ${user.slug}`, user.image);
        continue;
      }

      if (imageWidth > 0 && posX + avatarWidth + margin > imageWidth) {
        posY += (avatarHeight + margin);
        posX = margin;
      }
      const image = `<image x="${posX}" y="${posY}" width="${avatarWidth}" height="${avatarHeight}" xlink:href="data:${contentType};base64,${base64data}"/>`;
      const imageLink = `<a xlink:href="${website.replace(/&/g,'&amp;')}" target="_blank" id="${user.slug}">${image}</a>`;
      images.push(imageLink);
      posX += avatarWidth + margin;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${imageWidth || posX}" height="${imageHeight || posY + avatarHeight + margin}">
      ${images.join('\n')}
    </svg>`;
  })
  .then(svg => {
    switch (format) {
      case 'svg':
        res.setHeader('content-type','image/svg+xml;charset=utf-8');
        return svg;

      case 'png':
        res.setHeader('content-type','image/png');
        return svg2png(svg)
    }
  })
  .then(svg => {
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(svg);
  })
  .catch(e => {
    console.log("Error in generating banner: ", e);
  });
}

export async function website(req, res) {
  const { collectiveSlug, tierSlug, backerType } = req.params;

  let users = cache.get(queryString.stringify(req.params));
  if (!users) {
    users = await fetchMembers(req.params);
    cache.set(queryString.stringify(req.params), users);
  }

  const position = parseInt(req.params.position, 10);

  if (position > users.length) {
    return res.sendStatus(404);
  }

  const user = users[position] || {};
  const selector = tierSlug || backerType;
  let redirectUrl = `${WEBSITE_URL}/${user.slug}`;
  if (selector.match(/sponsor/)) {
    user.twitter = user.twitterHandle ? `https://twitter.com/${user.twitterHandle}` : null;
    redirectUrl =  user.website || user.twitter || `${WEBSITE_URL}/${user.slug}`;
  }

  if (position === users.length) {
    redirectUrl = `${WEBSITE_URL}/${collectiveSlug}#support`;
  }

  const parsedUrl = url.parse(redirectUrl);
  const params = queryString.parse(parsedUrl.query);

  params.utm_source = params.utm_source || 'opencollective';
  params.utm_medium = params.utm_medium || 'github';
  params.utm_campaign = params.utm_campaign || collectiveSlug;

  parsedUrl.search = `?${queryString.stringify(params)}`;
  redirectUrl = url.format(parsedUrl);

  req.ga.event(`GithubWidget-${selector}`, `Click`, user.slug, position);

  res.redirect(301, redirectUrl);
     
}

export async function avatar(req, res) {
  const { tierSlug, backerType } = req.params;
  
  let users = cache.get(queryString.stringify(req.params));
  if (!users) {
    users = await fetchMembers(req.params);
    cache.set(queryString.stringify(req.params), users);
  }

  const position = parseInt(req.params.position, 10);
  const user = (position < users.length) ?  users[position] : {};

  const format = req.params.format || 'svg';
  let maxHeight;
  const selector = tierSlug || backerType;
  if (req.query.avatarHeight) {
    maxHeight = Number(req.query.avatarHeight);
  } else {
    maxHeight = (format === 'svg' ) ? 128 : 64;
    if (selector.match(/silver/)) maxHeight *= 1.25;
    if (selector.match(/gold/)) maxHeight *= 1.5;
    if (selector.match(/diamond/)) maxHeight *= 2;
  }

  // We only record a page view when loading the first avatar
  if (position==0) {
    req.ga.pageview();
  }

  let imageUrl = "/public/images/user.svg";
  if (user.image && user.image.substr(0,1) !== '/') {
    if (user.type === 'USER') {
      imageUrl = getCloudinaryUrl(user.image, { query: `/c_thumb,g_face,h_${maxHeight},r_max,w_${maxHeight},bo_3px_solid_white/c_thumb,h_${maxHeight},r_max,w_${maxHeight},bo_2px_solid_rgb:66C71A/e_trim/f_auto/` });
    } else {
      imageUrl = getCloudinaryUrl(user.image, { height: maxHeight });
    }
  }

  if (position == users.length) {
    const btnImage = (selector.match(/sponsor/)) ? 'sponsor' : 'backer';
    imageUrl = `/public/images/become_${btnImage}.svg`;
  } else if (position > users.length) {
    imageUrl = "/public/images/1px.png";
  }

  if (imageUrl.substr(0,1) === '/') {
    return res.redirect(imageUrl);
  }

  if (format === 'svg') {
    request({url: imageUrl, encoding: null}, (err, r, data) => {
      if (err) {
        return res.status(500).send(`Unable to fetch ${imageUrl}`);
      }
      const contentType = r.headers['content-type'];

      const imageHeight = Math.round(maxHeight / 2);
      let imageWidth = 64;
      if (selector.match(/sponsor/)) {
        try {
          const dimensions = sizeOf(data);
          imageWidth = Math.round(dimensions.width / dimensions.height * imageHeight);
        } catch (e) {
          console.error("Unable to get image dimensions for ", imageUrl);
          return res.status(500).send(`Unable to fetch ${imageUrl}`);
        }
      }

      const base64data = new Buffer(data).toString('base64');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${imageWidth}" height="${imageHeight}">
        <image width="${imageWidth}" height="${imageHeight}" xlink:href="data:${contentType};base64,${base64data}"/>
      </svg>`;
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('content-type','image/svg+xml;charset=utf-8');
      return res.send(svg);
    });
  } else {
    req
      .pipe(request(imageUrl))
      .on('error', (e) => {
        console.error("error proxying ", imageUrl, e);
        res.status(500).send(e);
      })
      .on('response', (res) => {
        res.headers['Cache-Control'] = 'public, max-age=300';
      })
      .pipe(res);
  }  
}