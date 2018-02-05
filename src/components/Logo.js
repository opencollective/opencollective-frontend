import { defaultImage } from '../constants/collectives';
import { imagePreview, getDomain } from '../lib/utils';

export default ({ src, style = {}, height, type = 'ORGANIZATION', website }) => {
  style.height = style.height || height;
  if (!src && website && type==='ORGANIZATION') {
    src = `https://logo.clearbit.com/${getDomain(website)}`;
  }
  const backgroundStyle = { height, minWidth: height };
  if (!src) {
    backgroundStyle.backgroundImage = `url(${defaultImage[type]})`
  }
  const image = imagePreview(src, defaultImage[type], { height: style.height });
  return (
    <div className="Logo" style={backgroundStyle}>
      <style jsx>{`
        .Logo {
          background-repeat: no-repeat;
          background-position: center center;
          background-size: cover;
          overflow: hidden;
        }
        .image {
          background-repeat: no-repeat;
          background-position: center center;
          background-size: cover;
        }
      `}</style>
      <img className="logo" src={image} style={style} />
    </div>
  );
}