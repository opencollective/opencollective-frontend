import { pickAvatar } from '../lib/collective.lib';
import { imagePreview } from '../lib/utils';

export default ({src, radius, id, title}) => {
  const image = imagePreview(src, null, { width: radius });
  return (
    <div className="Avatar" style={{ 
      width: radius, 
      height: radius, 
      backgroundImage: `url(${pickAvatar(id || title || src)})` }}>
      <style jsx>{`
        .Avatar {
          background-repeat: no-repeat;
          background-position: center center;
          background-size: cover;
          border: 2px solid #fff;
          box-shadow: 0 0 0 1px #75cc1f;
          border-radius: 50%;
          overflow: hidden;
        }
        .image {
          background-repeat: no-repeat;
          background-position: center center;
          background-size: cover;          
        }
      `}</style>
      <div className="image" style={{ backgroundImage: `url(${image})`, width: radius, height: radius }} />
    </div>
  )
}