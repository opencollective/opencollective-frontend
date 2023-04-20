import React from 'react';
import { withStyles } from '@mui/material/styles';
import Switch from '@mui/material/Switch';

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
