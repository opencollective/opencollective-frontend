import React from 'react';
import type { ImageProps } from 'next/image';
import NextImage from 'next/image';

// Default to no custom loader, will use Squoosh in dev
let loader;

// Overrides default loader from https://github.com/vercel/next.js/blob/218c6114c9f5ed5c6d65840037673c841f44536b/packages/next/client/image.tsx#L591
// to load images from a custom domain if provided
if (process.env.NEXT_IMAGES_URL) {
  loader = ({ src, width, quality }) => {
    if (src.endsWith('.svg')) {
      // Special case to make svg serve as-is to avoid proxying through the built-in Image Optimization API.
      // See https://nextjs.org/docs/api-reference/next/image#dangerously-allow-svg
      return src;
    }

    return `${process.env.NEXT_IMAGES_URL}/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
  };
}

/**
 * We delegate static images loading to Vercel, as it has static images optimizations
 * that would be difficult to match with Heroku (at the time of writing, the default loader
 * uses Squoosh, which is a pure-JS solution up to 25x slower than Sharp)
 */
const Image = ({ ...props }: ImageProps) => {
  return (
    <NextImage
      loader={loader}
      {...props}
      style={{
        maxWidth: '100%',
        height: 'auto',
        ...props.style,
      }}
    />
  );
};

export default Image;
