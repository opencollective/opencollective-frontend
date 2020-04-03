import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/react-hooks';
import { useFormik } from 'formik';
import { defineMessages } from 'react-intl';

import { GraphQLContext } from '../../lib/graphql/context';
import { gqlV2, API_V2_CONTEXT } from '../../lib/graphql/helpers';

import { P } from '../Text';
import StyledButton from '../StyledButton';
import StyledInputField from '../StyledInputField';
import StyledInput from '../StyledInput';

const createConnectedAccountMutation = gqlV2`
  mutation createConnectedAccount($connectedAccount: ConnectedAccountCreateInput!, $account: AccountReferenceInput!) {
    createConnectedAccount(connectedAccount: $connectedAccount, account: $account) {
      id
      settings
      service
      createdAt
    }
  }
`;

const deleteConnectedAccountMutation = gqlV2`
  mutation deleteConnectedAccount($connectedAccount: ConnectedAccountReferenceInput!) {
    deleteConnectedAccount(connectedAccount: $connectedAccount) {
      id
    }
  }
`;

const mutationOptions = { context: API_V2_CONTEXT };

const EditTransferWiseAccount = props => {
  const messages = defineMessages({
    button: {
      id: 'collective.connectedAccounts.transferwise.button',
      defaultMessage: 'Connect TransferWise',
    },
    description: {
      id: 'collective.create.connectedAccounts.transferwise.description',
      defaultMessage: 'Connect a TransferWise account to pay expenses with one click.',
    },
    connected: {
      id: 'collective.connectedAccounts.transferwise.connected',
      defaultMessage: 'TransferWise account connected on {updatedAt, date, short}',
    },
    disconnect: {
      id: 'collective.connectedAccounts.disconnect.button',
      defaultMessage: 'Disconnect',
    },
  });
  const { refetch } = React.useContext(GraphQLContext);
  const [createConnectedAccount, { loading: isCreating, error: createError }] = useMutation(
    createConnectedAccountMutation,
    mutationOptions,
  );
  const [deleteConnectedAccount, { loading: isDeleting }] = useMutation(
    deleteConnectedAccountMutation,
    mutationOptions,
  );
  const formik = useFormik({
    initialValues: {
      token: '',
    },
    async onSubmit(values) {
      await createConnectedAccount({
        variables: {
          connectedAccount: { token: values.token, service: 'transferwise' },
          account: { slug: props.collective.slug },
        },
      });
      await refetch();
    },
    validate(values) {
      const errors = {};
      if (!values.token) {
        errors.token = 'Required';
      }
      return errors;
    },
  });

  const handleDelete = async () => {
    await deleteConnectedAccount({ variables: { connectedAccount: { legacyId: props.connectedAccount.id } } });
    await refetch();
  };

  if (!props.connectedAccount) {
    return (
      <form onSubmit={formik.handleSubmit}>
        <P lineHeight="0" fontSize="Caption" color="black.600" fontWeight="normal">
          {props.intl.formatMessage(messages.description)}
        </P>
        <StyledInputField
          name="token"
          label="Token"
          error={(formik.touched.token && formik.errors.token) || createError?.message.replace('GraphQL error: ', '')}
          disabled={isCreating}
        >
          {inputProps => (
            <StyledInput type="text" {...inputProps} onChange={formik.handleChange} value={formik.values.token} />
          )}
        </StyledInputField>
        <StyledButton type="submit" buttonSize="small" loading={isCreating}>
          {props.intl.formatMessage(messages.button)}
        </StyledButton>
      </form>
    );
  } else {
    return (
      <React.Fragment>
        <P lineHeight="0">
          {props.intl.formatMessage(messages.connected, {
            username: props.connectedAccount.username,
            updatedAt: new Date(props.connectedAccount.updatedAt || props.connectedAccount.createdAt),
          })}
        </P>
        <P lineHeight="0">
          <StyledButton type="submit" buttonSize="small" loading={isDeleting} onClick={handleDelete}>
            {props.intl.formatMessage(messages.disconnect)}
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
