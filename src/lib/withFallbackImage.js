import { withState } from 'recompose';
import fetch from 'cross-fetch';
import { defaultImage } from '../constants/collectives';
import { getDomain, imagePreview } from './utils';

export default ChildComponent => withState( 'src', 'setSrc', ({ src }) => src)(
  ({ src, setSrc, type = 'USER', radius, height, website, ...props }) => {
    const fallback = defaultImage[type];

    if (!src && website && type === 'ORGANIZATION') {
      src = `https://logo.clearbit.com/${getDomain(website)}`;
    }

    if (src && src !== fallback) {
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

    const image = imagePreview(src, fallback, {
      width: radius,
      height,
    });
    const childProps = {
      ...props,
      src: image,
      height,
      radius,
      type,
    };

    return <ChildComponent {...childProps} />;
  }
);
