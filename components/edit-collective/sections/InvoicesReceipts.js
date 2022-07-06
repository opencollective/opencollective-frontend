import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Plus, Trash } from '@styled-icons/boxicons-regular';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../lib/errors';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import MessageBox from '../../MessageBox';
import PreviewModal from '../../PreviewModal';
import StyledButton from '../../StyledButton';
import StyledHr from '../../StyledHr';
import StyledInput from '../../StyledInput';
import StyledTextarea from '../../StyledTextarea';
import { P, Span } from '../../Text';
import { editCollectiveSettingsMutation } from '../mutations';

import SettingsSectionTitle from './SettingsSectionTitle';

const messages = defineMessages({
  extraInfoPlaceholder: {
    id: 'EditHostInvoice.extraInfoPlaceholder',
    defaultMessage:
      "Add any other text to appear on payment receipts, such as your organization's tax ID number, info about tax deductibility of contributions, or a custom thank you message.",
  },
});

const InvoicesReceipts = ({ collective }) => {
  const intl = useIntl();

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
  const [showPreview, setShowPreview] = React.useState(false);
  const isTouched = receiptTitle !== defaultReceiptTitle || alternativeReceiptTitle !== defaultAlternativeReceiptTitle;
  const isSaved =
    get(data, 'editCollective.settings.invoice.templates.default.title') === receiptTitle &&
    get(data, 'editCollective.settings.invoice.templates.alternative.title') === alternativeReceiptTitle;

  // For invoice extra info
  const defaultInfo = get(collective.settings, 'invoice.templates.default.info');
  const defaultAlternativeInfo = get(collective.settings, 'invoice.templates.alternative.info');
  const [info, setInfo] = React.useState(defaultInfo);
  const [alternativeInfo, setAlternativeInfo] = React.useState(defaultAlternativeInfo);
  const infoIsTouched = info !== defaultInfo || alternativeInfo !== defaultAlternativeInfo;
  const infoIsSaved =
    get(data, 'editCollective.settings.invoice.templates.default.info') === info &&
    get(data, 'editCollective.settings.invoice.templates.alternative.info') === alternativeInfo;

  const deleteAlternativeReceipt = () => {
    setAlternativeReceiptTitle(null);
    setAlternativeInfo(null);
    setShowAlternativeReceiptsSection(false);
  };

  return (
    <Container>
      <SettingsSectionTitle>
        <FormattedMessage id="EditHostInvoice.receiptsSettings" defaultMessage="Receipt Settings" />
      </SettingsSectionTitle>
      <P>
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
        <Box color="black.800" fontSize="16px" fontWeight={700} lineHeight="24px" pt="26px">
          <FormattedMessage defaultMessage="Receipt title" />
        </Box>
        <StyledInput
          placeholder={defaultReceiptTitlePlaceholder}
          defaultValue={defaultReceiptTitlePlaceholder === receiptTitle || receiptTitle === null ? null : receiptTitle}
          onChange={e => setReceiptTitle(e.target.value === '' ? defaultReceiptTitlePlaceholder : e.target.value)}
          width="100%"
          maxWidth={414}
          mt="6px"
        />
        <P mt="6px">
          <FormattedMessage
            defaultMessage={`Keep this field empty to use the default title: ${defaultReceiptTitlePlaceholder}.`}
          />
        </P>
        <Flex justifyContent="space-between" flexDirection={['column', 'row']} pt="26px">
          <Box color="black.800" fontSize="16px" fontWeight={700} lineHeight="24px">
            <FormattedMessage defaultMessage="Custom Message" />
          </Box>
          <StyledButton
            buttonStyle="secondary"
            buttonSize="tiny"
            maxWidth="78px"
            pt="4px"
            pb="4px"
            pl="14px"
            pr="14px"
            height="24px"
            onClick={() => setShowPreview(true)}
          >
            <Span fontSize="13px" fontWeight={500} lineHeight="16px">
              <FormattedMessage defaultMessage="Preview" />
            </Span>
          </StyledButton>
        </Flex>
        <StyledTextarea
          placeholder={intl.formatMessage(messages.extraInfoPlaceholder)}
          defaultValue={info}
          onChange={e => setInfo(e.target.value)}
          width="100%"
          height="150px"
          fontSize="13px"
          mt="14px"
          mb="23px"
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
            <Plus size={14} color="#1869F5" />
            <FormattedMessage defaultMessage="Add alternative receipt" />
          </StyledButton>
        )}
        {showAlternativeReceiptsSection && (
          <Container mt="26px" mb="24px">
            <Flex flexWrap="wrap" flexDirection="column" width="100%">
              <Box color="black.800" fontSize="16px" fontWeight={700} lineHeight="24px">
                <FormattedMessage defaultMessage="Receipt title" />
              </Box>
              <StyledInput
                placeholder="Custom Receipt"
                defaultValue={alternativeReceiptTitle}
                onChange={e => setAlternativeReceiptTitle(e.target.value)}
                width="100%"
                maxWidth={414}
                mt="6px"
              />
              <P mt="6px">
                <FormattedMessage defaultMessage="Keep this field empty to use the default title: Custom receipt." />
              </P>
              <Flex justifyContent="space-between" flexDirection={['column', 'row']} pt="26px">
                <Box color="black.800" fontSize="16px" fontWeight={700} lineHeight="24px">
                  <FormattedMessage defaultMessage="Custom Message" />
                </Box>
                <StyledButton
                  buttonStyle="secondary"
                  buttonSize="tiny"
                  maxWidth="78px"
                  pt="4px"
                  pb="4px"
                  pl="14px"
                  pr="14px"
                  height="24px"
                  onClick={() => setShowPreview(true)}
                >
                  <Span fontSize="13px" fontWeight={500} lineHeight="16px">
                    <FormattedMessage defaultMessage="Preview" />
                  </Span>
                </StyledButton>
              </Flex>
              <StyledTextarea
                placeholder={intl.formatMessage(messages.extraInfoPlaceholder)}
                defaultValue={alternativeInfo}
                onChange={e => setAlternativeInfo(e.target.value)}
                width="100%"
                height="150px"
                fontSize="13px"
                mt="14px"
              />
            </Flex>
            <StyledButton
              buttonStyle="danger"
              style={{ backgroundColor: 'white', background: 'none', borderColor: '#CC2955' }}
              mt="24px"
              maxWidth={225}
              pt="7px"
              pb="7px"
              pl="18px"
              pr="16px"
              onClick={() => deleteAlternativeReceipt()}
            >
              <Trash size={14} color="#CC2955" />
              <Span fontSize="14px" fontWeight={500} lineHeight="18px" style={{ color: '#CC2955' }}>
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
          disabled={!isTouched && !infoIsTouched}
          onClick={() =>
            setSettings({
              variables: {
                id: collective.id,
                settings: {
                  ...collective.settings,
                  invoice: {
                    templates: {
                      default: { title: receiptTitle || defaultReceiptTitlePlaceholder, info: info },
                      alternative: { title: alternativeReceiptTitle, info: alternativeInfo },
                    },
                  },
                },
              },
            })
          }
        >
          {isSaved && infoIsSaved ? (
            <FormattedMessage id="saved" defaultMessage="Saved" />
          ) : (
            <FormattedMessage id="save" defaultMessage="Save" />
          )}
        </StyledButton>
      </Flex>
      {showPreview && (
        <PreviewModal
          alt="Receipt Preview"
          onClose={() => setShowPreview(false)}
          previewImage="/static/images/invoice-title-preview.jpg"
        />
      )}
    </Container>
  );
};

InvoicesReceipts.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    settings: PropTypes.object,
  }).isRequired,
};

export default InvoicesReceipts;
