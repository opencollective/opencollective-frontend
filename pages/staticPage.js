import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import Link from '../components/Link';
import NewsletterContainer from '../components/NewsletterContainer';
import Page from '../components/Page';
import staticPages from '../components/static-pages';

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
    const { path, pageSlug, title } = this.props;
    return (
      <Page title={title} navTitle={title}>
        <div className="markdown mx-auto mt-10 max-w-screen-lg px-4 py-2 sm:px-6 sm:py-4">
          {path && pageSlug && (
            <div className="mt-3 uppercase text-gray-400">
              <Link href={`/${path}`}>{path}</Link>
            </div>
          )}
          <div dangerouslySetInnerHTML={{ __html: this.props.content }} />
        </div>
        <NewsletterContainer />
      </Page>
    );
  }
}

export default StaticPage;
