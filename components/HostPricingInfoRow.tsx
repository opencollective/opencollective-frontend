import React from 'react';
import { Info } from 'lucide-react';
import { FormattedDate, FormattedMessage } from 'react-intl';

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';

type HostPricingInfoRowProps = {
  createdAt: string;
  currency: string;
  hostFeePercent: number | null;
  platformContributionAvailable: boolean;
};

const labelClassName = 'mb-1 text-xs font-normal leading-[18px] text-neutral-600';
const valueClassName = 'text-base font-medium leading-6 text-neutral-900';

export default function HostPricingInfoRow({
  createdAt,
  currency,
  hostFeePercent,
  platformContributionAvailable,
}: HostPricingInfoRowProps) {
  return (
    <div className="flex flex-wrap justify-center gap-8 rounded-md border px-6 py-4">
      <div className="flex flex-col">
        <p className={labelClassName}>
          <FormattedMessage id="HostSince" defaultMessage="Host since" />
        </p>
        <p className={valueClassName}>
          <FormattedDate value={createdAt} month="short" year="numeric" />
        </p>
      </div>
      <div className="flex flex-col">
        <p className={labelClassName}>
          <FormattedMessage id="Currency" defaultMessage="Currency" />
        </p>
        <p className={valueClassName}>{currency}</p>
      </div>
      <div className="flex flex-col">
        <p className={labelClassName}>
          <FormattedMessage id="HostFee" defaultMessage="Host fee" />
        </p>
        <p className={valueClassName}>{Number.isFinite(hostFeePercent) ? `${hostFeePercent}%` : '—'}</p>
      </div>
      {platformContributionAvailable && (
        <div className="flex flex-col">
          <p className={labelClassName}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex cursor-help items-center gap-1 underline decoration-slate-300 decoration-dashed underline-offset-2 transition-colors hover:decoration-slate-400">
                  <FormattedMessage defaultMessage="Platform Tips" id="ApplyToHostCard.platformTips" />
                  <Info size={12} className="shrink-0 text-slate-500" aria-hidden />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <FormattedMessage
                  defaultMessage="Contributors to Collectives hosted by this Fiscal Host are invited to add an optional tip to the Open Collective platform during checkout. The default tip is <b>15%</b> of the contribution amount; on average, contributors give about <b>6%</b>. <LearnMoreLink>Learn more ↗</LearnMoreLink>"
                  id="ApplyToHostCard.platformTips.tooltip"
                  values={{
                    b: chunks => <strong>{chunks}</strong>,
                    LearnMoreLink: chunks => (
                      <a
                        href="https://documentation.opencollective.com/giving-to-collectives/platform-tips"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {chunks}
                      </a>
                    ),
                  }}
                />
              </TooltipContent>
            </Tooltip>
          </p>
          <p className={valueClassName}>
            <FormattedMessage id="a5msuh" defaultMessage="Yes" />
          </p>
        </div>
      )}
    </div>
  );
}
