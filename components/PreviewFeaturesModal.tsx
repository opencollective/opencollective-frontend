import React from 'react';
import { useMutation } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { gql } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import type { PreviewFeature } from '../lib/preview-features';

import CommentIcon from './icons/CommentIcon';
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

const FeatureListItem = ({
  feature,
  enabled,
  selected,
  onClick,
}: {
  feature: PreviewFeature;
  enabled: boolean;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors ${selected ? 'bg-muted ring-2 ring-primary' : 'hover:bg-muted'}`}
    onClick={onClick}
    type="button"
    style={{ outline: 'none' }}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
    <span className="truncate">{feature.title}</span>
  </button>
);

const useTogglePreviewFeature = (feature: PreviewFeature, onManualFeatureUpdate: () => void) => {
  const { LoggedInUser, updateLoggedInUserFromCache } = useLoggedInUser();
  const [loading, setLoading] = React.useState(false);
  const [submitEditSettings] = useMutation(editAccountSettingsMutation);

  const togglePreviewFeature = async checked => {
    setLoading(true);
    if ('setIsEnabled' in feature && typeof feature.setIsEnabled === 'function') {
      feature.setIsEnabled(checked);
      onManualFeatureUpdate();
    } else {
      await submitEditSettings({
        variables: {
          account: { slug: LoggedInUser.collective.slug },
          key: `earlyAccess.${feature.key}`,
          value: checked,
        },
        update: (cache, { data }) => {
          cache.modify({
            id: cache.identify(LoggedInUser.collective),
            fields: { settings: () => data.editAccountSetting.settings },
          });
          updateLoggedInUserFromCache();
        },
      });
    }
    setLoading(false);
  };

  return { togglePreviewFeature, loading, isChecked: LoggedInUser.hasPreviewFeatureEnabled(feature.key) };
};

const DependentFeatureToggle = ({
  feature,
  disabled,
  onManualFeatureUpdate,
}: {
  feature: PreviewFeature;
  disabled: boolean;
  onManualFeatureUpdate: () => void;
}) => {
  const { togglePreviewFeature, loading, isChecked } = useTogglePreviewFeature(feature, onManualFeatureUpdate);
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-foreground">{feature.title}</span>
      <Switch
        id={feature.key}
        checked={isChecked}
        disabled={loading || disabled}
        onCheckedChange={togglePreviewFeature}
      />
    </div>
  );
};

const FeatureDetailsPanel = ({
  feature,
  dependentFeatures,
  onManualFeatureUpdate,
}: {
  feature: PreviewFeature;
  dependentFeatures: PreviewFeature[];
  onManualFeatureUpdate: () => void;
}) => {
  const { togglePreviewFeature, loading, isChecked } = useTogglePreviewFeature(feature, onManualFeatureUpdate);
  return (
    <div className="flex flex-col gap-2">
      <div className="mb-4 flex flex-col gap-2 rounded-lg border-b border-gray-200 bg-muted/60 px-4 py-4 shadow-sm">
        <div className="flex flex-row items-center gap-4">
          <h2 className="flex-1 text-sm leading-tight font-semibold text-foreground">{feature.title}</h2>
          <Badge size="sm" type={feature.publicBeta ? 'success' : 'warning'}>
            {feature.publicBeta ? (
              <FormattedMessage id="PreviewFeatures.publicBeta" defaultMessage="Public beta" />
            ) : (
              <FormattedMessage id="PreviewFeatures.LimitedAccess" defaultMessage="Limited preview" />
            )}
          </Badge>
          <Switch
            id={feature.key}
            checked={isChecked}
            disabled={loading}
            onCheckedChange={togglePreviewFeature}
            className="ml-2"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 px-1">
        {feature.description && <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>}
        {dependentFeatures?.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
              <FormattedMessage defaultMessage="Additional features" id="PreviewFeatures.AdditionalFeatures" />
            </div>
            <div className="flex flex-col gap-1">
              {dependentFeatures.map(dependentFeature => (
                <DependentFeatureToggle
                  key={dependentFeature.key}
                  feature={dependentFeature}
                  disabled={!isChecked}
                  onManualFeatureUpdate={onManualFeatureUpdate}
                />
              ))}
            </div>
          </div>
        )}
        <div className="mt-2">
          <Link
            href={`/contact`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground underline hover:text-neutral-700"
          >
            <CommentIcon size={14} />
            <FormattedMessage defaultMessage="Give feedback" id="GiveFeedback" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const PreviewFeaturesModal = ({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {
  const { LoggedInUser } = useLoggedInUser();
  const previewFeatures = LoggedInUser?.getAvailablePreviewFeatures() || [];
  const [, setUpdateCount] = React.useState(0); // Force a re-render of the component (since setIsEnabled can trigger updates outside of React)

  // Group features by category
  const featuresByCategory = previewFeatures.reduce(
    (acc, feature) => {
      const category = feature.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(feature);
      return acc;
    },
    {} as Record<string, PreviewFeature[]>,
  );

  // Flat list for selection
  const flatFeatures = Object.values(featuresByCategory)
    .flat()
    .filter(f => !f.dependsOn);
  const [selectedKey, setSelectedKey] = React.useState(flatFeatures[0]?.key);
  const selectedFeature = flatFeatures.find(f => f.key === selectedKey) || flatFeatures[0];
  const dependentFeatures = previewFeatures.filter(f => f.dependsOn === selectedFeature?.key);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle>
            <FormattedMessage id="PreviewFeatures" defaultMessage="Preview Features" />
          </DialogTitle>
          <DialogDescription>
            <FormattedMessage defaultMessage="Get early access to features that are in development." id="aOV5bB" />
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Left: Feature List */}
          <div className="mb-4 max-h-[40vh] w-full overflow-y-auto border-b pr-0 sm:mb-0 sm:max-h-[60vh] sm:w-60 sm:border-r sm:border-b-0 sm:pr-3">
            {Object.entries(featuresByCategory).map(([category, features]) => (
              <div key={category} className="mb-3">
                <div className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">{category}</div>
                <div className="flex flex-col gap-0.5 pl-[2px]">
                  {features
                    .filter(f => !f.dependsOn)
                    .map(feature => (
                      <FeatureListItem
                        key={feature.key}
                        feature={feature}
                        enabled={LoggedInUser.hasPreviewFeatureEnabled(feature.key)}
                        selected={selectedKey === feature.key}
                        onClick={() => setSelectedKey(feature.key)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
          {/* Right: Feature Details */}
          <div className="min-w-0 flex-1 pt-1">
            {selectedFeature && (
              <FeatureDetailsPanel
                feature={selectedFeature}
                dependentFeatures={dependentFeatures}
                onManualFeatureUpdate={() => setUpdateCount(count => count + 1)}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewFeaturesModal;
