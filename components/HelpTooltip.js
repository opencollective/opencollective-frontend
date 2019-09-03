import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';

import ReactTooltip from 'react-tooltip';
import { Question } from 'styled-icons/fa-solid/Question';

const IconQuestion = styled(Question)`
  padding: 0.2em;
  vertical-align: middle;
  border: 1px solid;
  border-radius: 1em;
  border-color: #55a4fb;
  color: white;

  ${props =>
    props.isInverted &&
    css`
      border-color: white;
      color: #55a4fb;
    `};
`;

class HelpTooltip extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string, // dark or light (default)
  };

  constructor(props) {
    super(props);
    this.id = `tooltip${Math.round(Math.random() * 10000000)}`;
    this.overlayStyle = { background: 'white', color: 'black' };
  }

  componentDidMount() {
    this._isMounted = true;
  }

  render() {
    const { children, className } = this.props;
    return (
      <div className="HelpTooltip">
        <style jsx global>
          {`
            .HelpTooltip {
              display: inline-block;
              margin: 0 5px;
            }
            .customTooltip {
              max-width: 90%;
              z-index: 1000000;
              background: white !important;
              color: #6e747a !important;
              font-size: 12px !important;
              line-height: 18px !important;
              border: 1px solid rgba(18, 19, 20, 0.12) !important;
              box-shadow: 0 8px 16px 0 rgba(12, 16, 20, 0.12) !important;
            }
            .customTooltip.place-bottom::after {
              border-color: white transparent !important;
            }
            span {
              text-shadow: none;
            }
          `}
        </style>
        {!this._isMounted && (
          <a data-tip data-for={this.id}>
            ?
          </a>
        )}
        {this._isMounted && (
          <div>
            <a data-tip data-for={this.id}>
              <IconQuestion size="1.2em" isInverted={className !== 'dark'} />
            </a>
            <ReactTooltip
              id={this.id}
              type="info"
              effect="solid"
              place="bottom"
              className="customTooltip"
              overlayStyle={this.overlayStyle}
            >
              {children}
            </ReactTooltip>
          </div>
        )}
      </div>
    );
  }
}

export default HelpTooltip;
