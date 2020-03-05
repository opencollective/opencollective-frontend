import { Box, Flex } from '@rebass/grid';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { v4 as uuid } from 'uuid';
import { isEmpty } from 'lodash';

import Container from '../Container';
import { I18nBold } from '../I18nFormatters';
import StyledButton from '../StyledButton';
import StyledDropzone from '../StyledDropzone';
import { P, Span } from '../Text';
import ExpenseAttachmentForm from './ExpenseAttachmentForm';
import { attachmentDropzoneParams, attachmentRequiresFile } from './lib/attachments';
import { toIsoDateStr } from '../../lib/date-utils';
import expenseTypes from '../../lib/constants/expenseTypes';
import AttachmentsTotalAmount from './AttachmentsTotalAmount';

/** Init a new attachments with default attributes */
const newAttachment = attrs => ({
  id: uuid(), // we generate it here to properly key lists, but it won't be submitted to API
  incurredAt: toIsoDateStr(new Date()),
  description: '',
  amount: null,
  url: '',
  ...attrs,
});

/** Converts a list of filenames to attachment objects */
const filesListToAttachments = files => files.map(url => newAttachment({ url }));

export default class ExpenseFormAttachments extends React.PureComponent {
  static propTypes = {
    /** Array helper as provided by formik */
    push: PropTypes.func.isRequired,
    /** Array helper as provided by formik */
    remove: PropTypes.func.isRequired,
    /** Formik */
    form: PropTypes.shape({
      values: PropTypes.object.isRequired,
      touched: PropTypes.object,
      errors: PropTypes.object,
    }).isRequired,
  };

  componentDidMount() {
    this.addDefaultAttachmentIfEmpty();
  }

  componentDidUpdate() {
    this.addDefaultAttachmentIfEmpty();
  }

  addDefaultAttachmentIfEmpty() {
    const { values } = this.props.form;
    if (values.type === expenseTypes.INVOICE && isEmpty(values.attachments)) {
      this.props.push(newAttachment());
    }
  }

  remove = attachment => {
    const idx = this.props.form.values.attachments.findIndex(a => a.id === attachment.id);
    if (idx !== -1) {
      this.props.remove(idx);
    }
  };

  render() {
    const { values, errors } = this.props.form;
    const requireFile = attachmentRequiresFile(values.type);
    const attachments = values.attachments || [];
    const hasAttachments = attachments.length > 0;

    if (!hasAttachments && requireFile) {
      return (
        <StyledDropzone
          {...attachmentDropzoneParams}
          data-cy="expense-multi-attachments-dropzone"
          onSuccess={files => filesListToAttachments(files).map(this.props.push)}
          showDefaultMessage
          mockImageGenerator={index => `https://loremflickr.com/120/120/invoice?lock=${index}`}
          mb={3}
        >
          <P color="black.700" mt={1}>
            <FormattedMessage
              id="MultipleAttachmentsDropzone.UploadWarning"
              defaultMessage="<i18n-bold>Important</i18n-bold>: Expenses will not be paid without a valid receipt."
              values={{ 'i18n-bold': I18nBold }}
            />
          </P>
        </StyledDropzone>
      );
    }

    const onRemove = requireFile || attachments.length > 1 ? this.remove : null;
    return (
      <Box>
        {attachments.map((attachment, index) => (
          <ExpenseAttachmentForm
            key={`attachment-${attachment.id}`}
            attachment={attachment}
            currency={values.currency}
            name={`attachments[${index}]`}
            errors={errors}
            onRemove={onRemove}
            requireFile={requireFile}
          />
        ))}
        <StyledButton
          type="button"
          buttonStyle="secondary"
          width="100%"
          onClick={() => {
            this.props.push(newAttachment());
            if (!hasAttachments) {
              this.props.push(newAttachment());
            }
          }}
        >
          <Span mr={2}>
            {requireFile ? (
              <FormattedMessage id="ExpenseForm.AddReceipt" defaultMessage="Add another receipt" />
            ) : (
              <FormattedMessage id="ExpenseForm.AddLineItem" defaultMessage="Add another line item" />
            )}
          </Span>
          <Span fontWeight="bold">+</Span>
        </StyledButton>
        <Container display="flex" borderTop="1px dashed #eaeaea" my={3} pt={3} justifyContent="flex-end">
          <Flex width={220} justifyContent="space-between" alignItems="center">
            <Container fontSize="Caption" fontWeight="bold" mr={2}>
              <FormattedMessage id="ExpenseFormAttachments.TotalAmount" defaultMessage="Total amount:" />
            </Container>
            <AttachmentsTotalAmount name={name} currency={values.currency} attachments={attachments} />
          </Flex>
        </Container>
      </Box>
    );
  }
}
