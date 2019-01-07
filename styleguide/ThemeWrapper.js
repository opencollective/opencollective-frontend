import React, { Component, Fragment } from 'react';
import { ThemeProvider } from 'styled-components';
import theme from '../src/constants/theme';
import AppGlobalStyles from '../src/pages/global-styles';
import { createGlobalStyle } from 'styled-components';
import { IntlProvider } from 'react-intl';

const StyleguideGlobalStyles = createGlobalStyle`
  body {
    font-size: 14px;
  }
`;

export default class ThemeWrapper extends Component {
  render() {
    return (
      <Fragment>
        <AppGlobalStyles />
        <StyleguideGlobalStyles />
        <ThemeProvider theme={theme}>
          <IntlProvider locale="en">{this.props.children}</IntlProvider>
        </ThemeProvider>
      </Fragment>
    );
  }
}
