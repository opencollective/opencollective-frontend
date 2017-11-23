import { defaultImage } from '../constants/collectives';
import { imagePreview } from '../lib/utils';

export default ({ src, style = {}, height }) => {
  style.height = style.height || height;
  const resizeOptions = {};
  resizeOptions.height = style.height;
  if (typeof resizeOptions.height === 'string') {
    resizeOptions.height = Number(resizeOptions.height.replace(/rem/,'')) * 10;
  }
  const image = imagePreview(src, defaultImage.ORGANIZATION, resizeOptions);
  return (
    <img className="logo" src={image} style={style} />
  );
}