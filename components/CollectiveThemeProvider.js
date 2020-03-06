import React from 'react';
import PropTypes from 'prop-types';
import { get, throttle } from 'lodash';
import memoizeOne from 'memoize-one';
import { darken, lighten } from 'polished';
import { ThemeProvider } from 'styled-components';
import { isHexColor } from 'validator';

import defaultTheme, { generateTheme } from '../lib/theme';

/**
 * A special `ThemeProvider` that plugs the custom collective theme, defined by the color
 * from `collective.settings.collectivePage.primaryColor`.
 */
export default class CollectiveThemeProvider extends React.PureComponent {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    collective: PropTypes.shape({
      settings: PropTypes.shape({
        collectivePage: PropTypes.shape({
          primaryColor: PropTypes.string,
        }),
      }),
    }),
  };

  state = { newPrimaryColor: null };

  getTheme = memoizeOne(primaryColor => {
    if (!primaryColor) {
      return defaultTheme;
    } else if (!isHexColor(primaryColor)) {
      console.warn(`Invalid custom color: ${primaryColor}`);
      return defaultTheme;
    } else {
      return generateTheme({
        colors: {
          ...defaultTheme.colors,
          primary: {
            900: darken(0.15, primaryColor),
            800: darken(0.1, primaryColor),
            700: darken(0.05, primaryColor),
            600: darken(0.025, primaryColor),
            500: primaryColor,
            400: lighten(0.1, primaryColor),
            300: lighten(0.15, primaryColor),
            200: lighten(0.2, primaryColor),
            100: lighten(0.25, primaryColor),
            50: lighten(0.3, primaryColor),
          },
        },
      });
    }
  });

  onPrimaryColorChange = throttle(newPrimaryColor => {
    this.setState({ newPrimaryColor });
  }, 2000);

  render() {
    const { collective, children } = this.props;
    const primaryColor = this.state.newPrimaryColor || get(collective, 'settings.collectivePage.primaryColor');
    return (
      <ThemeProvider theme={this.getTheme(primaryColor)}>
        {typeof children === 'function' ? (
          children({ onPrimaryColorChange: this.onPrimaryColorChange })
        ) : (
          <React.Fragment>{children}</React.Fragment>
        )}
      </ThemeProvider>
    );
  }
}
