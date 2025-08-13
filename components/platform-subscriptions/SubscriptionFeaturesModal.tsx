import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { PlatformSubscriptionFeatures } from '@/lib/graphql/types/v2/schema';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

import type { BaseModalProps } from '../ModalContext';

import { PlatformSubscriptionFeatureList } from './PlatformSubscriptionFeatureList';

type SubscriptionFeaturesModalProps = {
  features: PlatformSubscriptionFeatures;
} & BaseModalProps;

export function SubscriptionFeaturesModal(props: SubscriptionFeaturesModalProps) {
  return (
    <Dialog open={props.open} onOpenChange={isOpen => props.setOpen(isOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Features" id="ZXp0z1" />
          </DialogTitle>
        </DialogHeader>
        <PlatformSubscriptionFeatureList features={props.features} />
      </DialogContent>
    </Dialog>
  );
}
