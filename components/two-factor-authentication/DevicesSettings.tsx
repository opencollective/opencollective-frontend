import React from 'react';
import { gql, useMutation } from '@apollo/client';
import * as webauthn from '@simplewebauthn/browser';
import { CheckCircle2Icon, CircleIcon, PencilIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { Individual, TwoFactorMethod, UserTwoFactorMethod } from '../../lib/graphql/types/v2/graphql';
import theme from '../../lib/theme';

import ConfirmationModal, { CONFIRMATION_MODAL_TERMINATE } from '../ConfirmationModal';
import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import { H3 } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

const I18nMessages = defineMessages({
  DEVICE_ADDED: {
    defaultMessage: 'Device added',
  },
});

const RemoveTwoFactorAuthFromIndividualMutation = gql`
  mutation RemoveTwoFactorAuthFromIndividual(
    $account: AccountReferenceInput!
    $userTwoFactorMethod: UserTwoFactorMethodReferenceInput!
  ) {
    removeTwoFactorAuthTokenFromIndividual(account: $account, userTwoFactorMethod: $userTwoFactorMethod) {
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

const EditTwoFactorAuthenticationMethodMutation = gql`
  mutation EditTwoFactorAuthenticationMethod($userTwoFactorMethod: UserTwoFactorMethodReferenceInput!, $name: String!) {
    editTwoFactorAuthenticationMethod(userTwoFactorMethod: $userTwoFactorMethod, name: $name) {
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

const CreateWebAuthnRegistrationOptionsMutation = gql`
  mutation CreateWebAuthnRegistrationOptions($account: AccountReferenceInput!) {
    createWebAuthnRegistrationOptions(account: $account)
  }
`;

const AddTwoFactorAuthToIndividualMutation = gql`
  mutation AddTwoFactorAuthToIndividual($account: AccountReferenceInput!, $token: String!) {
    addTwoFactorAuthTokenToIndividual(account: $account, token: $token, type: WEBAUTHN) {
      account {
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
      recoveryCodes
    }
  }
`;

type DevicesSettingsProps = {
  userTwoFactorAuthenticationMethods: UserTwoFactorMethod[];
  individual: Pick<Individual, 'id' | 'email'>;
  onRecoveryCodes: (recoveryCodes: string[]) => void;
};

export function DevicesSettings(props: DevicesSettingsProps) {
  const intl = useIntl();
  const twoFactorMethods = props.userTwoFactorAuthenticationMethods.filter(m => m.method === TwoFactorMethod.WEBAUTHN);
  const hasTwoFactorMethod = twoFactorMethods.length > 0;
  const { addToast } = useToasts();

  const [createPublicKeyRequestOptions] = useMutation(CreateWebAuthnRegistrationOptionsMutation, {
    context: API_V2_CONTEXT,
  });

  const [addWebauthnDevice] = useMutation(AddTwoFactorAuthToIndividualMutation, {
    context: API_V2_CONTEXT,
  });

  const startWebauthnDeviceRegistration = React.useCallback(async () => {
    const response = await createPublicKeyRequestOptions({
      variables: {
        account: {
          id: props.individual.id,
        },
      },
    });

    try {
      const registration = await webauthn.startRegistration(response.data.createWebAuthnRegistrationOptions);
      const registrationBase64 = Buffer.from(JSON.stringify(registration)).toString('base64');

      const result = await addWebauthnDevice({
        variables: {
          account: {
            id: props.individual.id,
          },
          token: registrationBase64,
        },
      });

      if (result.data.addTwoFactorAuthTokenToIndividual.recoveryCodes) {
        props.onRecoveryCodes(result.data.addTwoFactorAuthTokenToIndividual.recoveryCodes);
      }

      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: intl.formatMessage(I18nMessages.DEVICE_ADDED),
      });
    } catch (e) {
      addToast({ type: TOAST_TYPE.ERROR, message: e.message });
    }
  }, [props.individual.id, intl]);

  return (
    <StyledCard px={3} py={2}>
      <Flex alignItems="center">
        <Box mr={3}>{hasTwoFactorMethod ? <CheckCircle2Icon color="#0EA755" /> : <CircleIcon />}</Box>
        <H3 fontSize="14px" fontWeight="700">
          <FormattedMessage defaultMessage="U2F (Universal 2nd Factor)" />
        </H3>
      </Flex>
      <Box>
        {twoFactorMethods.map(device => {
          return (
            <Box px={4} key={device.id}>
              <DeviceItem individual={props.individual} userTwoFactorMethod={device} />
            </Box>
          );
        })}
      </Box>
      <Box mt={3}>
        <StyledButton onClick={startWebauthnDeviceRegistration} buttonSize="tiny" buttonStyle="secondary">
          <FormattedMessage defaultMessage="Add device" /> <PlusIcon size="14px" />
        </StyledButton>
      </Box>
    </StyledCard>
  );
}

type DeviceItemProps = {
  individual: Pick<Individual, 'id'>;
  userTwoFactorMethod: UserTwoFactorMethod;
};

function DeviceItem(props: DeviceItemProps) {
  const [isConfirmingDelete, setIsConfirmingRemove] = React.useState(false);
  const [isEditingMethodName, setIsEditingMethodName] = React.useState(false);
  const [newMethodName, setNewMethodName] = React.useState(props.userTwoFactorMethod.name);

  const intl = useIntl();
  const { addToast } = useToasts();

  const [removeTwoFactorMethod, removing] = useMutation(RemoveTwoFactorAuthFromIndividualMutation, {
    context: API_V2_CONTEXT,
    variables: {
      account: {
        id: props.individual.id,
      },
      userTwoFactorMethod: {
        id: props.userTwoFactorMethod.id,
      },
    },
  });

  const [editTwoFactorMethod, editing] = useMutation(EditTwoFactorAuthenticationMethodMutation, {
    context: API_V2_CONTEXT,
    variables: {
      userTwoFactorMethod: {
        id: props.userTwoFactorMethod.id,
      },
      name: newMethodName,
    },
  });

  return (
    <React.Fragment>
      <Flex
        alignItems="center"
        py={2}
        style={{
          borderBottom: '1px solid #DCDDE0',
        }}
      >
        <Box>
          <CheckCircle2Icon color="#0EA755" />
        </Box>
        <Box px={2} flexGrow={1}>
          {props.userTwoFactorMethod.name}
        </Box>
        <Flex gap="20px">
          <StyledButton
            onClick={() => setIsEditingMethodName(true)}
            loading={isEditingMethodName || editing.loading}
            disabled={isConfirmingDelete || removing.loading}
            buttonStyle="borderless"
            buttonSize="tiny"
            color={theme.colors.blue[500]}
          >
            <PencilIcon size="18px" /> <FormattedMessage defaultMessage="Rename" />
          </StyledButton>

          <StyledButton
            onClick={() => setIsConfirmingRemove(true)}
            loading={isConfirmingDelete || removing.loading}
            disabled={isEditingMethodName || editing.loading}
            buttonStyle="borderless"
            buttonSize="tiny"
            color={theme.colors.red[500]}
          >
            <TrashIcon size="18px" /> <FormattedMessage id="actions.delete" defaultMessage="Delete" />
          </StyledButton>
        </Flex>
      </Flex>
      {isEditingMethodName && (
        <ConfirmationModal
          type="confirm"
          onClose={() => setIsEditingMethodName(false)}
          header={<FormattedMessage defaultMessage="Edit Two Factor Method" />}
          cancelHandler={() => {
            setNewMethodName(props.userTwoFactorMethod.name);
            setIsEditingMethodName(false);
          }}
          continueHandler={async () => {
            await editTwoFactorMethod();
            setIsEditingMethodName(false);
            return CONFIRMATION_MODAL_TERMINATE;
          }}
        >
          <StyledInputField
            labelFontWeight="bold"
            labelFontSize="13px"
            label={<FormattedMessage id="Fields.name" defaultMessage="Name" />}
            htmlFor="userTwoFactorMethodName"
          >
            {inputProps => (
              <StyledInput
                {...inputProps}
                name="userTwoFactorMethodName"
                id="userTwoFactorMethodName"
                onChange={e => setNewMethodName(e.target.value)}
                value={newMethodName}
                disabled={editing.loading}
              />
            )}
          </StyledInputField>
        </ConfirmationModal>
      )}
      {isConfirmingDelete && (
        <ConfirmationModal
          isDanger
          type="delete"
          onClose={() => setIsConfirmingRemove(false)}
          header={<FormattedMessage id="Remove" defaultMessage="Remove" />}
          continueHandler={async () => {
            try {
              await removeTwoFactorMethod();
              addToast({
                type: TOAST_TYPE.SUCCESS,
                message: <FormattedMessage defaultMessage="Two factor method removed successfully" />,
              });
              setIsConfirmingRemove(false);
              return CONFIRMATION_MODAL_TERMINATE;
            } catch (e) {
              addToast({
                type: TOAST_TYPE.ERROR,
                message: i18nGraphqlException(intl, e),
              });
            }
          }}
        >
          <FormattedMessage defaultMessage="This will permanently removed this two factor method" />
        </ConfirmationModal>
      )}
    </React.Fragment>
  );
}
