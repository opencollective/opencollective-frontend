import React from 'react';
import { FormattedDate, FormattedMessage } from 'react-intl';

import DefinedTerm, { Terms } from './DefinedTerm';

type HostPricingInfoRowProps = {
  createdAt: string;
  currency: string;
  hostFeePercent: number | null;
  platformContributionAvailable: boolean;
  useAlternativeHostFeeNaming?: boolean;
  hostFeeWithDefinedTerm?: boolean;
};

const labelClassName = 'mb-1 text-xs font-normal leading-[18px] text-neutral-600 text-center';
const valueClassName = 'text-base font-medium leading-6 text-neutral-900 text-center';

export default function HostPricingInfoRow({
  createdAt,
  currency,
  hostFeePercent,
  platformContributionAvailable,
  useAlternativeHostFeeNaming,
}: HostPricingInfoRowProps) {
  const hostFeeTerm = useAlternativeHostFeeNaming ? Terms.ADMINISTRATIVE_CONTRIBUTION : Terms.HOST_FEE;

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
          <DefinedTerm color="black.700" borderColor="#969ba3" fontSize="12px" term={hostFeeTerm} />
        </p>
        <p className={valueClassName}>{Number.isFinite(hostFeePercent) ? `${hostFeePercent}%` : '—'}</p>
      </div>
      {platformContributionAvailable && (
        <div className="flex flex-col">
          <p className={labelClassName}>
            <DefinedTerm term={Terms.PLATFORM_TIPS} color="black.700" borderColor="#969ba3" fontSize="12px" />
          </p>
          <p className={valueClassName}>
            <FormattedMessage id="a5msuh" defaultMessage="Yes" />
          </p>
        </div>
      )}
    </div>
  );
}
