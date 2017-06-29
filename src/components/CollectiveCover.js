import React from 'react';
import PropTypes from 'prop-types';

class CollectiveCover extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    title: PropTypes.string,
    description: PropTypes.string,
    logo: PropTypes.string,
    backgroundImage: PropTypes.string,
    style: PropTypes.object
  }

  render() {
    const { collective, title, logo, backgroundImage, className } = this.props;

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
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 300px;
          justify-content: space-around;
        }
        .logo {
          max-width: 20rem;
          max-height: 10rem;
          margin: 0 auto;
          display: block;
        }
        h1 {
          font-size: 3rem;
          color: white;
          margin: 0;
        }

        @media(max-width: 600px) {
          h1 {
            font-size: 2.5rem;
          }
        }
        `}</style>
        <div className="cover">
          <div className="backgroundCover" style={style} />
          <div className="content">
            <a href={`/${collective.slug}`}><img src={logo} className="logo" /></a>
            <h1>{title}</h1>
          </div>
        </div>
      </div>
    );
  }
}

export default CollectiveCover;