import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import NextLink from 'next/link';
import styled from 'styled-components';

import Body from '../components/Body';
import Footer from '../components/Footer';
import Header from '../components/Header';
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
    max-width: 96rem;
  }
  .content .path {
    color: #9399a3;
    font-size: 1.5rem;
    margin-bottom: -2rem;
    margin-left: 0.5rem;
    margin-top: 1rem;
    text-transform: uppercase;
  }
  .content h1 {
    margin: 4rem 0px 6rem;
    font-size: 4.8rem;
    color: #121314;
    line-height: 5.2rem;
    font-weight: 300;
    text-align: left;
  }
  .content h2 {
    font-size: 2.4rem;
    color: #6e747a;
    font-weight: 500;
    line-height: 3.2rem;
    margin: 5rem 0 1rem;
  }
  .content h3 {
    margin-top: 2.5rem;
    line-height: 1.3;
  }
  .content h4 {
    margin-top: 1rem;
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
    padding-top: 1rem;
  }
  .content li {
    margin: 0.5rem;
  }
  .content code {
    padding: 0.5rem !important;
    margin: -7px 0;
    line-height: 1.5rem;
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
                <NextLink href={`/${path}`}>{path}</NextLink>
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
