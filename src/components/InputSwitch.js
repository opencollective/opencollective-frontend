import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Switch from '@material-ui/core/Switch';

const styles = () => ({
  colorSwitchBase: {
    '&$colorChecked': {
      color: '#3385ff',
      '& + $colorBar': {
        backgroundColor: '#3385ff',
      },
    },
  },
  colorBar: {},
  colorChecked: {},
});

const InputSwitch = ({ classes, ...props }) => {
  return (
    <Switch
      classes={{
        switchBase: classes.colorSwitchBase,
        checked: classes.colorChecked,
        bar: classes.colorBar,
      }}
      {...props}
    />
  );
};

export default withStyles(styles)(InputSwitch);
