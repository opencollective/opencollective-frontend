import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { PreviewFeature } from '../lib/preview-features';

import { Badge } from './ui/Badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/Dialog';
import { Switch } from './ui/Switch';
import Link from './Link';

const editAccountSettingsMutation = gql`
  mutation EditAccountSettings($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;

const PreviewFeatureCard = ({ feature }: { feature: PreviewFeature }) => {
  const { LoggedInUser, refetchLoggedInUser } = useLoggedInUser();
  const [isChecked, setIsChecked] = React.useState(LoggedInUser.hasPreviewFeatureEnabled(feature.key));
  const [loading, setLoading] = React.useState(false);
  const [submitEditSettings] = useMutation(editAccountSettingsMutation, {
    context: API_V2_CONTEXT,
  });

  const togglePreviewFeature = async (featureKey, checked) => {
    setIsChecked(checked);
    setLoading(true);
    await submitEditSettings({
      variables: {
        account: { slug: LoggedInUser.collective.slug },
        key: `earlyAccess.${featureKey}`,
        value: checked,
      },
    });
    await refetchLoggedInUser();
    setLoading(false);
  };

  return (
    <div className="flex flex-row items-center justify-between gap-3 rounded-lg border p-4" key={feature.title}>
      <div className="space-y-0.5">
        <label className="flex flex-wrap items-center gap-x-2 text-base font-medium" htmlFor={feature.key}>
          <span>{feature.title}</span>
          <Badge size="sm" type={feature.publicBeta ? 'success' : 'warning'}>
            {feature.publicBeta ? (
              <FormattedMessage id="PreviewFeatures.publicBeta" defaultMessage="Public beta" />
            ) : (
              <FormattedMessage id="PreviewFeatures.LimitedAccess" defaultMessage="Limited preview" />
            )}
          </Badge>
        </label>

        <p className="text-sm text-muted-foreground">{feature.description}</p>
      </div>
      <Switch
        id={feature.key}
        checked={isChecked}
        disabled={loading}
        onCheckedChange={checked => {
          togglePreviewFeature(feature.key, checked);
        }}
      />
    </div>
  );
};

const PreviewFeaturesModal = ({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {
  const { LoggedInUser } = useLoggedInUser();
  const previewFeatures = LoggedInUser?.getAvailablePreviewFeatures() || [];
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage id="PreviewFeatures" defaultMessage="Preview Features" />
          </DialogTitle>
          <DialogDescription>
            <FormattedMessage
              id="PreviewFeatures.description"
              defaultMessage="Get early access to features that are in development. Please <ContactLink>let us know</ContactLink> how we can make them better."
              values={{
                ContactLink: msg => (
                  <Link className="text-blue-700 hover:underline" href="/contact">
                    {msg}
                  </Link>
                ),
              }}
            />
          </DialogDescription>
        </DialogHeader>
        {previewFeatures?.map(feature => <PreviewFeatureCard key={feature.key} feature={feature} />)}
      </DialogContent>
    </Dialog>
  );
};

export default PreviewFeaturesModal;
