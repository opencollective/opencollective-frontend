import React from 'react';
import PropTypes from 'prop-types';

class EventHeader extends React.Component {

  static propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    logo: PropTypes.string,
    backgroundImage: PropTypes.string
  }

  render() {
    const { title, logo, backgroundImage } = this.props;

    const style = {
      backgroundImage: `url('${backgroundImage}')`,
      backgroundSize: 'cover'
    };

    return (
      <div className="EventHeader">
        <style jsx>{`
        .cover {
          display: flex;
          align-items: center;
          position: relative;
          text-align: center;
          height: 400px;
          width: 100%;
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

export default EventHeader;