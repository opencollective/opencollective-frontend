import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import css from '@styled-system/css';
import uuid from 'uuid/v4';
import 'trix/dist/trix.css';

import { uploadImageWithXHR } from '../lib/api';
import MessageBox from './MessageBox';

const TrixEditorContainer = styled.form`
  trix-editor {
    border: none;
    padding: 0;
    margin-top: 16px;

    &:focus {
      outline: 1px dashed #eaeaea;
      outline-offset: 10px;
    }
  }

  trix-toolbar {
    min-height: 45px;
    background: white;
    padding-top: 10px;
    box-shadow: 0px 7px 4px -4px rgba(0, 0, 0, 0.1);
    z-index: 2;
    margin-bottom: 14px;

    /** Hide some buttons on mobile */
    @media (max-width: 500px) {
      .trix-button--icon-strike,
      .trix-button--icon-number-list,
      .trix-button--icon-decrease-nesting-level,
      .trix-button--icon-increase-nesting-level {
        display: none;
      }
    }

    ${props =>
      props.toolbarOffsetY &&
      css({
        marginTop: props.toolbarOffsetY,
      })}

    /** Sticky mode */
    ${props =>
      props.withStickyToolbar &&
      css({
        position: 'sticky',
        top: props.toolbarTop,
      })}
}
`;

/**
 * A React wrapper around the Trix library to edit rich text.
 * Produces HTML and clear text.
 */
export default class RichTextEditor extends React.Component {
  static propTypes = {
    /** If not provided, an id will be automatically generated which will require a component update */
    id: PropTypes.string,
    defaultValue: PropTypes.string,
    placeholder: PropTypes.string,
    autoFocus: PropTypes.bool,
    /** Called when text is changed with html content as first param and text content as second param */
    onChange: PropTypes.func,
    /** Wether the toolbar should stick to the top*/
    withStickyToolbar: PropTypes.bool,
    /** If position is sticky, this prop defines the `top` property. Support responsive arrays */
    toolbarTop: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    /** Usefull to compensate the height of the toolbar when editing inline */
    toolbarOffsetY: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  };

  static defaultProps = {
    withStickyToolbar: false,
    toolbarTop: 0,
    toolbarOffsetY: -62, // Default Trix toolbar height
  };

  constructor(props) {
    super(props);
    this.editorRef = React.createRef();
    this.state = { id: props.id, error: null };
    this.isReady = false;

    if (typeof window !== 'undefined') {
      this.Trix = require('trix');
      this.Trix.config.blockAttributes.heading1 = { tagName: 'h3' };
    }
  }

  componentDidMount() {
    if (!this.state.id) {
      this.setState({ id: uuid() });
    } else if (!this.isReady) {
      this.initialize();
    }
  }

  componentDidUpdate() {
    if (!this.isReady) {
      this.initialize();
    }
  }

  componentWillUnmount() {
    if (this.isReady) {
      this.editorRef.current.removeEventListener('trix-change', this.handleChange);
      this.editorRef.current.removeEventListener('trix-attachment-add', this.handleUpload);
      this.editorRef.current.removeEventListener('trix-attachment-add', this.handleFileAccept);
    }
  }

  initialize = () => {
    if (this.Trix && this.editorRef.current) {
      // Listen for changes
      this.editorRef.current.addEventListener('trix-change', this.handleChange, false);
      this.editorRef.current.addEventListener('trix-attachment-add', this.handleUpload);
      this.editorRef.current.addEventListener('trix-file-accept', this.handleFileAccept);

      // Component ready!
      this.isReady = true;
    }
  };

  handleChange = e => {
    if (this.props.onChange) {
      this.props.onChange(e.target.innerHTML, e.target.innerText);
    }

    if (this.state.error) {
      this.setState({ error: null });
    }
  };

  handleFileAccept = e => {
    if (!/^image\//.test(e.file.type)) {
      alert('You can only upload images.');
      e.preventDefault();
    } else if (e.file.size > 4000000) {
      // Prevent attaching files > 4MB
      alert('This file is too big (max: 4mb).');
      e.preventDefault();
    }
  };

  handleUpload = async e => {
    const file = e.attachment && e.attachment.file;
    if (!file) {
      return;
    }

    try {
      const fileURL = await uploadImageWithXHR(file, e.attachment.setUploadProgress);
      return e.attachment.setAttributes({ url: fileURL, href: fileURL });
    } catch (e) {
      this.setState({ error: e });
    }
  };

  render() {
    const { defaultValue, withStickyToolbar, toolbarTop, toolbarOffsetY, autoFocus, placeholder } = this.props;
    return !this.state.id ? null : (
      <TrixEditorContainer
        withStickyToolbar={withStickyToolbar}
        toolbarTop={toolbarTop}
        toolbarOffsetY={toolbarOffsetY}
        data-cy="RichTextEditor"
      >
        {this.state.error && (
          <MessageBox type="error" withIcon>
            {this.state.error.toString()}
          </MessageBox>
        )}
        <input id={this.state.id} value={defaultValue} type="hidden" name="content" />
        <trix-editor
          ref={this.editorRef}
          input={this.state.id}
          autofocus={autoFocus ? true : undefined}
          placeholder={placeholder}
        />
      </TrixEditorContainer>
    );
  }
}
