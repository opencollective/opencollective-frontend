import React from 'react';
import PropTypes from 'prop-types';
import colors from '../constants/colors';

const star = '/static/images/icons/star.svg';

const icons = {
  star
};

class Button extends React.Component {

  static propTypes = {
    label: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
    disabled: PropTypes.bool,
    type: PropTypes.string, // e.g. type="submit"
    onClick: PropTypes.func,
    className: PropTypes.string,
    icon: PropTypes.string,
    style: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    const { onClick, disabled } = this.props;
    if (!onClick) return;
    e.preventDefault();
    return !disabled && onClick && onClick();
  }

  render() {
    return (
      <button 
        type={this.props.type}
        disabled={this.props.disabled}
        style={this.props.style}
        className={`Button ${this.props.className}`}
        onClick={this.onClick} >
        <style jsx>{`
        .Button {
          width: 100%;
          max-width: 400px;
          --webkit-appearance: none;
          background: transparent;
          font-family: montserratlight, Montserrat, arial;
          font-weight: bold;
          font-size: 1.3rem;
          padding: 0;
          height: 6rem;
          border: 1px solid transparent;
          text-transform: uppercase;
          color: ${colors.darkgray};
          letter-spacing: 4px;
        }
        .Button:focus {
          outline: 0;
        }
        .Button[disabled] {
          border-color: ${colors.disabled};
          background: ${colors.disabled};
        }
        .Button[type=submit] {
          height: 4rem;
          border-radius: 2rem;
        }
        div {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          border: 2px solid;
          border-color: ${colors.lightgray};
        }
        img {
          height: 1.6rem;
          margin: 0 0.5rem;
        }
        .allcaps {
          text-transform: 'uppercase';
        }
        .whiteblue, .whiteblue :global(a) {
          color: ${colors.blue};
          background: white;
          background-image: linear-gradient(to bottom, #ffffff, #f3f6f8);
        }
        .whiteblue.small {
          width: 20rem;
        }
        .whiteblue:hover {
          background-image: linear-gradient(to bottom, #ffffff, #f3f6f8);
          box-shadow: 0 0 4px 0 rgba(63, 175, 240, 0.4);
        }
        .whiteblue:active {
          background-image: linear-gradient(to top, #ffffff, #f3f6f8);
          box-shadow: inset 0 2px 0 0 rgba(0, 0, 0, 0.05);
        }
        .blue {
          color: white;
          border-color: ${colors.blue};
          background: ${colors.blue};
          border-radius: 3px;
          background-image: linear-gradient(to bottom, #52bbf8, #2fa8ee);
        }
        .blue:hover {
          background-image: linear-gradient(to bottom, #7acfff, #4cbeff);
        }
        .blue:active {
          background-image: linear-gradient(to top, #52bbf8, #2fa8ee);
          box-shadow: inset 0 2px 0 0 rgba(0, 0, 0, 0.1);
        }
        .gray {
          color: ${colors.darkgray};
          border-color: ${colors.lightgray};
          background: ${colors.lightgray}
        }
        .gray:hover {
          color: ${colors.gray}
        }
        .Button :global(a) {
          display: block;
          width: 100%;
          height: 100%;
          text-align: center;
          line-height: 5.4rem;
        }
        .green {
          color: white;
          border-color: ${colors.green};
          background: ${colors.green};
        }
        `}</style>
        {this.props.icon && <img src={icons[this.props.icon]} />}
        {this.props.label && <span>{this.props.label}</span>}
        {this.props.children}
      </button>
    );
  }
}

export default Button;