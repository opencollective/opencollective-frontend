import React from 'react';
import PropTypes from 'prop-types';
import colors from '../constants/colors';

class TicketController extends React.Component {

  static propTypes = {
    value: PropTypes.number,
    className: PropTypes.object,
    onChange: PropTypes.func
  }

  constructor(props) {
    super(props);
  }

  changeValue(delta) {
    const newValue = Math.max(this.props.value + delta, 1);
    this.props.onChange(newValue);
  }

  render() {

    return (
      <div className="TicketController">
        <style jsx>{`
        .TicketController {
          width: 100%;
          height: 100%;
          background: ${colors.lightgray};
          color: ${colors.darkgray};
        }
        .TicketController > div {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          height: 100%;
          max-width: 400px;
          text-transform: uppercase;
          font-weight: bold;
          font-size: 1.7rem;
        }
        .btn {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 3rem;
          height: 100%;
          font-size: 1.7rem;
          cursor: pointer;
        }
        .TicketController:hover .btn {
          color: ${colors.gray};
        }
        `}</style>
        <div className={this.props.className}>
          <div className="btn decrease" onClick={() => this.changeValue(-1)}>-</div>
          {this.props.value} ticket{this.props.value > 1 ? 's' : ''}
          <div className="btn increase" onClick={() => this.changeValue(1)}>+</div>
        </div>
      </div>
    );
  }
}

export default TicketController;
