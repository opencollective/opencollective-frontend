import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { useFormik } from 'formik';
import { trim } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { editCollectivePageQuery } from '../../lib/graphql/queries';

import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import { P } from '../Text';

const createConnectedAccountMutation = gqlV2/* GraphQL */ `
  mutation createConnectedAccount($connectedAccount: ConnectedAccountCreateInput!, $account: AccountReferenceInput!) {
    createConnectedAccount(connectedAccount: $connectedAccount, account: $account) {
      id
      settings
      service
      createdAt
      updatedAt
    }
  }
`;

const deleteConnectedAccountMutation = gqlV2/* GraphQL */ `
  mutation deleteConnectedAccount($connectedAccount: ConnectedAccountReferenceInput!) {
    deleteConnectedAccount(connectedAccount: $connectedAccount) {
      id
    }
  }
`;

const EditPrivacyAccount = props => {
  const mutationOptions = {
    context: API_V2_CONTEXT,
    refetchQueries: [{ query: editCollectivePageQuery, variables: { slug: props.collective.slug } }],
    awaitRefetchQueries: true,
  };
  const [connectedAccount, setConnectedAccount] = React.useState(props.connectedAccount);
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
      const {
        data: { createConnectedAccount: createdAccount },
      } = await createConnectedAccount({
        variables: {
          connectedAccount: {
            token: trim(values.token),
            service: 'privacy',
          },
          account: { slug: props.collective.slug },
        },
      });
      setConnectedAccount(createdAccount);
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
    setConnectedAccount();
  };

  if (!connectedAccount) {
    return (
      <form onSubmit={formik.handleSubmit}>
        <P fontSize="12px" color="black.600" fontWeight="normal">
          <FormattedMessage
            id="collective.create.connectedAccounts.privacy.description"
            defaultMessage="Connect a Privacy account to emit Virtual Credit Cards to your collectives."
          />
        </P>
        <StyledInputField
          mt={2}
          name="token"
          label="Token"
          error={(formik.touched.token && formik.errors.token) || createError?.message}
          disabled={isCreating}
        >
          {inputProps => (
            <StyledInput type="text" {...inputProps} onChange={formik.handleChange} value={formik.values.token} />
          )}
        </StyledInputField>
        <StyledButton mt={10} type="submit" buttonSize="tiny" loading={isCreating}>
          <FormattedMessage id="collective.connectedAccounts.privacy.button" defaultMessage="Connect Privacy" />
        </StyledButton>
      </form>
    );
  } else {
    return (
      <React.Fragment>
        <P>
          <FormattedMessage
            id="collective.connectedAccounts.privacy.connected"
            defaultMessage="Privacy connected on {updatedAt, date, short}"
            values={{
              updatedAt: new Date(connectedAccount.updatedAt || connectedAccount.createdAt),
            }}
          />
        </P>
        <P>
          <StyledButton type="submit" buttonSize="tiny" loading={isDeleting} onClick={handleDelete}>
            <FormattedMessage id="collective.connectedAccounts.disconnect.button" defaultMessage="Disconnect" />
          </StyledButton>
        </P>
      </React.Fragment>
    );
  }
};

EditPrivacyAccount.propTypes = {
  connectedAccount: PropTypes.object,
  collective: PropTypes.object,
  intl: PropTypes.object.isRequired,
  variation: PropTypes.string,
};

export default EditPrivacyAccount;
