import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';
import { v4 as uuid } from 'uuid';

import expenseTypes from '../../lib/constants/expenseTypes';
import { toIsoDateStr } from '../../lib/date-utils';
import { formatErrorMessage } from '../../lib/errors';
import { attachmentDropzoneParams, attachmentRequiresFile } from './lib/attachments';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import { I18nBold } from '../I18nFormatters';
import MessageBox from '../MessageBox';
import StyledDropzone from '../StyledDropzone';
import { P } from '../Text';

import ExpenseItemForm from './ExpenseItemForm';
import ExpenseItemsTotalAmount from './ExpenseItemsTotalAmount';

/** Init a new expense item with default attributes */
const newExpenseItem = attrs => ({
  id: uuid(), // we generate it here to properly key lists, but it won't be submitted to API
  incurredAt: toIsoDateStr(new Date()),
  description: '',
  amount: null,
  url: '',
  __isNew: true,
  ...attrs,
});

/** Converts a list of filenames to expense item objects */
const filesListToItems = files => files.map(url => newExpenseItem({ url }));

/** Helper to add a new item to the form */
export const addNewExpenseItem = (formik, defaultValues) => {
  formik.setFieldValue('items', [...(formik.values.items || []), newExpenseItem(defaultValues)]);
};

class ExpenseFormItems extends React.PureComponent {
  static propTypes = {
    /** @ignore from injectIntl */
    intl: PropTypes.object,
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

  state = { uploadErrors: null };

  componentDidMount() {
    const { values } = this.props.form;
    if (values.type === expenseTypes.INVOICE || values.type === expenseTypes.FUNDING_REQUEST) {
      this.addDefaultItem();
    }
  }

  componentDidUpdate(oldProps) {
    const { values, touched } = this.props.form;

    if (oldProps.form.values.type !== values.type) {
      if (values.type === expenseTypes.INVOICE || values.type === expenseTypes.FUNDING_REQUEST) {
        this.addDefaultItem();
      } else if (!touched.items && values.items?.length === 1) {
        const firstItem = values.items[0];
        if (!firstItem.url && !firstItem.description && !firstItem.amount) {
          this.props.remove(0);
        }
      }
    }
  }

  addDefaultItem() {
    const { values } = this.props.form;
    if (isEmpty(values.items)) {
      this.props.push(newExpenseItem());
    }
  }

  remove = item => {
    const idx = this.props.form.values.items.findIndex(a => a.id === item.id);
    if (idx !== -1) {
      this.props.remove(idx);
    }
  };

  renderErrors() {
    const { uploadErrors } = this.state;
    if (!uploadErrors?.length) {
      return null;
    } else {
      return (
        <MessageBox type="error" withIcon mb={2}>
          <strong>
            <FormattedMessage
              id="FilesUploadFailed"
              defaultMessage="{count, plural, one {The file} other {# files}} failed to upload"
              values={{ count: uploadErrors.length }}
            />
          </strong>
          <P mt={1} pl={22}>
            {formatErrorMessage(this.props.intl, uploadErrors[0])}
          </P>
        </MessageBox>
      );
    }
  }

  render() {
    const { values, errors } = this.props.form;
    const requireFile = attachmentRequiresFile(values.type);
    const isFundingRequest = values.type === expenseTypes.FUNDING_REQUEST;
    const items = values.items || [];
    const hasItems = items.length > 0;

    if (!hasItems && requireFile) {
      return (
        <React.Fragment>
          {this.renderErrors()}
          <StyledDropzone
            {...attachmentDropzoneParams}
            data-cy="expense-multi-attachments-dropzone"
            onSuccess={files => filesListToItems(files).map(this.props.push)}
            onReject={uploadErrors => this.setState({ uploadErrors })}
            mockImageGenerator={index => `https://loremflickr.com/120/120/invoice?lock=${index}`}
            mb={3}
          >
            <P color="black.700" mt={1} px={2}>
              <FormattedMessage
                id="MultipleAttachmentsDropzone.UploadWarning"
                defaultMessage="<i18n-bold>Important</i18n-bold>: Expenses will not be paid without a valid receipt."
                values={{ 'i18n-bold': I18nBold }}
              />
            </P>
          </StyledDropzone>
        </React.Fragment>
      );
    }

    const onRemove = requireFile || items.length > 1 ? this.remove : null;
    return (
      <Box>
        {this.renderErrors()}
        {items.map((attachment, index) => (
          <ExpenseItemForm
            key={`item-${attachment.id}`}
            attachment={attachment}
            currency={values.currency}
            name={`items[${index}]`}
            errors={errors}
            onRemove={onRemove}
            requireFile={requireFile}
            requireDate={!isFundingRequest}
            isRichText={isFundingRequest}
            onUploadError={e => this.setState({ uploadErrors: [e] })}
            isOptional={values.payee?.isInvite}
          />
        ))}
        <Flex alignItems="center" my={3}>
          <Box flex="0 1" flexBasis={['3%', requireFile ? '53%' : '47%']} />
          <Container fontSize="12px" fontWeight="500" mr={3} whiteSpace="nowrap">
            <FormattedMessage id="ExpenseFormAttachments.TotalAmount" defaultMessage="Total amount:" />
          </Container>
          <ExpenseItemsTotalAmount name={name} currency={values.currency} items={items} />
        </Flex>
      </Box>
    );
  }
}

export default injectIntl(ExpenseFormItems);
