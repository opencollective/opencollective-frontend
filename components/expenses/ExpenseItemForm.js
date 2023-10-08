import React from 'react';
import PropTypes from 'prop-types';
import { FastField, Field, useFormikContext } from 'formik';
import { escape, get, isEmpty, pick, unescape } from 'lodash';
import Lottie from 'lottie-react';
import { AlertTriangle } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { isURL } from 'validator';

import expenseTypes from '../../lib/constants/expenseTypes';
import { formatValueAsCurrency } from '../../lib/currency-utils';
import { createError, ERROR } from '../../lib/errors';
import { formatFormErrorMessage, requireFields } from '../../lib/form-utils';
import { cn } from '../../lib/utils';
import { attachmentDropzoneParams } from './lib/attachments';
import { expenseItemsMustHaveFiles } from './lib/items';
import { checkExpenseItemCanBeSplit, updateExpenseFormWithUploadResult } from './lib/ocr';

import * as ScanningAnimationJSON from '../../public/static/animations/scanning.json';
import { Box, Flex } from '../Grid';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import RichTextEditor from '../RichTextEditor';
import StyledButton from '../StyledButton';
import StyledDropzone from '../StyledDropzone';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputField from '../StyledInputField';
import { Span } from '../Text';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

import { ExpenseItemDescriptionHint } from './ItemDescriptionHint';
import { SplitExpenseItemsModal } from './SplitExpenseItemsModal';

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
  removeReceipt: {
    id: 'expense.RemoveReceipt',
    defaultMessage: 'Remove receipt',
  },
  removeItem: {
    id: 'expense.RemoveItem',
    defaultMessage: 'Remove item',
  },
  receiptRequired: {
    id: 'expense.ReceiptRequired',
    defaultMessage: 'Receipt required',
  },
});

/** Validates a single expense item, one field at a time (doesn't return multiple errors) */
export const validateExpenseItem = (expense, item) => {
  const requiredFields = ['description', 'amount'];
  if (expense.type !== expenseTypes.GRANT) {
    requiredFields.push('incurredAt');
  }
  const errors = requireFields(item, requiredFields);

  if (isNaN(item.amount)) {
    errors.amount = createError(ERROR.FORM_FIELD_PATTERN);
  }

  if (!isEmpty(errors)) {
    return errors;
  }

  // Attachment URL
  if (expenseItemsMustHaveFiles(expense.type)) {
    if (!item.url) {
      errors.url = createError(ERROR.FORM_FIELD_REQUIRED);
    } else if (!isURL(item.url)) {
      errors.url = createError(ERROR.FORM_FIELD_PATTERN);
    }
  }

  // Show the expense currency errors on the amount field, since it's displayed next to it
  if (!expense.currency) {
    errors.amount = createError(ERROR.FORM_FIELD_REQUIRED);
  }

  return errors;
};

export const prepareExpenseItemForSubmit = (expenseData, item) => {
  // The frontend currently ignores the time part of the date, we default to midnight UTC
  const incurredAtFullDate = item.incurredAt || new Date().toISOString().split('T')[0];
  const incurredAt = incurredAtFullDate.match(/^\d{4}-\d{2}-\d{2}$/)
    ? `${incurredAtFullDate}T00:00:00Z`
    : incurredAtFullDate;

  return {
    incurredAt,
    ...pick(item, [
      ...(item.__isNew ? [] : ['id']), // Omit item's ids that were created for keying purposes
      ...(expenseItemsMustHaveFiles(expenseData.type) ? ['url'] : []), // never submit URLs for invoices or requests
      'description',
      'amount',
    ]),
  };
};

const AttachmentLabel = () => (
  <Span fontSize="13px" whiteSpace="nowrap">
    <FormattedMessage id="Expense.Attachment" defaultMessage="Attachment" />
    &nbsp;&nbsp;
    <PrivateInfoIcon color="#969BA3" />
  </Span>
);

const WithOCRComparisonWarning = ({ comparison, formatValue, children, mrClass = 'mr-10' }) => (
  <div className="relative">
    {children}
    {Boolean(comparison?.hasMismatch) && (
      <div className={cn('absolute right-0 top-0 mt-[9px]', mrClass)}>
        <Tooltip>
          <TooltipTrigger>
            <AlertTriangle size={16} color="#CB9C03" />
          </TooltipTrigger>
          <TooltipContent>
            <FormattedMessage
              defaultMessage="This value does not match the one scanned from the document ({value})"
              values={{ value: formatValue ? formatValue(comparison.ocrValue) : comparison.ocrValue.toString() }}
            />
          </TooltipContent>
        </Tooltip>
      </div>
    )}
  </div>
);

WithOCRComparisonWarning.propTypes = {
  children: PropTypes.node,
  mrClass: PropTypes.string,
  formatValue: PropTypes.func,
  comparison: PropTypes.shape({
    hasMismatch: PropTypes.bool,
    ocrValue: PropTypes.any,
  }),
};

