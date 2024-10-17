import React from 'react';

export default function DefaultPaletteStyle({ palette }: { palette: Record<string, string> }) {
  return (
    // eslint-disable-next-line react/no-unknown-property
    <style jsx global>
      {`
        :root {
          --primary-color-900: ${palette[900]};
          --primary-color-800: ${palette[800]};
          --primary-color-700: ${palette[700]};
          --primary-color-600: ${palette[600]};
          --primary-color-500: ${palette[500]};
          --primary-color-400: ${palette[400]};
          --primary-color-300: ${palette[300]};
          --primary-color-200: ${palette[200]};
          --primary-color-100: ${palette[100]};
          --primary-color-50: ${palette[50]};
        }
      `}
    </style>
  );
}
