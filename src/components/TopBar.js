import React from 'react';

const logo = '/static/images/opencollective-icon.svg';

class TopBar extends React.Component {

  render() {
    const {className} = this.props;
    return (
      <div className={`${className} TopBar`}>
        <style jsx>{`
        .TopBar {
          height: 60px;
          width: 100%;
          position: relative;
        }
        .logo {
          margin: 10px;
        }
        .loading .logo {
          animation: oc-rotate 0.8s infinite linear;
        }
        @keyframes oc-rotate {
          0%    { transform: rotate(0deg); }
          100%  { transform: rotate(360deg); }
        }
        .nav {
          box-sizing: border-box;
          position: absolute;
          top: 0px;
          right: 20px;
          padding-top: 10px;
        }
        ul {
          display: inline-block;
          min-width: 200px;
          list-style: none;
          text-align: right;
          margin: 0;
          padding-left: 10px;
          padding-right: 10px;
        }
        li {
          display: inline-block;
        }
        .separator {
          display: inline-block;
          width: 1px;
          margin: 0 5px;
          height: 30px;
          height: 40px;
          background-color: #e6e6e6;
          vertical-align: middle;          
        }
        .nav a {
          box-sizing: border-box;
          display: inline-block;
          font-size: 12px;
          letter-spacing: 1px;
          text-align: center;
          color: #b4bbbf;
          text-transform: capitalize;
          padding: 4px 16px;
          cursor: pointer;
        }
        .nav a:last-child {
          margin-right: 0;
          padding-right: 0;          
        }
        `}</style>
        <img src={logo} width="40" height="40" className="logo" alt="Open Collective logo" />
        <div className="nav">
          <ul>
            <li><a href="/learn-more">How it works</a></li>
            <li><a href="/discover">Discover</a></li>
            <li><a href="https://medium.com/open-collective">Blog</a></li>
          </ul>
          <div className="separator"></div>
          <a href="/login?next=/">Login</a>
        </div>
      </div>
    )
  }
}

export default TopBar;