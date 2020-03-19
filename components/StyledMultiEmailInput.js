import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { Editor, EditorState } from 'draft-js';
import { omit, uniq, debounce } from 'lodash';

import Container from './Container';
import { Span } from './Text';
import { getInputBorderColor } from '../lib/styled_components_utils';
import { FormattedMessage } from 'react-intl';

const InputContainer = styled(Container)`
  .DraftEditor-root {
    padding: 0.5em;
    cursor: text;
    font-weight: 400;
    border: 1px solid;
    border-radius: 4px;
    border-color: inherit;

    &:hover,
    &:focus {
      border-color: ${themeGet('colors.primary.300')};
    }
  }

  .public-DraftEditor-content {
    min-height: 3em;
    max-height: 18em;
    overflow-y: auto;
  }

  .public-DraftEditor-content[contenteditable='false'] {
    cursor: not-allowed;
  }
`;

export default class StyledMultiEmailInput extends Component {
  static propTypes = {
    /** Editor initial state */
    initialState: PropTypes.instanceOf(EditorState),
    /** Callback for state update like `({emails, invalids}) => void` */
    onChange: PropTypes.func,
    /** Callback for when component is unmount. Useful to save editor state. */
    onClose: PropTypes.func,
    /** On array of invalid emails */
    invalids: PropTypes.arrayOf(PropTypes.string),
    /** disabled */
    disabled: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.onChangeParent = debounce(this.onChangeParent.bind(this), 100, { trailing: true });
    this.onBlur = this.onBlur.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.state = {
      editorState: props.initialState || EditorState.createEmpty(),
      showErrors: false,
    };
  }

  componentWillUnmount() {
    if (this.props.onClose) {
      this.props.onClose(this.state.editorState);
    }
  }

  extractEmails(str) {
    return uniq(str.split(/[\s,;]/gm)).reduce(
      (result, term) => {
        if (term.length === 0) {
          return result;
        } else if (term.match(/.+@.+\..+/)) {
          result.emails.push(term);
        } else {
          result.invalids.push(term);
        }
        return result;
      },
      { emails: [], invalids: [] },
    );
  }

  onChange(editorState) {
    this.setState({ editorState });
    if (this.props.onChange) {
      this.onChangeParent(editorState);
    }
  }

  onChangeParent(editorState) {
    const stringContent = editorState.getCurrentContent().getPlainText();
    const returnedState = this.extractEmails(stringContent);
    this.props.onChange(returnedState);
  }

  onBlur() {
    this.setState({ showErrors: true });
  }

  onFocus() {
    this.setState({ showErrors: false });
  }

  render() {
    const { invalids, disabled } = this.props;

    return (
      <InputContainer
        width="100%"
        bg={disabled ? 'black.50' : 'white.full'}
        fontSize="Paragraph"
        borderColor={getInputBorderColor(invalids && invalids.length > 0)}
        {...omit(this.props, ['invalids', 'onChange', 'initialState', 'onClose'])}
      >
        <Editor
          editorState={this.state.editorState}
          onChange={this.onChange}
          onBlur={this.onBlur}
          onFocus={this.onFocus}
          readOnly={disabled}
          stripPastedStyles
        />
        {this.state.showErrors && invalids && invalids.length > 0 && (
          <Span className="multiemails-errors" display="block" color="red.500" pt={2} fontSize="Tiny">
            <strong>
              <FormattedMessage id="multiemail.invalids" defaultMessage="Invalid emails:" />{' '}
            </strong>
            {invalids.join(', ')}
          </Span>
        )}
      </InputContainer>
    );
  }
}
