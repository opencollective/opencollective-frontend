import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { connectAccount, disconnectAccount } from '../../lib/api';
import { editCollectiveSettingsMutation } from '../../lib/graphql/v1/mutations';

import MessageBox from '../MessageBox';
import StyledCheckbox from '../StyledCheckbox';
import { P } from '../Text';
import { Button } from '../ui/Button';

const EditTransferWiseAccount = ({ collective, ...props }) => {
  const router = useRouter();
  const error = router.query?.error;
  const [connectedAccount, setConnectedAccount] = React.useState(props.connectedAccount);
  const [setSettings, { loading }] = useMutation(editCollectiveSettingsMutation);
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
  const handleUpdateSetting = async generateReference => {
    await setSettings({
      variables: {
        id: collective.id,
        settings: {
          ...collective.settings,
          transferwise: {
            ...collective.settings.transferwise,
            generateReference,
          },
        },
      },
    });
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

        <Button size="sm" className="mt-2 w-fit" variant="outline" type="submit" onClick={handleConnect}>
          <FormattedMessage defaultMessage="Connect {service}" id="C9HmCs" values={{ service: 'Wise' }} />
        </Button>
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
          <Button type="submit" size="sm" className="mt-2 w-fit" variant="outline" onClick={handleDisconnect}>
            <FormattedMessage
              id="collective.connectedAccounts.disconnect.button"
              defaultMessage="Disconnect"
              buttonStyle="dangerSecondary"
            />
          </Button>
        </P>
        <div className="mt-4 flex flex-col gap-2">
          <h1 className="text-base font-bold">
            <FormattedMessage id="header.options" defaultMessage="Options" />
          </h1>
          <StyledCheckbox
            name="generateReference"
            label={
              <FormattedMessage
                id="collective.connectedAccounts.wise.generateReference"
                defaultMessage="Automatically generate the transfer reference based on Collective name and Expense ID."
              />
            }
            checked={collective.settings?.transferwise?.generateReference !== false}
            onChange={({ checked }) => handleUpdateSetting(checked)}
            loading={loading}
          />
        </div>
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
