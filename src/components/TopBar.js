import React from 'react';
import logo from '../logo.svg';

class TopBar extends React.Component {

  render() {
    const {className} = this.props;
    return (
      <div className={`${className} TopBar`}>
        <style>{`
        .TopBar {
          height: 60px;
          width: 100%;
        }
        .TopBar .logo {
          margin: 10px;
        }
        .loading .logo {
          animation: oc-rotate 0.8s infinite linear;
        }
        @keyframes oc-rotate {
          0%    { transform: rotate(0deg); }
          100%  { transform: rotate(360deg); }
        }
        `}</style>
        <img src={logo} width="40" height="40" className="logo" alt="Open Collective logo" />
      </div>
    )
  }
}

export default TopBar;