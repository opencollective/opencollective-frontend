import React from 'react';
import PropTypes from 'prop-types';
import { Link } from '../server/pages';
import { FormattedMessage, defineMessages } from 'react-intl';
import withIntl from '../lib/withIntl';
import { formatCurrency } from '../lib/utils';
import { Badge } from 'react-bootstrap';
import { get } from 'lodash';

class TopBarProfileMenu extends React.Component {

  static propTypes = {
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.state = { showProfileMenu: false, loading: true };
    this.toggleProfileMenu = this.toggleProfileMenu.bind(this);
    this.logout = this.logout.bind(this);
    this.messages = defineMessages({
      'tooltip.balance': { id: 'profilemenu.memberships.tooltip.balance', defaultMessage: 'Balance {balance}' },
      'tooltip.pendingExpenses': { id: 'profilemenu.memberships.tooltip.pendingExpenses', defaultMessage: '{n} pending expenses' },
    });
  }

  logout() {
    this.setState({ showProfileMenu: false, status: 'loggingout' })
    window.localStorage.removeItem('accessToken');
    window.location.replace(window.location.href);
  }

  componentDidMount() {
    this.onClickOutsideRef = this.onClickOutside.bind(this);
    document.addEventListener('click', this.onClickOutsideRef);
    if (typeof window !== 'undefined') {
      this.redirectAfterSignin = window.location.href.replace(/^https?:\/\/[^\/]+/,'');
      if (!window.localStorage.accessToken) {
        this.setState({ loading: false })
      }
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onClickOutsideRef);
  }

  onClickOutside() {
    this.setState({ showProfileMenu: false });
  }

  toggleProfileMenu(e) {
    if (e.target.className.indexOf('LoginTopBarProfileButton') !== -1) {
      this.setState({showProfileMenu: !this.state.showProfileMenu});
      e.nativeEvent.stopImmediatePropagation();
    }
  }

  tooltip(membership) {
    const { intl } = this.props;
    const { collective } = membership;
    const balance = get(collective, 'stats.balance');
    let str = intl.formatMessage(this.messages['tooltip.balance'], { balance: formatCurrency(balance, collective.currency) });
    const pendingExpenses = get(collective, 'stats.expenses.pending');
    if (pendingExpenses > 0) {
      str += ` - ${intl.formatMessage(this.messages['tooltip.pendingExpenses'], { n: pendingExpenses })}`;
    }
    return str;
  }

  renderProfileMenu() {
    const { LoggedInUser, intl } = this.props;
    const score = (c) => {
      switch (c.role) {
        case 'HOST':
          return 0;
        case 'ADMIN':
          return 1;
        case 'MEMBER':
          return 2;
        case 'BACKER':
          return 3;
      }
    }
    const collectives = [ ...LoggedInUser.memberOf.filter(m => m.collective.type !== 'EVENT') ].sort((a, b) => {
      return (`${score(a)}-${a.collective.slug}` > `${score(b)}-${b.collective.slug}`) ? 1 : -1
    }); // order by role then az

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
          border-radius: 0.5rem;
          background-color: #ffffff;
          box-shadow: 0 -1px 2px 0 rgba(0, 0, 0, 0.1);
          border: solid 1px #f2f2f2;
          padding: 20px 0;
        }
        .LoginTopBarProfileMenuHeading {
          position: relative;
          font-family: montserratlight, arial;
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
          margin-top: 1rem;
          margin-bottom: 2rem;
          padding: 0;
          overflow: hidden;
        }
        li {
          box-sizing: border-box;
          float: left;
          width: 100%;
          padding: 0.1rem 0.5rem;
          display: flex;
        }
        a {
          box-sizing: border-box;
          display: inline-block;
          width: 100%;
          text-decoration: none;
          font-family: montserratlight, arial;
          font-size: 1.4rem;
          font-weight: 300;
          text-align: left;
          color: #84898c;
          padding: 1px 2rem;
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
          height: 1.3rem;
          background-color: white;
          z-index: 1;
          padding-right: 0.5rem;
        }
        .-dash {
          position: absolute;
          top: 0.7rem;
          left: 2rem;
          right: 2rem;
          height: 0.1rem;
          background-color: #e6e6e6;
          z-index: 0;
        }

        .LoginTopBar-nav .LoginTopBarLink:last-child {
          margin-right: 0;
          padding-right: 0;
        }

        a.admin {
          color: red;
        }

        a.member {
          color: green;
        }

