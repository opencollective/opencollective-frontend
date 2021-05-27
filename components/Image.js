import React from 'react';
import NextImage from 'next/image';

// Default to no custom loader, will use Squoosh in dev
let loader;

// Overrides default loader from https://github.com/vercel/next.js/blob/218c6114c9f5ed5c6d65840037673c841f44536b/packages/next/client/image.tsx#L591
// to load images from a custom domain if provided
if (process.env.NEXT_IMAGES_URL) {
  loader = ({ src, width, quality }) => {
    return `${process.env.NEXT_IMAGES_URL}/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
  };
}

/**
 * We delegate static images loading to Vercel, as it has static images optimizations
 * that would be difficult to match with Heroku (at the time of writing, the default loader
 * uses Squoosh, which is a pure-JS solution up to 25x slower than Sharp)
 */
const Image = ({ ...props }) => {
  return <NextImage loader={loader} {...props} />;
};

export default Image;
