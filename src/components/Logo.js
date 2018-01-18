import { defaultImage } from '../constants/collectives';
import { imagePreview, getDomain } from '../lib/utils';

export default ({ src, style = {}, height, type = 'ORGANIZATION', website }) => {
  style.height = style.height || height;
  if (!src && website) {
    src = `https://logo.clearbit.com/${getDomain(website)}`;
  }
  const image = imagePreview(src, defaultImage[type], { height: style.height });
  return (
    <div className="Logo" style={{ width: height, height, backgroundImage: `url(${defaultImage[type]})` }}>
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