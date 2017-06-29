import React from 'react';

class TopBarProfileMenu extends React.Component {

  constructor(props) {
    super(props);
    this.state = { showProfileMenu: false };
    this.toggleProfileMenu = this.toggleProfileMenu.bind(this);
    this.logout = this.logout.bind(this);
  }

  logout() {
    window.localStorage.removeItem('accessToken');
    window.location.replace(window.location.href);
  }

  componentDidMount() {
    this.onClickOutsideRef = this.onClickOutside.bind(this);
    document.addEventListener('click', this.onClickOutsideRef);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onClickOutsideRef);
  }

  onClickOutside() {
    this.setState({showProfileMenu: false});
  }

  toggleProfileMenu(e) {
    if (e.target.className.indexOf('LoginTopBarProfileButton') !== -1) {
      this.setState({showProfileMenu: !this.state.showProfileMenu});
      e.nativeEvent.stopImmediatePropagation();
    }
  }

  renderProfileMenu() {
    const { LoggedInUser } = this.props;

    return (
      <div className='LoginTopBarProfileMenu' onClick={(e) => e.nativeEvent.stopImmediatePropagation()}>
        <style jsx>{`
        .LoginTopBarProfileMenu {
          position: absolute;
          top: 40px;
          right: 0;
          z-index: 999;
          min-width: 170px;
          max-width: 300px;
          border-radius: 5px;
          background-color: #ffffff;
          box-shadow: 0 -1px 2px 0 rgba(0, 0, 0, 0.1);
          border: solid 1px #f2f2f2;
          padding: 20px 0;
        }
        .LoginTopBarProfileMenuHeading {
          position: relative;
          font-family: Montserrat;
          font-size: 10px;
          font-weight: 500;
          text-align: left;
          color: #b4bbbf;
          padding: 0 20px;
          text-transform: uppercase;
          cursor: default;
          height: 13px;
        }

        ul {
          width: 100%;
          list-style-type: none;
          margin-top: 10px;
          margin-bottom: 20px;
          padding: 0;
          overflow: hidden;
        }
        li {
          box-sizing: border-box;
          float: left;
          width: 100%;
          padding: 0 10px;
        }
        a {
          box-sizing: border-box;
          display: inline-block;
          width: 100%;
          text-decoration: none;
          font-family: Montserrat;
          font-size: 14px;
          font-weight: 300;
          text-align: left;
          color: #84898c;
          padding: 1px 20px;
          border-radius: 4px;
        }
        a:active,
        a:hover {
          background-color: #f0f0f0;
        }
        a.-blue {
          color: #46b0ed;
        }
        .LoginTopBarProfileMenu div:last-child ul {
          margin-bottom: 0;
        }

        span {
          display: inline-block;
          position: absolute;
          height: 13px;
          background-color: white;
          z-index: 1;
          padding-right: 5px;
        }
        .-dash {
          position: absolute;
          top: 7px;
          left: 20px;
          right: 20px;
          height: 1px;
          background-color: #e6e6e6;
          z-index: 0;
        }

        .LoginTopBar-nav .LoginTopBarLink:last-child {
          margin-right: 0;
          padding-right: 0;
        }

        `}</style>
        <div>
          <div className='LoginTopBarProfileMenuHeading'>
            <span>collectives</span>
            <div className='-dash'></div>
          </div>
          <ul>
          {this.showCreateBtn && <li><a href='/create'>create a collective</a></li>}
          <li><a href='/discover'>Discover</a></li>
            <li><a href='/subscriptions'>Subscriptions</a></li>
          </ul>
        </div>
        <div>
          <div className='LoginTopBarProfileMenuHeading'>
            <span>my account</span>
            <div className='-dash'></div>
          </div>
          <ul>
            <li><a href={`/${LoggedInUser.username}`}>Profile</a></li>
            <li><a className='-blue' href='#' onClick={this.logout}>Logout</a></li>
          </ul>
        </div>
      </div>
    )
  }

  render() {

    const { showProfileMenu } = this.state;
    const { LoggedInUser } = this.props;

    return (
      <div className={`LoginTopBarProfileButton ${showProfileMenu ? '-active' : ''}`} onClick={this.toggleProfileMenu}>
      <style jsx>{`
      .LoginTopBarProfileButton {
        position: relative;
        box-sizing: border-box;
        display: inline-block;
        height: 40px;
        border-radius: 5px;
        vertical-align: middle;
        margin-right: 0;
        padding: 6px 11px;
      }
      .LoginTopBarProfileButton:hover {
        background-color: #fbfbfb;
        cursor: pointer;
      }
      .LoginTopBarProfileButton-caret:after {
        border-top: 5px solid #fbfbfb;
      }
      LoginTopBarProfileButton .-active {
        background-color: #f7f7f7;
      }
      .LoginTopBarProfileButton-caret:after {
        border-top: 5px solid #f7f7f7;
      }
      .LoginTopBarProfileButton-avatar {
        display: inline-block;
        width: 26px;
        height: 26px;
        background-color: #fdfdfd;
        vertical-align: middle;
        border-radius: 100%;
        overflow: hidden;
        background-size: contain;
        margin-right: 5px;
        background-repeat: no-repeat;
        background-position: center;
      }
      .LoginTopBarProfileButton-name {
        display: inline-block;
        height: 14px;
        font-size: 12px;
        font-weight: bold;
        color: #46b0ed;
        margin: 0 5px;
      }
      .LoginTopBarProfileButton-caret {
        position: relative;
        display: inline-block;
        width: 14px;
        height: 6px;
      }
      .LoginTopBarProfileButton-caret:before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        border-top: 6px solid #46b0ed;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
      }
      .LoginTopBarProfileButton-caret:after {
        content: '';
        position: absolute;
        left: 1px;
        top: 0;
        border-top: 5px solid white;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
      }
      `}</style>
      {LoggedInUser.avatar && <div className='LoginTopBarProfileButton-avatar' style={{backgroundImage: `url(${LoggedInUser.avatar})`}}></div>}
      <div className='LoginTopBarProfileButton-name desktopOnly'>{LoggedInUser.username}</div>
      <div className='LoginTopBarProfileButton-caret'></div>
      {showProfileMenu && this.renderProfileMenu()}
    </div>
    );
  }
}

export default TopBarProfileMenu;