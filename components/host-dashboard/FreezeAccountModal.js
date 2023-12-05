import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import { collectivePageQuery } from '../collective-page/graphql/queries';
import { Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledModal, { CollectiveModalHeader, ModalBody, ModalFooter } from '../StyledModal';
import StyledTextarea from '../StyledTextarea';
import { Label, P, Span } from '../Text';
import { useToast } from '../ui/useToast';

const editAccountFreezeStatusMutation = gql`
  mutation EditAccountFreezeStatus($account: AccountReferenceInput!, $action: AccountFreezeAction!, $message: String) {
    editAccountFreezeStatus(account: $account, message: $message, action: $action) {
      id
      isFrozen
      childrenAccounts {
        nodes {
          id
          isFrozen
        }
      }
    }
  }
`;

const FreezeAccountModal = ({ collective, ...props }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const isUnfreezing = collective.isFrozen;
  const [editAccountFreezeStatus, { loading }] = useMutation(editAccountFreezeStatusMutation, {
    context: API_V2_CONTEXT,
  });

  return (
    <StyledModal maxWidth={432} trapFocus {...props}>
      <CollectiveModalHeader collective={collective} mb={3} />
      <ModalBody>
        {collective.isFrozen ? (
          <div>
            <P fontSize="16px" fontWeight="700" lineHeight="24px" color="red.900" mb={2}>
              <FormattedMessage defaultMessage="Are you sure want to unfreeze this collective?" />
            </P>
            <P fontSize="14px" lineHeight="20px" color="black.700" mb="10px">
              <FormattedMessage defaultMessage="Unfreezing the collective means they will now have full access to the platform." />
              <br />
              <br />
              <FormattedMessage defaultMessage="This collective (and all its related Projects & Events) will now have access to accept funds, pay out expenses, post updates, create new Events or Projects." />
            </P>
            <Label
              fontSize="16px"
              fontWeight="700"
              lineHeight="24px"
              color="black.800.900"
              mb="6px"
              htmlFor="freeze-account-message"
            >
              <FormattedMessage defaultMessage="Include a message to the Collective admins (Optional)" />
              <br />
              <Span fontSize="13px" fontWeight="400">
                <FormattedMessage defaultMessage="They will also be notified of this unfreeze via auto-email." />
              </Span>
            </Label>
            <StyledTextarea
              id="freeze-account-message"
              width="100%"
              minHeight={126}
              maxHeight={300}
              onChange={e => setMessage(e.target.value)}
              value={message}
            />
          </div>
        ) : (
          <div>
            <P fontSize="16px" fontWeight="700" lineHeight="24px" color="red.900" mb={2}>
              <FormattedMessage defaultMessage="Are you sure want to freeze this collective?" />
            </P>
            <P fontSize="14px" lineHeight="20px" color="black.700" mb="10px">
              <FormattedMessage defaultMessage="Freezing this collective means temporarily limiting what a collective (and their connected Projects & Events) can and cannot do on the platform." />
              <br />
              <br />
              <FormattedMessage defaultMessage="They will not be able to accept funds, pay out expenses, post updates, create new Events or Projects, add new Team members under this collective. However, they will still continue to receive recurring donations that were started before this freeze." />
            </P>
            <Label
              htmlFor="freeze-account-message"
              fontSize="16px"
              fontWeight="700"
              lineHeight="24px"
              color="black.800.900"
              mb="6px"
            >
              <FormattedMessage defaultMessage="Include a message to the Collective admins (Optional)" />
              <br />
              <Span fontSize="13px" fontWeight="400">
                <FormattedMessage defaultMessage="They will also be notified of this freeze via auto-email notification." />
              </Span>
            </Label>
            <StyledTextarea
              id="freeze-account-message"
              width="100%"
              minHeight={126}
              maxHeight={300}
              onChange={e => setMessage(e.target.value)}
              value={message}
              fontSize="13px"
            />
            <P fontSize="13px" color="black.700" mt="6px">
              <FormattedMessage defaultMessage="Make sure to let the admins know if action is required" />
            </P>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Flex justifyContent="center">
          <StyledButton
            buttonStyle={isUnfreezing ? 'primary' : 'danger'}
            minWidth={90}
            loading={loading}
            onClick={async () => {
              try {
                const action = isUnfreezing ? 'UNFREEZE' : 'FREEZE';
                const accountInput =
                  typeof collective.id === 'number' ? { legacyId: collective.id } : { id: collective.id };
                const variables = { account: accountInput, message, action };
                await editAccountFreezeStatus({
                  variables,
                  refetchQueries: [{ query: collectivePageQuery, variables: { slug: collective.slug } }],
                  awaitRefetchQueries: true,
                });
                const successMsgArgs = { accountName: collective.name, accountSlug: collective.slug };
                toast({
                  variant: 'success',
                  message: isUnfreezing
                    ? intl.formatMessage(
                        { defaultMessage: '{accountName} (@{accountSlug}) has been unfrozen' },
                        successMsgArgs,
                      )
                    : intl.formatMessage(
                        { defaultMessage: '{accountName} (@{accountSlug}) has been frozen' },
                        successMsgArgs,
                      ),
                });
                props?.onClose();
              } catch (e) {
                toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
              }
            }}
          >
            {isUnfreezing ? (
              <FormattedMessage defaultMessage="Unfreeze" />
            ) : (
              <FormattedMessage defaultMessage="Freeze Collective" />
            )}
          </StyledButton>
          <StyledButton ml={3} minWidth={120} onClick={props.onClose} disabled={loading}>
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </StyledButton>
        </Flex>
      </ModalFooter>
    </StyledModal>
  );
};

FreezeAccountModal.propTypes = {
  onClose: PropTypes.func,
  collective: PropTypes.shape({
    id: PropTypes.string,
    hostFeePercent: PropTypes.number,
    isFrozen: PropTypes.bool,
    settings: PropTypes.object,
    parent: PropTypes.object,
    type: PropTypes.string,
    name: PropTypes.string,
    slug: PropTypes.string,
  }).isRequired,
};

export default FreezeAccountModal;
