export default ({src, radius}) => (
  <img className="avatar" src={src} width={radius} height={radius} style={{borderRadius: '50%' }} />
)