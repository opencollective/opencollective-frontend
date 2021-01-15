import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { useFormik } from 'formik';
import { trim } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { editCollectivePageQuery } from '../../lib/graphql/queries';

import { getI18nLink } from '../I18nFormatters';
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

const EditPayPalAccount = props => {
  const isReceiving = props.variation == 'RECEIVING';
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
      clientId: '',
      webhookId: '',
    },
    async onSubmit(values) {
      const {
        data: { createConnectedAccount: createdAccount },
      } = await createConnectedAccount({
        variables: {
          connectedAccount: {
            token: trim(values.token),
            clientId: trim(values.clientId),
            service: 'paypal',
            settings: { webhookId: trim(values.webhookId) },
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
      if (!values.clientId) {
        errors.clientId = 'Required';
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
          {isReceiving ? null : (
            <FormattedMessage
              id="collective.create.connectedAccounts.paypal.description"
              defaultMessage="Connect a PayPal account to pay expenses with one click. For instructions on how to connect to PayPal, please, <a>read our documentation</a>."
              values={{
                a: getI18nLink({
                  href: 'https://docs.opencollective.com/help/fiscal-hosts/payouts/payouts-with-paypal',
                  openInNewTab: true,
                }),
              }}
            />
          )}
        </P>
        <StyledInputField
          name="clientId"
          label="Client ID"
          error={(formik.touched.clientId && formik.errors.clientId) || createError?.message}
          disabled={isCreating}
        >
          {inputProps => (
            <StyledInput type="text" {...inputProps} onChange={formik.handleChange} value={formik.values.clientId} />
          )}
        </StyledInputField>
        <StyledInputField
          mt={2}
          name="token"
          label="Secret"
          error={(formik.touched.token && formik.errors.token) || createError?.message}
          disabled={isCreating}
        >
          {inputProps => (
            <StyledInput type="text" {...inputProps} onChange={formik.handleChange} value={formik.values.token} />
          )}
        </StyledInputField>

        {isReceiving ? null : (
          <StyledInputField mt={2} name="webhookId" label="Webhook ID" disabled={isCreating}>
            {inputProps => (
              <StyledInput type="text" {...inputProps} onChange={formik.handleChange} value={formik.values.webhookId} />
            )}
          </StyledInputField>
        )}
        <StyledButton mt={10} type="submit" buttonSize="tiny" loading={isCreating}>
          <FormattedMessage id="collective.connectedAccounts.paypal.button" defaultMessage="Connect PayPal" />
        </StyledButton>
      </form>
    );
  } else {
    return (
      <React.Fragment>
        <P>
          <FormattedMessage
            id="collective.connectedAccounts.paypal.connected"
            defaultMessage="PayPal account connected on {updatedAt, date, short}"
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

EditPayPalAccount.propTypes = {
  connectedAccount: PropTypes.object,
  collective: PropTypes.object,
  intl: PropTypes.object.isRequired,
  variation: PropTypes.string,
};

export default EditPayPalAccount;
