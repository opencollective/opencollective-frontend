import { defaultImage } from '../constants/collectives';

export default ({ src, style = {}, height }) => {
  style.height = style.height || height;
  const image = src || defaultImage.ORGANIZATION;
  return (
    <img className="logo" src={image} style={style} />
  );
}