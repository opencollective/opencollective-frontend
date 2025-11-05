import React from 'react';

import type { Location as LocationType } from '@/lib/graphql/types/v2/graphql';
import { cn } from '@/lib/utils';

import Link from '../Link';

const ZOOM_RATIO = 0.01; // Adjust this value to change the zoom level
const Map = ({ lat, long }) => {
  const bbox = `${long * (1 - ZOOM_RATIO)}%2C${lat * (1 - ZOOM_RATIO)}%2C${long * (1 + ZOOM_RATIO)}%2C${lat * (1 + ZOOM_RATIO)}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${lat}%2C${long}&layer=mapnik`;

  return <iframe loading="lazy" title="Open Street Map" width="100%" height="100%" src={src}></iframe>;
};

export const Location = ({ location, className }: { location: Readonly<LocationType>; className?: string }) => {
  if (!location) {
    return null;
  }
  const { name, address, lat, long, country } = location;
  const openStreetMapLink =
    isNaN(lat) || isNaN(long)
      ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`
      : `https://www.openstreetmap.org/?mlat=${lat}&amp;mlon=${long}#map=16/${lat}/${long}`;

  return (
    <div id="location" className={cn('relative h-full w-full overflow-hidden rounded-lg border', className)}>
      {lat && long && (
        <div className="relative h-80" data-cy="location-map">
          <Map lat={lat} long={long} />
        </div>
      )}
      <div className="absolute bottom-2 left-2 max-w-1/2 rounded-lg bg-background px-3 py-2">
        <h1 className="font-semibold" data-cy="location-name">
          {name}
        </h1>
        <p className="text-sm" data-cy="location-address">
          <Link
            href={openStreetMapLink}
            openInNewTab
            className="text-oc-blue-tints-500 hover:text-oc-blue-tints-500/70"
          >
            {[address, country].filter(Boolean).join(', ')}
          </Link>
        </p>
      </div>
    </div>
  );
};
