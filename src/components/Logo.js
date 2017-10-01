export default ({ src, style = {}, height }) => {
  style.height = style.height || height;
  return (
    <img className="logo" src={src} style={style} />
  );
}