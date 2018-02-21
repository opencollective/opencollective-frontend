import React from 'react';
import Button from './Button';
import colors from '../constants/colors';

class SmallButton extends React.Component {
  render() {
    return (
      <div className={`SmallButton ${this.props.className}`}>
        <style global jsx>{`
          .SmallButton button {
            height: 29px;
            border-radius: 100px;
            border: solid 1px #797c80;
            font-family: Rubik;
            font-size: 12px;
            line-height: 1.5;
            text-align: center;
            color: #797c80;
            background: white;
            padding: 0 2rem;
          }
          .SmallButton.primary button {
            background: #297acc;
            border-color: rgba(24,25,26,0.12);
            color: white;
          }
          .SmallButton.pay button {
            background: rgba(85,170,0,1);
            border-color: rgba(24,25,26,0.12);
            color: white;
          }
          .SmallButton.pay button[disabled] {            
            border-color: ${colors.darkgray};
            background: ${colors.darkgray};
          }
          .SmallButton.pay button:hover {
            border-color: rgba(85,170,0,1);
            background: rgba(85,170,0,.9);
          }
          .SmallButton.approve button, .SmallButton.publish button {
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
        `}</style>
        <Button {...this.props}>{this.props.children}</Button>
      </div>);
  }
}

export default SmallButton;