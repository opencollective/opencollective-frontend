import { Box, Flex } from '@rebass/grid';
import { get, isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { Field, FastField } from 'formik';
import { isURL } from 'validator';

import { createError, FORM_ERROR, requireFields, formatErrorMessage } from '../../lib/form-utils';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputField from '../StyledInputField';
import { Span } from '../Text';
import { attachmentDropzoneParams, attachmentRequiresFile } from './lib/attachments';
import StyledDropzone from '../StyledDropzone';
import StyledButton from '../StyledButton';

export const msg = defineMessages({
  previewImgAlt: {
    id: 'ExpenseReceiptImagePreview.Alt',
    defaultMessage: 'Expense receipt preview',
  },
  descriptionLabel: {
    id: 'Fields.description',
    defaultMessage: 'Description',
  },
  amountLabel: {
    id: 'Fields.amount',
    defaultMessage: 'Amount',
  },
  dateLabel: {
    id: 'expense.incurredAt',
    defaultMessage: 'Date',
  },
  remove: {
    id: 'Remove',
    defaultMessage: 'Remove',
  },
});

export const FormFieldsContainer = styled.div`
  border-bottom: 1px dashed #eaeaea;
  display: flex;
  margin-bottom: 18px;
`;

export const PreviewImg = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 10px;
`;

/** Validates a single attachment, one field at a time (doesn't return multiple errors) */
export const validateAttachment = (expense, attachment) => {
  const errors = requireFields(attachment, ['description', 'incurredAt', 'amount']);

  if (!isEmpty(errors)) {
    return errors;
  }

  // Attachment URL
  if (attachmentRequiresFile(expense.type)) {
    if (!attachment.url) {
      errors.url = createError(FORM_ERROR.REQUIRED);
    } else if (!isURL(attachment.url)) {
      errors.url = createError(FORM_ERROR.BAD_PATTERN);
    }
  }

  return errors;
};

const AttachmentLabel = () => (
  <Span fontSize="LeadCaption">
    <FormattedMessage id="Expense.Attachment" defaultMessage="Attachment" />
    &nbsp;&nbsp;
    <PrivateInfoIcon color="#969BA3" />
  </Span>
);

/**
 * Form for a single attachment. Must be used with react-hook-form.
 */
const ExpenseAttachmentForm = ({ attachment, errors, onRemove, currency, requireFile, name }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const attachmentKey = `attachment-${attachment.id || attachment.url}`;
  const getFieldName = field => `${name}.${field}`;
  const getError = field => formatErrorMessage(intl, get(errors, getFieldName(field)));

  return (
    <FormFieldsContainer data-cy="expense-attachment-form">
      {requireFile && (
        <FastField name={getFieldName('url')}>
          {({ field, form, meta }) => {
            const hasValidUrl = isURL(field.value);
            return (
              <StyledInputField
                mr={4}
                htmlFor={attachmentKey}
                label={<AttachmentLabel />}
                error={formatErrorMessage(intl, meta.error)}
                data-cy="attachment-url-field"
                required
              >
                <StyledDropzone
                  {...attachmentDropzoneParams}
                  isMulti={false}
                  error={meta.error}
                  onSuccess={url => form.setFieldValue(field.name, url)}
                  showDefaultMessage={!hasValidUrl}
                  mockImageGenerator={() => `https://loremflickr.com/120/120/invoice?lock=${attachmentKey}`}
                  fontSize="LeadCaption"
                  size={112}
                >
                  {hasValidUrl && <PreviewImg src={field.value} alt={formatMessage(msg.previewImgAlt)} />}
                </StyledDropzone>
              </StyledInputField>
            );
          }}
        </FastField>
      )}
      <Box flex="1 1" minWidth={200}>
        <StyledInputField
          name={getFieldName('description')}
          error={getError('description')}
          htmlFor={`${attachmentKey}-description`}
          label={formatMessage(msg.descriptionLabel)}
          labelFontSize="LeadCaption"
          required
        >
          {inputProps => <Field as={StyledInput} {...inputProps} />}
        </StyledInputField>
        <Flex flexWrap="wrap" justifyContent="space-between">
          <StyledInputField
            name={getFieldName('incurredAt')}
            error={getError('incurredAt')}
            htmlFor={`${attachmentKey}-incurredAt`}
            inputType="date"
            required
            label={formatMessage(msg.dateLabel)}
            labelFontSize="LeadCaption"
            flex="1 1 50%"
            mt={3}
            mr={[null, 3]}
          >
            {inputProps => <Field as={StyledInput} maxHeight={39} {...inputProps} />}
          </StyledInputField>
          <StyledInputField
            name={getFieldName('amount')}
            error={getError('amount')}
            htmlFor={`${attachmentKey}-amount`}
            label={formatMessage(msg.amountLabel)}
            required
            labelFontSize="LeadCaption"
            inputType="number"
            flex="1 1 30%"
            maxWidth="100%"
            mt={3}
          >
            {inputProps => (
              <Field
                as={StyledInputAmount}
                {...inputProps}
                currency={currency}
                currencyDisplay="CODE"
                min="0.01"
                maxWidth="100%"
                placeholder="0.00"
                parseNumbers
              />
            )}
          </StyledInputField>
        </Flex>
        <Box mt={2} p={2} textAlign="right">
          {onRemove && (
            <StyledButton
              type="button"
              color="red.500"
              borderColor="red.500"
              focusColor="red.500"
              fontSize="Caption"
              onClick={() => onRemove(attachment)}
              p={2}
              asLink
            >
              {formatMessage(msg.remove)}
            </StyledButton>
          )}
        </Box>
      </Box>
    </FormFieldsContainer>
  );
};

ExpenseAttachmentForm.propTypes = {
  /** The currency of the collective */
  currency: PropTypes.string.isRequired,
  /** ReactHookForm key */
  name: PropTypes.string.isRequired,
  /** Called when clicking on remove */
  onRemove: PropTypes.func,
  /** A map of errors for this object */
  errors: PropTypes.object,
  /** Wether a file is required for this attachment type */
  requireFile: PropTypes.bool,
  /** the attachment data */
  attachment: PropTypes.shape({
    id: PropTypes.string,
    url: PropTypes.string,
    description: PropTypes.string,
    incurredAt: PropTypes.string,
    amount: PropTypes.number,
  }).isRequired,
};

ExpenseAttachmentForm.whyDidYouRender = true;

export default React.memo(ExpenseAttachmentForm);
