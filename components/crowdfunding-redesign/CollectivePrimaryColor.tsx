import React from 'react';
import { get } from 'lodash';
import { parseToHsl } from 'polished';

export function CollectivePrimaryColor({ account }) {
  const primaryColor =
    get(account, 'settings.collectivePage.primaryColor') || get(account, 'parent.settings.collectivePage.primaryColor');
  if (!primaryColor) {
    return null;
  }

  const hsl = parseToHsl(primaryColor);

  return (
    // eslint-disable-next-line react/no-unknown-property
    <style jsx global>
      {`
        :root {
          --primary: ${hsl.hue} ${hsl.saturation * 100}% ${hsl.lightness * 100}%;
        }
      `}
    </style>
  );
}
