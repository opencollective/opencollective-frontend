
import Document, {Head, Main, NextScript} from 'next/document'

// The document (which is SSR-only) needs to be customized to expose the locale
// data for the user's locale for React Intl to work in the browser.
export default class IntlDocument extends Document {
  static async getInitialProps (context) {
    const props = await super.getInitialProps(context);
    const {req: {locale, localeDataScript}} = context;

    return {
      ...props,
      locale,
      localeDataScript
    }
  }

  render () {
    // Polyfill Intl API for older browsers
    const scriptsUrls = {
      intl: `https://cdn.polyfill.io/v2/polyfill.min.js?features=Intl.~locale.${this.props.locale}`,
      stripe: "https://js.stripe.com/v3/",
      google: "https://maps.googleapis.com/maps/api/js?key=AIzaSyCRLIexl7EkMQk_0_yNsjO4Vqb_MccD-RI&libraries=places"
    };

    const scripts = [];
    const page = this.props.__NEXT_DATA__.pathname.substr(1);
    const noScriptPages = ['nametags', 'events', 'events-iframe', 'collectives-iframe'];
    if (noScriptPages.indexOf(page) === -1) {
      const requiredScripts = Object.keys(scriptsUrls);
      requiredScripts.forEach(script => scripts.push(scriptsUrls[script]));
    }

    return (
      <html>
        <style jsx global>{`
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
            width: 100%;
            height: 100%;
            font-size: 62.5%;
          }
          body {
            height: 100%;
            margin: 0;
            padding: 0;
          }
          a:hover {
            color: #797d80;
            text-decoration: none;
          }
        `}</style>
        <Head />
        <body>
          <Main />
          {scripts.map((script) => <script type="text/javascript" src={script} />)}
          {/* TODO: use the official react-stripe-elements; this is ugly */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
              if (typeof Stripe !== "undefined") {
                const stripePublishableKey = (typeof window !== "undefined" && (window.location.hostname === 'localhost' || window.location.hostname === 'staging.opencollective.com')) ? 'pk_test_5aBB887rPuzvWzbdRiSzV3QB' : 'pk_live_qZ0OnX69UlIL6pRODicRzsZy';
                // eslint-disable-next-line
                stripe = Stripe(stripePublishableKey);
              }
              `
            }}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: this.props.localeDataScript
            }}
          />
          <NextScript />
        </body>
      </html>
    )
  }
}