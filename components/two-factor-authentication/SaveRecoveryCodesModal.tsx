import React from 'react';
import { saveAs } from 'file-saver';
import { DownloadIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import ConfirmationModal from '../ConfirmationModal';
import Container from '../Container';
import { Box, Flex, Grid } from '../Grid';
import StyledButton from '../StyledButton';
import StyledModal from '../StyledModal';
import { H3, P } from '../Text';

type SaveRecoveryCodesModalProps = {
  recoveryCodes: string[];
  onClose: () => void;
};

export function SaveRecoveryCodesModal(props: SaveRecoveryCodesModalProps) {
  const [showRecoveryCodesConfirmationModal, setShowRecoveryCodesConfirmationModal] = React.useState(false);

  return (
    <StyledModal ignoreEscapeKey trapFocus preventClose onClose={props.onClose}>
      <React.Fragment>
        <Box width="500px">
          <Flex alignItems="center">
            <H3 fontSize="18px" fontWeight="700" mr={1}>
              <FormattedMessage defaultMessage="Save your recovery codes" />
            </H3>
          </Flex>
          <P>
            <FormattedMessage
              id="TwoFactorAuth.Setup.RecoveryCodes.Info"
              defaultMessage="Recovery codes are used to access your account in case you can't access it with your authenticator app (for example, if you have lost your phone). Each code can only be used once. Save your 2FA recovery codes in a safe place, like a password manager app."
            />
          </P>
          <Container maxWidth={480} border="2px solid black" borderRadius={8} my={3}>
            <Grid gridTemplateColumns={['1fr', '1fr 1fr']} p="32px" gridGap="16px" data-cy="recovery-codes-container">
              {props.recoveryCodes.map(code => {
                return (
                  <P key={code} fontSize="16px" fontWeight="700" m="0 16px 16px 0">
                    {code}
                  </P>
                );
              })}
            </Grid>
          </Container>
          <Container>
            <Flex justifyContent={['center', 'left']} mb={4} gap="16px">
              <StyledButton
                minWidth="148px"
                buttonStyle="primary"
                onClick={() => setShowRecoveryCodesConfirmationModal(true)}
                loading={showRecoveryCodesConfirmationModal}
                data-cy="add-two-factor-auth-confirm-recovery-codes-button"
              >
                <FormattedMessage id="TwoFactorAuth.Setup.Form.FinishSetup" defaultMessage="Finish setup" />
              </StyledButton>
              <StyledButton
                display="flex"
                onClick={() =>
                  saveAs(
                    new Blob([props.recoveryCodes.join('\n')], { type: 'text/plain;charset=utf-8' }),
                    'opencollective-recovery-codes.txt',
                  )
                }
              >
                <FormattedMessage defaultMessage="Download codes" />
                &nbsp;
                <DownloadIcon size="1em" />
              </StyledButton>
            </Flex>
          </Container>
        </Box>
        {showRecoveryCodesConfirmationModal && (
          <ConfirmationModal
            isDanger
            type="confirm"
            onClose={() => setShowRecoveryCodesConfirmationModal(false)}
            continueHandler={() => props.onClose()}
            header={
              <FormattedMessage
                id="TwoFactorAuth.Setup.RecoveryCodes.ConfirmationModal.Header"
                defaultMessage="Are you sure?"
              />
            }
          >
            <FormattedMessage
              id="TwoFactorAuth.Setup.RecoveryCodes.ConfirmationModal.Body"
              defaultMessage="Once you click 'Confirm', you will no longer have access to your recovery codes."
            />
          </ConfirmationModal>
        )}
      </React.Fragment>
    </StyledModal>
  );
}
