import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import NewsletterContainer from '../components/NewsletterContainer';
import Link from '../components/Link';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

import staticPages from './static';

const getContent = (path, pageSlug) => {
  if (path) {
    return get(staticPages, [path, pageSlug || 'index']);
  } else {
    return get(staticPages, pageSlug);
  }
};

class StaticPage extends React.Component {
  static async getInitialProps(props) {
    const { path, pageSlug } = props.query;

    let content = getContent(path, pageSlug);

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

  static propTypes = {
    getLoggedInUser: PropTypes.func.isRequired,
    data: PropTypes.object,
    query: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && (await getLoggedInUser());
    this.setState({ LoggedInUser });
  }

  render() {
    const { path, pageSlug, title } = this.props;

    return (
      <div className="staticPage">
        <style global jsx>
          {`
            .staticPage .path {
              color: #9399a3;
              font-size: 1.5rem;
              margin-bottom: -2rem;
              margin-left: 0.5rem;
              margin-top: 1rem;
              text-transform: uppercase;
            }
            .staticPage h1 {
              margin: 4rem 0px 6rem;
              font-size: 4.8rem;
              color: #121314;
              line-height: 5.2rem;
              font-weight: 300;
              text-align: left;
            }
            .staticPage h2 {
              font-size: 2.4rem;
              color: #6e747a;
              font-weight: 500;
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
            .staticPage p,
            .staticPage li,
            .staticPage summary {
              color: #6e747a;
              font-size: 16px;
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
          `}
        </style>
        <Header title={title} LoggedInUser={this.state.LoggedInUser} />
        <Body>
          <div className="content">
            {path && pageSlug && (
              <div className="path">
                <Link route={`/${path}`}>{path}</Link>
              </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: this.props.content }} />
          </div>
          <NewsletterContainer />
        </Body>
        <Footer />
      </div>
    );
  }
}

export default withData(withIntl(withLoggedInUser(StaticPage)));
