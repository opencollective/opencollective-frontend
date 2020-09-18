import { desaturate, lighten } from 'polished';
import { variant } from 'styled-system';

import { getTopToBottomGradient } from '../helpers';

// Button size

export const buttonSize = variant({
  key: 'buttonSizes',
  prop: 'buttonSize',
});

export const getButtonSizes = () => {
  return {
    xLarge: {
      fontSize: 17,
      lineHeight: '18px',
      paddingBottom: 22,
      paddingLeft: 48,
      paddingRight: 48,
      paddingTop: 22,
    },

    large: {
      fontSize: '16px',
      lineHeight: '17px',
      paddingBottom: 18,
      paddingLeft: 40,
      paddingRight: 40,
      paddingTop: 18,
    },

    medium: {
      fontSize: '14px',
      lineHeight: '17px',
      paddingBottom: 14,
      paddingLeft: 24,
      paddingRight: 24,
      paddingTop: 14,
    },

    small: {
      fontSize: '13px',
      lineHeight: '21px',
      paddingBottom: 11,
      paddingLeft: 20,
      paddingRight: 20,
      paddingTop: 11,
    },

    tiny: {
      fontSize: '12px',
      lineHeight: '12px',
      letterSpacing: 0,
      paddingBottom: 5,
      paddingLeft: 14,
      paddingRight: 14,
      paddingTop: 5,
    },
  };
};

// Button style

export const buttonStyle = variant({
  key: 'buttons',
  prop: 'buttonStyle',
});

/**
 * Generates a variant for a `buttonStyle`
 */
const generateButtonVariant = ({
  baseColor,
  baseGradientColor = baseColor,
  baseTextColor = '#FFFFFF',
  hoverColor,
  hoverGradientColor = hoverColor,
  activeColor,
  disabledColor,
  outlineColor = '#90F0BD',
}) => {
  return {
    background: getTopToBottomGradient(baseColor, baseGradientColor),
    backgroundColor: baseColor, // Not all browsers support gradients, this is a fallback for them
    borderColor: baseColor,
    color: baseTextColor,

    '&:focus': {
      boxShadow: `0px 0px 0px 2px ${outlineColor}`,
    },

    '&:hover': {
      background: getTopToBottomGradient(hoverColor, hoverGradientColor),
      backgroundColor: hoverColor,
      borderColor: hoverColor,
      color: baseTextColor,
    },

    '&:active': {
      background: activeColor,
      backgroundColor: activeColor,
      borderColor: activeColor,
    },

    '&:disabled': {
      background: disabledColor,
      backgroundColor: disabledColor,
      borderColor: disabledColor,
      color: baseTextColor,
    },
  };
};

/**
 * Similar to generateButtonVariant, but to generate secondary buttons
 */
const generateSecondaryButtonVariant = ({
  baseColor,
  baseTextColor,
  hoverColor,
  activeColor,
  disabledColor,
  disabledBorderColor = disabledColor,
  outlineColor = '#90F0BD',
}) => {
  return {
    background: '#FFFFFF',
    backgroundColor: '#FFFFFF', // Not all browsers support gradients, this is a fallback for them
    borderColor: baseColor,
    color: baseTextColor,

    '&:focus': {
      boxShadow: `0px 0px 0px 2px ${outlineColor}`,
    },

    '&:hover:not(:disabled):not(:active)': {
      background: hoverColor,
    },

    '&:active': {
      background: activeColor,
      backgroundColor: activeColor,
      borderColor: activeColor,
      color: '#FFFFFF',
    },

    '&:disabled': {
      borderColor: disabledBorderColor,
      color: disabledColor,
    },
  };
};

/**
 * Generate buttons styles based on the colors defined in https://www.figma.com/file/1jyGC3MjtqI7uUsGf1447P/%5BDS%5D-01-Colors?node-id=1354%3A2
 */
export const getButtonStyles = ({ colors }) => {
  return {
    // Base
    standard: {
      backgroundColor: 'white',
      borderColor: colors.black[300],
      color: colors.black[700],

      '&:hover': {
        borderColor: colors.primary[300],
      },

      '&:focus': {
        backgroundColor: 'white',
        borderColor: colors.primary[400],
        boxShadow: '0px 0px 0px 2px #90F0BD',
      },

      '&:active': {
        background: colors.primary[700],
        backgroundColor: colors.primary[700],
        borderColor: colors.primary[700],
        color: 'white',
      },

      '&:disabled': {
        backgroundColor: 'white',
        borderColor: colors.black[200],
        color: colors.black[300],
      },
    },

    primary: generateButtonVariant({
      baseColor: colors.primary[600],
      baseGradientColor: lighten(0.025, colors.primary[700]),
      hoverColor: colors.primary[500],
      hoverGradientColor: colors.primary[600],
      activeColor: colors.primary[800],
      disabledColor: colors.primary[100],
    }),

    secondary: generateSecondaryButtonVariant({
      baseColor: colors.primary[500],
      baseTextColor: colors.primary[600],
      hoverColor: colors.primary[50],
      activeColor: colors.primary[700],
      disabledColor: desaturate(0.4, colors.primary[200]),
    }),

    // Warning (yellow)

    warning: generateButtonVariant({
      baseColor: colors.yellow[500],
      baseGradientColor: colors.yellow[600],
      hoverColor: colors.yellow[400],
      hoverGradientColor: colors.yellow[600],
      activeColor: colors.yellow[700],
      disabledColor: desaturate(0.2, colors.yellow[200]),
    }),

    warningSecondary: generateSecondaryButtonVariant({
      baseColor: colors.yellow[600],
      baseTextColor: colors.yellow[700],
      hoverColor: colors.yellow[50],
      activeColor: colors.yellow[600],
      disabledColor: desaturate(0.4, colors.yellow[200]),
    }),

    // Danger (red)

    danger: generateButtonVariant({
      baseColor: colors.red[500],
      baseGradientColor: colors.red[600],
      hoverColor: colors.red[400],
      hoverGradientColor: colors.red[500],
      activeColor: colors.red[700],
      disabledColor: colors.red[100],
    }),

    dangerSecondary: generateSecondaryButtonVariant({
      baseColor: colors.red[400],
      baseTextColor: colors.red[500],
      hoverColor: colors.red[50],
      activeColor: colors.red[600],
      disabledColor: desaturate(0.4, colors.red[200]),
    }),

    // Success (green)

    success: generateButtonVariant({
      baseColor: colors.green[500],
      baseGradientColor: colors.green[600],
      hoverColor: colors.green[400],
      hoverGradientColor: colors.green[500],
      activeColor: colors.green[700],
      disabledColor: desaturate(0.1, colors.green[200]),
      outlineColor: colors.primary[500],
    }),

    successSecondary: generateSecondaryButtonVariant({
      baseColor: colors.green[400],
      baseTextColor: colors.green[500],
      hoverColor: colors.green[50],
      activeColor: colors.green[600],
      disabledColor: desaturate(0.4, colors.green[200]),
      outlineColor: colors.primary[500],
    }),

    // Dark

    dark: generateButtonVariant({
      baseColor: colors.black[800],
      baseGradientColor: colors.black[900],
      hoverColor: colors.black[700],
      hoverGradientColor: colors.black[800],
      activeColor: colors.black[900],
      disabledColor: colors.black[100],
    }),

    // Borderless (link)

    borderless: generateSecondaryButtonVariant({
      baseColor: 'transparent',
      baseTextColor: colors.black[700],
      hoverColor: colors.black[50],
      activeColor: colors.black[900],
      disabledColor: desaturate(0.4, colors.black[200]),
      disabledBorderColor: 'transparent',
    }),
  };
};
