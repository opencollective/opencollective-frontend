import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import css from '@styled-system/css';
import uuid from 'uuid/v4';
import 'trix/dist/trix.css';

import { uploadImageWithXHR } from '../lib/api';
import MessageBox from './MessageBox';
import LoadingPlaceholder from './LoadingPlaceholder';
import HTMLContent from './HTMLContent';

const TrixEditorContainer = styled.div`
  ${props =>
    props.withBorders &&
    css({
      border: '1px solid',
      borderColor: 'black.300',
      borderRadius: 10,
      padding: 3,
    })}

  trix-editor {
    border: none;
    padding: 0;
    margin-top: 8px;
    padding-top: 8px;
    outline-offset: 0.5em;

    // Outline (only when there's no border)
    ${props =>
      !props.withBorders &&
      css({
        outline: !props.error ? 'none' : `1px dashed ${props.theme.colors.red[300]}`,
        '&:focus': {
          outline: `1px dashed ${props.theme.colors.black[200]}`,
        },
      })}

    // Placeholder
    &:empty:not(:focus)::before {
      color: ${props => props.theme.colors.black[400]};
    }

    ${props => css({ minHeight: props.editorMinHeight })}
  }

  trix-toolbar {
    min-height: 40px;
    background: white;
    box-shadow: 0px 5px 3px -3px rgba(0, 0, 0, 0.1);
    z-index: 2;
    margin-bottom: 8px;

    .trix-button-group {
      border-radius: 6px;
      border-color: #c4c7cc;
      margin-bottom: 0;
    }

    .trix-button {
      border-bottom: none;
      width: 2.6em;
      height: 1.8em;
      padding: 0.75em;

      &:hover {
        background: ${props => props.theme.colors.blue[100]};
      }

      &.trix-active {
        background: ${props => props.theme.colors.blue[200]};
      }

      &::before,
      &.trix-active::before {
        margin: 4px; // Use this to reduce the icons size
      }
    }

    /** Hide some buttons on mobile */
    @media (max-width: 500px) {
      .trix-button--icon-strike,
      .trix-button--icon-number-list,
      .trix-button--icon-decrease-nesting-level,
      .trix-button--icon-increase-nesting-level {
        display: none;
      }
    }

    /** Sticky mode */
    ${props =>
      props.withStickyToolbar &&
      css({
        position: 'sticky',
        top: props.toolbarTop || 0,
        marginTop: props.toolbarOffsetY,
        py: '10px',
      })}

    /** Custom icons */
    .trix-button--icon-attach::before {
      // See https://feathericons.com/?query=image
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E");
    }
  } // End of toolbar customization

  /** Disabled mode */
  ${props =>
    props.isDisabled &&
    css({
      pointerEvents: 'none',
      cursor: 'not-allowed',
      background: '#f3f3f3',
      'trix-toolbar': {
        background: '#f3f3f3',
      },
    })}
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
    /** Font size for the text */
    fontSize: PropTypes.string,
    autoFocus: PropTypes.bool,
    /** Called when text is changed with html content as first param and text content as second param */
    onChange: PropTypes.func,
    /** A name for the input */
    inputName: PropTypes.string,
    /** Change this prop to reset the value */
    reset: PropTypes.any,
    /** A ref for the input. Useful to plug react-hook-form */
    inputRef: PropTypes.func,
    /** Wether the toolbar should stick to the top */
    withStickyToolbar: PropTypes.bool,
    /** This component is borderless by default. Set this to `true` to change that. */
    withBorders: PropTypes.bool,
    /** Wether the field should be disabled */
    disabled: PropTypes.bool,
    /** If position is sticky, this prop defines the `top` property. Support responsive arrays */
    toolbarTop: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    /** Usefull to compensate the height of the toolbar when editing inline */
    toolbarOffsetY: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    /** Min height for the full component */
    editorMinHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    /** If truthy, will display a red outline */
    error: PropTypes.any,
  };

  static defaultProps = {
    withStickyToolbar: false,
    toolbarTop: 0,
    toolbarOffsetY: -62, // Default Trix toolbar height
    inputName: 'content',
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

  componentDidUpdate(oldProps) {
    if (!this.isReady) {
      this.initialize();
    } else if (oldProps.reset !== this.props.reset) {
      this.editorRef.current.editor.loadHTML('');
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
      this.props.onChange(e);
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
    const {
      defaultValue,
      withStickyToolbar,
      toolbarTop,
      toolbarOffsetY,
      autoFocus,
      placeholder,
      editorMinHeight,
      withBorders,
      inputName,
      inputRef,
      disabled,
      error,
      fontSize,
    } = this.props;
    return !this.state.id ? (
      <LoadingPlaceholder height={editorMinHeight ? editorMinHeight + 56 : 200} />
    ) : (
      <TrixEditorContainer
        withStickyToolbar={withStickyToolbar}
        toolbarTop={toolbarTop}
        toolbarOffsetY={toolbarOffsetY}
        editorMinHeight={editorMinHeight}
        withBorders={withBorders}
        isDisabled={disabled}
        error={error}
        data-cy="RichTextEditor"
      >
        {this.state.error && (
          <MessageBox type="error" withIcon>
            {this.state.error.toString()}
          </MessageBox>
        )}
        <input id={this.state.id} value={defaultValue} type="hidden" name={inputName} ref={inputRef} />
        <HTMLContent fontSize={fontSize}>
          <trix-editor
            ref={this.editorRef}
            input={this.state.id}
            autofocus={autoFocus ? true : undefined}
            placeholder={placeholder}
          />
        </HTMLContent>
      </TrixEditorContainer>
    );
  }
}
