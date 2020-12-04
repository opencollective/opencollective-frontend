import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { getErrorFromGraphqlException } from '../../../lib/errors';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledInput from '../../StyledInput';
import StyledTextarea from '../../StyledTextarea';
import { H3, H4, P } from '../../Text';
import { editCollectiveSettingsMutation } from '../mutations';

import imgInvoiceTitlePreview from '../../../public/static/images/invoice-title-preview.jpg';

const messages = defineMessages({
  extraInfoPlaceholder: {
    id: 'EditHostInvoice.extraInfoPlaceholder',
    defaultMessage:
      "Add any other text to appear on payment receipts, such as your organization's tax ID number, info about tax deductibility of contributions, or a custom thank you message.",
  },
});

const InvoicesReceipts = ({ collective }) => {
  const { formatMessage } = useIntl();

  // For invoice Title
  const defaultValue = get(collective.settings, 'invoiceTitle');
  const [setSettings, { loading, error, data }] = useMutation(editCollectiveSettingsMutation);
  const [value, setValue] = React.useState(defaultValue);
  const isTouched = value !== defaultValue;
  const isSaved = get(data, 'editCollective.settings.invoiceTitle') === value;

  // For invoice extra info
  const defaultInfo = get(collective.settings, 'invoice.extraInfo');
  const [info, setInfo] = React.useState(defaultInfo);
  const infoIsTouched = info !== defaultInfo;
  const infoIsSaved = get(data, 'editCollective.settings.invoice.extraInfo') === info;

  return (
    <Container>
      <H3>
        <FormattedMessage id="becomeASponsor.invoiceReceipts" defaultMessage="Invoices & Receipts" />
      </H3>
      <H4 mt={2}>
        <FormattedMessage id="EditHostInvoice.receiptsSettings" defaultMessage="Receipt Settings" />
      </H4>
      <P>
        <FormattedMessage
          id="EditHostInvoice.Receipt.Instructions"
          defaultMessage="You can define a custom title that will appear on the receipts generated for the contributors of the Collectives you are hosting. Keep this field empty to use the default title:"
        />
        {/** Un-localized on purpose, because it's not localized in the actual invoice */}
        &nbsp;<i>Payment Receipt</i>.
      </P>
      {error && (
        <MessageBox type="error" fontSize="14px" withIcon mb={3}>
          {getErrorFromGraphqlException(setValue).message}
        </MessageBox>
      )}
      <Flex flexWrap="wrap" justifyContent="space-between" maxWidth={800}>
        <Flex flexWrap="wrap" flexDirection="column" width="100%" maxWidth={350}>
          <StyledInput
            placeholder="Payment Receipt"
            defaultValue={value}
            onChange={e => setValue(e.target.value)}
            width="100%"
            maxWidth={350}
            my={3}
          />

          <StyledTextarea
            placeholder={formatMessage(messages.extraInfoPlaceholder)}
            defaultValue={info}
            onChange={e => setInfo(e.target.value)}
            width="100%"
            height="150px"
            maxWidth={350}
            fontSize="13px"
            my={2}
          />

          <StyledButton
            buttonStyle="primary"
            my={2}
            maxWidth={300}
            minWidth={200}
            loading={loading}
            maxLength={255}
            disabled={!isTouched && !infoIsTouched}
            onClick={() =>
              setSettings({
                variables: {
                  id: collective.id,
                  settings: { ...collective.settings, invoiceTitle: value, invoice: { extraInfo: info } },
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
        <Box mt={3} maxWidth={400}>
          <img src={imgInvoiceTitlePreview} alt="" />
        </Box>
      </Flex>
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
