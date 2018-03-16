import React from 'react';
import PropTypes from 'prop-types';
import colors from '../constants/colors';
import HashLink from 'react-scrollchor';
import Logo from './Logo';
import Sticky from 'react-stickynode';
import { FormattedMessage, defineMessages } from 'react-intl';
import Link from './Link';
import Button from './Button';
import { get, throttle, uniqBy } from 'lodash';
import withIntl from '../lib/withIntl';

class MenuBar extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.onscroll = this.onscroll.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.height = 60;

    const menuItems = [
      { anchor: 'about', link: `${props.collective.path}#about`, position: 0 },
    ];

    if (props.collective.type === 'COLLECTIVE') {
      menuItems.push({ anchor: 'budget', link: `/${props.collective.slug}#budget`, position: 0 });
      menuItems.push({ anchor: 'contributors', link: `/${props.collective.slug}#contributors`, position: 0 });
    }

    if (get(props.collective, 'stats.collectives.all') > 0) {
      menuItems.push({ anchor: 'collectives', link: `/${props.collective.slug}#collectives`, position: 0 });
    }

    if (get(props.collective, 'stats.events') > 0) {
      menuItems.push({ anchor: 'events', link: `/${props.collective.slug}#events`, position: 0 });
    }

    if (get(props.collective, 'stats.updates') > 0) {
      menuItems.push({ anchor: 'updates', link: `/${props.collective.slug}#updates`, position: 0 });
    }

    this.state = { menuItems, selectedAnchor: null, sticky: false, logoLink: `/${props.collective.slug}` };

    this.messages = defineMessages({
      'admin': { id: 'menu.admin', defaultMessage: "admin" },
      'backer': { id: 'menu.backer', defaultMessage: "backer" },
      'attendee': { id: 'menu.attendee', defaultMessage: "attendee" },
      'fundraiser': { id: 'menu.fundraiser', defaultMessage: "fundraiser" },
      'about': { id: 'menu.about', defaultMessage: "about" },
      'events': { id: 'menu.events', defaultMessage: "events" },
      'updates': { id: 'menu.updates', defaultMessage: "updates" },
      'budget': { id: 'menu.budget', defaultMessage: "budget" },
      'contributors': { id: 'menu.contributors', defaultMessage: "contributors" },
      'menu.edit.collective': { id: 'menu.edit.collective', defaultMessage: "edit collective" },
      'menu.edit.user': { id: 'menu.edit.user', defaultMessage: "edit profile" },
      'menu.edit.organization': { id: 'menu.edit.organization', defaultMessage: "edit organization" },
      'menu.edit.event': { id: 'menu.edit.event', defaultMessage: "edit event" }
    })
  }

  onscroll(e) {
    const top = e.target.scrollingElement.scrollTop;
    const selectedMenuItem = this.state.menuItems.find(menuItem => {
      return menuItem.position && menuItem.position > (top);
    })
    if (selectedMenuItem) {
      history.replaceState(undefined, undefined, (selectedMenuItem.anchor === this.state.menuItems[0].anchor) ? '#' : `#${selectedMenuItem.anchor}`);
      this.setState({ selectedAnchor: selectedMenuItem.anchor });
    }
  }

  handleChange(status) {
    this.setState({ sticky: status.status === Sticky.STATUS_FIXED });
  }

  componentDidMount() {
    window.onscroll = throttle(this.onscroll, 300);
    const { collective } = this.props;
    const { menuItems } = this.state;
    if (!collective) {
      console.error(">>> this is a weird error, collective should always be set", this.props);
      return;
    }

    const menuItemsFoundOnPage = [];
    uniqBy(document.querySelectorAll('section'), el => el.id).forEach((el, index) => {
      if (!el.id) return;
      const menuItem = {
        anchor: el.id,
        link: `#${el.id}`,
        position: el.offsetTop
      };
      menuItemsFoundOnPage.push(menuItem);
    })

    // If we don't find the sections on the page, we link the logo to the homepage instead of #top
    let logoLink;

    if (menuItemsFoundOnPage.length > 0) {
      logoLink = '#top';
      menuItemsFoundOnPage.sort((a, b) => {
        return a.position > b.position;
      });
      this.setState({ menuItems: menuItemsFoundOnPage, logoLink });
    }
  }

  // Render Contribute and Submit Expense buttons
  renderButtons() {
    const { collective, cta } = this.props;
    const offset = -this.height;
    return (
      <div className="buttons">
        <style jsx>{`
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
          border-color: ${colors.blue}
        }

        `}</style>
        { this.state.sticky && cta &&
          <Link route={cta.href} animate={{offset}}>
            <Button className="blue">{cta.label}</Button>
          </Link>
        }
        { ["COLLECTIVE", "EVENT"].indexOf(collective.type) !== -1  &&
          <Button className="submitExpense darkBackground" href={`${collective.path}/expenses/new`}><FormattedMessage id="menu.submitExpense" defaultMessage="Submit Expense" /></Button>
        }
      </div>
    )
  }

  renderMenu() {
    const { intl, LoggedInUser, collective } = this.props;
    const offset = -this.height; // offset for hashlink to leave room for the menu bar
    return (
      <div className="menu">
        <style jsx>{`
        .menu {
          display: flex;
          padding: 0;
          flex-direction: row;
          justify-content: space-evenly;
        }
        .item {
          color: #FAFAFA;
          font-family: Rubik;
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
        .icon {
          height: 24px;
          width: 24px;
          border-radius: 4px;
          background-color: #393D40;
          float: left;
          background-repeat: no-repeat;
          background-position: center center;
          margin-top: 8px;
          margin-right: 8px;
        }
        .edit {
          background-image: url(/static/icons/edit.svg);
        }
        .separator {
          background-color: #393D40;
          width: 1px;
          height: 28px;
          float: left;
        }
        `}</style>
        { this.state.menuItems.map((item, index) =>
          <div className={`item ${item.anchor} ${this.state.selectedAnchor === item.anchor && 'selected'}`} key={`item-${index}-${item.link}`}>
            <Link route={item.link} animate={{offset}}>
              { this.messages[item.anchor] ? intl.formatMessage(this.messages[item.anchor]): item.anchor }
            </Link>
          </div>
        )}
        { LoggedInUser && LoggedInUser.canEditCollective(collective) &&
          <div className="admin">
            { ["USER", "ORGANIZATION"].indexOf(collective.type) !== -1 &&
              <div className="item transactions">
                <Link route={`${collective.path}/transactions`}>
                  <FormattedMessage id="menu.transactions" defaultMessage="transactions" />
                </Link>
              </div>
            }
            <div className="separator" />
            <div className="item editCollective">
              <Link route={`${collective.path}/edit`}>
                <div className="icon edit" />
                { intl.formatMessage(this.messages[`menu.edit.${collective.type.toLowerCase()}`])}
              </Link>
            </div>
          </div>
        }
      </div>
    )
  }

  render() {
    const { collective, cta } = this.props;
    const { logoLink } = this.state;

    if (!collective) {
      return (<div />);
    }

    return (
      <div className="MenuBar">
        <style jsx>{`
        .MenuBar {
          background-color: #17181A;
          overflow: hidden;
        }

        .stickyBar {
          background-color: #17181A;
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
        <style jsx global>{`
        .sticky-outer-wrapper {
          width: 100%;
        }
        .sticky-inner-wrapper {
          z-index: 2000;
          overflow: hidden;
          background-color: #17181A;
        }
        .MenuBar .item a {
          color: #AAAEB3;
        }
        .MenuBar .item a:hover {
          color: white;
        }

        .MenuBar .selected a {
          color: #FAFAFA;
          font-weight: 500;
        }

        .MenuBar .buttons button {
          margin-left: 1rem;
        }

        .MenuBar .logo img {
          height: 64px;
        }
        .USER .MenuBar .mobileOnly .innerMenu, .ORGANIZATION .MenuBar .mobileOnly .innerMenu {
          display: flex;
          align-items: center;
        }
        .MenuBar .mobileOnly .logo img {
          height: 48px;
        }
        `}</style>
        <div className="mobileOnly">
          <div className="innerMenu">
            <div className="actionBar">
              <Sticky enabled={true} top={0} onStateChange={this.handleChange}>
                <div className="stickyBar">
                  <div className="row1">
                    <div className="pullRight">
                      { this.renderButtons() }
                    </div>
                    <div className="logo">
                      <Link route={logoLink} key={logoLink}><Logo src={collective.image} type='COLLECTIVE' /></Link>
                    </div>
                  </div>
                </div>
              </Sticky>
            </div>
            <div className="menu">
              { this.renderMenu() }
            </div>
          </div>
        </div>
        <div className="desktopOnly mediumScreenOnly">
          <Sticky enabled={true} top={0} onStateChange={this.handleChange}>
            <div className="stickyBar">
              <div className="content">
                <div className="pullRight">
                  { this.renderButtons() }
                </div>
                <div className="logo">
                  <Link route={logoLink} key={logoLink}><Logo src={collective.image} type='COLLECTIVE' /></Link>
                </div>
                <div className="pullLeft menu">
                  { this.renderMenu() }
                </div>
              </div>
            </div>
          </Sticky>
        </div>
      </div>
    )
  }

}

export default withIntl(MenuBar);