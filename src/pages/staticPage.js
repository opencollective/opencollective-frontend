import React from 'react';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import NewsletterContainer from '../components/NewsletterContainer';
import withIntl from '../lib/withIntl';
import Link from '../components/Link';

class StaticPage extends React.Component {

  static async getInitialProps(props) {
    const { path, pageSlug } = props.query;
    const filepath = `./static/${path || ''}/${pageSlug || 'index'}.md`.toLowerCase().replace('//','/');
    let content = await require(`${filepath}`);

    // we rewrite the links to be relative to root /
    if (path === 'faq') {
      content = content.replace(/href="(?!['"]?(?:data|http|\/))['"]?([^'")\s>]+)/g, 'href="/faq/$1');
    }

    // get the title from the html of the markdown
    // e.g. <h1 id="about-open-collective">About Open Collective</h1> => About Open Collective
    let title = content.substr(content.indexOf('<h1'), content.indexOf('</h1>'));
    title = title.substr(title.indexOf('>') + 1);

    return { title, content, path, pageSlug };
  }

  static propTypes = {
    path: PropTypes.string,
    pageSlug: PropTypes.string,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);
  }

  render() {

    const { path, pageSlug, title } = this.props;

    return (
      <div className="staticPage">
        <style global jsx>{`
          .staticPage .path {
            color: #9399A3;
            font-family: "Inter UI";
            font-size: 1.5rem;
            letter-spacing: -0.2px;
            margin-bottom: -2rem;
            margin-left: 0.5rem;
            margin-top: 1rem;
            text-transform: uppercase;
          }
          .staticPage h1 {
            margin: 4rem 0px 6rem;
            font-family: 'Inter UI', 'lato','montserratlight', sans-serif;
            font-size: 4.8rem;
            color: #121314;
            letter-spacing: -0.8px;
            line-height: 5.2rem;
            font-weight: 300;
            text-align: left;
          }
          .staticPage h2 {
            font-family: 'Inter UI', 'lato','montserratlight', sans-serif;
            font-size: 2.4rem;
            color: #6E747A;
            font-weight: 500;
            letter-spacing: -0.4px;
            line-height: 3.2rem;
            margin: 5rem 0 1rem;
          }
          .staticPage h3 {
            margin-top: 2.5rem;
            line-height: 1.3;
          }
          .staticPage h4 {
            margin-top: 1rem;
            line-height: 1.3;
          }
          .staticPage .content {
            max-width: 96rem;
          }
          .staticPage p, .staticPage li {
            color: #6E747A;
            font-family: 'Inter UI', 'lato','montserratlight', sans-serif;
            font-size: 16px;
            letter-spacing: -0.2px;
            line-height: 24px;
          }
          .staticPage th {
            min-width: 200px;
            text-align: left;
            vertical-align: top;
            padding-top: 1rem;
          }
          .staticPage li {
            margin: 0.5rem;
          }
          .staticPage code {
            padding: 0.5rem !important;
            margin: -7px 0;
            line-height: 1.5rem;
          }
        `}</style>
        <Header title={title} />
        <Body>
          <div className="content">
            { path && pageSlug &&
              <div className="path">
                <Link route={`/${path}`}>{path}</Link>
              </div>
            }
            <div dangerouslySetInnerHTML={{ __html: this.props.content }} />
          </div>
          <NewsletterContainer />
        </Body>
        <Footer />
      </div>
    )
  }
}

export default withIntl(StaticPage);
