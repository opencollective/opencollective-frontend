import React from 'react';
import PropTypes from 'prop-types';
import { processMarkdown } from '../lib/markdown.lib';
import SectionTitle from './SectionTitle';
import { FormattedMessage } from 'react-intl';
import showdown from 'showdown';

const converter = new showdown.Converter();

class LongDescription extends React.Component {

  static propTypes = {
    longDescription: PropTypes.string,
    defaultSubtitle: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.sections = processMarkdown(props.longDescription || '').sections.filter(s => s.markdown);
  }

  render() {
    return (
      <div className="longDescription">
        <style jsx>{`
        .longDescription :global(.video) {
          position: relative;
          padding-bottom: 56.25%; /* 16:9 */
          padding-top: 25px;
          height: 0;
        }
        .longDescription :global(.video iframe) {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          max-width: 640px;
          height: 100%;
        }
        `}</style>
        {this.sections.map(section => (
          <section key={section.id || 'about'} id={section.id || 'about'} className="longDescription">
            <SectionTitle
              title={section.title || <FormattedMessage id="collective.about.title" defaultMessage="About" />}
              subtitle={section.title ? '' : this.props.defaultSubtitle}
              />

            <div dangerouslySetInnerHTML={{ __html: converter.makeHtml(section.markdown) }} />
          </section>
        ))}
      </div>
    );
  }
}

export default LongDescription;
