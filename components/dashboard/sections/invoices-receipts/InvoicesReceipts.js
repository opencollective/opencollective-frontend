import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Plus } from '@styled-icons/boxicons-regular/Plus';
import { Trash } from '@styled-icons/boxicons-regular/Trash';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../../lib/errors';
import { editCollectiveSettingsMutation } from '../../../../lib/graphql/v1/mutations';

import Container from '../../../Container';
import SettingsSectionTitle from '../../../edit-collective/sections/SettingsSectionTitle';
import { Box, Flex } from '../../../Grid';
import MessageBox from '../../../MessageBox';
import StyledInputField from '../../../StyledInputField';
import StyledSelect from '../../../StyledSelect';
import { H2, P, Span } from '../../../Text';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/useToast';

import { useReceipt } from './hooks/useReceipt';
import ReceiptTemplateForm from './ReceiptTemplateForm';

const BILL_TO_OPTIONS = [
  {
    value: 'host',
    label: (
      <FormattedMessage
        defaultMessage="{value} (default)"
        id="OgbGHX"
        values={{ value: <FormattedMessage id="Member.Role.HOST" defaultMessage="Host" /> }}
      />
    ),
  },
  { value: 'collective', label: <FormattedMessage id="Collective" defaultMessage="Collective" /> },
];

