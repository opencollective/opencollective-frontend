import React from 'react';

class TopBarProfileMenu extends React.component {

  render() {
    return (
      <div className={`LoginTopBarProfileButton ${showProfileMenu ? '-active' : ''}`} onClick={this.toggleProfileMenu.bind(this)}>
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
        &:hover {
          background-color: #fbfbfb;
          cursor: pointer;
          .LoginTopBarProfileButton-caret {
            &:after {
              border-top: 5px solid #fbfbfb;
            }
          }
        }
        &:active,
        &.-active {
          background-color: #f7f7f7;
          .LoginTopBarProfileButton-caret {
            &:after {
              border-top: 5px solid #f7f7f7;
            }
          }
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
          &:before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            border-top: 6px solid #46b0ed;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
          }
          &:after {
            content: '';
            position: absolute;
            left: 1px;
            top: 0;
            border-top: 5px solid white;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
          }
        }
      }
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
      `}</style>
      {LoggedInUser.avatar && <div className='LoginTopBarProfileButton-avatar' style={{backgroundImage: `url(${LoggedInUser.avatar})`}}></div>}
      <div className='LoginTopBarProfileButton-name'>{LoggedInUser.username}</div>
      <div className='LoginTopBarProfileButton-caret'></div>
      {false && showProfileMenu && this.renderProfileMenu()}
    </div>
    );
  }
}

export default TopBarProfileMenu;