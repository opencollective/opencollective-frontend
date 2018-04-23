import React from 'react';
import PropTypes from 'prop-types';
import { processMarkdown } from '../lib/markdown.lib';
import Markdown from 'react-markdown';
import SectionTitle from './SectionTitle';
import { FormattedMessage } from 'react-intl';

class LongDescription extends React.Component {

  static propTypes = {
    longDescription: PropTypes.string,
    defaultSubtitle: PropTypes.string
  }

  constructor(props) {
    super(props);
    this.sections = processMarkdown(props.longDescription || "").sections.filter(s => s.markdown);
  }

  render() {
    return (
      <div className="longDescription">
        {this.sections.map(section => (
          <section key={section.id || 'about'} id={section.id || 'about'} className="longDescription">
            <SectionTitle
              title={section.title || <FormattedMessage id="collective.about.title" defaultMessage="About" />}
              subtitle={section.title ? '' : this.props.defaultSubtitle}
            />

            <Markdown source={section.markdown} />
          </section>
        ))}
      </div>
    );
  }
}

export default LongDescription;
