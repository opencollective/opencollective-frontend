import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from 'react-apollo';
import { useFormik } from 'formik';

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
  const messages = {
    'collective.connectedAccounts.transferwise.button': {
      id: 'collective.connectedAccounts.transferwise.button',
      defaultMessage: 'Connect TransferWise',
    },
    'collective.connectedAccounts.transferwise.description': {
      id: 'collective.create.connectedAccounts.transferwise.description',
      defaultMessage: 'Connect a TransferWise account to pay expenses with one click.',
    },
    'collective.connectedAccounts.transferwise.connected': {
      id: 'collective.connectedAccounts.transferwise.connected',
      defaultMessage: 'TransferWise account connected on {updatedAt, date, short}',
    },
    'collective.connectedAccounts.disconnect.button': {
      id: 'collective.connectedAccounts.disconnect.button',
      defaultMessage: 'Disconnect',
    },
  };
  const { refetch } = React.useContext(GraphQLContext);
  const [connectedAccount, setConnectedAccount] = React.useState(props.connectedAccount);
  const [createConnectedAccount, { loading: createLoading }] = useMutation(
    createConnectedAccountMutation,
    mutationOptions,
  );
  const [deleteConnectedAccount, { loading: deleteLoading }] = useMutation(
    deleteConnectedAccountMutation,
    mutationOptions,
  );
  const formik = useFormik({
    initialValues: {
      token: '',
    },
    async onSubmit(values) {
      const { data } = await createConnectedAccount({
        variables: {
          connectedAccount: { token: values.token, service: 'transferwise' },
          account: { slug: props.collective.slug },
        },
      });
      console.log(data);
      await refetch(data.createConnectedAccount);
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
    setConnectedAccount(null);
  };

  if (!connectedAccount) {
    return (
      <form onSubmit={formik.handleSubmit}>
        <P lineHeight="0" fontSize="Caption" color="black.600" fontWeight="normal">
          {props.intl.formatMessage(messages[`collective.connectedAccounts.transferwise.description`])}
        </P>
        <StyledInputField
          name="token"
          label="Token"
          error={formik.touched.token && formik.errors.token}
          disabled={createLoading}
        >
          {inputProps => (
            <StyledInput type="text" {...inputProps} onChange={formik.handleChange} value={formik.values.token} />
          )}
        </StyledInputField>
        <StyledButton type="submit" buttonSize="small" loading={createLoading}>
          {props.intl.formatMessage(messages['collective.connectedAccounts.transferwise.button'])}
        </StyledButton>
      </form>
    );
  } else {
    return (
      <React.Fragment>
        <P lineHeight="0">
          {props.intl.formatMessage(messages[`collective.connectedAccounts.transferwise.connected`], {
            username: connectedAccount.username,
            updatedAt: new Date(connectedAccount.updatedAt),
          })}
        </P>
        <P lineHeight="0">
          <StyledButton type="submit" buttonSize="small" loading={deleteLoading} onClick={handleDelete}>
            {props.intl.formatMessage(messages['collective.connectedAccounts.disconnect.button'])}
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
