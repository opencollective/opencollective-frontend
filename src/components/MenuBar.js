import React from 'react';
import PropTypes from 'prop-types';
import colors from '../constants/colors';
import HashLink from 'react-scrollchor';
import Logo from './Logo';

class MenuBar extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired
  }

  render() {
    const { collective } = this.props;

    const menuItems = [
      'about', 'events', 'updates', 'budget', 'backers', 'sponsors'
    ];

    return (
      <div className="MenuBar">
        <style jsx>{`
        .MenuBar {
          background-color: #F5F8FF;
          height: 8rem;
        }

        .item {
          color: #666F80;
          font-family: Rubik;
          font-size: 14px;
          line-height: 17px;
          margin: 32px;
        }

        .content {
          display: flex;
          padding: 0;
          flex-direction: row;
        }

        .logo {
          height: 64px;
          margin: 8px;
        }

        .allcaps {
          text-transform: uppercase;
        }

        @media(max-width: 600px) {
          .content {
            flex-direction: column;
          }
          .item:first {
            border-bottom: 1px solid #E6E6E6;
            border-right: none;
          }
        }
        `}
        </style>
        <style jsx global>{`
        .MenuBar .item a {
          color: #666F80;
        }

        .MenuBar .selected a {
          color: #2E8AE6;
          font-weight: 500;
        }        
        `}</style>
        <div className="content">
          <div className="logo">
            <Logo src={collective.image} type='COLLECTIVE' height={64} />
          </div>
          {menuItems.map((item, index) =>
            <div className={`item ${item}`} key={`item-${index}`}>
              <HashLink to={item}>
                {item}
              </HashLink>
            </div>
          )}
        </div>
      </div>
    )
  }

}

export default MenuBar;