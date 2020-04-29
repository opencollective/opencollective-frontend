import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { v4 as uuid } from 'uuid';

import expenseTypes from '../../lib/constants/expenseTypes';
import { toIsoDateStr } from '../../lib/date-utils';
import { attachmentDropzoneParams, attachmentRequiresFile } from './lib/attachments';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import { I18nBold } from '../I18nFormatters';
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

export default class ExpenseFormItems extends React.PureComponent {
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
    const { values } = this.props.form;
    if (values.type === expenseTypes.INVOICE) {
      this.addDefaultItem();
    }
  }

  componentDidUpdate(oldProps) {
    const { values, touched } = this.props.form;

    if (oldProps.form.values.type !== values.type) {
      if (values.type === expenseTypes.INVOICE) {
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

  render() {
    const { values, errors } = this.props.form;
    const requireFile = attachmentRequiresFile(values.type);
    const items = values.items || [];
    const hasItems = items.length > 0;

    if (!hasItems && requireFile) {
      return (
        <StyledDropzone
          {...attachmentDropzoneParams}
          data-cy="expense-multi-attachments-dropzone"
          onSuccess={files => filesListToItems(files).map(this.props.push)}
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
      );
    }

    const onRemove = requireFile || items.length > 1 ? this.remove : null;
    return (
      <Box>
        {items.map((attachment, index) => (
          <ExpenseItemForm
            key={`item-${attachment.id}`}
            attachment={attachment}
            currency={values.currency}
            name={`items[${index}]`}
            errors={errors}
            onRemove={onRemove}
            requireFile={requireFile}
          />
        ))}
        <Flex alignItems="center" my={3}>
          <Box flex="0 1" flexBasis={['3%', requireFile ? '53%' : '47%']} />
          <Container fontSize="Caption" fontWeight="500" mr={3} whiteSpace="nowrap">
            <FormattedMessage id="ExpenseFormAttachments.TotalAmount" defaultMessage="Total amount:" />
          </Container>
          <ExpenseItemsTotalAmount name={name} currency={values.currency} items={items} />
        </Flex>
      </Box>
    );
  }
}
