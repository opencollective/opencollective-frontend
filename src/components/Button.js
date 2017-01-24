import React from 'react';
import { css } from 'glamor';
import colors from '../constants/colors';
import star from '../images/icons/star.svg';

const styles = {
  btn: css({
    width: '100%',
    maxWidth: '400px',
    WebkitAppearance: 'none',
    background: 'transparent',
    fontFamily: 'montserratlight',
    fontWeight: 'bold',
    fontSize: '17px',
    padding: '0',
    cursor: 'pointer',
    height: '60px',
    border: '1px solid transparent',
    textTransform: 'uppercase',
    color: colors.darkgray,
    '&:focus': {
      outline: '0'
    },
    '&div': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      border: `2px solid`,
      borderColor: colors.lightgray
    },
    '& img': {
      height: '16px',
      margin: '0 5px'
    },
    '& label': {
      padding: '0px',
      margin: '0px',
      cursor: 'pointer'
    },
    '&.whiteblue, &.whiteblue a': {
      color: colors.blue,
      background: 'white'
    },
    '&.blue': {
      color: 'white',
      borderColor: colors.blue,
      background: colors.blue
    },
    '& a': {
      display: 'block',
      width: '100%',
      height: '100%',
      textAlign: 'center',
      lineHeight: '54px'
    },
    '&.green': {
      color: 'white',
      borderColor: colors.green,
      background: colors.green
    },
    '&[type=submit]': {
      height: '40px',
      borderRadius: '20px'
    }
  })
};

const icons = {
  star
};

class Button extends React.Component {

  static propTypes = {
    label: React.PropTypes.string,
    type: React.PropTypes.string, // e.g. type="submit"
    onClick: React.PropTypes.func,
    className: React.PropTypes.string,
    icon: React.PropTypes.string,
    style: React.PropTypes.object
  }

  render() {
    return (
      <button type={this.props.type} style={this.props.style} className={`${styles.btn} ${this.props.className}`} onClick={this.props.onClick} >
        {this.props.icon && <img src={icons[this.props.icon]} />}
        {this.props.label && <label className={styles.label}>{this.props.label}</label>}
        {this.props.children}
      </button>
    );
  }
}

export default Button;