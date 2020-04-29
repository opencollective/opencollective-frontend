import React from 'react';
import PropTypes from 'prop-types';

import colors from '../lib/constants/colors';

import Button from './Button';

class SmallButton extends React.Component {
  render() {
    return (
      <div className={`SmallButton ${this.props.className}`}>
        <style global jsx>
          {`
            .SmallButton button {
              height: 29px;
              border-radius: 100px;
              border: solid 1px #797c80;
              font-size: 12px;
              line-height: 1.5;
              text-align: center;
              color: #797c80;
              background: white;
              padding: 0 2rem;
            }
            .SmallButton.light button {
              border: 1px solid #76777a;
              color: #76777a;
              font-size: 1.2rem;
              height: 2.8rem;
              line-height: 2.8rem;
              font-weight: 500;
            }
            .SmallButton.light button:hover {
              color: #99c2ff;
              border: 1px solid #99c2ff;
            }
            .SmallButton.light button:active {
              background: #3385ff;
              color: white;
              border: 1px solid #3385ff;
            }
            .SmallButton.light button:disabled {
              color: #dcdee0;
              border: 1px solid #dcdee0;
            }
            .SmallButton.primary button {
              background: #297acc;
              border-color: rgba(24, 25, 26, 0.12);
              color: white;
            }
            .SmallButton.pay button {
              background: rgba(85, 170, 0, 1);
              border-color: rgba(24, 25, 26, 0.12);
              color: white;
            }
            .SmallButton.pay button[disabled] {
              border-color: ${colors.darkgray};
              background: ${colors.darkgray};
            }
            .SmallButton.pay button:hover {
              border-color: rgba(85, 170, 0, 1);
              background: rgba(85, 170, 0, 0.9);
            }
            .SmallButton.approve button,
            .SmallButton.publish button {
              background: #3399ff;
              border-color: #3399ff;
              color: white;
            }
            .SmallButton.reject button {
              background: white;
              border: solid 2px #e63956;
              color: #e63956;
            }
            .SmallButton.reject button:hover {
              background: #e63956;
              border: solid 2px #e63956;
              color: white;
            }
            .SmallButton.no button {
              background: white;
              border-color: ${colors.bgBlue};
              color: ${colors.bgBlue};
            }
            .SmallButton.yes button {
              background: ${colors.bgBlue};
              border-color: ${colors.bgBlue};
              color: white;
            }
          `}
        </style>
        <Button {...this.props}>{this.props.children}</Button>
      </div>
    );
  }
}

SmallButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

export default SmallButton;
