/**
 * Implement the colors from https://www.figma.com/file/1jyGC3MjtqI7uUsGf1447P/DS-03-%2F-Colors?node-id=1146%3A643
 */

const ocBrandColors = {
  900: '#0C2D66',
  800: '#1041A3',
  700: '#1153D6',
  600: '#1869F5',
  500: '#297EFF',
  400: '#5CA3FF',
  300: '#8FC7FF',
  200: '#C2E2FF',
  100: '#E5F3FF',
  50: '#F5FAFF',
};

const defaultColors = {
  /** White */
  white: {
    full: '#FFFFFF',
    transparent: {
      72: 'rgba(255, 255, 255, 0.72)',
      48: 'rgba(255, 255, 255, 0.48)',
    },
  },
  /** Black, neutral */
  black: {
    900: '#141415',
    800: '#323334',
    700: '#4D4F51',
    600: '#75777A',
    500: '#9EA0A3',
    400: '#C3C6CB',
    300: '#DCDDE0',
    200: '#EAEAEC',
    100: '#F1F2F3',
    50: '#F9FAFB',
    transparent: {
      90: 'rgba(19, 20, 20, 0.90)',
      80: 'rgba(19, 20, 20, 0.80)',
      40: 'rgba(19, 20, 20, 0.4)',
      20: 'rgba(19, 20, 20, 0.2)',
      8: 'rgba(19, 20, 20, 0.08)',
    },
  },
  /** Primary */
  primary: ocBrandColors,
  /** Info - right now the colors are the same as primary */
  blue: ocBrandColors,
  /** Success, Approve */
  green: {
    900: '#04391D',
    800: '#07582D',
    700: '#256643',
    600: '#128145',
    500: '#0EA755',
    400: '#51E094',
    300: '#90F0BD',
    200: '#BEFADA',
    100: '#E6FAEF',
    50: '#F2FFF8',
  },
  /** Warning, Alert */
  yellow: {
    900: '#5C5C0B',
    800: '#858510',
    700: '#ADAD23',
    600: '#CCCC18',
    500: '#E0E01B',
    400: '#EBEB2F',
    300: '#F5F576',
    200: '#FAFAAA',
    100: '#FFFFC2',
    50: '#FFFFEB',
  },

  /** Danger, Error */
  red: {
    900: '#521022',
    800: '#7A0F2B',
    700: '#A32143',
    600: '#CC2955',
    500: '#DC416A',
    400: '#F55882',
    300: '#FA82A2',
    200: '#FFC2D2',
    100: '#FFEBF0',
    50: '#FFF7F9',
  },
  purple: {
    900: '#180C66',
    800: '#3220A3',
    700: '#4B3BB8',
    600: '#5C48E0',
    500: '#6F5AFA',
    400: '#8C7AFF',
    300: '#B8ADFF',
    200: '#D7D1FF',
    100: '#EDEBFF',
    50: '#F6F5FF',
  },
};

export default defaultColors;
