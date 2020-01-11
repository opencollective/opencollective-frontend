import React from 'react';
import PropTypes from 'prop-types';
import Sticky from 'react-stickynode';
import styled from 'styled-components';
import { get, throttle, uniqBy } from 'lodash';

import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { animateScroll } from 'react-scrollchor/lib/helpers';
import { Pencil } from '@styled-icons/octicons/Pencil';

import colors from '../lib/constants/colors';
import { withUser } from './UserProvider';

import Avatar from './Avatar';
import Logo from './Logo';
import Link from './Link';
import Button from './Button';
import AddFundsModal from './AddFundsModal';

const PencilIcon = styled(Pencil)`
  margin-right: 8px;
  padding: 0.3em;
  background-color: #393d40;
  border-radius: 4px;
`;

class MenuBar extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object,
    cta: PropTypes.object,
    intl: PropTypes.object,
  };

  constructor(props) {
    super(props);

    const menuItems = [{ anchor: 'about', link: `${props.collective.path}#about`, position: 0 }];

    if (props.collective.type === 'COLLECTIVE') {
      menuItems.push({
        anchor: 'budget',
        link: `/${props.collective.slug}#budget`,
        position: 0,
      });
      menuItems.push({
        anchor: 'contributors',
        link: `/${props.collective.slug}#contributors`,
        position: 0,
      });
    }

    if (get(props.collective, 'stats.collectives.all') > 0) {
      menuItems.push({
        anchor: 'collectives',
        link: `/${props.collective.slug}#collectives`,
        position: 0,
      });
    }

    if (get(props.collective, 'stats.events') > 0) {
      menuItems.push({
        anchor: 'events',
        link: `/${props.collective.slug}#events`,
        position: 0,
      });
    }

    if (get(props.collective, 'stats.updates') > 0) {
      menuItems.push({
        anchor: 'updates',
        link: `/${props.collective.slug}#updates`,
        position: 0,
      });
    }

    this.state = {
      menuItems,
      selectedAnchor: null,
      sticky: false,
      logoLink: `/${props.collective.slug}`,
      showAddFunds: false,
    };

    this.messages = defineMessages({
      admin: { id: 'menu.admin', defaultMessage: 'admin' },
      backer: { id: 'menu.backing', defaultMessage: 'backing' },
      attendee: { id: 'menu.attending', defaultMessage: 'attending' },
      fundraiser: { id: 'menu.fundraising', defaultMessage: 'fundraising' },
      parenting: { id: 'menu.parenting', defaultMessage: 'member collectives' },
      about: { id: 'menu.about', defaultMessage: 'about' },
      events: { id: 'menu.events', defaultMessage: 'events' },
      team: { id: 'menu.team', defaultMessage: 'team' },
      updates: { id: 'menu.updates', defaultMessage: 'updates' },
      budget: { id: 'menu.budget', defaultMessage: 'budget' },
      contributors: { id: 'menu.contributors', defaultMessage: 'contributors' },
      'menu.edit.collective': {
        id: 'menu.edit.collective',
        defaultMessage: 'edit collective',
      },
      'menu.edit.user': {
        id: 'menu.edit.user',
        defaultMessage: 'edit profile',
      },
      'menu.edit.organization': {
        id: 'menu.edit.organization',
        defaultMessage: 'edit organization',
      },
      'menu.edit.event': {
        id: 'menu.edit.event',
        defaultMessage: 'edit event',
      },
      'menu.createPledge': {
        id: 'menu.createPledge',
        defaultMessage: 'Make a Pledge',
      },
    });

    this.domElement = React.createRef();

    this.throttledOnResize = throttle(this.onResize, 400);
    this.throttledOnScroll = throttle(this.onScroll, 400);
  }

  componentDidMount() {
    if (this.domElement.current) {
      this.height = this.domElement.current.clientHeight;
    }

    window.addEventListener('load', this.onLoad);
    window.addEventListener('hashchange', this.onHashChange);
    window.addEventListener('resize', this.throttledOnResize);
    window.addEventListener('scroll', this.throttledOnScroll);

    const { collective } = this.props;
    if (!collective) {
      console.error('>>> this is a weird error, collective should always be set', this.props);
      return;
    }

    const menuItemsFoundOnPage = [];
    uniqBy(document.querySelectorAll('section'), el => el.id)
      .filter(el => !!el.id)
      .forEach(el => {
        const titleEl = el.querySelector('h1');
        const menuItem = {
          anchor: el.id,
          title: titleEl && titleEl.innerText,
          link: `#${el.id}`,
          position: el.offsetTop,
        };
        if (menuItem.title && menuItem.title.length < 30) {
          menuItemsFoundOnPage.push(menuItem);
        }
      });

    // If we don't find the sections on the page, we link the logo to the homepage instead of #top
    if (menuItemsFoundOnPage.length > 0) {
      menuItemsFoundOnPage.sort((a, b) => a.position - b.position);
      this.setState({ menuItems: menuItemsFoundOnPage, logoLink: '#top' });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('load', this.onLoad);
    window.removeEventListener('hashchange', this.onHashChange);
    window.removeEventListener('resize', this.throttledOnResize);
    window.removeEventListener('scroll', this.throttledOnScroll);
  }

  onLoad = () => {
    this.adjustScrollPosition();
  };

  onHashChange = () => {
    this.adjustScrollPosition();
  };

  onResize = () => {
    if (this.domElement.current) {
      this.height = this.domElement.current.clientHeight;
    }
  };

  onScroll = e => {
    if (e.target.scrollingElement) {
      const top = e.target.scrollingElement.scrollTop;
      const selectedMenuItem = this.state.menuItems
        .filter(menuItem => !!menuItem.position)
        .sort((a, b) => b.position - a.position)
        .find(menuItem => menuItem.position < top + this.height + 50);
      if (selectedMenuItem) {
        const anchor = `#${selectedMenuItem.anchor}`;
        this.setState({ selectedAnchor: selectedMenuItem.anchor });
        history.replaceState({ ...history.state, as: location.pathname + anchor }, undefined, anchor);
      } else {
        history.replaceState(history.state, undefined, window.location.pathname + window.location.search);
      }
    }
  };

  adjustScrollPosition = () => {
    if (window.location.hash) {
      const animate = {
        duration: 400,
        offset: -this.height,
        easing: (x, t, b, c, d) => -c * (t /= d) * (t - 2) + b,
      };
      animateScroll(window.location.hash.substr(1), animate)
        .then(id => this.setState({ selectedAnchor: id }))
        .catch(() => {});
    }
  };

  handleChange = status => {
    this.setState({ sticky: status.status === Sticky.STATUS_FIXED });
  };

  // Render Contribute and Submit Expense buttons
  renderButtons = () => {
    const { collective, LoggedInUser } = this.props;
    const offset = -this.height;

    let cta = this.props.cta;
    const stickyCTA = get(this.props, 'cta.props.sticky', true);
    if (get(cta, 'label')) {
      cta = (
        <Link route={cta.href} animate={{ offset }}>
          <Button className="blue">{cta.label}</Button>
        </Link>
      );
    }

    return (
      <div className="buttons">
        <style jsx>
          {`
            .buttons {
              height: 88px;
              display: flex;
              padding: 5px;
              text-align: center;
              align-items: center;
            }

            :global(.mobileOnly) .buttons {
              height: 64px;
            }

            .MenuBar :global(button.blue) {
              border-color: ${colors.blue};
            }
          `}
        </style>
        {this.state.sticky && stickyCTA && cta}
        {!collective.isArchived && ['COLLECTIVE', 'EVENT'].includes(collective.type) && (
          <Button className="submitExpense darkBackground" href={`${collective.path}/expenses/new`}>
            <FormattedMessage id="menu.submitExpense" defaultMessage="Submit Expense" />
          </Button>
        )}

        {LoggedInUser &&
        LoggedInUser.isRoot() /* Only Site admins can do that for now */ &&
        LoggedInUser.hostsUserIsAdminOf() /* Don't show button if user isn't admin anywhere */ &&
        collective.type === 'ORGANIZATION' /* We can only create a prepaid card for an organization */ && (
            <div>
              <div className="item editCollective">
                <AddFundsModal collective={collective} show={this.state.showAddFunds} setShow={this.hideAddFunds} />
                <Button className="addFunds darkBackground" onClick={() => this.setState({ showAddFunds: true })}>
                  <FormattedMessage id="menu.addFunds" defaultMessage="Add funds" />
                </Button>
              </div>
            </div>
          )}
        {collective.isHost && LoggedInUser && LoggedInUser.canEditCollective(collective) && (
          <div>
            <div className="item editCollective">
              <Button className="darkBackground" href={`/${collective.slug}/dashboard`}>
                <FormattedMessage id="host.dashboard" defaultMessage="Dashboard" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  hideAddFunds = () => this.setState({ showAddFunds: false });

  renderMenu = () => {
    const { intl, LoggedInUser, collective } = this.props;
    const offset = -this.height; // offset for hashlink to leave room for the menu bar
    return (
      <div className="menu">
        <style jsx>
          {`
            .menu {
              display: flex;
              padding: 0;
              flex-direction: row;
              justify-content: space-evenly;
              flex-wrap: wrap;
            }
            .item {
              color: #fafafa;
              font-size: 14px;
              line-height: 40px;
              margin: 32px;
            }
            :global(.mediumScreenOnly) .item {
              margin: 24px 12px;
            }
            :global(.mobileOnly) .item {
              margin: 0px 5px;
            }
            .admin {
              display: flex;
              align-items: center;
            }
            .admin a {
              line-height: 24px;
            }
            .separator {
              background-color: #393d40;
              width: 1px;
              height: 28px;
              float: left;
            }
          `}
        </style>
        {this.state.menuItems.map((item, index) => (
          <div
            className={`item ${item.anchor} ${this.state.selectedAnchor === item.anchor && 'selected'}`}
            key={/* eslint-disable-line react/no-array-index-key */ `item-${index}-${item.link}`}
          >
            <Link route={item.link} animate={{ offset }}>
              {this.messages[item.anchor] ? intl.formatMessage(this.messages[item.anchor]) : item.title || item.anchor}
            </Link>
          </div>
        ))}
        {LoggedInUser && LoggedInUser.canEditCollective(collective) && (
          <div className="admin">
            {['USER', 'ORGANIZATION'].includes(collective.type) && (
              <div className="item transactions">
                <Link route={`${collective.path}/transactions`}>
                  <FormattedMessage id="menu.transactions" defaultMessage="transactions" />
                </Link>
              </div>
            )}
            {collective.type !== 'EVENT' && (
              <div className="item">
                <Link route="subscriptions" params={{ collectiveSlug: collective.slug }}>
                  <FormattedMessage id="menu.subscriptions" defaultMessage="Manage Contributions" />
                </Link>
              </div>
            )}
            <div className="separator" />
            {!collective.isIncognito && (
              <div className="item editCollective">
                <Link route={`${collective.path}/edit`}>
                  <PencilIcon size="1.75em" />
                  {intl.formatMessage(this.messages[`menu.edit.${collective.type.toLowerCase()}`])}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  render() {
    const { collective } = this.props;
    const { logoLink } = this.state;

    if (!collective || !collective.slug) {
      return <div />;
    }

    return (
      <div className="MenuBar" ref={this.domElement}>
        <style jsx>
          {`
            .MenuBar {
              background-color: #17181a;
              overflow: hidden;
            }

            .stickyBar {
              background-color: #17181a;
            }

            .content {
              display: block;
              padding-top: 0;
              padding-bottom: 0;
            }

            .flexColumns {
              display: flex;
              flex-direction: row;
            }

            .logo {
              height: 64px;
              min-width: 64px;
              margin: 12px 12px 12px 0;
              float: left;
            }

            .mobileOnly .logo {
              height: 48px;
              min-width: 48px;
              margin: 8px;
            }

            .allcaps {
              text-transform: uppercase;
            }

            .actionBar {
              overflow: hidden;
            }
          `}
        </style>
        <style jsx global>
          {`
            .sticky-outer-wrapper {
              width: 100%;
            }
            .sticky-inner-wrapper {
              overflow: hidden;
              background-color: #17181a;
            }
            #nprogress .bar {
              z-index: 2001;
            }
            .active .sticky-inner-wrapper {
              z-index: 2000;
              overflow: hidden;
              background-color: #17181a;
            }
            .MenuBar .item a {
              color: #aaaeb3;
              text-transform: capitalize;
            }
            .MenuBar .item a:hover {
              color: white;
            }

            .MenuBar .selected a {
              color: #fafafa;
              font-weight: 500;
            }

            .MenuBar .buttons button {
              margin-left: 1rem;
            }

            .MenuBar .logo img {
              height: 64px;
            }
            .USER .MenuBar .mobileOnly .innerMenu,
            .ORGANIZATION .MenuBar .mobileOnly .innerMenu {
              display: flex;
              align-items: center;
            }
            .MenuBar .mobileOnly .logo img {
              height: 48px;
            }
          `}
        </style>
        <div className="mobileOnly">
          <div className="innerMenu">
            <div className="actionBar">
              <Sticky enabled={true} top={0} onStateChange={this.handleChange}>
                <div className="stickyBar">
                  <div className="row1">
                    <div className="pullRight">{this.renderButtons()}</div>
                    <div className="logo">
                      <Link route={logoLink} key={logoLink}>
                        {collective.type === 'USER' && (
                          <Avatar collective={collective} className="logo" radius="4.8rem" />
                        )}
                        {collective.type !== 'USER' && <Logo collective={collective} className="logo" height="48" />}
                      </Link>
                    </div>
                  </div>
                </div>
              </Sticky>
            </div>
            <div className="menu">{this.renderMenu()}</div>
          </div>
        </div>
        <div className="desktopOnly mediumScreenOnly">
          <Sticky enabled={true} top={0} onStateChange={this.handleChange}>
            <div className="stickyBar">
              <div className="content">
                <div className="pullRight">{this.renderButtons()}</div>
                <div className="logo">
                  <Link route={logoLink} key={logoLink}>
                    {collective.type === 'USER' && <Avatar collective={collective} className="logo" radius="6.4rem" />}
                    {collective.type !== 'USER' && <Logo collective={collective} className="logo" height="64" />}
                  </Link>
                </div>
                <div className="pullLeft menu">{this.renderMenu()}</div>
              </div>
            </div>
          </Sticky>
        </div>
      </div>
    );
  }
}

export default injectIntl(withUser(MenuBar));
