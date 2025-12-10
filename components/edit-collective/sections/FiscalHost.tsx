import React from 'react';
import { useMutation } from '@apollo/client';
import { Formik } from 'formik';
import { get, pick } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../lib/errors';
import { gql } from '../../../lib/graphql/helpers';
import { FEATURES, requiresUpgrade } from '@/lib/allowed-features';

import { DashboardContext } from '@/components/dashboard/DashboardContext';
import { FormField } from '@/components/FormField';
import { UpgradePlanCTA } from '@/components/platform-subscriptions/UpgradePlanCTA';
import { Card } from '@/components/ui/Card';
import { InputGroup } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';

import { Button } from '../../ui/Button';
import { useToast } from '../../ui/useToast';

const editAccountMutation = gql`
  mutation FiscalHostSettingsUpdate($account: AccountUpdateInput!) {
    editAccount(account: $account) {
      id
      legacyId
      settings
      ... on AccountWithHost {
        host {
          id
          legacyId
          hostFeePercent
        }
      }
      ... on Organization {
        host {
          id
          legacyId
          hostFeePercent
        }
      }
    }
  }
`;

const getInitialValues = account => {
  return {
    hostFees: Boolean(get(account, 'host.hostFeePercent')),
    hostFeePercent: get(account, 'host.hostFeePercent'),
    apply: get(account, 'settings.apply', false),
    applyMessage: get(account, 'settings.applyMessage', ''),
    tos: get(account, 'settings.tos', ''),
  };
};

const FiscalHost = ({ account }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [updateAccount, { loading: submitting }] = useMutation(editAccountMutation);

  const { account: accountFromDashboardQuery } = React.useContext(DashboardContext);
  const isUpgradeRequiredForSettingHostFee = requiresUpgrade(accountFromDashboardQuery, FEATURES.CHARGE_HOSTING_FEES);

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
        initialValues={getInitialValues(account)}
        onSubmit={async values => {
          try {
            await updateAccount({
              variables: {
                account: {
                  id: account.id,
                  ...(!isUpgradeRequiredForSettingHostFee && {
                    hostFeePercent: !values.hostFees
                      ? 0
                      : values.hostFeePercent
                        ? parseInt(values.hostFeePercent, 10)
                        : null,
                  }),
                  settings: pick(values, ['apply', 'applyMessage', 'tos']),
                },
              },
            });
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
        {({ handleSubmit, setFieldValue, values, dirty }) => {
          return (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Card className="flex flex-row items-center justify-between p-4">
                <div>
                  <h1 className="font-bold">
                    <FormattedMessage defaultMessage="Open to Applications" id="collective.application.label" />
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
              <Card className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-bold">
                      <FormattedMessage defaultMessage="Host Fee" id="NJsELs" />
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      <FormattedMessage
                        defaultMessage="Enable collecting a fee from contributions to the collectives you host."
                        id="FiscalHost.HostFee.description"
                      />
                    </p>
                  </div>
                  <Switch
                    name="hostFees"
                    checked={values.hostFees}
                    onCheckedChange={checked => {
                      setFieldValue('hostFees', checked);
                    }}
                    disabled={isUpgradeRequiredForSettingHostFee}
                  />
                </div>
                {values.hostFees && (
                  <FormField
                    name="hostFeePercent"
                    hint={
                      <FormattedMessage
                        defaultMessage="Calculate the fee as a percentage of the contribution amount."
                        id="FiscalHost.HostFeePercent.hint"
                      />
                    }
                  >
                    {({ field }) => (
                      <InputGroup
                        {...field}
                        disabled={isUpgradeRequiredForSettingHostFee}
                        maxLength={2}
                        className="max-w-32"
                        append="%"
                      />
                    )}
                  </FormField>
                )}
                {isUpgradeRequiredForSettingHostFee && (
                  <UpgradePlanCTA compact featureKey={FEATURES.CHARGE_HOSTING_FEES} />
                )}
              </Card>
              <Card className="flex flex-col gap-4 p-4">
                <div>
                  <h1 className="font-bold">
                    <FormattedMessage defaultMessage="Terms of Fiscal Hosting" id="FiscalHost.TOS" />
                  </h1>
                </div>
                <FormField
                  name="tos"
                  hint={
                    <FormattedMessage
                      defaultMessage="Link the terms and conditions under which your Host collects and holds funds. This appears on your public profile page and application form."
                      id="FiscalHost.ToS.description"
                    />
                  }
                />
              </Card>

              <div className="mt-4 flex w-full items-center">
                <h1 className="grow-0 text-xl font-bold whitespace-nowrap">
                  <FormattedMessage defaultMessage="Application Instructions" id="FiscalHost.Instructions" />
                </h1>
                <Separator className="my-1 ml-2 w-fit grow" />
              </div>

              <FormField
                name="applyMessage"
                hint={
                  <FormattedMessage
                    defaultMessage="These instructions appear on the application form (1000 character max)"
                    id="FiscalHost.ApplyMessage.hint"
                  />
                }
              >
                {({ field }) => <Textarea className="min-h-32" {...field} />}
              </FormField>

              <div className="mt-4 flex flex-col gap-2 sm:justify-stretch">
                <Button className="grow" type="submit" loading={submitting} disabled={!dirty}>
                  <FormattedMessage id="save" defaultMessage="Save" />
                </Button>
              </div>
            </form>
          );
        }}
      </Formik>
    </React.Fragment>
  );
};

export default FiscalHost;
