import React from 'react';
import { css } from 'glamor';
import Button from './Button';
import colors from '../constants/colors';

const styles = {
  actions: css({
    display: 'flex',
    width: '100%',
    justifyContent: 'center',
    height: '60px',
    boxShadow: '0px 2px 4px rgba(0,0,0,.1)',
    '& button': {
      border: '1px solid transparent',
      borderRight: `1px solid ${colors.lightgray}`
    },
    '& button:first-of-type ': {
      borderLeft: `1px solid ${colors.lightgray}`
    }
  })
}

class ActionBar extends React.Component {

  static propTypes = {
    actions: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
  }

  render() {
    return (
      <div className={styles.actions}>
        {this.props.actions.map((action, index) =>
          <Button key={`actionItem${index}`} className={action.className} label={action.label} onClick={() => action.onClick()}>
          {action.component}
          </Button> 
        )}
      </div>
    )
  }

}

export default ActionBar;