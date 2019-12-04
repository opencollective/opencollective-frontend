import React from 'react';
import PropTypes from 'prop-types';
import ReactMde, { ReactMdeCommands as Commands } from 'react-mde';
import classNames from 'classnames';
import * as Showdown from 'showdown';
import { Heading } from '@styled-icons/fa-solid/Heading';
import { Bold } from '@styled-icons/fa-solid/Bold';
import { Italic } from '@styled-icons/fa-solid/Italic';
import { Link } from '@styled-icons/fa-solid/Link';
import { Image } from '@styled-icons/fa-solid/Image';
import { ListUl } from '@styled-icons/fa-solid/ListUl';
import { ListOl } from '@styled-icons/fa-solid/ListOl';

import '../node_modules/react-mde/lib/styles/css/react-mde-all.css'; // eslint-disable-line node/no-unpublished-import

const EditorIconComponents = {
  heading: Heading,
  bold: Bold,
  italic: Italic,
  link: Link,
  image: Image,
  'list-ul': ListUl,
  'list-ol': ListOl,
};

/*
 * Simple editor component that takes placeholder text as a prop
 */
class MarkdownEditor extends React.Component {
  static propTypes = {
    placeholder: PropTypes.string,
    defaultValue: PropTypes.string,
    onChange: PropTypes.func,
    preview: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      value: props.defaultValue || '',
    };
    this.converter = new Showdown.Converter();
    this.commands = [
      {
        commands: [Commands.headerCommand, Commands.boldCommand, Commands.italicCommand],
      },
      {
        commands: [Commands.linkCommand, Commands.imageCommand],
      },
      {
        commands: [Commands.unorderedListCommand, Commands.orderedListCommand],
      },
    ];
  }

  handleChange(value) {
    this.setState({ value });
    this.props.onChange(value);
  }

  render() {
    return (
      <div
        className={classNames('MarkdownEditor', {
          noPreview: this.props.preview === false,
        })}
      >
        <style jsx global>
          {`
            .MarkdownEditor.noPreview .mde-tabs {
              display: none;
            }
            .DraftEditor-root,
            .DraftEditor-editorContainer,
            .public-DraftEditor-content {
              height: 100%;
            }
            .react-mde .grip svg {
              display: block;
              margin: 0 auto;
            }
          `}
        </style>
        <ReactMde
          value={this.state.value}
          onChange={this.handleChange}
          commands={this.commands}
          generateMarkdownPreview={markdown => {
            // react-mde expect generateMarkdownPreview to return a promise
            return Promise.resolve(this.converter.makeHtml(markdown));
          }}
          buttonContentOptions={{
            iconProvider: name => {
              const Component = EditorIconComponents[name];
              return Component ? <Component size="1em" title={name} /> : name;
            },
          }}
        />
      </div>
    );
  }
}

export default MarkdownEditor;