/**
 * Form for a single attachment. Must be used with Formik.
 */
const ExpenseItemForm = ({
  collective,
  attachment,
  errors,
  onRemove,
  onUploadError,
  currency,
  requireFile,
  requireDate,
  isRichText,
  itemIdx,
  isOptional,
  editOnlyDescriptiveInfo,
  hasMultiCurrency,
  availableCurrencies,
  onCurrencyChange,
  isInvoice,
  hasOCRFeature,
  ocrComparison,
}) => {
  const intl = useIntl();
  const [showSplitConfirm, setShowSplitConfirm] = React.useState(false);
  const form = useFormikContext();
  const { formatMessage } = intl;
  const attachmentKey = `attachment-${attachment.id || attachment.url}`;
  const getFieldName = field => `items[${itemIdx}].${field}`;
  const getError = field => formatFormErrorMessage(intl, get(errors, getFieldName(field)));

  return (
    <Box mb={18} data-cy="expense-attachment-form">
      <Flex flexWrap="wrap">
        {requireFile && (
          <FastField name={getFieldName('url')}>
            {({ field, form, meta }) => {
              const hasValidUrl = field.value && isURL(field.value);
              return (
                <StyledInputField
                  mr={[1, 4]}
                  mt={2}
                  htmlFor={attachmentKey}
                  label={<AttachmentLabel />}
                  data-cy="attachment-url-field"
                  required={!isOptional}
                  error={meta.error?.type !== ERROR.FORM_FIELD_REQUIRED && formatFormErrorMessage(intl, meta.error)}
                >
                  <StyledDropzone
                    {...attachmentDropzoneParams}
                    kind="EXPENSE_ITEM"
                    data-cy={`${field.name}-dropzone`}
                    name={field.name}
                    isMulti={false}
                    error={
                      meta.error?.type === ERROR.FORM_FIELD_REQUIRED ? formatMessage(msg.receiptRequired) : meta.error
                    }
                    onSuccess={({ url }) => form.setFieldValue(field.name, url)}
                    mockImageGenerator={() => `https://loremflickr.com/120/120/invoice?lock=${attachmentKey}`}
                    fontSize="13px"
                    size={[84, 112]}
                    value={hasValidUrl && field.value}
                    onReject={onUploadError}
                    useGraphQL={hasOCRFeature}
                    parseDocument={hasOCRFeature}
                    onGraphQLSuccess={uploadResults => {
                      updateExpenseFormWithUploadResult(collective, form, uploadResults, [itemIdx]);
                    }}
                    isLoading={attachment.__isUploadingFromMultiDropzone}
                    UploadingComponent={() => <Lottie animationData={ScanningAnimationJSON} loop autoPlay />}
                  />
                </StyledInputField>
              );
            }}
          </FastField>
        )}
        <Box flex="1 1" minWidth={170} mt={2}>
          <Field name={getFieldName('description')}>
            {({ field, form }) => (
              <StyledInputField
                name={field.name}
                error={getError('description')}
                hint={<ExpenseItemDescriptionHint item={attachment} isInvoice={isInvoice} form={form} field={field} />}
                htmlFor={`${attachmentKey}-description`}
                label={formatMessage(msg.descriptionLabel)}
                labelFontSize="13px"
                required={!isOptional}
              >
                {inputProps =>
                  isRichText ? (
                    <RichTextEditor
                      inputName={inputProps.name}
                      error={inputProps.error}
                      withBorders
                      version="simplified"
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      value={field.value}
                    />
                  ) : (
                    <StyledInput
                      {...inputProps}
                      value={unescape(field.value)}
                      onChange={e => form.setFieldValue(field.name, escape(e.target.value))}
                      placeholder={get(attachment, '__file.name') || get(attachment, '__file.path')}
                    />
                  )
                }
              </StyledInputField>
            )}
          </Field>
          <Flex justifyContent="flex-end" flexDirection={['column', 'row']}>
            {requireDate && (
              <StyledInputField
                name={getFieldName('incurredAt')}
                error={getError('incurredAt')}
                htmlFor={`${attachmentKey}-incurredAt`}
                inputType="date"
                required={!isOptional}
                label={formatMessage(msg.dateLabel)}
                labelFontSize="13px"
                flex={requireFile ? '1 1 44%' : '1 1 50%'}
                mt={3}
                mr={[0, '8px']}
                disabled={editOnlyDescriptiveInfo}
              >
                {inputProps => (
                  <Field maxHeight={39} {...inputProps}>
                    {({ field }) => (
                      <WithOCRComparisonWarning comparison={ocrComparison?.['incurredAt']}>
                        <StyledInput
                          {...inputProps}
                          {...field}
                          py="7px"
                          width="100%"
                          value={typeof field.value === 'string' ? field.value.split('T')[0] : field.value}
                        />
                      </WithOCRComparisonWarning>
                    )}
                  </Field>
                )}
              </StyledInputField>
            )}
            <StyledInputField
              name={getFieldName('amount')}
              error={getError('amount')}
              htmlFor={`${attachmentKey}-amount`}
              label={formatMessage(msg.amountLabel)}
              required={!isOptional}
              labelFontSize="13px"
              inputType="number"
              flex="1 1 30%"
              minWidth={150}
              maxWidth={['100%', '40%']}
              mt={3}
              disabled={editOnlyDescriptiveInfo}
            >
              {inputProps => (
                <Field name={inputProps.name}>
                  {({ field, form: { setFieldValue } }) => (
                    <WithOCRComparisonWarning
                      comparison={ocrComparison?.['amount']}
                      formatValue={amount => formatValueAsCurrency(amount, { locale: intl.locale })}
                    >
                      <StyledInputAmount
                        {...field}
                        {...inputProps}
                        currency={currency}
                        currencyDisplay="CODE"
                        min={isOptional ? undefined : 1}
                        maxWidth="100%"
                        placeholder="0.00"
                        onChange={(value, e) => setFieldValue(e.target.name, value)}
                        onCurrencyChange={onCurrencyChange}
                        hasCurrencyPicker={hasMultiCurrency || !currency} // Makes sure user can re-select currency after a reset
                        availableCurrencies={availableCurrencies}
                      />
                    </WithOCRComparisonWarning>
                  )}
                </Field>
              )}
            </StyledInputField>
          </Flex>
        </Box>
      </Flex>
      <Flex alignItems="center" mt={3}>
        {onRemove && !editOnlyDescriptiveInfo && (
          <StyledButton
            type="button"
            buttonStyle="dangerSecondary"
            buttonSize="tiny"
            isBorderless
            ml={-10}
            onClick={() => onRemove(attachment)}
          >
            {formatMessage(requireFile ? msg.removeReceipt : msg.removeItem)}
          </StyledButton>
        )}
        {checkExpenseItemCanBeSplit(attachment, form.values.type) && (
          <React.Fragment>
            <StyledButton
              type="button"
              buttonStyle="secondary"
              buttonSize="tiny"
              isBorderless
              mr={2}
              onClick={() => setShowSplitConfirm(true)}
            >
              <FormattedMessage defaultMessage="Split items" />
            </StyledButton>
            {showSplitConfirm && (
              <SplitExpenseItemsModal form={form} itemIdx={itemIdx} onClose={() => setShowSplitConfirm(false)} />
            )}
          </React.Fragment>
        )}
        <StyledHr flex="1" borderStyle="dashed" borderColor="black.200" />
      </Flex>
    </Box>
  );
};

