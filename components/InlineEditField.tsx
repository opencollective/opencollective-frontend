import React, { Component } from 'react';
import type { DocumentNode } from '@apollo/client';
import { Mutation } from '@apollo/client/react/components';
import { PencilAlt } from '@styled-icons/fa-solid/PencilAlt';
import { get, pick } from 'lodash-es';
import type { IntlShape } from 'react-intl';
import { defineMessages, FormattedMessage } from 'react-intl';
import { styled } from 'styled-components';

import injectIntl from '@/lib/injectIntl';

import Container from './Container';
import { Box, Flex } from './Grid';
import MessageBox from './MessageBox';
import StyledButton from './StyledButton';
import { fadeIn } from './StyledKeyframes';
import StyledTextarea from './StyledTextarea';
import WarnIfUnsavedChanges from './WarnIfUnsavedChanges';

/** Container used to show the description to users than can edit it */
const EditIcon = styled(PencilAlt)`
  cursor: pointer;
  background-color: white;
  border: 1px solid #aaaeb3;
  border-radius: 25%;
  padding: 15%;
  color: #aaaeb3;

  &:hover {
    color: #8697ad;
  }
`;

/** Component used for cancel / submit buttons */
const FormButton = styled(StyledButton)`
  width: 35%;
  font-weight: normal;
  text-transform: capitalize;
  margin: 4px 8px;
  animation: ${fadeIn} 0.3s;
`;

/** `values` is the untyped record being edited; the edited field is handled as a string draft */
const getFieldDraft = (values: Record<string, unknown>, field: string): string => get(values, field) as string;

const messages = defineMessages({
  warnDiscardChanges: {
    id: 'warning.discardUnsavedChanges',
    defaultMessage: 'Are you sure you want to discard your unsaved changes?',
  },
});

type InlineEditFieldRenderProps = {
  value?: React.ReactNode;
  isEditing: boolean;
  maxLength?: number;
  enableEditor: () => void;
  disableEditor: (noWarning?: boolean | React.MouseEvent) => void;
  setValue: (draft: string) => void;
  setUploading?: (uploading: boolean) => void;
};

type InlineEditFieldProps = {
  /** Field name */
  field: string;
  /** Object that holds the values */
  values: Record<string, unknown>;
  /** The GraphQL mutation used to update this value */
  mutation: DocumentNode;
  /** Passed to Apollo */
  mutationOptions?: Record<string, unknown>;
  /** Can user edit the description */
  canEdit?: boolean;
  /** Unused by this component, accepted for consumers that still pass it (see PLAN.md) */
  canDelete?: boolean;
  /** Use this to control the component state */
  isEditing?: boolean;
  /** Add a confirm if trying to leave the form with unsaved changes */
  warnIfUnsavedChanges?: boolean;
  required?: boolean;
  /** Max field length */
  maxLength?: number;
  /** Gets passed the item, the new value and must return the mutation variables */
  prepareVariables?: (values: Record<string, unknown>, draft: string) => Record<string, unknown>;
  /** For cases when component is controlled */
  disableEditor?: (noWarning?: boolean) => void;
  /** Set to false to disable edit icon even if user is allowed to edit */
  showEditIcon?: boolean;
  /** If given, this function will be used to render the field */
  children?: (props: InlineEditFieldRenderProps) => React.ReactNode;
  /**
   * A text that will be rendered if user can edit and there's no value available.
   * Highly recommended if field is nullable.
   */
  placeholder?: React.ReactNode;
  /** To set the min width of Cancel/Save buttons */
  buttonsMinWidth?: number | string;
  /** Editing the top value. */
  topEdit?: number;
  /** @ignore from injectIntl */
  intl?: IntlShape;
};

type InlineEditFieldState = {
  isEditing: boolean;
  draft: string;
  uploading: boolean;
};

/**
 * A field that can be edited inline. Relies directly on GraphQL to handle errors and
 * loading states properly. By default this component will use `TextAreaAutosize`
 * but you can override this behaviour by passing a custom `children` prop.
 */
class InlineEditField extends Component<InlineEditFieldProps, InlineEditFieldState> {
  static defaultProps = {
    showEditIcon: true,
    buttonsMinWidth: 225,
    topEdit: -5,
  };

  state = { isEditing: false, draft: '', uploading: false };

  componentDidUpdate(oldProps: InlineEditFieldProps) {
    if (oldProps.isEditing !== this.props.isEditing) {
      if (this.props.isEditing) {
        this.setState({ isEditing: true, draft: getFieldDraft(this.props.values, this.props.field) });
      } else {
        this.setState({ isEditing: false });
      }
    }
  }

