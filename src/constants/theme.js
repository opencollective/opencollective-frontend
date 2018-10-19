export default {
  buttons: {
    standard: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #DCDEE0',
      borderRadius: '100px',
      color: '#76777A',

      '&:hover': {
        border: '1px solid #99C2FF',
        color: '#66A3FF',
      },

      '&:active': {
        backgroundColor: '#3385FF',
        border: '1px solid #3385FF',
        color: '#FFFFFF',
      },

      '&:disabled': {
        backgroundColor: '#F7F8FA',
        border: '1px solid #E8E9EB',
        color: '#DCDEE0',
      },
    },

    primary: {
      backgroundColor: '#3385FF',
      borderRadius: '100px',
      color: '#FFFFFF',

      '&:hover': {
        backgroundColor: '#66A3FF',
        color: '#FFFFFF',
      },

      '&:active': {
        backgroundColor: '#145ECC',
        color: '#FFFFFF',
      },

      '&:disabled': {
        backgroundColor: '#DBECFF',
      },
    },
  },
};
