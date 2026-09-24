import React from 'react';
import { ExternalLink } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { isURL } from 'validator';

import type { GraphQLV1Collective } from '@/lib/custom_typings/GraphQLV1';

import { Button } from './ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/Dialog';
import Avatar from './Avatar';
import HostPricingInfoRow from './HostPricingInfoRow';
import HTMLContent, { isEmptyHTMLValue } from './HTMLContent';

type HostInformationDialogProps = {
  collective: GraphQLV1Collective;
};

const getTos = (collective: GraphQLV1Collective) => {
  const tos = collective.settings?.tos;
  if (typeof tos === 'string') {
    const cleanedTos = tos.trim();
    if (isURL(cleanedTos)) {
      return cleanedTos;
    }
  }

  return null;
};

export default function HostInformationDialog({ collective }: HostInformationDialogProps) {
  const [open, setOpen] = React.useState(false);
  const useAlternativeHostFeeNaming = Boolean(collective.settings?.useAlternativeHostFeeNaming);
  const hasLongDescription = !isEmptyHTMLValue(collective.longDescription);
  const hasDescription = Boolean(collective.description?.trim());
  const tos = getTos(collective);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-cy="host-information" variant="outline" size="xs" className="text-gray-700">
          <FormattedMessage id="Hero.HostInformation" defaultMessage="Host information" />
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-0 sm:max-w-xl">
        <DialogHeader className="mb-8 items-center space-y-0 pb-0 text-center">
          <Avatar collective={collective} type={collective.type} radius={64} className="mb-2" />
          <DialogTitle className="mt-2 mb-1 text-xl leading-7 text-neutral-900">{collective.name}</DialogTitle>
          {hasDescription && (
            <p className="max-w-md text-sm leading-relaxed text-neutral-600">{collective.description}</p>
          )}
          {collective.createdAt && collective.currency && (
            <div className="mt-5 w-full">
              <HostPricingInfoRow
                createdAt={collective.createdAt}
                currency={collective.currency}
                hostFeePercent={collective.hostFeePercent ?? null}
                platformContributionAvailable={Boolean(collective.platformContributionAvailable)}
                useAlternativeHostFeeNaming={useAlternativeHostFeeNaming}
              />
            </div>
          )}
        </DialogHeader>

        {(tos || hasLongDescription) && (
          <div className="mb-6 flex flex-col gap-6 text-left">
            {tos && (
              <a
                href={tos}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-4 rounded-md border border-neutral-200 px-4 py-3 transition-colors hover:bg-neutral-50"
              >
                <span className="text-sm font-medium text-neutral-900">
                  <FormattedMessage id="host.tos" defaultMessage="Terms of fiscal hosting" />
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 group-hover:text-blue-700">
                  <FormattedMessage id="Hero.HostInformation.viewTerms" defaultMessage="View" />
                  <ExternalLink size={14} aria-hidden />
                </span>
              </a>
            )}

            {hasLongDescription && (
              <section className="rounded-md border border-neutral-200 px-4 py-5 text-sm leading-relaxed text-neutral-600">
                <h3 className="mb-2 border-b border-neutral-100 pb-2 text-lg font-semibold text-neutral-900">
                  <FormattedMessage id="collective.about.title" defaultMessage="About" />
                </h3>
                <HTMLContent
                  content={collective.longDescription}
                  fontSize="14px"
                  collapsable
                  maxCollapsedHeight={200}
                  collapsePadding={0}
                />
              </section>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            <FormattedMessage defaultMessage="Close" id="Close" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
