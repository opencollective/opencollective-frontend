import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import colors from '../constants/colors';

class MenuBar extends React.Component {

  static propTypes = {
    actions: PropTypes.arrayOf(PropTypes.object).isRequired,
    info: PropTypes.node
  }

  render() {
    return (
      <div className="MenuBar">
        <style jsx>{`
        .MenuBar {
          box-shadow: 0px 2px 4px rgba(0,0,0,.1);
          border-top: 1px solid #E6E6E6;
          border-bottom: 1px solid #E6E6E6;
        }

        .content {
          display: flex;
          padding: 0;
          flex-direction: row;
        }

        .item {
          float: left;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 1rem;
          font-size: 1.4rem;
          width: 100%;
          height: 6rem;
          border-left: 1px solid #E6E6E6;
          border-right: 1px solid #E6E6E6;
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
        <div className="content">
          <div className="item">
            {this.props.info}
          </div>
          {this.props.actions.map((action, index) =>
            <div className="item">
              { action.onClick &&
                <a
                  key={`actionItem${index}`}
                  style={{borderColor: colors.lightgray}}
                  className={action.className}
                  style={action.className === 'selected' ? { color: colors.green } : {}}
                  label={action.label}
                  icon={action.icon}
                  onClick={() => action.onClick && action.onClick()}
                  >{action.component}</a>
              }
              { !action.onClick &&
                action.component
              }
            </div>
          )}
        </div>
      </div>
    )
  }

}

export default MenuBar;