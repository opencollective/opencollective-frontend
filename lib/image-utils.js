import { getEnvVar } from './env-utils';
import { getWebsiteUrl } from './utils';

const getBaseImagesUrl = () => getEnvVar('IMAGES_URL');

export function generateDownloadUrlForFileUrl(fileUrl) {
  try {
    const url = new URL(fileUrl);
    if (url.origin === getWebsiteUrl() && /^\/api\/files\//.test(url.pathname)) {
      url.searchParams.append('download', '');
      return url.toString();
    }

    /* To enable downloading files from S3 directly we're using a /api/download-file endpoint
      to stream the file and set the correct headers. */
    return `/api/download-file?url=${encodeURIComponent(fileUrl)}`;
  } catch {
    return fileUrl;
  }
}

function resizeImage(imageUrl, { width, height, query, baseUrl }) {
  if (!imageUrl) {
    return null;
  }
  if (imageUrl.substr(0, 1) === '/') {
    return imageUrl;
  } // if image is a local image, we don't resize it with the proxy.
  if (imageUrl.substr(0, 4).toLowerCase() !== 'http') {
    return null;
  } // Invalid imageUrl;
  if (!query && imageUrl.match(/\.svg$/)) {
    return imageUrl;
  } // if we don't need to transform the image, no need to proxy it.

  try {
    const url = new URL(imageUrl);
    if (url.origin === getWebsiteUrl() && /^\/api\/files\//.test(url.pathname)) {
      url.searchParams.append('thumbnail', '');
      return url.toString();
    }
  } catch {
    return null;
  }

  let queryurl = '';
  if (query) {
    queryurl = encodeURIComponent(query);
  } else {
    if (width) {
      queryurl += `&width=${width}`;
    }
    if (height) {
      queryurl += `&height=${height}`;
    }
  }

  return `${getBaseImagesUrl() || baseUrl || ''}/proxy/images?src=${encodeURIComponent(imageUrl)}${queryurl}`;
}

function isValidImageUrl(src) {
  return src && (src.substr(0, 1) === '/' || src.substr(0, 4).toLowerCase() === 'http');
}

export function imagePreview(src, defaultImage, options = { width: 640 }) {
  if (typeof options.width === 'string') {
    options.width = Number(options.width.replace(/rem/, '')) * 10;
  }
  if (typeof options.height === 'string') {
    options.height = Number(options.height.replace(/rem/, '')) * 10;
  }

  if (src) {
    return resizeImage(src, options);
  }
  if (isValidImageUrl(defaultImage)) {
    return defaultImage;
  }
  return null;
}

export function getAvatarBorderRadius(collectiveType) {
  return collectiveType === 'USER' || collectiveType === 'INDIVIDUAL' ? '50%' : '25%';
}

function createCollectiveImageUrl(collective, params = {}) {
  const sections = [getBaseImagesUrl(), collective.slug];

  sections.push(params.name || 'avatar');

  for (const key of ['style', 'height', 'width']) {
    if (params[key]) {
      sections.push(params[key]);
    }
  }

  return `${sections.join('/')}.${params.format || 'png'}`;
}

export function getCollectiveImage(collective, params = {}) {
  const imageUrl = collective.imageUrl ?? collective.image;
  // If available use the imageUrl provided by the API
  if (imageUrl) {
    if (params.height) {
      const parsedUrl = new URL(imageUrl);
      parsedUrl.searchParams.set('height', params.height);
      return parsedUrl.href;
    } else {
      return imageUrl;
    }
  }

  return createCollectiveImageUrl(collective, { ...params });
}

export function isImageServiceUrl(url) {
  return Boolean(url && url.startsWith(getBaseImagesUrl()));
}
