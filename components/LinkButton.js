import React from 'react';
import PropTypes from 'prop-types';

import Link from './Link';

class LinkButton extends React.Component {
  render() {
    return (
      <div className={`LinkButton ${this.props.className} ${this.props.disabled ? 'disabled' : ''}`}>
        <style global jsx>
          {`
            .LinkButton > a {
              height: 29px;
              border-radius: 100px;
              border: solid 1px #797c80;
              font-size: 12px;
              line-height: 1.5;
              text-align: center;
              color: #797c80;
              background: white;
              padding: 0 2rem;
              display: inline-block;
            }
            .LinkButton.light > a {
              border: 1px solid #76777a;
              color: #76777a;
              font-size: 1.2rem;
              height: 2.8rem;
              line-height: 2.8rem;
              font-weight: 500;
            }
            .LinkButton.light > a:hover {
              color: #99c2ff;
              border: 1px solid #99c2ff;
            }
            .LinkButton.light > a:active {
              background: #3385ff;
              color: white;
              border: 1px solid #3385ff;
            }
            .LinkButton.light.disabled > a {
              color: #dcdee0;
              border: 1px solid #dcdee0;
            }
            .LinkButton.primary a {
              background: #297acc;
              border-color: rgba(24, 25, 26, 0.12);
              color: white;
            }
          `}
        </style>
        <Link {...this.props}>{this.props.children}</Link>
      </div>
    );
  }
}

LinkButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  disabled: PropTypes.bool,
};

export default LinkButton;
