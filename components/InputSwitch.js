import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Switch from '@material-ui/core/Switch';

export default withStyles({
  switchBase: {
    '&$checked': {
      color: '#3385ff',
    },
    '&$checked + $track': {
      backgroundColor: '#3385ff',
    },
  },
  checked: {},
  track: {},
})(props => {
  return <Switch color="default" {...props} />;
});
