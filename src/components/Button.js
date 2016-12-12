import React from 'react';
import { css } from 'glamor';
import colors from '../constants/colors';

const styles = {
  btn: css({
    width: '100%',
    maxWidth: '300px',
    height: '100%',
    cursor: 'pointer',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: colors.darkgray,
    '&>div': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      border: `2px solid`,
      borderColor: colors.lightgray
    },
    '& label': {
      padding: '10px',
    },
    '& .whiteblue, & .whiteblue a': {
      color: colors.blue,
      background: 'white'
    },
    '& .blue': {
      color: 'white',
      borderColor: colors.blue,
      background: colors.blue
    }
  })
};

class Button extends React.Component {

  static propTypes = {
    label: React.PropTypes.string,
    onClick: React.PropTypes.func,
    className: React.PropTypes.string
  }

  render() {
    return (
      <div className={styles.btn} onClick={this.props.onClick} >
        <div className={this.props.className} >
          {this.props.label && <label className={styles.label}>{this.props.label}</label>}
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default Button;