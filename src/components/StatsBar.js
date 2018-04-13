import React from 'react';
import PropTypes from 'prop-types';
import colors from '../constants/colors';

class StatsBar extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired
  }

  render() {
    return (
      <div className="StatsBar">
        <style jsx>{`
        .StatsBar {
          background-color: #2E3033;
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
        <div className="content">
          <div className="item">
          </div>
        </div>
      </div>
    )
  }

}

export default StatsBar;
