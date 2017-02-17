import React from 'react';
import Button from './Button';
import colors from '../constants/colors';
import '../css/ActionBar.css';

class ActionBar extends React.Component {

  static propTypes = {
    actions: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    info: React.PropTypes.string
  }

  render() {
    return (
      <div className="ActionBar">
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
            onClick={() => action.onClick()}
            >{action.component}</Button> 
        )}
        </div>
      </div>
    )
  }

}

export default ActionBar;