import React from 'react';
import { css } from 'glamor';
import colors from '../constants/colors';

const styles = {
  bar: css({
    width: '100%',
    height: '100%',
    '&>div': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      maxWidth: '400px',
      background: colors.lightgray,
      padding: '10px',
      color: colors.darkgray,
      textTransform: 'uppercase',
      fontWeight: 'bold',
      fontSize: '12px',
    },
    '& .btn': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '30px',
      height: '100%',
      cursor: 'pointer'
    }
  })
};


class TicketsCtrl extends React.Component {

  static propTypes = {
    value: React.PropTypes.number,
    className: React.PropTypes.object,
    onChange: React.PropTypes.func
  }

  constructor(props) {
    super(props);
    this.state = { value: props.value || 1 };
  }

  changeValue(delta) {
    const newValue = this.state.value + delta;
    this.setState({ value: newValue });
    this.props.onChange(newValue);
  }

  render() {

    return (
      <div className={styles.bar}>
        <div className={this.props.className}>
          <div className="btn" onClick={() => this.changeValue(-1)}>-</div>
          {this.state.value} ticket{this.state.value > 1 ? 's' : ''}
          <div className="btn" onClick={() => this.changeValue(1)}>+</div>
        </div>
      </div>
    );
  }
}

export default TicketsCtrl;