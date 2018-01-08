import { defaultImage } from '../constants/collectives';
import { imagePreview } from '../lib/utils';

export default ({ src, style = {}, height, type = 'ORGANIZATION' }) => {
  style.height = style.height || height;
  const image = imagePreview(src, defaultImage[type], { height: style.height });
  return (
    <img className="logo" src={image} style={style} />
  );
}