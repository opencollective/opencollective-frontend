import React from 'react';
import { useMutation } from '@apollo/client';
import { AlertCircle } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import type { Individual } from '../../lib/graphql/types/v2/schema';
import { TwoFactorAuthenticationHeader } from '../../lib/two-factor-authentication';
import { useTwoFactorAuthenticationPrompt } from '../../lib/two-factor-authentication/TwoFactorAuthenticationContext';

import ConfirmationModal, { CONFIRMATION_MODAL_TERMINATE } from '../ConfirmationModal';
import MessageBox from '../MessageBox';
import { P } from '../Text';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

const RemoveTwoFactorAuthenticationMutation = gql`
  mutation RemoveTwoFactorAuthentication($account: AccountReferenceInput!) {
    removeTwoFactorAuthTokenFromIndividual(account: $account) {
      id
      hasTwoFactorAuth
      twoFactorMethods {
        id
        method
        name
        createdAt
        description
        icon
      }
    }
  }
`;

type ResetTwoFactorButtonProps = {
  individual: Pick<Individual, 'id'>;
};

export function ResetTwoFactorButton(props: ResetTwoFactorButtonProps) {
  const intl = useIntl();
  const { toast } = useToast();

  const [isRemovingTwoFactorAuthentication, setIsRemovingTwoFactorAuthentication] = React.useState(false);
  const [removeTwoFactorAuthentication] = useMutation(RemoveTwoFactorAuthenticationMutation);

  const prompt = useTwoFactorAuthenticationPrompt();

  const onRemoveConfirmation = React.useCallback(async () => {
    let twoFactorResult: { code: string; type: string };
    try {
      twoFactorResult = await prompt.open({ supportedMethods: ['recovery_code'], allowRecovery: true });
    } catch {
      return;
    }

    try {
      await removeTwoFactorAuthentication({
        context: {
          ...API_V2_CONTEXT,
          headers: {
            [TwoFactorAuthenticationHeader]: `${twoFactorResult.type} ${twoFactorResult.code}`,
          },
        },
        variables: {
          account: {
            id: props.individual.id,
          },
        },
      });
      toast({
        variant: 'success',
        message: <FormattedMessage defaultMessage="Two factor authentication disabled." id="8TdbVp" />,
      });
      return CONFIRMATION_MODAL_TERMINATE;
    } catch (e) {
      toast({
        variant: 'error',
        message: i18nGraphqlException(intl, e),
      });
    } finally {
      setIsRemovingTwoFactorAuthentication(false);
    }
  }, [removeTwoFactorAuthentication, props.individual]);

  return (
    <React.Fragment>
      <Button
        className="mt-3 w-full"
        onClick={() => setIsRemovingTwoFactorAuthentication(true)}
        variant="outlineDestructive"
      >
        <AlertCircle className="mr-2 h-4 w-4" />
        <FormattedMessage defaultMessage="Reset Two Factor Authentication" id="NCTAeh" />
      </Button>
      {isRemovingTwoFactorAuthentication && (
        <ConfirmationModal
          isDanger
          type="delete"
          onClose={() => setIsRemovingTwoFactorAuthentication(false)}
          header={
            <FormattedMessage
              defaultMessage="Are you sure you want to remove two-factor authentication from your account?"
              id="76Sds/"
            />
          }
          continueHandler={onRemoveConfirmation}
        >
          <MessageBox type="warning" withIcon>
            <FormattedMessage defaultMessage="Removing 2FA from your account can make it less secure." id="7w98pJ" />
          </MessageBox>
          <P mt={3}>
            <FormattedMessage
              defaultMessage="If you would like to remove 2FA from your account, you will need to enter a recovery code"
              id="hpJFoW"
            />
          </P>
        </ConfirmationModal>
      )}
    </React.Fragment>
  );
}
