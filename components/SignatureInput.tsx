import React from 'react';
import { isEqual } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { useElementSize } from '../lib/hooks/useElementSize';
import { scaleValue } from '../lib/math';
import { cn } from '../lib/utils';

import { Button } from './ui/Button';

/**
 * Gets the font size in px for the signature. The longer the text, the smaller the font.
 */
const getFontSizeInPx = (text, maxSize) => {
  const maxTextLength = 150; // This is not the real max length (as defined in `components/dashboard/sections/tax-information/common.ts`), but the length that corresponds to the minimum font size.
  return scaleValue(maxTextLength - text.length, [0, maxTextLength], [8, Math.min(maxSize, 32)], true);
};

const SignatureWithCustomFont = ({ signerName, maxSize }) => {
  const fontSize = React.useMemo(() => getFontSizeInPx(signerName, maxSize), [signerName, maxSize]);
  return (
    <div className="text-center font-signature" style={{ fontSize }}>
      {signerName}
    </div>
  );
};

/**
 * A box where users can click to sign.
 */
export const SignatureInput = ({ isSigned, signerName, onChange, values, error }) => {
  const [signedValues, setSignedValues] = React.useState(null);
  const { ref, width, height } = useElementSize({ defaultWidth: 440 });

  // Invalidate the signature if the values change
  React.useEffect(() => {
    if (isSigned && !isEqual(values, signedValues)) {
      onChange(false);
    }
  }, [isSigned, values, signedValues, onChange]);

  const sign = () => {
    setSignedValues(values);
    onChange(true);
  };

  const containerClassName = cn(
    'relative flex h-40 w-full flex-col items-center justify-center rounded-lg border bg-gray-100 text-lg text-gray-500',
    {
      'border-red-500': error,
      'cursor-pointer': !isSigned,
    },
  );

  return (
    <div ref={ref}>
      {/** Force font preload by rendering a text. Also tried with a link=preload, but results were not playing well with Next Caching strategies. */}
      <span className="font-signature"></span>
      {!isSigned ? (
        <div
          className={containerClassName}
          role="button"
          tabIndex={0}
          onClick={sign}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              sign();
            }
          }}
        >
          <FormattedMessage defaultMessage="Click to sign" id="XSPhX7" />
        </div>
      ) : (
        <div className={cn(containerClassName, 'p-2')}>
          <SignatureWithCustomFont signerName={signerName} maxSize={Math.min(width, height)} />
          <div className="absolute right-3 top-3">
            <Button variant="outline" size="sm" onClick={() => onChange(false)}>
              <FormattedMessage defaultMessage="Clear" id="/GCoTA" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
