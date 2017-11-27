import fs from 'fs';
import sizeOf from 'image-size';
import Promise from 'bluebird';
import crypto from 'crypto';
import svg_to_png from 'svg-to-png';
import cachedRequestLib from 'cached-request';
import request from 'request';
import { getCloudinaryUrl } from '../lib/utils';

const WEBSITE_URL = process.env.WEBSITE_URL || "https://opencollective.com";

const cachedRequest = cachedRequestLib(request);
cachedRequest.setCacheDirectory('/tmp');

const requestPromise = Promise.promisify(cachedRequest, { multiArgs: true });
const readFile = Promise.promisify(fs.readFile);

/**
 * Converts an svg string into a PNG data blob
 * (returns a promise)
 */
export function svg2png(svg) {
  const md5 = crypto.createHash('md5').update(svg).digest("hex");
  const svgFilePath = `/tmp/${md5}.svg`;
  const outputDir = `/tmp`;
  const outputFile = `${outputDir}/${md5}.png`;

  try {
    // If file exists, return it
    // Note: because we generate a md5 fingerprint based on the content of the svg,
    //       any change in the svg (margin, size, number of backers, etc.) will force
    //       the creation of a new png :-)
    fs.statSync(outputFile);
    return readFile(outputFile);
  } catch (e) {
    // Otherwise, generate a new png (slow)
    fs.writeFileSync(svgFilePath, svg);

    return svg_to_png.convert(svgFilePath, outputDir)
            .then(() => readFile(outputFile));
  }
}


export function generateSVGBannerForUsers(users, options) {
  console.log(">>> generateSVGBannerForUsers", users.length, "users, options: ", options);
  
  const {
    format, style, limit, buttonImage, collectiveSlug
  } = options;
  
  const imageWidth = options.width;
  const imageHeight = options.height;
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

  const avatarHeight = Number(options.avatarHeight) || defaultAvatarHeight;
  const margin = Number(options.margin) || defaultMargin;

  const params = (style === 'rounded') ? { query: `/c_thumb,g_face,h_${avatarHeight*2},r_max,w_${avatarHeight*2},bo_3px_solid_white/c_thumb,h_${avatarHeight*2},r_max,w_${avatarHeight*2},bo_2px_solid_rgb:66C71A/e_trim/f_auto/` } : { width: avatarHeight * 2, height: avatarHeight * 2};

  const promises = [];
  for (let i = 0 ; i < count ; i++) {
    let image = users[i].image;
    if (image) {
      if (users[i].type === 'USER' || style === 'rounded') {
        image = getCloudinaryUrl(image, params);
      }
      const promiseOptions = {url: image, encoding: null, ttl: 60 * 60 * 24 * 30 * 1000}; // 30 days caching
      promises.push(requestPromise(promiseOptions));
    } else {
      promises.push(Promise.resolve());
    }
  }

  if (options.buttonImage) {
    const btn = {
      url: options.buttonImage,
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

  return Promise.all(promises)
    .then(responses => {
      const images = [];
      for (let i=0; i<responses.length; i++) {
        if (!responses[i]) continue;
        const { headers } = responses[i][0];
        const rawData = responses[i][1];
        const user = users[i];
        if (!user) continue;

        const contentType = headers['content-type'];
        const website = (options.linkToProfile || !user.website) ? `${WEBSITE_URL}/${user.slug}` : user.website;
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
    .catch(e => {
      console.error(">>> error in image-generator:generateSVGBannerForUsers:", e);
    })
  }