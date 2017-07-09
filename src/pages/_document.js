
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
      stripe: "https://js.stripe.com/v2/",
      google: "https://maps.googleapis.com/maps/api/js?key=AIzaSyCRLIexl7EkMQk_0_yNsjO4Vqb_MccD-RI&libraries=places"
    };

    const page = this.props.__NEXT_DATA__.pathname.substr(1);
    let requiredScripts = ['intl'];
    if (['createEvent', 'event', 'editEvent'].indexOf(page) !== -1) {
      requiredScripts = Object.keys(scriptsUrls);
    }

    const scripts = [];
    requiredScripts.forEach(script => scripts.push(scriptsUrls[script]));

    return (
      <html>
        <Head />
        <body>
          <Main />
          {scripts.map((script) => <script type="text/javascript" src={script} />)}
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