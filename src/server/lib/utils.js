
import fs from 'fs';
import svg_to_png from 'svg-to-png';
import Promise from 'bluebird';
import crypto from 'crypto';

const readFile = Promise.promisify(fs.readFile);

export function getCloudinaryUrl(src, { width, height, query }) {
  const cloudinaryBaseUrl = 'https://res.cloudinary.com/opencollective/image/fetch';

  // We don't try to resize animated gif, svg or images already processed by cloudinary
  if (src.substr(0, cloudinaryBaseUrl.length) === cloudinaryBaseUrl || src.match(/\.gif$/) || (src.match(/\.svg/) && !query) || src.match(/localhost\:3000/)) {
    return src;
  }

  let size = '';
  if (width) size += `w_${width},`;
  if (height) size += `h_${height},`;
  if (size === '') size = 'w_320,';

  const format = (src.match(/\.png$/)) ? 'png' : 'jpg';

  const queryurl = query || `/${size}c_fill,f_${format}/`;

  return `${cloudinaryBaseUrl}${queryurl}${encodeURIComponent(src)}`;
}


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

export const queryString = {
  stringify: (obj) => {
    let str = "";
    for (const key in obj) {
      if (str != "") {
        str += "&";
      }
      str += `${key}=${encodeURIComponent(obj[key])}`;
    }
    return str;
  },
  parse: (query) => {
    if (!query) return {};
    const vars = query.split('&');
    const res = {};
    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=');
      res[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return res;
  }
}