import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import TopBarProfileMenu from './TopBarProfileMenu';
import { defineMessages, FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';

const logo = '/static/images/opencollective-icon.svg';

class TopBar extends React.Component {

  static propTypes = {
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      'menu.homepage': { id: 'menu.homepage', defaultMessage: `Go to Open Collective Homepage`}
    });
  }

  onClickSubscriptions(e) {
    this.props.pushState(null, '/subscriptions')
    this.toggleProfileMenu(e);
  }

  renderProfileMenu() {
    const { LoggedInUser } = this.props;

    return (
      <div className='LoginTopBarProfileMenu' onClick={(e) => e.nativeEvent.stopImmediatePropagation()}>
        <div>
          <div className='LoginTopBarProfileMenuHeading'>
            <span>collectives</span>
            <div className='-dash'></div>
          </div>
          <ul>
          {this.showCreateBtn && <li><a href='/create'>create a collective</a></li>}
          <li><a href='/discover'><FormattedMessage id="menu.discover" defaultMessage="discover" /></a></li>
            <li><a href='#' onClick={this.onClickSubscriptions.bind(this)}>Subscriptions</a></li>
          </ul>
        </div>
        <div>
          <div className='LoginTopBarProfileMenuHeading'>
            <span><FormattedMessage id="menu.myAccount" defaultMessage="My account" /></span>
            <div className='-dash'></div>
          </div>
          <ul>
            <li><a href={`/${LoggedInUser.username}`}><FormattedMessage id="menu.profile" defaultMessage="Profile" /></a></li>
          </ul>
          <ul>
            <li><a className='-blue' href='#' onClick={this.onClickLogout.bind(this)}><FormattedMessage id="menu.logout" defaultMessage="Logout" /></a></li>
          </ul>
        </div>
      </div>
    )
  }

  render() {
    const { className, LoggedInUser, intl } = this.props;

    return (
      <div className={classNames(className, 'TopBar')}>
        <style jsx>{`
        .TopBar {
          height: 6rem;
          width: 100%;
          position: relative;
        }
        .logo {
          margin: 1rem;
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
          top: 0;
          right: 2rem;
          padding-top: 1rem;
          display: flex;
          align-items: center;
        }
        ul {
          display: inline-block;
          min-width: 20rem;
          list-style: none;
          text-align: right;
          margin: 0;
          padding-left: 1rem;
        }
        li {
          display: inline-block;
          text-transform: capitalize;
        }
        .separator {
          display: inline-block;
          width: 0.1rem;
          margin: 0 1rem;
          height: 3rem;
          height: 4rem;
          background-color: #e6e6e6;
          vertical-align: middle;
        }
        @media(max-width: 380) {
          ul {
            display: none;
          }
        }
        .TopBar .nav a {
          box-sizing: border-box;
          display: inline-block;
          font-size: 1.2rem;
          letter-spacing: 0.1rem;
          color: #b4bbbf;
          padding: 0.4rem 1.6rem;
          cursor: pointer;
        }
        .TopBar .nav a:last-child {
          margin-right: 0;
          padding-right: 0;
        }
        `}</style>
        <a href="/" title={intl.formatMessage(this.messages['menu.homepage'])}><img src={logo} width="40" height="40" className="logo" alt="Open Collective logo" /></a>
        <div className="nav">
          <ul className="mediumScreenOnly">
            <li><a className="menuItem" href="/learn-more"><FormattedMessage id="menu.howItWorks" defaultMessage="How it works" /></a></li>
            <li><a className="menuItem" href="/discover"><FormattedMessage id="menu.discover" defaultMessage="discover" /></a></li>
            <li><a className="menuItem" href="https://medium.com/open-collective"><FormattedMessage id="menu.blog" defaultMessage="Blog" /></a></li>
          </ul>
          <div className="separator"></div>
          <TopBarProfileMenu LoggedInUser={LoggedInUser} />
        </div>
      </div>
    )
  }
}

export default withIntl(TopBar);
