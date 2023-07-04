import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import styled from 'styled-components';

import Body from '../components/Body';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Link from '../components/Link';
import NewsletterContainer from '../components/NewsletterContainer';
import staticPages from '../components/static-pages';
import { withUser } from '../components/UserProvider';

const getContent = (path, pageSlug) => {
  if (path) {
    return get(staticPages, [path, pageSlug || 'index']);
  } else {
    return get(staticPages, pageSlug);
  }
};

const StaticPageContainer = styled.div`
  .content {
    max-width: 60rem;
  }
  .content .path {
    color: #9399a3;
    font-size: 0.95rem;
    margin-bottom: -1.25rem;
    margin-left: 0.3rem;
    margin-top: 0.65rem;
    text-transform: uppercase;
  }
  .content h1 {
    margin: 2.5rem 0px 3.75rem;
    font-size: 3rem;
    color: #121314;
    line-height: 3.25rem;
    font-weight: 300;
    text-align: left;
  }
  .content h2 {
    font-size: 1.5rem;
    color: #6e747a;
    font-weight: 500;
    line-height: 2rem;
    margin: 3.15rem 0 0.65rem;
  }
  .content h3 {
    margin-top: 1.55rem;
    line-height: 1.3;
  }
  .content h4 {
    margin-top: 0.65rem;
    line-height: 1.3;
  }

  .content p,
  .content li,
  .content summary {
    color: #6e747a;
    font-size: 16px;
    line-height: 24px;
  }
  .content th {
    min-width: 200px;
    text-align: left;
    vertical-align: top;
    padding-top: 0.65rem;
  }
  .content li {
    margin: 0.3rem;
  }
  .content code {
    padding: 0.3rem !important;
    margin: -7px 0;
    line-height: 0.95rem;
  }
  .content iframe {
    max-width: 100%;
  }
`;

class StaticPage extends React.Component {
  static async getInitialProps(props) {
    const { path, pageSlug } = props.query;

    const content = getContent(path, pageSlug);

    // get the title from the html of the markdown
    // e.g., <h1 id="about-open-collective">About Open Collective</h1> => About Open Collective
    let title = content.substr(content.indexOf('<h1'), content.indexOf('</h1>'));
    title = title.substr(title.indexOf('>') + 1);

    return { title, content, path, pageSlug };
  }

  static propTypes = {
    path: PropTypes.string,
    pageSlug: PropTypes.string,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    LoggedInUser: PropTypes.object,
    data: PropTypes.object,
    query: PropTypes.object,
  };

  render() {
    const { path, pageSlug, title, LoggedInUser } = this.props;

    return (
      <StaticPageContainer>
        <Header title={title} LoggedInUser={LoggedInUser} />
        <Body>
          <div className="content">
            {path && pageSlug && (
              <div className="path">
                <Link href={`/${path}`}>{path}</Link>
              </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: this.props.content }} />
          </div>
          <NewsletterContainer />
        </Body>
        <Footer />
      </StaticPageContainer>
    );
  }
}

export default withUser(StaticPage);
