import React from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { connectAccount, disconnectAccount } from '../../lib/api';

import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import { P } from '../Text';

const EditTransferWiseAccount = ({ collective, ...props }) => {
  const router = useRouter();
  const error = router.query?.error;
  const [connectedAccount, setConnectedAccount] = React.useState(props.connectedAccount);
  const handleConnect = async () => {
    const json = await connectAccount(collective.id, 'transferwise');
    window.location.href = json.redirectUrl;
  };
  const handleDisconnect = async () => {
    const json = await disconnectAccount(collective.id, 'transferwise');
    if (json.deleted === true) {
      setConnectedAccount(null);
    }
  };

  if (!connectedAccount) {
    return (
      <React.Fragment>
        <P fontSize="13px" color="black.700" fontWeight="normal" mb={3}>
          <FormattedMessage
            id="collective.create.connectedAccounts.transferwise.description"
            defaultMessage="Connect a Wise account to pay expenses with one click."
          />
        </P>
        {error && (
          <MessageBox withIcon type="error" mb={3}>
            {error}
          </MessageBox>
        )}

        <StyledButton mt={2} type="submit" onClick={handleConnect}>
          <FormattedMessage defaultMessage="Connect {service}" id="C9HmCs" values={{ service: 'Wise' }} />
        </StyledButton>
      </React.Fragment>
    );
  } else {
    return (
      <React.Fragment>
        <P>
          <FormattedMessage
            id="collective.connectedAccounts.transferwise.connected"
            defaultMessage="Wise connected on {updatedAt, date, short}"
            values={{
              updatedAt: new Date(connectedAccount.createdAt),
            }}
          />
        </P>
        <P>
          <StyledButton type="submit" mt={2} onClick={handleDisconnect}>
            <FormattedMessage
              id="collective.connectedAccounts.disconnect.button"
              defaultMessage="Disconnect"
              buttonStyle="dangerSecondary"
            />
          </StyledButton>
        </P>
      </React.Fragment>
    );
  }
};

EditTransferWiseAccount.propTypes = {
  connectedAccount: PropTypes.object,
  collective: PropTypes.object,
  intl: PropTypes.object.isRequired,
};

export default EditTransferWiseAccount;