ExpenseItemForm.propTypes = {
  collective: PropTypes.object,
  /** The currency of the collective */
  currency: PropTypes.string,
  /** ReactHookForm key */
  name: PropTypes.string.isRequired,
  /** Called when clicking on remove */
  onRemove: PropTypes.func,
  /** A map of errors for this object */
  errors: PropTypes.object,
  /** Whether a file is required for this attachment type */
  requireFile: PropTypes.bool,
  /** Whether a date is required for this expense type */
  requireDate: PropTypes.bool,
  /** Whether this whole item is optional */
  isOptional: PropTypes.bool,
  /** Whether the OCR feature is enabled */
  hasOCRFeature: PropTypes.bool,
  /** Whether this item is the first in the list */
  hasMultiCurrency: PropTypes.bool,
  /** True if description is HTML */
  isRichText: PropTypes.bool,
  /** Called when an attachment upload fails */
  onUploadError: PropTypes.func.isRequired,
  /** For multi-currency expenses: called when the expense's currency changes */
  onCurrencyChange: PropTypes.func.isRequired,
  /** For multi-currency expenses */
  availableCurrencies: PropTypes.arrayOf(PropTypes.string),
  /** Is it an invoice */
  isInvoice: PropTypes.bool,
  /** the item data. TODO: Rename to "item" */
  attachment: PropTypes.shape({
    id: PropTypes.string,
    url: PropTypes.string,
    description: PropTypes.string,
    incurredAt: PropTypes.string,
    amount: PropTypes.number,
    __parsingResult: PropTypes.object,
    __canBeSplit: PropTypes.boolean,
    __isUploadingFromMultiDropzone: PropTypes.boolean,
  }).isRequired,
  editOnlyDescriptiveInfo: PropTypes.bool,
  itemIdx: PropTypes.number.isRequired,
  ocrComparison: PropTypes.object,
};

ExpenseItemForm.defaultProps = {
  isOptional: false,
};

ExpenseItemForm.whyDidYouRender = true;

export default React.memo(ExpenseItemForm);