  enableEditor = () => {
    this.setState({ isEditing: true, draft: getFieldDraft(this.props.values, this.props.field) });
  };

  // Also registered as an `onClick` handler, which passes the event here (truthy); preserved as-is
  disableEditor = (noWarning?: boolean | React.MouseEvent) => {
    const { warnIfUnsavedChanges, intl, values, field } = this.props;
    if (!noWarning && warnIfUnsavedChanges) {
      const isDirty = getFieldDraft(values, field) !== this.state.draft;
      if (isDirty && !confirm(intl.formatMessage(messages.warnDiscardChanges))) {
        return;
      }
    }

    this.setState({ isEditing: false });

    if (this.props.disableEditor) {
      this.props.disableEditor();
    }
  };

  setDraft = (draft: string) => {
    this.setState({ draft });
  };

  renderContent(
    field: string,
    canEdit: boolean,
    value: React.ReactNode,
    placeholder: React.ReactNode,
    children: (props: InlineEditFieldRenderProps) => React.ReactNode,
  ) {
    if (children) {
      return children({
        value,
        isEditing: false,
        enableEditor: this.enableEditor,
        disableEditor: this.disableEditor,
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
    const {
      field,
      values,
      mutation,
      canEdit,
      prepareVariables,
      showEditIcon,
      placeholder,
      children,
      topEdit,
      mutationOptions,
      warnIfUnsavedChanges,
    } = this.props;
    const { draft, isEditing } = this.state;
    const { buttonsMinWidth } = this.props;
    const value = getFieldDraft(values, field);
    const touched = draft !== value;
    const isValid = !this.props.required ? touched : touched && Boolean(draft);

    if (!isEditing) {
      return (
        <Container position="relative">
          {canEdit && showEditIcon && (
            <Container position="absolute" top={topEdit} right={-5} zIndex={2}>
              <EditIcon size={24} onClick={this.enableEditor} data-cy={`InlineEditField-Trigger-${field}`} />
            </Container>
          )}
          {this.renderContent(field, canEdit, value, placeholder, children)}
        </Container>
      );
    } else {
      return (
        <WarnIfUnsavedChanges hasUnsavedChanges={warnIfUnsavedChanges && isValid}>
          <Mutation mutation={mutation} {...mutationOptions}>
            {(updateField, { loading, error }) => (
              <React.Fragment>
                {children ? (
                  children({
                    isEditing: true,
                    value: draft,
                    maxLength: this.props.maxLength,
                    setValue: this.setDraft,
                    enableEditor: this.enableEditor,
                    disableEditor: this.disableEditor,
                    setUploading: uploading => this.setState({ uploading }),
                  })
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
                    {...({
                      letterSpacing: 'inherit',
                      fontWeight: 'inherit',
                      lineHeight: 'inherit',
                    } as React.ComponentProps<typeof StyledTextarea>)}
                    fontSize="inherit"
                    maxLength={this.props.maxLength}
                    data-cy={`InlineEditField-Textarea-${field}`}
                    withOutline
                  />
                )}
                <Box width={1}>
                  {error && (
                    <MessageBox type="error" my={2} fontSize="14px" lineHeight="20px" fontWeight="normal" withIcon>
                      {error.message}
                    </MessageBox>
                  )}
                  <Flex flexWrap="wrap" justifyContent="space-evenly" mt={3}>
                    <FormButton
                      data-cy="InlineEditField-Btn-Cancel"
                      disabled={loading}
                      minWidth={buttonsMinWidth}
                      onClick={this.disableEditor}
                    >
                      <FormattedMessage id="form.cancel" defaultMessage="cancel" />
                    </FormButton>
                    <FormButton
                      buttonStyle="primary"
                      loading={loading}
                      disabled={!isValid || this.state.uploading}
                      data-cy="InlineEditField-Btn-Save"
                      minWidth={buttonsMinWidth}
                      onClick={() => {
                        const variables = prepareVariables
                          ? prepareVariables(values, draft)
                          : { ...pick(values, ['id']), [field]: draft };

                        updateField({ variables }).then(() => this.disableEditor(true));
                      }}
                    >
                      {this.state.uploading ? (
                        <FormattedMessage id="uploadImage.isUploading" defaultMessage="Uploading image..." />
                      ) : (
                        <FormattedMessage id="save" defaultMessage="Save" />
                      )}
                    </FormButton>
                  </Flex>
                </Box>
              </React.Fragment>
            )}
          </Mutation>
        </WarnIfUnsavedChanges>
      );
    }
  }
}

// `injectIntl` only types the injected `intl` prop; the class' own props (and `defaultProps`) are kept as-is
export default injectIntl(InlineEditField as React.ComponentType<{ intl?: IntlShape }>);
