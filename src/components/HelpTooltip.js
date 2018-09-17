import React from 'react';
import PropTypes from 'prop-types';

import ReactTooltip from 'react-tooltip';

const darkIcon = '/static/icons/icon-help-dark.svg';
const lightIcon = '/static/icons/icon-help-light.svg';

class HelpTooltip extends React.Component {
  static propTypes = {
    children: PropTypes.array.isRequired,
    className: PropTypes.string, // dark or light (default)
  };

  constructor(props) {
    super(props);
    this.id = `tooltip${Math.round(Math.random() * 10000000)}`;
    this.iconsrc = props.className === 'dark' ? darkIcon : lightIcon;
    this.overlayStyle = { background: 'white', color: 'black' };
  }

  componentDidMount() {
    this._isMounted = true;
  }

  render() {
    return (
      <div className="HelpTooltip">
        <style jsx global>
          {`
            .HelpTooltip {
              display: inline-block;
              margin: 0 5px;
            }
            .customTooltip {
              max-width: 400px;
              z-index: 1000000;
              background: white !important;
              color: #6e747a !important;
              font-family: 'Inter UI', 'lato', 'montserratlight', sans-serif !important;
              font-size: 12px !important;
              letter-spacing: -0.2px !important;
              line-height: 18px !important;
              border: 1px solid rgba(18, 19, 20, 0.12) !important;
              box-shadow: 0 8px 16px 0 rgba(12, 16, 20, 0.12) !important;
            }
            .customTooltip.place-bottom::after {
              border-color: white transparent !important;
            }
            .helpIcon {
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
              <img src={this.iconsrc} className="helpIcon" />
            </a>
            <ReactTooltip
              id={this.id}
              type="info"
              effect="solid"
              place="bottom"
              className="customTooltip"
              overlayStyle={this.overlayStyle}
            >
              {this.props.children}
            </ReactTooltip>
          </div>
        )}
      </div>
    );
  }
}

export default HelpTooltip;
