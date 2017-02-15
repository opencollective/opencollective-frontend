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
    '& .label': {
      padding: '0px',
      margin: '0px'
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
    '&[disabled]': {
      borderColor: colors.disabled,
      background: colors.disabled
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
    label: React.PropTypes.object,
    disabled: React.PropTypes.bool,
    type: React.PropTypes.string, // e.g. type="submit"
    onClick: React.PropTypes.func,
    className: React.PropTypes.string,
    icon: React.PropTypes.string,
    style: React.PropTypes.object
  }

  onClick() {
    !this.props.disabled && this.props.onClick && this.props.onClick();
  }

  render() {
    return (
      <button 
        type={this.props.type}
        disabled={this.props.disabled}
        style={this.props.style}
        className={`${styles.btn} ${this.props.className}`}
        onClick={this.onClick.bind(this)} >
        {this.props.icon && <img src={icons[this.props.icon]} />}
        {this.props.label && <span className={styles.label}>{this.props.label}</span>}
        {this.props.children}
      </button>
    );
  }
}

export default Button;