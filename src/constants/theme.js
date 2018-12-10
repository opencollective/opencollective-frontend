import { variant } from 'styled-system';

export const colors = {
  black: {
    900: '#141414',
    800: '#313233',
    700: '#4E5052',
    600: '#76777A',
    500: '#9D9FA3',
    400: '#C4C7CC',
    300: '#DCDEE0',
    200: '#E8E9EB',
    100: '#F2F3F5',
    50: '#F7F8FA',
    transparent: {
      80: 'rgba(19, 20, 20, 0.80)',
      40: 'rgba(19, 20, 20, 0.4)',
      20: 'rgba(19, 20, 20, 0.2)',
      8: 'rgba(19, 20, 20, 0.08)',
    },
  },
  green: {
    700: '#00A34C',
    500: '#00B856',
    300: '#6CE0A2',
    100: '#E6FAEF',
  },
  primary: {
    700: '#145ECC',
    500: '#3385FF',
    400: '#66A3FF',
    300: '#99C9FF',
    200: '#DBECFF',
    100: '#EBF4FF',
    50: '#F2F8FF',
  },
  red: {
    700: '#CC1836',
    500: '#F53152',
    300: '#FF99AA',
    100: '#FFF2F4',
  },
  secondary: {
    700: '#9BC200',
    500: '#AFDB00',
    400: '#D3E58A',
    100: '#F2FAD2',
  },
  white: {
    full: '#FFFFFF',
    transparent: {
      72: 'rgba(255, 255, 255, 0.72)',
      48: 'rgba(255, 255, 255, 0.48)',
    },
  },
  yellow: {
    700: '#E0B700',
    500: '#F5CC00',
    300: '#FFEB85',
    100: '#FFFBE5',
  },
};

const fontSizes = {
  H1: 52,
  H2: 40,
  H3: 32,
  H4: 24,
  H5: 20,
  H6: 9,
  LeadParagraph: 16,
  Paragraph: 14,
  Caption: 12,
  Tiny: 10,
};

const lineHeights = {
  H1: '56px',
  H2: '44px',
  H3: '36px',
  H4: '32px',
  H5: '24px',
  H6: '14px',
  LeadParagraph: '24px',
  Paragraph: '20px',
  Caption: '18px',
  Tiny: '14px',
};

// using default space values from styled-system
const space = [0, 4, 8, 16, 32, 64, 128, 256, 512];

const theme = {
  colors,
  fontSizes,
  lineHeights,
  space,
  buttons: {
    standard: {
      backgroundColor: 'white',
      border: '1px solid',
      borderColor: colors.black[300],
      borderRadius: '100px',
      color: colors.black[600],

      '&:hover': {
        borderColor: colors.primary[300],
        color: colors.primary[400],
      },

      '&:active': {
        backgroundColor: colors.primary[500],
        borderColor: colors.primary[500],
        color: 'white',
      },

      '&:disabled': {
        backgroundColor: colors.black[50],
        borderColor: colors.black[200],
        color: colors.black[300],
        cursor: 'not-allowed',
      },
    },

    primary: {
      backgroundColor: colors.primary[500],
      borderRadius: '100px',
      color: 'white',

      '&:hover': {
        backgroundColor: colors.primary[400],
        color: 'white',
      },

      '&:active': {
        backgroundColor: colors.primary[700],
        color: 'white',
      },

      '&:disabled': {
        backgroundColor: colors.primary[200],
        cursor: 'not-allowed',
      },
    },
  },
  buttonSizes: {
    large: {
      fontSize: toPx(fontSizes.LeadParagraph),
      paddingBottom: toPx(space[3]),
      paddingLeft: toPx(space[5]),
      paddingRight: toPx(space[5]),
      paddingTop: toPx(space[3]),
    },

    medium: {
      fontSize: toPx(fontSizes.Paragraph),
      paddingBottom: toPx(space[2]),
      paddingLeft: toPx(space[3]),
      paddingRight: toPx(space[3]),
      paddingTop: toPx(space[2]),
    },

    small: {
      fontSize: toPx(fontSizes.Caption),
      paddingBottom: toPx(space[1]),
      paddingLeft: toPx(space[2]),
      paddingRight: toPx(space[2]),
      paddingTop: toPx(space[1]),
    },
  },
};

export const buttonStyle = variant({
  key: 'buttons',
  prop: 'buttonStyle',
});

export const buttonSize = variant({
  key: 'buttonSizes',
  prop: 'buttonSize',
});

export default theme;

function toPx(value) {
  return `${value}px`;
}
