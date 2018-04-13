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
