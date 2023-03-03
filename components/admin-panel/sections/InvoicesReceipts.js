import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Plus } from '@styled-icons/boxicons-regular/Plus';
import { Trash } from '@styled-icons/boxicons-regular/Trash';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../lib/errors';

import { editCollectiveSettingsMutation } from '../../collective-page/graphql/mutations';
import Container from '../../Container';
import SettingsSectionTitle from '../../edit-collective/sections/SettingsSectionTitle';
import { Box, Flex } from '../../Grid';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledHr from '../../StyledHr';
import StyledInputField from '../../StyledInputField';
import StyledSelect from '../../StyledSelect';
import { H2, P, Span } from '../../Text';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';

import ReceiptTemplateForm from './ReceiptTemplateForm';

const messages = defineMessages({
  extraInfoPlaceholder: {
    id: 'EditHostInvoice.extraInfoPlaceholder',
    defaultMessage:
      "Add any other text to appear on payment receipts, such as your organization's tax ID number, info about tax deductibility of contributions, or a custom thank you message.",
  },
});

const BILL_TO_OPTIONS = [
  {
    value: 'host',
    label: (
      <FormattedMessage
        defaultMessage="{value} (default)"
        values={{ value: <FormattedMessage id="Member.Role.HOST" defaultMessage="Host" /> }}
      />
    ),
  },
  { value: 'collective', label: <FormattedMessage id="Collective" defaultMessage="Collective" /> },
];

