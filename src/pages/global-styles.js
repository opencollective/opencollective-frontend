import { injectGlobal } from 'styled-components';
import colors from '../constants/colors';

injectGlobal`
  @font-face {
    font-family: 'Inter UI';
    font-style:  normal;
    font-weight: 400;
    src: url('/static/fonts/inter-ui/Inter-UI-Regular.woff2') format('woff2'),
    url('/static/fonts/inter-ui/Inter-UI-Regular.woff') format('woff');
  }

  @font-face {
    font-family: 'Inter UI';
    font-style:  italic;
    font-weight: 400;
    src: url('/static/fonts/inter-ui/Inter-UI-Italic.woff2') format('woff2'),
    url('/static/fonts/inter-ui/Inter-UI-Italic.woff') format('woff');
  }

  @font-face {
    font-family: 'Inter UI';
    font-style:  normal;
    font-weight: 500;
    src: url('/static/fonts/inter-ui/Inter-UI-Medium.woff2') format('woff2'),
    url('/static/fonts/inter-ui/Inter-UI-Medium.woff') format('woff');
  }

  @font-face {
    font-family: 'Inter UI';
    font-style:  italic;
    font-weight: 500;
    src: url('/static/fonts/inter-ui/Inter-UI-MediumItalic.woff2') format('woff2'),
    url('/static/fonts/inter-ui/Inter-UI-MediumItalic.woff') format('woff');
  }

  @font-face {
    font-family: 'Inter UI';
    font-style:  normal;
    font-weight: 700;
    src: url('/static/fonts/inter-ui/Inter-UI-Bold.woff2') format('woff2'),
    url('/static/fonts/inter-ui/Inter-UI-Bold.woff') format('woff');
  }

  @font-face {
    font-family: 'Inter UI';
    font-style:  italic;
    font-weight: 700;
    src: url('/static/fonts/inter-ui/Inter-UI-BoldItalic.woff2') format('woff2'),
    url('/static/fonts/inter-ui/Inter-UI-BoldItalic.woff') format('woff');
  }

  @font-face {
    font-family: 'Inter UI';
    font-style:  normal;
    font-weight: 900;
    src: url('/static/fonts/inter-ui/Inter-UI-Black.woff2') format('woff2'),
    url('/static/fonts/inter-ui/Inter-UI-Black.woff') format('woff');
  }

  @font-face {
    font-family: 'Inter UI';
    font-style:  italic;
    font-weight: 900;
    src: url('/static/fonts/inter-ui/Inter-UI-BlackItalic.woff2') format('woff2'),
    url('/static/fonts/inter-ui/Inter-UI-BlackItalic.woff') format('woff');
  }

  @font-face {
    font-family: 'montserratlight';
    src: url('/static/fonts/montserrat/montserrat-light-webfont.eot');
    src: url('/static/fonts/montserrat/montserrat-light-webfont.eot?#iefix') format('embedded-opentype'),
      url('/static/fonts/montserrat/montserrat-light-webfont.woff2') format('woff2'),
      url('/static/fonts/montserrat/montserrat-light-webfont.woff') format('woff'),
      url('/static/fonts/montserrat/montserrat-light-webfont.ttf') format('truetype'),
      url('/static/fonts/montserrat/montserrat-light-webfont.svg#montserratlight') format('svg');
    font-weight: normal;
    font-style: normal;
  }

  @font-face {
    font-family: 'lato';
    src: url('/static/fonts/montserrat/lato-regular.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
  }

  html {
    --charcoal-grey-two: #373a3d;
    --charcoal-grey-three: #45484c;
    --main-custom-color: #8f47b3;
    --silver-four: #e1e4e6;
    --cool-grey: #9ea2a6;
    --attention: #e69900;
    --gunmetal: #505559;
    --fade-blue: #97B7F3;

    font-size: 62.5%;
    height: 100%;
    width: 100%;
  }

  body {
    font-family: 'Inter UI', 'lato', 'montserratlight', sans-serif;
    height: 100%;
    margin: 0;
    padding: 0;
  }

  a:hover {
    color: #797d80;
    text-decoration: none;
  }

  body.showModal {
    overflow: hidden;
  }

  body.showModal .EventPage {
    filter: blur(3px); background: rgba(0,0,0,0.6);
  }

  body > div:first-child {
    position: relative;
    min-height: 100%;
  }

  @media(max-width: 600px) {
    html {
      font-size: 55%;
    }
  }

  #root {
    height: 100%;
  }

  .EventPage {
    position: relative;
    height: 100%;
  }

  @media(max-width: 600px) {
    .showModal .EventPage {
      display: none;
    }
  }

  section {
    margin: 3rem 0px;
    overflow: hidden;
  }

  h1, h2, h3, h4 {
    font-family: 'Inter UI', 'lato','montserratlight', sans-serif;
  }

  h1 {
    text-align: center;
    margin: 40px 0px 20px;
    font-size: 1.8rem;
    font-weight: bold;
  }

  .map {
    border: 1px solid #eee;
    height: 300px;
    position: relative;
  }

  .map-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0);
  }

  .row {
    display: flex;
    flex-direction: row;
  }

  .btn-primary {
    background-color: ${colors.blue};
    border-color: ${colors.blue};
  }

  .clear {
    clear: both;
  }

  .pullLeft {
    float: left;
  }      

  .pullRight {
    float: right;
  }

  .hidden {
    display: none;
  }

  .mobileOnly {
    display: none;
  }

  .mediumScreenOnly {
    display: none;
  }

  .desktopOnly {
    display: none;
  }

  @media(min-width: 1024px) {
    .desktopOnly {
      display: inherit !important;
    }
  }

  @media(min-width: 420px) and (max-width: 1024px) {
    .mediumScreenOnly {
      display: inherit !important;
    }
  }

  @media(max-width: 420px) {
    .mobileOnly {
      display: inherit !important;
    }
  }
`;
