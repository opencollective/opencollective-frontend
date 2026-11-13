/**
 * Dark variant of the legacy (styled-components) colors, used by the dashboard when dark mode is enabled.
 * Mirrors the Tailwind dark palette defined in `public/static/styles/app.css`:
 * - `white` is the base surface and the `black` (neutral) scale is inverted.
 * - Light tints (50-300) become subtle tints of the surface, mid tones (400-600) are kept and dark shades (700-900)
 *   become their light counterparts.
 */
import type defaultColors from './colors';

const primary = {
  900: '#E5F3FF',
  800: '#C2E2FF',
  700: '#8FC7FF',
  600: '#1869F5',
  500: '#297EFF',
  400: '#5CA3FF',
  300: '#284573',
  200: '#253756',
  100: '#222E41',
  50: '#212935',
};

const darkColors: typeof defaultColors = {
  white: {
    full: '#1E1F22',
    transparent: {
      72: 'rgba(30, 31, 34, 0.72)',
      48: 'rgba(30, 31, 34, 0.48)',
    },
  },
  black: {
    900: '#E6EDF8',
    800: '#D4DBE6',
    700: '#C1C8D2',
    600: '#ABB2BB',
    500: '#8F969F',
    400: '#696F78',
    300: '#454B53',
    200: '#343A42',
    100: '#292E36',
    50: '#22272E',
    transparent: {
      90: 'rgba(229, 236, 246, 0.90)',
      80: 'rgba(229, 236, 246, 0.80)',
      40: 'rgba(229, 236, 246, 0.4)',
      20: 'rgba(229, 236, 246, 0.2)',
      8: 'rgba(229, 236, 246, 0.08)',
    },
  },
  primary,
  blue: primary,
  green: {
    900: '#E6FAEF',
    800: '#BEFADA',
    700: '#90F0BD',
    600: '#128145',
    500: '#0EA755',
    400: '#51E094',
    300: '#285238',
    200: '#264030',
    100: '#23332B',
    50: '#212B28',
  },
  yellow: {
    900: '#FFFFC2',
    800: '#FAFAAA',
    700: '#F5F576',
    600: '#CCCC18',
    500: '#E0E01B',
    400: '#EBEB2F',
    300: '#646633',
    200: '#4A4C2F',
    100: '#383A2B',
    50: '#2E3028',
  },
  red: {
    900: '#FFEBF0',
    800: '#FFC2D2',
    700: '#FA82A2',
    600: '#CC2955',
    500: '#DC416A',
    400: '#F55882',
    300: '#66323E',
    200: '#4C2C34',
    100: '#3A272D',
    50: '#302429',
  },
  purple: {
    900: '#EDEBFF',
    800: '#D7D1FF',
    700: '#B8ADFF',
    600: '#5C48E0',
    500: '#6F5AFA',
    400: '#8C7AFF',
    300: '#3B3972',
    200: '#303155',
    100: '#282A41',
    50: '#242635',
  },
};

export default darkColors;
