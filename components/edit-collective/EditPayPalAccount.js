import React from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { useFormik } from 'formik';
import { trim } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { editCollectivePageQuery } from '../../lib/graphql/v1/queries';

import { getI18nLink, I18nSignInLink } from '../I18nFormatters';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import { P } from '../Text';
import { Button } from '../ui/Button';
import { TableBody, TableCell, TableRow, Table } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/Tooltip';
import { editCollectiveSettingsMutation } from '@/lib/graphql/v1/mutations';
import StyledCheckbox from '../StyledCheckbox';

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

const editPayPalAccountQuery = gql`
  query EditPayPalAccount($slug: String!) {
    account(slug: $slug) {
      id
      connectedAccounts(service: paypal) {
        id
        legacyId
        service
        createdAt
        settings
        hash
        createdByAccount {
          id
          legacyId
          name
          slug
        }
        accountsMirrored {
          id
          slug
          name
        }
      }
      settings
    }
  }
`;

const EditPayPalAccount = props => {
  const { data, loading, refetch } = useQuery(editPayPalAccountQuery, {
    variables: { slug: props.collective.slug },
    context: API_V2_CONTEXT,
  });
  const mutationOptions = {
    context: API_V2_CONTEXT,
    refetchQueries: [{ query: editCollectivePageQuery, variables: { slug: props.collective.slug } }],
    awaitRefetchQueries: true,
  };
  const connectedAccount = data?.account?.connectedAccounts?.[0];
  const [createConnectedAccount, { loading: isCreating, error: createError }] = useMutation(
    createConnectedAccountMutation,
    mutationOptions,
  );
  const [setSettings, { loading: mutating, error: settingUpdateError }] = useMutation(editCollectiveSettingsMutation);

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
      await refetch();
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

  const togglePayPalPayout = async () => {
    await setSettings({
      variables: {
        id: props.collective.id,
        settings: {
          ...props.collective.settings,
          disablePaypalPayouts: !props.collective.settings.disablePaypalPayouts,
        },
      },
    });
  };

  const isReceiving = props.variation === 'RECEIVING';
  if (loading) {
    return <Skeleton className="mb-3 h-10 w-full" />;
  } else if (!connectedAccount) {
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

        <Button size="sm" variant="outline" type="submit" className="mt-2" loading={isCreating}>
          <FormattedMessage defaultMessage="Connect {service}" id="C9HmCs" values={{ service: 'PayPal' }} />
        </Button>
      </form>
    );
  } else {
    return (
      <div className="flex flex-col gap-4">
        <Table>
          <TableBody>
            <TableRow className="text-sm text-gray-700">
              <TableCell className="w-fit min-w-0">
                <Badge size="sm">{connectedAccount.hash?.slice(0, 7)}</Badge>
              </TableCell>
              <TableCell className="w-full">
                <p>
                  <FormattedMessage
                    id="EditWiseAccounts.connectedby"
                    defaultMessage="Connected by {createdByName} on {updatedAt, date, short}"
                    values={{
                      updatedAt: new Date(connectedAccount.createdAt),
                      createdByName: connectedAccount.createdByAccount.name,
                    }}
                  />
                </p>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="text-sm">
          <FormattedMessage
            defaultMessage="Please contact <SupportLink>support</SupportLink> to disconnect PayPal."
            id="ivhAav"
            values={{ SupportLink: I18nSignInLink }}
          />
        </div>
        {!isReceiving && (
          <div className="flex flex-col gap-2">
            <h1 className="text-base font-bold">
              <FormattedMessage id="header.options" defaultMessage="Options" />
            </h1>
            <StyledCheckbox
              name="paypalPayoutsEnabled"
              label={
                <FormattedMessage
                  id="collective.sendMoney.PayPalPayouts.description"
                  defaultMessage="Enable PayPal Payouts so users are able to request Expenses to be paid with PayPal."
                />
              }
              checked={!props.collective.settings?.disablePaypalPayouts}
              onChange={togglePayPalPayout}
              loading={mutating}
            />
            <p className="text-xs text-gray-500">
              <FormattedMessage
                id="collective.sendMoney.PayPalPayouts.details"
                defaultMessage="The PayPal Payouts is an opt-in feature and needs to be manually requested on and approved by PayPal before being enabled."
              />
            </p>
          </div>
        )}
      </div>
    );
  }
};

EditPayPalAccount.propTypes = {
  collective: PropTypes.object,
  variation: PropTypes.string,
};

export default EditPayPalAccount;
