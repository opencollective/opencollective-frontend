import React from 'react';
import { css } from 'glamor';
import Button from './Button';

const styles = {
  actions: css({
    display: 'flex',
    width: '100%',
    justifyContent: 'center',
    height: '40px' 
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