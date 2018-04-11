import { defaultImage } from '../constants/collectives';
import { imagePreview, getDomain } from '../lib/utils';

export default ({ src, style = {}, height, type = 'ORGANIZATION', website }) => {
  style.maxHeight = style.height || height;
  if (!src && website && type==='ORGANIZATION') {
    src = `https://logo.clearbit.com/${getDomain(website)}`;
  }
  const backgroundStyle = { height, minWidth: Math.max(0, parseInt(height)/2) };
  if (!src) {
    backgroundStyle.backgroundImage = `url(${defaultImage[type]})`
  }
  const image = imagePreview(src, defaultImage[type], { height: style.maxHeight });
  return (
    <div className="Logo" style={backgroundStyle}>
      <style jsx>{`
        .Logo {
          background-repeat: no-repeat;
          background-position: center center;
          background-size: cover;
          overflow: hidden;
          display: flex;
          align-items: center;
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