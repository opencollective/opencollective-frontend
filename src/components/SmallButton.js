import React from 'react';
import { Button } from 'react-bootstrap';
import colors from '../constants/colors';

class SmallButton extends React.Component {
  render() {
    return (
      <div className={`SmallButton ${this.props.className}`}>
        <style global jsx>{`
          .SmallButton button {
            height: 29px;
            border-radius: 100px;
            border: solid 1px #18191a;
            border: solid 1px var(--dark-grey);            
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
            border-color: #18191a;
            color: white;
          }
          .SmallButton.pay button {
            background: #55aa00;
            border-color: #18191a;
            color: white;
          }
          .SmallButton.pay button[disabled] {            
            border-color: ${colors.darkgray};
            background: ${colors.darkgray};
          }
          .SmallButton:hover button {
            font-weight: bold;
          }
          .SmallButton.approve button, .SmallButton.publish button {
            background: #3399ff;
            border-color: #18191a;
            color: white;
          }
          .SmallButton.reject button {
            background: white;
            border: solid 1px #e63956;
            color: #e63956;
          }
        `}</style>
        <Button {...this.props}>{this.props.children}</Button>
      </div>);
  }
}

export default SmallButton;