import React from 'react';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import NewsletterContainer from '../components/NewsletterContainer';
import withIntl from '../lib/withIntl';

class StaticPage extends React.Component {

  static async getInitialProps(props) {
    let { pageSlug } = props.query;
    pageSlug = pageSlug.toLowerCase().replace(/faq/, 'FAQ');
    const content = await require(`../markdown/${pageSlug}.md`);

    // get the title from the html of the markdown
    // e.g. <h1 id="about-open-collective">About Open Collective</h1> => About Open Collective
    let title = content.substr(content.indexOf('<h1'), content.indexOf('</h1>'));
    title = title.substr(title.indexOf('>') + 1);

    return { title, content };
  }

  static propTypes = {
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);
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
    
        `}</style>
        <Header title={this.props.title} />
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
