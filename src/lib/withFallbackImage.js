import { withState } from 'recompose';
import fetch from 'cross-fetch';
import { defaultImage } from '../constants/collectives';
import { getDomain, imagePreview } from './utils';

const fallbackFetchEnabled = false;

export default ChildComponent =>
  withState('src', 'setSrc', ({ src }) => src)(
    ({
      src,
      setSrc,
      type = 'USER',
      radius,
      height,
      website,
      name,
      ...props
    }) => {
      if (name === 'anonymous') {
        type = name.toUpperCase();
      }

      const fallback = defaultImage[type];

      if (!src && website && type === 'ORGANIZATION') {
        src = `https://logo.clearbit.com/${getDomain(website)}`;
      }

      if (fallbackFetchEnabled && src && src !== fallback) {
        // due to CORS issues, we should use the Image error event in the browser
        if (process.browser) {
          const img = new Image();
          img.src = src;
          img.addEventListener('error', () => {
            setSrc(fallback);
          });
        } else {
          fetch(src)
            .then(({ status }) => {
              if (status >= 400) {
                setSrc(fallback);
              }
            })
            .catch(() => {
              setSrc(fallback);
            });
        }
      }

      let image;
      if (!src) {
        image = fallback;
      } else {
        image = imagePreview(src, fallback, {
          width: radius,
          height,
        });
      }

      const childProps = {
        ...props,
        src: image,
        height,
        radius,
        type,
        name,
      };

      return <ChildComponent {...childProps} />;
    },
  );
