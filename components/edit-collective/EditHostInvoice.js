import { Flex, Box } from '@rebass/grid';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { useMutation } from 'react-apollo';
import { FormattedMessage } from 'react-intl';

import imgInvoiceTitlePreview from '../../static/images/invoice-title-preview.jpg';

import { getErrorFromGraphqlException } from '../../lib/utils';
import Container from '../Container';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledTextarea from '../StyledTextarea';
import { H3, P } from '../Text';
import { updateSettingsMutation } from './mutations';

const EditHostInvoice = ({ collective }) => {
  // For invoice Title
  const defaultValue = get(collective.settings, 'invoiceTitle');
  const [setSettings, { loading, error, data }] = useMutation(updateSettingsMutation);
  const [value, setValue] = React.useState(defaultValue);
  const isTouched = value !== defaultValue;
  const isSaved = get(data, 'editCollective.settings.invoiceTitle') === value;

  // For invoice extra info
  const defaultInfo = get(collective.settings, 'extraInfo');
  const [info, setInfo] = React.useState(defaultInfo);
  const isTouch = info !== defaultInfo;
  const isSave = get(data, 'editCollective.settings.extraInfo') === info;

  return (
    <Container>
      <H3>
        <FormattedMessage id="editCollective.menu.invoicesAndReceipts" defaultMessage="Invoices & Receipts" />
      </H3>
      <P fontWeight="bold">
        <FormattedMessage id="EditHostInvoice.receiptsSettings" defaultMessage="Receipt settings" />
      </P>
      <P>
        <FormattedMessage
          id="EditHostInvoice.Receipt.Instructions"
          defaultMessage="You can define a custom title that will appear on the receipts generated for the contributors of the Collectives you are hosting. Keep this field empty to use the default title:"
        />
        {/** Un-localized on purpose, because it's not localized in the actual invoice */}
        &nbsp;<i>Payment Receipt</i>.
      </P>
      {error && (
        <MessageBox type="error" fontSize="Paragraph" withIcon mb={3}>
          {getErrorFromGraphqlException(setValue).message}
        </MessageBox>
      )}
      <Flex flexWrap="wrap" flexDirection="column">
        <StyledInput
          placeholder="Payment Receipt"
          defaultValue={value}
          onChange={e => setValue(e.target.value)}
          width="100%"
          maxWidth={300}
          my={3}
        />

        <StyledTextarea
          placeholder="Add any other text to appear on payment receipts, such as your organization's tax ID number, info about tax deductibility of contributions, or a custom thank you message."
          defaultValue={info}
          onChange={e => setInfo(e.target.value)}
          width="100%"
          height="150px"
          maxWidth={300}
          my={2}
        />

        {/* <textarea placeholder="Add any other text to appear on payment receipts, such as your organization's tax ID number, info about tax deductibility of contributions, or a custom thank you message."defaultInfo={info} onChange={e => setInfo(e.target.value)}> </textarea> */}

        <StyledButton
          buttonStyle="primary"
          my={2}
          maxWidth={300}
          minWidth={200}
          loading={loading}
          maxLength={255}
          disabled={!isTouched && !isTouch}
          onClick={() =>
            setSettings({
              variables: {
                id: collective.id,
                settings: { ...collective.settings, invoiceTitle: value, extraInfo: info },
              },
            })
          }
        >
          {isSaved && isSave ? (
            <FormattedMessage id="saved" defaultMessage="Saved" />
          ) : (
            <FormattedMessage id="save" defaultMessage="Save" />
          )}
        </StyledButton>
      </Flex>
      <Box mt={3} maxWidth={400}>
        <img src={imgInvoiceTitlePreview} alt="" />
      </Box>
    </Container>
  );
};

EditHostInvoice.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    settings: PropTypes.object,
  }).isRequired,
};

export default EditHostInvoice;
