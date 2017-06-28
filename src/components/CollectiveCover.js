import React from 'react';
import PropTypes from 'prop-types';

class CollectiveCover extends React.Component {

  static propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    logo: PropTypes.string,
    backgroundImage: PropTypes.string,
    style: PropTypes.object
  }

  render() {
    const { title, logo, backgroundImage, className } = this.props;

    const style = {
      backgroundImage: `url('${backgroundImage}')`,
      backgroundSize: 'cover',
      ...this.props.style
    };

    return (
      <div className={`CollectiveCover ${className}`}>
        <style jsx>{`
        .cover {
          display: flex;
          align-items: center;
          position: relative;
          text-align: center;
          height: 400px;
          width: 100%;
        }
        .small .cover {
          height: 200px;
        }
        .backgroundCover {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          filter: brightness(50%);
        }
        .content {
          position: relative;
        }
        .logo {
          width: 7.5rem;
          margin: 20px auto;
          display: block;
        }
        h1 {
          font-size: 4rem;
          color: white;
          line-height: 1.5;
        }
        `}</style>
        <div className="cover">
          <div className="backgroundCover" style={style} />
          <div className="content">
            <img src={logo} className="logo" />
            <h1>{title}</h1>
          </div>
        </div>
      </div>
    );
  }
}

export default CollectiveCover;