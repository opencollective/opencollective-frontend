import React from 'react';
import Switch from '@mui/material/Switch';
import { withStyles } from '@mui/styles';

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
