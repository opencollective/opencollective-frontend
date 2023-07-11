import React from 'react';
import { useMutation } from '@apollo/client';
import { RefreshCcw } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import ConfirmationModal from '../ConfirmationModal';
import MessageBox from '../MessageBox';
import StyledCard from '../StyledCard';
import { H3 } from '../Text';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

const regenerateRecoveryCodesMutation = gql`
  mutation RegenerateRecoveryCodes {
    regenerateRecoveryCodes
  }
`;

type RecoverySettingsProps = {
  onRecoveryCodes: (recoveryCodes: string[]) => void;
};

export function RecoverySettings(props: RecoverySettingsProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const [isRegeneratingRecoveryCodes, setIsRegeneratingRecoveryCodes] = React.useState(false);

  const [regenerateRecoveryCodes, { loading }] = useMutation<{ regenerateRecoveryCodes: string[] }>(
    regenerateRecoveryCodesMutation,
    {
      context: API_V2_CONTEXT,
    },
  );

  const onRegenerateConfirmation = React.useCallback(async () => {
    try {
      const res = await regenerateRecoveryCodes();
      setIsRegeneratingRecoveryCodes(false);
      props.onRecoveryCodes(res.data.regenerateRecoveryCodes);
    } catch (err) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, err) });
    }
  }, [intl, props.onRecoveryCodes]);

  return (
    <React.Fragment>
      <StyledCard px={3} py={2}>
        <H3 fontSize="14px" fontWeight="700" my={3}>
          <FormattedMessage defaultMessage="Recovery" id="AAB4k2" />
        </H3>
        <div className="text-sm">
          <FormattedMessage
            defaultMessage="Recovery codes can be used to access your account in case you lose access to your other two factor methods."
            id="Pw3c53"
          />
        </div>
        <Button
          variant="outline"
          loading={loading}
          onClick={() => setIsRegeneratingRecoveryCodes(true)}
          className="mb-2 mt-3 w-full"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          <FormattedMessage defaultMessage="Regenerate codes" id="TWwiPo" />
        </Button>
      </StyledCard>
      {isRegeneratingRecoveryCodes && (
        <ConfirmationModal
          isDanger
          onClose={() => setIsRegeneratingRecoveryCodes(false)}
          header={
            <FormattedMessage defaultMessage="Are you sure you want to regenerate your recovery codes?" id="844sMC" />
          }
          continueHandler={onRegenerateConfirmation}
        >
          <MessageBox type="warning" withIcon>
            <FormattedMessage defaultMessage="This will inactivate your previous recovery codes." id="bHcyqz" />
          </MessageBox>
        </ConfirmationModal>
      )}
    </React.Fragment>
  );
}
