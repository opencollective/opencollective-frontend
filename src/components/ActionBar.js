import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import colors from '../constants/colors';

class ActionBar extends React.Component {

  static propTypes = {
    actions: PropTypes.arrayOf(PropTypes.object).isRequired,
    info: PropTypes.node
  }

  render() {
    return (
      <div className="ActionBar">
        <style jsx>{`
        .ActionBar {
          box-shadow: 0px 2px 4px rgba(0,0,0,.1);
          border-top: 1px solid #E6E6E6;
          border-bottom: 1px solid #E6E6E6;
        }

        .content {
          display: flex;
          padding: 0;
          flex-direction: row;
        }

        .info {
          float: left;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          font-size: 1.2rem;
          height: 60px;
          border-left: 1px solid #E6E6E6;
          border-right: 1px solid #E6E6E6;
        }

        .info :global(a) {
          color: #797d80;
          text-decoration: none;
        }

        .buttons {
          display: flex;
          width: 100%;
          justify-content: center;
          height: 6rem;
        }

        .buttons :global(button) {
          border-right: 1px solid #E6E6E6;
          cursor: pointer;
        }

        @media(max-width: 600px) {

          .content {
            flex-direction: column;
          }

          .info {
            border-bottom: 1px solid #E6E6E6;
            border-right: none;
          }
        }
        `}
        </style>
        <div className="content">
          <div className="info">
            {this.props.info}
          </div>
          <div className="buttons">
          {this.props.actions.map((action, index) =>
            <Button
              key={`actionItem${index}`}
              style={{borderColor: colors.lightgray}}
              className={action.className}
              style={action.className === 'selected' ? { color: colors.green } : {}}
              label={action.label}
              icon={action.icon}
              onClick={() => action.onClick && action.onClick()}
              >{action.component}</Button> 
          )}
          </div>
        </div>
      </div>
    )
  }

}

export default ActionBar;