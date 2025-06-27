import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Formik } from 'formik';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { margin } from 'styled-system';

import { i18nGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';

import { FormField } from '@/components/FormField';
import { Card } from '@/components/ui/Card';
import { InputGroup } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';

import { Button } from '../../ui/Button';
import { useToast } from '../../ui/useToast';

const accountQuery = gql`
  query Account($slug: String) {
    account(slug: $slug) {
      id
      slug
      name
      isHost
      settings
      currency
    }
  }
`;

const updateAccountSettingsMutation = gql`
  mutation UpdateAccountSettings($account: AccountReferenceInput!) {
    editAccountSetting(account: $account) {
      id
      settings
    }
  }
`;

const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 16px;
  border: 1px solid #dcdee0;
  font-weight: normal;
  transition: box-shadow 0.3s;
  border-radius: 8px;
  ${margin}
  &:hover {
    box-shadow: 0px 4px 12px rgba(20, 20, 20, 0.1);
  }
`;

const getInitialValues = account => {
  return {
    hostFeePercent: get(account, 'hostFeePercent'),
    apply: get(account, 'settings.apply', false),
    applyMessage: get(account, 'settings.applyMessage', ''),
    tos: get(account, 'settings.tos', ''),
  };
};

const FiscalHost = ({ collective }) => {
  const intl = useIntl();
  const { toast } = useToast();
  // const { data, loading } = useQuery(accountQuery, { variables: { slug: collective.slug }, context: API_V2_CONTEXT });
  const [updateSecuritySettings, { loading: submitting }] = useMutation(updateAccountSettingsMutation, {
    context: API_V2_CONTEXT,
  });

  // if (loading) {
  //   return <LoadingPlaceholder height={300} />;
  // }

  return (
    <React.Fragment>
      <p className="mb-8 text-muted-foreground">
        <FormattedMessage
          id="FiscalHost.Settings.Description"
          defaultMessage="Supporting collectives under your umbrella by providing them with legal and financial infrastructure."
        />
      </p>
      <Formik
        enableReinitialize
        initialValues={getInitialValues(collective)}
        onSubmit={async values => {
          try {
            console.log(values);
            // await updateSecuritySettings({ variables: { account: pick(data.account, ['id']), ...values } });
            toast({
              variant: 'success',
              message: <FormattedMessage id="Settings.Updated" defaultMessage="Settings updated." />,
            });
          } catch (error) {
            toast({
              variant: 'error',
              title: <FormattedMessage id="Settings.Updated.Fail" defaultMessage="Update failed." />,
              message: i18nGraphqlException(intl, error),
            });
          }
        }}
      >
        {({ handleSubmit, setFieldValue, values, dirty }) => (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Card className="flex items-center justify-between p-4">
              <div>
                <h1 className="font-bold">
                  <FormattedMessage defaultMessage="Open to Applications" id="FiscalHost.OpenToApplications" />
                </h1>
                <p className="text-sm text-muted-foreground">
                  <FormattedMessage
                    defaultMessage="Enable new collectives to apply to join your fiscal host."
                    id="FiscalHost.OpenToApplications.Description"
                  />
                </p>
              </div>
              <Switch
                name="apply"
                checked={values.apply}
                onCheckedChange={checked => {
                  setFieldValue('apply', checked);
                }}
              />
            </Card>
            <Card className="flex items-center justify-between p-4">
              <div>
                <h1 className="font-bold">
                  <FormattedMessage defaultMessage="Host Fee Percent" id="FiscalHost.HostFeePercent" />
                </h1>
                <p className="text-sm text-muted-foreground">
                  <FormattedMessage
                    defaultMessage="Fee on financial contributions to Collectives you fiscally host."
                    id="FiscalHost.HostFeePercent.Description"
                  />
                </p>
              </div>
              <FormField className="max-w-24" name="hostFeePercent">
                {({ field }) => <InputGroup {...field} maxLength={2} append="%" />}
              </FormField>
            </Card>
            <Card className="flex flex-col gap-4 p-4">
              <div>
                <h1 className="font-bold">
                  <FormattedMessage defaultMessage="Terms of Fiscal Hosting" id="FiscalHost.TOS" />
                </h1>
                <p className="text-sm text-muted-foreground">
                  <FormattedMessage
                    defaultMessage="Link to the terms under which this Host collects and holds funds."
                    id="FiscalHost.TOS.Description"
                  />
                </p>
              </div>
              <FormField name="tos" />
            </Card>

            <div className="mt-4 flex w-full items-center">
              <h1 className="grow-0 text-xl font-bold whitespace-nowrap">
                <FormattedMessage defaultMessage="Application Instructions" id="FiscalHost.Instructions" />
              </h1>
              <Separator className="my-1 ml-2 w-fit grow" />
            </div>

            <FormField name="applyMessage">{({ field }) => <Textarea className="min-h-32" {...field} />}</FormField>

            <div className="mt-4 flex flex-col gap-2 sm:justify-stretch">
              <Button className="grow" type="submit" loading={submitting} disabled={!dirty}>
                <FormattedMessage id="save" defaultMessage="Save" />
              </Button>
            </div>
          </form>
        )}
      </Formik>
    </React.Fragment>
  );
};

export default FiscalHost;
