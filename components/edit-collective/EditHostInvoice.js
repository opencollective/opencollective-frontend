import { Flex, Box } from '@rebass/grid';
import gql from 'graphql-tag';
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
import { H3, P } from '../Text';

const updateSettingsMutation = gql`
  mutation EditCollectiveSettings($id: Int!, $settings: JSON) {
    editCollective(collective: { id: $id, settings: $settings }) {
      id
      settings
    }
  }
`;

const EditHostInvoice = ({ collective }) => {
  const defaultValue = get(collective.settings, 'invoiceTitle');
  const [setSettings, { loading, error, data }] = useMutation(updateSettingsMutation);
  const [value, setValue] = React.useState(defaultValue);
  const isTouched = value !== defaultValue;
  const isSaved = get(data, 'editCollective.settings.invoiceTitle') === value;

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
      <Flex flexWrap="wrap">
        <StyledInput
          placeholder="Payment Receipt"
          defaultValue={value}
          onChange={e => setValue(e.target.value)}
          width="100%"
          maxWidth={300}
          my={2}
        />
        <StyledButton
          buttonStyle="primary"
          mx={2}
          my={2}
          minWidth={200}
          loading={loading}
          maxLength={255}
          disabled={!isTouched}
          onClick={() =>
            setSettings({
              variables: {
                id: collective.id,
                settings: { ...collective.settings, invoiceTitle: value },
              },
            })
          }
        >
          {isSaved ? (
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
