import { defaultImage } from '../constants/collectives';
import { imagePreview } from '../lib/utils';

export default ({ src, style = {}, height }) => {
  style.height = style.height || height;
  const image = imagePreview(src, defaultImage.ORGANIZATION);
  return (
    <img className="logo" src={image} style={style} />
  );
}