const InvoicesReceipts = ({ collective }) => {
  const intl = useIntl();
  const { addToast } = useToasts();

  // For invoice Title
  const defaultReceiptTitlePlaceholder = 'Payment Receipt';
  const defaultReceiptTitle = get(collective.settings, 'invoice.templates.default.title');
  const defaultAlternativeReceiptTitle = get(collective.settings, 'invoice.templates.alternative.title', null);
  const [setSettings, { loading, error, data }] = useMutation(editCollectiveSettingsMutation);
  const [receiptTitle, setReceiptTitle] = React.useState(defaultReceiptTitle);
  const [alternativeReceiptTitle, setAlternativeReceiptTitle] = React.useState(defaultAlternativeReceiptTitle);
  const [showAlternativeReceiptsSection, setShowAlternativeReceiptsSection] = React.useState(
    defaultAlternativeReceiptTitle !== null,
  );
  const [isFieldChanged, setIsFieldChanged] = React.useState(false);
  const isSaved =
    get(data, 'editCollective.settings.invoice.templates.default.title') === receiptTitle &&
    get(data, 'editCollective.settings.invoice.templates.alternative.title', null) === alternativeReceiptTitle;

  // For invoice extra info
  const defaultInfo = get(collective.settings, 'invoice.templates.default.info');
  const defaultAlternativeInfo = get(collective.settings, 'invoice.templates.alternative.info');
  const [info, setInfo] = React.useState(defaultInfo);
  const [alternativeInfo, setAlternativeInfo] = React.useState(defaultAlternativeInfo);
  const infoIsSaved =
    get(data, 'editCollective.settings.invoice.templates.default.info') === info &&
    get(data, 'editCollective.settings.invoice.templates.alternative.info') === alternativeInfo;

  // For Bill To
  const getBillToOption = value => BILL_TO_OPTIONS.find(option => option.value === value) || BILL_TO_OPTIONS[0];
  const getInExpenseTemplate = (account, field) => get(account, `settings.invoice.expenseTemplates.default.${field}`);
  const [billTo, setBillTo] = React.useState(getInExpenseTemplate(collective, 'billTo'));
  const billToIsSaved = getInExpenseTemplate(collective, 'billTo') === billTo;

  const deleteAlternativeReceipt = () => {
    setAlternativeReceiptTitle(null);
    setAlternativeInfo(null);
    setShowAlternativeReceiptsSection(false);
    setIsFieldChanged(true);
  };

  const getInvoiceTemplatesObj = () => {
    const templates = { default: { title: receiptTitle, info: info } };
    const expenseTemplates = { default: { billTo } };

    if (alternativeReceiptTitle || alternativeInfo) {
      templates.alternative = { title: alternativeReceiptTitle, info: alternativeInfo };
    }

    return { templates, expenseTemplates };
  };

  const onChangeDefault = (title, info) => {
    if (title) {
      setReceiptTitle(title === '' ? defaultReceiptTitlePlaceholder : title);
    }
    if (info) {
      setInfo(info);
    }
    setIsFieldChanged(true);
  };

  const onChangeAlternate = (title, info) => {
    if (title) {
      setAlternativeReceiptTitle(title);
    }
    if (info) {
      setAlternativeInfo(info);
    }
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
          label={intl.formatMessage({ defaultMessage: 'Bill To' })}
          hint={intl.formatMessage({
            defaultMessage:
              'Set this to "Collective" to use the collective info for generated invoices\' "Bill To" section. You need to make sure that this pattern is legal under your jurisdiction.',
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
        &nbsp;<i>{defaultReceiptTitlePlaceholder}</i>.
      </P>
      {error && (
        <MessageBox type="error" fontSize="14px" withIcon mb={3}>
          {i18nGraphqlException(intl, error)}
        </MessageBox>
      )}
      <Flex flexWrap="wrap" flexDirection="column" width="100%">
        <ReceiptTemplateForm
          defaultTemplate
          value={{
            title: defaultReceiptTitlePlaceholder === receiptTitle || receiptTitle === null ? null : receiptTitle,
            info,
          }}
          placeholders={{
            title: defaultReceiptTitlePlaceholder,
            info: intl.formatMessage(messages.extraInfoPlaceholder),
          }}
          onChange={onChangeDefault}
        />
        <SettingsSectionTitle>
          <FormattedMessage defaultMessage="Alternative receipt template" />
        </SettingsSectionTitle>
        <P>
          <FormattedMessage defaultMessage="You can create an additional receipt for you to use as a non-tax-deductible payments for cases like event tickets, merch, or services." />
        </P>
        {!showAlternativeReceiptsSection && (
          <StyledButton
            buttonStyle="secondary"
            mt="24px"
            mb="24px"
            maxWidth={209}
            pt="7px"
            pb="7px"
            pl="18px"
            pr="16px"
            onClick={() => setShowAlternativeReceiptsSection(true)}
          >
            <Flex fontSize="14px" fontWeight={500} lineHeight="18px" color="#1869F5">
              <Box pr="10px">
                <Plus size={17} />
              </Box>
              <FormattedMessage defaultMessage="Add alternative receipt" />
            </Flex>
          </StyledButton>
        )}
        {showAlternativeReceiptsSection && (
          <Container mt="26px" mb="24px">
            <Flex flexWrap="wrap" flexDirection="column" width="100%">
              <ReceiptTemplateForm
                value={{ title: alternativeReceiptTitle, info: alternativeInfo }}
                placeholders={{ title: 'Custom Receipt', info: intl.formatMessage(messages.extraInfoPlaceholder) }}
                onChange={onChangeAlternate}
              />
            </Flex>
            <StyledButton
              buttonStyle="danger"
              borderColor="#CC2955"
              backgroundColor="white"
              background="none"
              mt="24px"
              maxWidth={225}
              pt="7px"
              pb="7px"
              pl="18px"
              pr="16px"
              onClick={() => deleteAlternativeReceipt()}
            >
              <Span display="flex" fontSize="14px" fontWeight={500} lineHeight="18px" color="#CC2955">
                <Box pr="10px">
                  <Trash size={17} />
                </Box>
                <FormattedMessage defaultMessage="Delete alternative receipt" />
              </Span>
            </StyledButton>
          </Container>
        )}
        <StyledHr borderColor="#C3C6CB" />
        {showAlternativeReceiptsSection && (
          <MessageBox type="info" mt="24px">
            <Span fontSize="13px" fontWeight={400} lineHeight="20px">
              <FormattedMessage defaultMessage="Please advise your Collectives to select the correct receipt setting for any tiers where the alternative receipt should be used, or manage related contributions through the Add Funds process, where you as the Host Admin can select the correct receipt." />
            </Span>
          </MessageBox>
        )}
        <StyledButton
          buttonStyle="primary"
          mt="24px"
          maxWidth={200}
          loading={loading}
          disabled={!isFieldChanged}
          onClick={() => {
            setSettings({
              variables: {
                id: collective.legacyId,
                settings: {
                  ...collective.settings,
                  invoice: getInvoiceTemplatesObj(),
                },
              },
            });
            setIsFieldChanged(false);
            addToast({
              type: TOAST_TYPE.SUCCESS,
              message: <FormattedMessage defaultMessage="Invoices updated successfully" />,
            });
          }}
        >
          {isSaved && infoIsSaved && billToIsSaved ? (
            <FormattedMessage id="saved" defaultMessage="Saved" />
          ) : (
            <FormattedMessage id="save" defaultMessage="Save" />
          )}
        </StyledButton>
      </Flex>
    </Container>
  );
};

InvoicesReceipts.propTypes = {
  collective: PropTypes.shape({
    legacyId: PropTypes.number.isRequired,
    settings: PropTypes.object,
  }).isRequired,
};

export default InvoicesReceipts;