const InvoicesReceipts = ({ account }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const defaultReceipt = useReceipt({ template: 'default', settings: account.settings });
  const alternativeReceipt = useReceipt({ template: 'alternative', settings: account.settings });
  const [setSettings, { loading, error, data }] = useMutation(editCollectiveSettingsMutation);
  const [showAlternativeReceiptsSection, setShowAlternativeReceiptsSection] = React.useState(
    alternativeReceipt.values.title !== undefined,
  );
  const [isFieldChanged, setIsFieldChanged] = React.useState(false);
  const isSaved =
    get(data, 'editCollective.settings.invoice.templates.default.title') === defaultReceipt.values.title &&
    get(data, 'editCollective.settings.invoice.templates.alternative.title') === alternativeReceipt.values.title;
  const infoIsSaved =
    get(data, 'editCollective.settings.invoice.templates.default.info') === defaultReceipt.values.info &&
    get(data, 'editCollective.settings.invoice.templates.alternative.info') === alternativeReceipt.values.info;

  // For Bill To
  const getBillToOption = value => BILL_TO_OPTIONS.find(option => option.value === value) || BILL_TO_OPTIONS[0];
  const getInExpenseTemplate = (account, field) => get(account, `settings.invoice.expenseTemplates.default.${field}`);
  const [billTo, setBillTo] = React.useState(getInExpenseTemplate(account, 'billTo'));
  const billToIsSaved = getInExpenseTemplate(account, 'billTo') === billTo;

  const deleteAlternativeReceipt = () => {
    alternativeReceipt.changeValues({ title: undefined, info: undefined });
    setShowAlternativeReceiptsSection(false);
    setIsFieldChanged(true);
  };

  const getInvoiceTemplatesObj = () => {
    const expenseTemplates = { default: { billTo } };
    const templates = {};

    templates.default = { title: defaultReceipt.values.title, info: defaultReceipt.values.info };

    const { title: alternativeTitle, info: alternativeInfo } = alternativeReceipt.values;

    if (alternativeTitle || alternativeInfo) {
      templates.alternative = { title: alternativeTitle, info: alternativeInfo };
    }

    return { templates, expenseTemplates };
  };

  const onChangeField = () => {
    setIsFieldChanged(true);
  };

  const onChange = (value, stateFunction) => {
    stateFunction(value);
    setIsFieldChanged(true);
  };

  return (
    <Container>
      <H2 mb={3} fontSize="24px" lineHeight="32px" fontWeight="700">
        <FormattedMessage id="becomeASponsor.invoiceReceipts" defaultMessage="Invoices & Receipts" />
      </H2>
      <Box mb={4}>
        <SettingsSectionTitle>
          <FormattedMessage id="Expenses" defaultMessage="Expenses" />
        </SettingsSectionTitle>

        <StyledInputField
          name="expense-bill-to-select"
          labelProps={{ fontSize: '16px', fontWeight: '700', lineHeight: '24px', color: 'black.800' }}
          label={intl.formatMessage({ defaultMessage: 'Bill To', id: 'izhuHE' })}
          hint={intl.formatMessage({
            defaultMessage:
              'Set this to "Collective" to use the collective info for generated invoices\' "Bill To" section. You need to make sure that this pattern is legal under your jurisdiction.',
            id: 'yMFA0e',
          })}
        >
          {({ id }) => (
            <StyledSelect
              inputId={id}
              options={BILL_TO_OPTIONS}
              value={getBillToOption(billTo)}
              onChange={({ value }) => onChange(value, setBillTo)}
            />
          )}
        </StyledInputField>
      </Box>
      <SettingsSectionTitle>
        <FormattedMessage id="financialContributions" defaultMessage="Financial contributions" />
      </SettingsSectionTitle>
      <P pb="26px">
        <FormattedMessage
          id="EditHostInvoice.Receipt.Instructions"
          defaultMessage="You can customize the title (and add custom text) on automatically generated receipts for financial contributions to your Collective(s), e.g., 'donation receipt' or 'tax receipt' or a phrase appropriate for your legal entity type, language, and location. Keep this field empty to use the default title:"
        />
        {/** Un-localized on purpose, because it's not localized in the actual invoice */}
        &nbsp;<i>{defaultReceipt.placeholders.title}</i>.
      </P>
      {error && (
        <MessageBox type="error" fontSize="14px" withIcon mb={3}>
          {i18nGraphqlException(intl, error)}
        </MessageBox>
      )}
      <div className="flex flex-col">
        <ReceiptTemplateForm receipt={defaultReceipt} onChange={onChangeField} />
        <div>
          <SettingsSectionTitle>
            <FormattedMessage defaultMessage="Alternative receipt template" id="CJtvlX" />
          </SettingsSectionTitle>
          <P>
            <FormattedMessage
              defaultMessage="You can create an additional receipt for you to use as a non-tax-deductible payments for cases like event tickets, merch, or services."
              id="MNi3fa"
            />
          </P>
        </div>
        <div className="mt-5 mb-10">
          {!showAlternativeReceiptsSection && (
            <Button size="sm" onClick={() => setShowAlternativeReceiptsSection(true)}>
              <Plus size={16} />
              <FormattedMessage defaultMessage="Add alternative receipt" id="7It+w9" />
            </Button>
          )}
          {showAlternativeReceiptsSection && (
            <React.Fragment>
              <Flex flexWrap="wrap" flexDirection="column" width="100%">
                <ReceiptTemplateForm receipt={alternativeReceipt} onChange={onChangeField} />
              </Flex>
              <Button onClick={() => deleteAlternativeReceipt()} variant="outlineDestructive" size="sm" className="">
                <Trash size={17} />
                <FormattedMessage defaultMessage="Delete alternative receipt" id="aXAB2R" />
              </Button>
            </React.Fragment>
          )}
        </div>
        {showAlternativeReceiptsSection && (
          <MessageBox type="info" mb={2}>
            <Span fontSize="13px" fontWeight={400} lineHeight="20px">
              <FormattedMessage
                defaultMessage="Please advise your Collectives to select the correct receipt setting for any tiers where the alternative receipt should be used, or manage related contributions through the Add Funds process, where you as the Host Admin can select the correct receipt."
                id="nYrU4E"
              />
            </Span>
          </MessageBox>
        )}
        <Button
          loading={loading}
          disabled={!isFieldChanged}
          onClick={() => {
            setSettings({
              variables: {
                id: account.legacyId,
                settings: {
                  ...account.settings,
                  invoice: getInvoiceTemplatesObj(),
                },
              },
            });
            setIsFieldChanged(false);
            toast({
              variant: 'success',
              message: <FormattedMessage defaultMessage="Invoices updated successfully" id="6P4LG/" />,
            });
          }}
        >
          {isSaved && infoIsSaved && billToIsSaved ? (
            <FormattedMessage id="saved" defaultMessage="Saved" />
          ) : (
            <FormattedMessage id="save" defaultMessage="Save" />
          )}
        </Button>
      </div>
    </Container>
  );
};

InvoicesReceipts.propTypes = {
  account: PropTypes.shape({
    legacyId: PropTypes.number.isRequired,
    settings: PropTypes.object,
  }).isRequired,
};

export default InvoicesReceipts;
