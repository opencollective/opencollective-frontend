import { getEnvVar } from './env-utils';
import { getWebsiteUrl } from './utils';

type ImageDimensions = { width?: number | string; height?: number | string };

type ImageOptions = ImageDimensions & { query?: string; baseUrl?: string };

type CollectiveImageParams = {
  name?: string;
  style?: string;
  height?: number | string;
  width?: number | string;
  format?: string;
};

const getBaseImagesUrl = (): string => getEnvVar('IMAGES_URL');

export function generateDownloadUrlForFileUrl(fileUrl: string): string {
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

function resizeImage(imageUrl: string, { width, height, query, baseUrl }: ImageOptions): string | null {
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

function isValidImageUrl(src: string): boolean {
  return Boolean(src && (src.substr(0, 1) === '/' || src.substr(0, 4).toLowerCase() === 'http'));
}

export function imagePreview(src: string, defaultImage: string, options: ImageOptions = { width: 640 }): string | null {
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

export function getAvatarBorderRadius(collectiveType: string): string {
  return collectiveType === 'USER' || collectiveType === 'INDIVIDUAL' ? '50%' : '25%';
}

function createCollectiveImageUrl(collective, params: CollectiveImageParams = {}): string {
  const sections: Array<string | number> = [getBaseImagesUrl(), collective.slug];

  sections.push(params.name || 'avatar');

  const keys: (keyof CollectiveImageParams)[] = ['style', 'height', 'width'];
  for (const key of keys) {
    if (params[key]) {
      sections.push(params[key]);
    }
  }

  return `${sections.join('/')}.${params.format || 'png'}`;
}

export function getCollectiveImage(collective, params: CollectiveImageParams = {}): string {
  const imageUrl = collective.imageUrl ?? collective.image;
  // If available use the imageUrl provided by the API
  if (imageUrl) {
    if (params.height) {
      const parsedUrl = new URL(imageUrl);
      parsedUrl.searchParams.set('height', String(params.height));
      return parsedUrl.href;
    } else {
      return imageUrl;
    }
  }

  return createCollectiveImageUrl(collective, { ...params });
}

export function isImageServiceUrl(url: string): boolean {
  return Boolean(url && url.startsWith(getBaseImagesUrl()));
}

/**
 * Get image dimensions from a File object
 * @param file - The image file to get dimensions from
 * @returns Image dimensions or null if invalid/not an image
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise(resolve => {
    if (!file || !file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = e => {
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = e.target.result as string;
    };

    reader.onerror = () => {
      resolve(null);
    };

    reader.readAsDataURL(file);
  });
}
