import React from 'react';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import NewsletterContainer from '../components/NewsletterContainer';
import withIntl from '../lib/withIntl';

const pages = {
  'about': {
    title: 'About Open Collective',
  },
  'widgets': {
    title: 'Widgets',
  },
  'tos': {
    title: 'Terms of Service',
  },
  'privacypolicy': {
    title: 'Privacy Policy',
  },
};

class StaticPage extends React.Component {

  static async getInitialProps({ req }) {
    const pageSlug = req._parsedUrl.pathname.substr(1);
    const content = await require(`../markdown/${pageSlug}.md`);
    return { content, pageSlug };
  }

  static propTypes = {
    pageSlug: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);
    this.page = pages[props.pageSlug];
  }

  render() {
    return (
      <div className="staticPage">
        <style global jsx>{`
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
          .staticPage h4 {
            margin-top: 1rem;
          }
          .staticPage .content {
            max-width: 96rem;
          }
          .staticPage p {
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
    
        `}</style>
        <Header title={this.page.title} />
        <Body>
          <div className="content" dangerouslySetInnerHTML={{ __html: this.props.content }} />
          <NewsletterContainer />
        </Body>
        <Footer />
      </div>
    )
  }
}

export default withIntl(StaticPage);
