import React from 'react';
import { useMutation } from '@apollo/client';
import { CheckCircle2Icon, PencilIcon, TrashIcon } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import type { Individual, UserTwoFactorMethod } from '../../lib/graphql/types/v2/graphql';
import theme from '../../lib/theme';

import ConfirmationModal, { CONFIRMATION_MODAL_TERMINATE } from '../ConfirmationModal';
import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import { useToast } from '../ui/useToast';

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

type UserTwoFactorMethodItemProps = {
  individual: Pick<Individual, 'id'>;
  userTwoFactorMethod: UserTwoFactorMethod;
};

export function UserTwoFactorMethodItem(props: UserTwoFactorMethodItemProps) {
  const [isConfirmingDelete, setIsConfirmingRemove] = React.useState(false);
  const [isEditingMethodName, setIsEditingMethodName] = React.useState(false);
  const [newMethodName, setNewMethodName] = React.useState(props.userTwoFactorMethod.name);

  const intl = useIntl();
  const { toast } = useToast();

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
      <Flex alignItems="center" py={2}>
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
            display="flex"
            alignItems="center"
          >
            <PencilIcon size="18px" />
            &nbsp;
            <FormattedMessage defaultMessage="Rename" />
          </StyledButton>

          <StyledButton
            onClick={() => setIsConfirmingRemove(true)}
            loading={isConfirmingDelete || removing.loading}
            disabled={isEditingMethodName || editing.loading}
            buttonStyle="borderless"
            buttonSize="tiny"
            color={theme.colors.red[500]}
            display="flex"
            alignItems="center"
          >
            <TrashIcon size="18px" />
            &nbsp;
            <FormattedMessage id="actions.delete" defaultMessage="Delete" />
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
              toast({
                variant: 'success',
                message: <FormattedMessage defaultMessage="Two factor method removed successfully" />,
              });
              setIsConfirmingRemove(false);
              return CONFIRMATION_MODAL_TERMINATE;
            } catch (e) {
              toast({
                variant: 'error',
                message: i18nGraphqlException(intl, e),
              });
            }
          }}
        >
          <FormattedMessage defaultMessage="This will permanently remove this two factor method" />
        </ConfirmationModal>
      )}
    </React.Fragment>
  );
}
