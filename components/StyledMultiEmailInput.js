import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { debounce, omit, uniq } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { getInputBorderColor } from '../lib/styled_components_utils';

import { Textarea } from './ui/Textarea';
import Container from './Container';
import { Span } from './Text';

export default class StyledMultiEmailInput extends Component {
  static propTypes = {
    /** Initial value */
    value: PropTypes.string,
    /** Callback for state update like `({emails, invalids}) => void` */
    onChange: PropTypes.func,
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
      value: props.value || '',
      showErrors: false,
    };
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

  onChange(e) {
    const value = e.target.value;
    this.setState({ value });
    if (this.props.onChange) {
      this.onChangeParent(value);
    }
  }

  onChangeParent(value) {
    const returnedState = this.extractEmails(value);
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
      <Container
        width="100%"
        bg={disabled ? 'black.50' : 'white.full'}
        fontSize="14px"
        borderColor={getInputBorderColor(invalids && invalids.length > 0)}
        {...omit(this.props, ['invalids', 'onChange', 'value'])}
      >
        <Textarea
          value={this.state.value}
          onChange={this.onChange}
          onBlur={this.onBlur}
          onFocus={this.onFocus}
          disabled={disabled}
          className={this.state.showErrors && invalids && invalids.length > 0 ? 'border-red-500' : ''}
        />
        {this.state.showErrors && invalids && invalids.length > 0 && (
          <Span className="multiemails-errors" display="block" color="red.500" pt={2} fontSize="10px">
            <strong>
              <FormattedMessage id="multiemail.invalids" defaultMessage="Invalid emails:" />{' '}
            </strong>
            {invalids.join(', ')}
          </Span>
        )}
      </Container>
    );
  }
}
