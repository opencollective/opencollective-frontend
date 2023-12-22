import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { useFormik } from 'formik';
import { trim } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { editCollectiveQuery } from '../../lib/graphql/v1/queries';

import { getI18nLink, I18nSignInLink } from '../I18nFormatters';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import { P } from '../Text';

const createConnectedAccountMutation = gql`
  mutation CreateConnectedAccount($connectedAccount: ConnectedAccountCreateInput!, $account: AccountReferenceInput!) {
    createConnectedAccount(connectedAccount: $connectedAccount, account: $account) {
      id
      settings
      service
      createdAt
      updatedAt
    }
  }
`;

const EditPayPalAccount = props => {
  const isReceiving = props.variation === 'RECEIVING';
  const mutationOptions = {
    context: API_V2_CONTEXT,
    refetchQueries: [{ query: editCollectiveQuery, variables: { slug: props.collective.slug } }],
    awaitRefetchQueries: true,
  };
  const [connectedAccount, setConnectedAccount] = React.useState(props.connectedAccount);
  const [createConnectedAccount, { loading: isCreating, error: createError }] = useMutation(
    createConnectedAccountMutation,
    mutationOptions,
  );
  const formik = useFormik({
    initialValues: {
      token: '',
      clientId: '',
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

  if (!connectedAccount) {
    return (
      <form onSubmit={formik.handleSubmit}>
        <P fontSize="12px" color="black.700" fontWeight="normal" mb={3}>
          {isReceiving ? null : (
            <FormattedMessage
              id="collective.create.connectedAccounts.paypal.description"
              defaultMessage="Connect a PayPal account to pay expenses with one click. (<a>Instructions</a>)."
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
            <StyledInput
              type="text"
              {...inputProps}
              onChange={formik.handleChange}
              value={formik.values.clientId}
              autoComplete="off"
            />
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
            <StyledInput
              type="text"
              {...inputProps}
              onChange={formik.handleChange}
              value={formik.values.token}
              autoComplete="off"
            />
          )}
        </StyledInputField>

        <StyledButton type="submit" mt={2} minWidth={150} loading={isCreating}>
          <FormattedMessage defaultMessage="Connect {service}" values={{ service: 'PayPal' }} />
        </StyledButton>
      </form>
    );
  } else {
    return (
      <React.Fragment>
        <P>
          <FormattedMessage
            id="collective.connectedAccounts.paypal.connected"
            defaultMessage="PayPal connected on {updatedAt, date, short}"
            values={{
              updatedAt: new Date(connectedAccount.updatedAt || connectedAccount.createdAt),
            }}
          />
        </P>
        <P mt={3} fontStyle="italic">
          <FormattedMessage
            defaultMessage="Please contact <SupportLink>support</SupportLink> to disconnect PayPal."
            values={{ SupportLink: I18nSignInLink }}
          />
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