        `}</style>
        <div>
          <div className='LoginTopBarProfileMenuHeading'>
            <span><FormattedMessage id="collective" defaultMessage="{n, plural, one {collective} other {collectives}}" values={{ n: collectives.length }} /></span>
            <div className='-dash'></div>
          </div>
          <ul>
          {this.showCreateBtn && <li><a href='/create'><FormattedMessage id="menu.createCollective" defaultMessage="Create a Collective" /></a></li>}
          <li><a href='/discover'><FormattedMessage id="menu.discover" defaultMessage="discover" /></a></li>
          { collectives.map(membership => (
            <li key={`LoggedInMenu-Collective-${get(membership, 'collective.slug')}`}>
              <Link route={`/${get(membership, 'collective.slug')}`}>
                <a title={this.tooltip(membership)} className={membership.role.toLowerCase()}>{get(membership, 'collective.slug')}</a>
              </Link>
              { get(membership, 'collective.stats.expenses.pending') > 0 && <Badge>{get(membership, 'collective.stats.expenses.pending')}</Badge> }
            </li>
          ))}
          </ul>
        </div>
        <div>
          <div className='LoginTopBarProfileMenuHeading'>
            <span><FormattedMessage id="menu.myAccount" defaultMessage="My account" /></span>
            <div className='-dash'></div>
          </div>
          <ul>
            <li><a href={`/${LoggedInUser.username}`}><FormattedMessage id="menu.profile" defaultMessage="profile" /></a></li>
            <li><a href='/subscriptions'><FormattedMessage id="menu.subscriptions" defaultMessage="Subscriptions" /></a></li>
            <li>
              <Link route="/organizations/new">
                <a><FormattedMessage id="menu.createOrganization" defaultMessage="Create an Organization" /></a>
              </Link>
            </li>
            <li><a className='-blue' href='#' onClick={this.logout}><FormattedMessage id="menu.logout" defaultMessage="logout" /></a></li>
          </ul>
        </div>
      </div>
    )
  }

  renderLoggedInUser() {
    const { showProfileMenu } = this.state;
    const { LoggedInUser } = this.props;
    
    return (
      <div className={showProfileMenu ? '-active' : ''} onClick={this.toggleProfileMenu}>
        <style jsx>{`
        .LoginTopBarProfileMenu {
          line-height: 3.1rem;
        }
        .LoginTopBarProfileButton:hover {
          background-color: #fbfbfb;
          cursor: pointer;
        }
        .LoginTopBarProfileButton-caret:after {
          border-top: 0.5rem solid #fbfbfb;
        }
        LoginTopBarProfileButton .-active {
          background-color: #f7f7f7;
        }
        .LoginTopBarProfileButton-caret:after {
          border-top: 0.5rem solid #f7f7f7;
        }
        .LoginTopBarProfileButton-image {
          display: inline-block;
          width: 2.6rem;
          height: 2.6rem;
          background-color: #fdfdfd;
          vertical-align: middle;
          border-radius: 100%;
          overflow: hidden;
          background-size: contain;
          margin-right: 0.5rem;
          background-repeat: no-repeat;
          background-position: center;
        }
        .LoginTopBarProfileButton-name {
          display: inline-block;
          height: 1.4rem;
          font-size: 1.2rem;
          font-weight: bold;
          color: #46b0ed;
          margin: 0 0.5rem;
        }
        .LoginTopBarProfileButton-caret {
          position: relative;
          display: inline-block;
          width: 1.4rem;
          height: 0.6rem;
        }
        .LoginTopBarProfileButton-caret:before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          border-top: 0.6rem solid #46b0ed;
          border-left: 0.6rem solid transparent;
          border-right: 0.6rem solid transparent;
        }
        .LoginTopBarProfileButton-caret:after {
          content: '';
          position: absolute;
          left: 0.1rem;
          top: 0;
          border-top: 0.5rem solid white;
          border-left: 0.5rem solid transparent;
          border-right: 0.5rem solid transparent;
        }
        `}</style>
        {LoggedInUser.image && <div className='LoginTopBarProfileButton-image' style={{backgroundImage: `url(${LoggedInUser.image})`}}></div>}
        <div className='LoginTopBarProfileButton-name desktopOnly'>{LoggedInUser.username}</div>
        <div className='LoginTopBarProfileButton-caret'></div>
        {showProfileMenu && this.renderProfileMenu()}
      </div>
    )
  }

  render() {

    const { loading } = this.state;
    const { LoggedInUser } = this.props;

    let status;
    if (this.state.status) {
      status = this.state.status;
    } else if (loading && typeof LoggedInUser === 'undefined') {
      status = 'loading';
    } else if (!LoggedInUser) {
      status = 'loggedout';
    } else {
      status = 'loggedin';
    }

    return (
      <div className="LoginTopBarProfileButton">
        <style jsx>{`
        .LoginTopBarProfileButton {
          position: relative;
          box-sizing: border-box;
          display: inline-block;
          border-radius: 0.5rem;
          vertical-align: middle;
          margin-right: 0;
          padding: 0.6rem 0.1rem;
          font-size: 1.2rem;
          letter-spacing: 0.1rem;
          color: #b4bbbf;
          cursor: pointer;
        }
        .LoginTopBarProfileButton a {
          color: #b4bbbf;
        }
        `}</style>

        { status === 'loading' &&
          <div className="LoginTopBarProfileButton"><FormattedMessage id="loading" defaultMessage="loading" />&hellip;</div>
        }

        { status === 'loggingout' &&
          <div className="LoginTopBarProfileButton"><FormattedMessage id="loggingout" defaultMessage="logging out" />&hellip;</div>
        }

        { status === 'loggedout' &&
          <div className="LoginTopBarProfileButton">
            <Link route="signin" params={ { next: this.redirectAfterSignin } }><a>
              <FormattedMessage id="login.button" defaultMessage="login" />
            </a></Link>
          </div>
        }

        { status === 'loggedin' && this.renderLoggedInUser() }
      </div>
    )

  }
}

export default withIntl(TopBarProfileMenu);
