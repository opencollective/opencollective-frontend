import React from 'react';
import PropTypes from 'prop-types';
import { accountHasGST, accountHasVAT, TaxType } from '@opencollective/taxes';
import { isEmpty, uniq } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';
import { v4 as uuid } from 'uuid';

import hasFeature, { FEATURES } from '../../lib/allowed-features';
import { Currency, PayPalSupportedCurrencies } from '../../lib/constants/currency';
import expenseTypes from '../../lib/constants/expenseTypes';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { toIsoDateStr } from '../../lib/date-utils';
import { formatErrorMessage } from '../../lib/errors';
import { i18nTaxType } from '../../lib/i18n/taxes';
import { attachmentDropzoneParams, attachmentRequiresFile } from './lib/attachments';

import { Box, Flex } from '../Grid';
import { I18nBold } from '../I18nFormatters';
import MessageBox from '../MessageBox';
import StyledCheckbox from '../StyledCheckbox';
import StyledDropzone from '../StyledDropzone';
import StyledHr from '../StyledHr';
import { P, Span } from '../Text';

import ExpenseAmountBreakdown from './ExpenseAmountBreakdown';
import ExpenseGSTFormikFields from './ExpenseGSTFormikFields';
import ExpenseItemForm from './ExpenseItemForm';
import ExpenseVATFormikFields from './ExpenseVATFormikFields';

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
const filesListToItems = files => files.map(({ url }) => newExpenseItem({ url }));

/** Helper to add a new item to the form */
export const addNewExpenseItem = (formik, defaultValues) => {
  formik.setFieldValue('items', [...(formik.values.items || []), newExpenseItem(defaultValues)]);
};

class ExpenseFormItems extends React.PureComponent {
  static propTypes = {
    collective: PropTypes.object,
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
      setFieldValue: PropTypes.func,
    }).isRequired,
  };

  state = { uploadErrors: null };

  componentDidMount() {
    const { values } = this.props.form;
    if ([expenseTypes.INVOICE, expenseTypes.FUNDING_REQUEST, expenseTypes.GRANT].includes(values.type)) {
      this.addDefaultItem();
    }
  }

  componentDidUpdate(oldProps) {
    const { values, touched } = this.props.form;

    if (oldProps.form.values.type !== values.type) {
      if ([expenseTypes.INVOICE, expenseTypes.FUNDING_REQUEST, expenseTypes.GRANT].includes(values.type)) {
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
            {formatErrorMessage(this.props.intl, uploadErrors[0]?.message)}
          </P>
        </MessageBox>
      );
    }
  }

  onCurrencyChange = newCurrency => {
    this.props.form.setFieldValue('currency', newCurrency);
  };

  getPossibleCurrencies = () => {
    const { collective, form } = this.props;

    if (
      (!hasFeature(collective, FEATURES.MULTI_CURRENCY_EXPENSES) &&
        !hasFeature(collective.host, FEATURES.MULTI_CURRENCY_EXPENSES)) ||
      payoutMethod?.type === PayoutMethodType.ACCOUNT_BALANCE
    ) {
      return [collective.currency];
    }

    const { payoutMethod, currency } = form.values;
    const isPayPal = payoutMethod?.type === PayoutMethodType.PAYPAL;
    if (isPayPal) {
      return PayPalSupportedCurrencies;
    } else if (payoutMethod?.type === PayoutMethodType.OTHER) {
      return Currency;
    } else {
      return uniq(
        [
          currency,
          collective.currency,
          collective.host?.currency,
          payoutMethod?.currency,
          payoutMethod?.data?.currency,
        ].filter(Boolean),
      );
    }
  };

  getApplicableTaxType() {
    const { collective, form } = this.props;
    if (form.values.type === expenseTypes.INVOICE) {
      if (accountHasVAT(collective)) {
        return TaxType.VAT;
      } else if (accountHasGST(collective)) {
        return TaxType.GST;
      }
    }
  }

  renderTaxFormFields(taxType, isOptional) {
    switch (taxType) {
      case TaxType.VAT:
        return <ExpenseVATFormikFields formik={this.props.form} isOptional={isOptional} />;
      case TaxType.GST:
        return <ExpenseGSTFormikFields formik={this.props.form} isOptional={isOptional} />;
      default:
        return `Tax not supported: ${taxType}`;
    }
  }

  render() {
    const { values, errors, setFieldValue } = this.props.form;
    const requireFile = attachmentRequiresFile(values.type);
    const isGrant = values.type === expenseTypes.FUNDING_REQUEST || values.type === expenseTypes.GRANT;
    const isCreditCardCharge = values.type === expenseTypes.CHARGE;
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
    const availableCurrencies = this.getPossibleCurrencies();
    const taxType = this.getApplicableTaxType();
    const hasTaxFields = taxType && !values.taxes?.[0]?.isDisabled; // True by default
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
            requireDate={!isGrant}
            isRichText={isGrant}
            onUploadError={e => this.setState({ uploadErrors: [e] })}
            isOptional={values.payee?.isInvite}
            editOnlyDescriptiveInfo={isCreditCardCharge}
            hasMultiCurrency={!index && availableCurrencies?.length > 1} // Only display currency picker for the first item
            availableCurrencies={availableCurrencies}
            onCurrencyChange={this.onCurrencyChange}
            isLastItem={index === items.length - 1}
          />
        ))}
        {taxType && (
          <div>
            <Flex alignItems="center" mt={24}>
              <Span color="black.900" fontSize="16px" lineHeight="21px" fontWeight="bold">
                <FormattedMessage defaultMessage="Tax and Total" />
              </Span>
              <StyledHr flex="1" borderColor="black.300" mx={2} />
            </Flex>
            <Box mt="8px" display="inline-block">
              <StyledCheckbox
                name={`tax-${taxType}`}
                checked={hasTaxFields}
                onChange={({ checked }) => {
                  // Using "isDisabled" flag rather than removing to preserve data when enabled/disabled
                  if (checked) {
                    const tax = { ...values.taxes?.[0], type: taxType, isDisabled: false };
                    setFieldValue('taxes', [tax]);
                  } else {
                    setFieldValue('taxes.0.isDisabled', true);
                  }
                }}
                label={
                  <FormattedMessage
                    defaultMessage="Apply {taxName}"
                    values={{ taxName: i18nTaxType(this.props.intl, taxType) }}
                  />
                }
              />
            </Box>
          </div>
        )}
        {taxType && !hasTaxFields && <StyledHr borderColor="black.300" borderStyle="dotted" mb={24} mt={24} />}
        <Flex justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" mt={24}>
          <Box flexBasis={['100%', null, null, '50%']} mb={3}>
            {hasTaxFields && this.renderTaxFormFields(taxType, Boolean(values.payee?.isInvite))}
          </Box>
          <Box mb={3} ml={[0, null, null, 4]} flexBasis={['100%', null, null, 'auto']}>
            <ExpenseAmountBreakdown currency={values.currency} items={items} taxes={values.taxes} />
          </Box>
        </Flex>
      </Box>
    );
  }
}

export default injectIntl(ExpenseFormItems);
