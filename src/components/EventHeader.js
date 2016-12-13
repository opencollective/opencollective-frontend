import React from 'react';
import { css } from 'glamor';

const styles = {
  cover: css({
    width: '100%',
    height: '400px',
    padding: '10px',
    color: 'white',
    textAlign: 'center',
    position: 'relative'
  }),
  backgroundCover: css({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    filter: 'brightness(50%)'
  }),
  logo: css({
    width: '75px',
    borderRadius: '50%',
    margin: '20px auto',
    display: 'block'
  }),
  content: css({
    position: 'relative'
  }),
  title: css({
    fontSize: '16px'
  })
}

class EventHeader extends React.Component {

  static propTypes = {
    title: React.PropTypes.string,
    description: React.PropTypes.string,
    logo: React.PropTypes.string,
    backgroundImage: React.PropTypes.string
  }

  render() {
    const { title, logo, backgroundImage } = this.props;

    const style = {
      backgroundImage: `url('${backgroundImage}')`,
      backgroundSize: 'cover'
    };

    return (
      <div className={styles.header}>
        <div className={styles.cover}>
          <div className={styles.backgroundCover} style={style} />
          <div className={styles.content}>
            <img src={logo} className={styles.logo} />
            <h1 className={styles.title}>{title}</h1>
          </div>
        </div>
      </div>
    );
  }
}

export default EventHeader;