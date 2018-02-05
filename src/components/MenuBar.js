import React from 'react';
import PropTypes from 'prop-types';
import colors from '../constants/colors';
import HashLink from 'react-scrollchor';
import Logo from './Logo';
import Sticky from 'react-stickynode';
import { FormattedMessage, defineMessages } from 'react-intl';
import Link from './Link';
import Button from './Button';
import { throttle } from 'lodash';

class MenuBar extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.onscroll = this.onscroll.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.height = 100;
    this.menuItems = [
      { anchor: 'about', position: 0 },
      { anchor: 'events', position: 0 },
      { anchor: 'updates', position: 0 },
      { anchor: 'budget', position: 0 },
      { anchor: 'contributors', position: 0 }
    ];
    this.state = { selectedAnchor: null, sticky: false };
    this.messages = defineMessages({
      'about': { id: 'collective.menu.about', defaultMessage: "about" },
      'events': { id: 'collective.menu.events', defaultMessage: "events" },
      'updates': { id: 'collective.menu.updates', defaultMessage: "updates" },
      'budget': { id: 'collective.menu.budget', defaultMessage: "budget" },
      'contributors': { id: 'collective.menu.contributors', defaultMessage: "contributors" }
    })
  }

  onscroll(e) {
    const top = e.target.scrollingElement.scrollTop;
    const selectedMenuItem = this.menuItems.find(menuItem => {
      return menuItem.position && menuItem.position > (top);
    })
    if (selectedMenuItem) {
      history.replaceState(undefined, undefined, `#${selectedMenuItem.anchor}`);
      this.setState({ selectedAnchor: selectedMenuItem.anchor });
    }
  }

  handleChange(status) {
    this.setState({ sticky: status.status === Sticky.STATUS_FIXED });
  }

  componentDidMount() {
    window.onscroll = throttle(this.onscroll, 300);
    const menuItems = [];
    this.menuItems.forEach((menuItem, index) => {
      const el = document.querySelector(`#${menuItem.anchor}`);
      if (!el) return;
      this.menuItems[index].position = el.offsetTop;
      menuItems.push(this.menuItems[index]);
    })
    this.menuItems = menuItems.sort((a, b) => {
      return a.position > b.position;
    })

    console.log(">>> this.menuItems", this.menuItems);
  }

  // Render Contribute and Submit Expense buttons
  renderButtons() {
    const { collective } = this.props;
    const offset = -this.height;
    return (
      <div className="buttons">
        <style jsx>{`
        .buttons {
          display: flex;
          padding: 5px;
          text-align: center;
          align-items: center;
        }
        `}</style>
        { this.state.sticky &&
          <HashLink to="contribute" animate={{offset}}>
            <Button className="blue">
              <FormattedMessage id="collective.menu.contribute" defaultMessage="Contribute" />
            </Button>
          </HashLink>
        }
        <Button href={`/${collective.slug}/expenses/new`}><FormattedMessage id="collective.menu.submitExpense" defaultMessage="Submit Expense" /></Button>
      </div>
    )
  }

  renderMenu() {
    const { LoggedInUser, collective } = this.props;
    const offset = -this.height; // offset for hashlink to leave room for the menu bar
    return (
      <div className="menu">
        <style jsx>{`
        .menu {
          display: flex;
          flex-direction: row;
          width: 100%;
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
          margin: 24px 5px;
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
        {this.menuItems.map((item, index) =>
          <div className={`item ${item.anchor} ${this.state.selectedAnchor === item.anchor && 'selected'}`} key={`item-${index}`}>
            <HashLink to={item.anchor} animate={{offset}}>
              {item.anchor}
            </HashLink>
          </div>
        )}
        { LoggedInUser && LoggedInUser.canEditCollective(collective) &&
          <div className="admin">
            <div className="separator" />
            <div className="item editCollective">
              <Link route={`/${collective.slug}/edit`}>
                <a>
                  <div className="icon edit" />
                  <FormattedMessage id="collective.menu.editCollective" defaultMessage="edit collective" />
                </a>
              </Link>
            </div>
          </div>
        }
      </div>
    )
  }

  render() {
    const { collective } = this.props;

    if (!collective) {
      return (<div />);
    }

    return (
      <div className="MenuBar">
        <style jsx>{`
        .MenuBar {
          background-color: #17181A;
        }

        .stickyBar {
          background-color: #17181A;
        }

        .content {
          display: flex;
          flex-direction: row;
          padding: 0;
          justify-content: space-between;
        }

        .pullLeft {
          display: flex;
          padding: 0;
          flex-direction: row;
        }

        .logo {
          height: 64px;
          min-width: 64px;
          margin: 12px;
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

        .pullRight {
          float: right;
          display: flex;
          min-height: 88px;
        }
        `}
        </style>
        <style jsx global>{`
        .sticky-outer-wrapper {
          width: 100%;
        }
        .sticky-inner-wrapper {
          z-index: 10;
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
          margin-right: 1rem;
        }

        .MenuBar .logo img {
          height: 64px;
        }
        .MenuBar .mobileOnly .logo img {
          height: 48px;
        }
        `}</style>
        <div className="mobileOnly">
          <div className="actionBar">
            <div className="logo">
              <Logo src={collective.image} type='COLLECTIVE' />
            </div>
            { this.renderButtons() }
          </div>
          <div className="menu">
            { this.renderMenu() }
          </div>
        </div>
        <div className="desktopOnly mediumScreenOnly">
          <Sticky enabled={true} top={0} onStateChange={this.handleChange}>
            <div className="stickyBar">
              <div className="content">
                <div className="pullLeft">
                  <div className="logo">
                    <Logo src={collective.image} type='COLLECTIVE' />
                  </div>
                  { this.renderMenu() }
                </div>
                <div className="pullRight">
                  { this.renderButtons() }
                </div>
              </div>
            </div>
          </Sticky>
        </div>
      </div>
    )
  }

}

export default MenuBar;