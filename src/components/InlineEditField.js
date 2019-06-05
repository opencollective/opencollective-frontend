import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import { Mutation } from 'react-apollo';
import { get, set, pick } from 'lodash';
import styled from 'styled-components';
import { themeGet } from 'styled-system';

import { Edit } from 'styled-icons/feather/Edit';

import StyledButton from './StyledButton';
import Container from './Container';
import MessageBox from './MessageBox';
import StyledTextarea from './StyledTextarea';

/** Container used to show the description to users than can edit it */
const EditIcon = styled(Edit)`
  cursor: pointer;
  color: ${themeGet('colors.black.300')};
  &:hover {
    color: ${themeGet('colors.primary.700')};
  }
`;

/**
 * A field that can be edited inline. Relies directly on GraphQL to handle errors and
 * loading states properly. By default this component will use `TextAreaAutosize`
 * but you can override this behaviour by passing a custom `children` prop.
 */
class InlineEditField extends Component {
  static propTypes = {
    /** Field name */
    field: PropTypes.string.isRequired,
    /** Object that holds the values */
    values: PropTypes.object.isRequired,
    /** The GraphQL mutation used to update this value */
    mutation: PropTypes.object.isRequired,
    /** Can user edit the description */
    canEdit: PropTypes.bool,
    /** Set to false to disable edit icon even if user is allowed to edit */
    showEditIcon: PropTypes.bool,
    /** If given, this function will be used to render the field */
    children: PropTypes.func,
    /**
     * A text that will be rendered if user can edit and there's no value available.
     * Highly recommended if field is nullable.
     */
    placeholder: PropTypes.node,
  };

  static defaultProps = {
    showEditIcon: true,
  };

  state = { isEditing: false, draft: '' };

  enableEditor = () => {
    this.setState({ isEditing: true, draft: get(this.props.values, this.props.field) });
  };

  closeEditor = () => {
    this.setState({ isEditing: false });
  };

  setDraft = draft => {
    this.setState({ draft });
  };

  renderContent(field, canEdit, value, placeholder, children) {
    if (children) {
      return children({
        value,
        isEditing: false,
        enableEditor: this.enableEditor,
        closeEditor: this.closeEditor,
        setValue: this.setDraft,
      });
    } else if (!value) {
      return canEdit && placeholder ? (
        <StyledButton buttonSize="large" onClick={this.enableEditor} data-cy={`InlineEditField-Add-${field}`}>
          {placeholder}
        </StyledButton>
      ) : null;
    } else {
      return <span>{value}</span>;
    }
  }

  render() {
    const { field, values, mutation, canEdit, showEditIcon, placeholder, children } = this.props;
    const { isEditing, draft } = this.state;
    const value = get(values, field);
    const touched = draft !== value;

    if (!isEditing) {
      return (
        <Container position="relative">
          {canEdit && showEditIcon && (
            <Container position="absolute" top={0} right={0}>
              <EditIcon size={24} onClick={this.enableEditor} data-cy={`InlineEditField-Trigger-${field}`} />
            </Container>
          )}
          {this.renderContent(field, canEdit, value, placeholder, children)}
        </Container>
      );
    } else {
      return (
        <Mutation mutation={mutation}>
          {(updateField, { loading, error }) => (
            <Box>
              {children ? (
                children({ isEditing: true, value: draft, setValue: this.setDraft })
              ) : (
                <StyledTextarea
                  autoSize
                  autoFocus
                  width={1}
                  value={draft || ''}
                  onChange={e => this.setDraft(e.target.value)}
                  px={0}
                  py={0}
                  border="0"
                  letterSpacing="inherit"
                  fontSize="inherit"
                  fontWeight="inherit"
                  lineHeight="inherit"
                  data-cy={`InlineEditField-Textarea-${field}`}
                />
              )}
              {error && (
                <MessageBox type="error" my={2} withIcon>
                  {error.message}
                </MessageBox>
              )}
              <Flex flexWrap="wrap" justifyContent="center" mt={2}>
                <StyledButton
                  textTransform="capitalize"
                  mx={2}
                  buttonSize="large"
                  buttonStyle="primary"
                  loading={loading}
                  disabled={!touched}
                  data-cy="InlineEditField-Btn-Save"
                  onClick={() => {
                    const variables = set(pick(values, ['id']), field, draft.trim());
                    updateField({ variables }).then(this.closeEditor);
                  }}
                >
                  <FormattedMessage id="save" defaultMessage="save" />
                </StyledButton>
                <StyledButton
                  textTransform="capitalize"
                  mx={2}
                  data-cy="InlineEditField-Btn-Cancel"
                  buttonSize="large"
                  disabled={loading}
                  onClick={this.closeEditor}
                >
                  <FormattedMessage id="form.cancel" defaultMessage="cancel" />
                </StyledButton>
              </Flex>
              <hr />
            </Box>
          )}
        </Mutation>
      );
    }
  }
}

export default InlineEditField;
