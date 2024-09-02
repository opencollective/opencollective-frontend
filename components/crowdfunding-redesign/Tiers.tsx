import React from 'react';
import { getApplicableTaxes } from '@opencollective/taxes';
import { FormattedMessage } from 'react-intl';

import { getPrecisionFromAmount, graphqlAmountValueInCents } from '../../lib/currency-utils';
import { isPastEvent } from '../../lib/events';
import { TierFrequency } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { isTierExpired } from '../../lib/tier-utils';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Button } from '../ui/Button';
import { InputGroup } from '../ui/Input';

import { triggerPrototypeToast } from './helpers';

const canContribute = (collective, LoggedInUser) => {
  if (!collective.isActive) {
    return false;
  } else if (collective.type === 'EVENT') {
    return !isPastEvent(collective) || Boolean(LoggedInUser.isAdminOfCollectiveOrHost(collective));
  } else {
    return true;
  }
};

const CustomTierCard = () => {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center gap-2 font-medium">
          <InputGroup defaultValue={'20'} prepend="$" className="w-20" />
          <span>a month</span>
        </div>
        <Button variant="outline" className="">
          Select
        </Button>
      </div>
    </div>
  );
};
export const Tiers = ({ account }) => {
  const LoggedInUser = useLoggedInUser();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select a tier</h3>
      <CustomTierCard />
      {account.tiers.nodes.map(tier => {
        const isFlexibleAmount = tier.amountType === 'FLEXIBLE';
        const minAmount = isFlexibleAmount ? tier.minimumAmount : tier.amount;
        const tierIsExpired = isTierExpired(tier);
        const canContributeToCollective = canContribute(account, LoggedInUser);
        const hasNoneLeft = tier.availableQuantity === 0;
        const currency = tier.currency || account.currency;
        const isDisabled = !canContributeToCollective || tierIsExpired || hasNoneLeft;
        const taxes = getApplicableTaxes(account, account.host, tier.type);

        return (
          <div key={tier.id} className="space-y-2 rounded-lg border p-4">
            <div className="text-balance text-lg font-semibold">{tier.name}</div>
            <div className="text-sm">{tier.description}</div>
            {!isDisabled && graphqlAmountValueInCents(minAmount) > 0 && (
              <div className="mt-3 text-muted-foreground">
                {isFlexibleAmount && (
                  <span className="block text-sm">
                    <FormattedMessage id="ContributeTier.StartsAt" defaultMessage="Starts at" />
                  </span>
                )}

                <div className="flex min-h-[36px] flex-col">
                  <span data-cy="amount">
                    <FormattedMoneyAmount
                      amount={graphqlAmountValueInCents(minAmount)}
                      frequency={tier.frequency && tier.frequency !== TierFrequency.FLEXIBLE ? tier.frequency : null}
                      currency={currency}
                      amountClassName="text-foreground font-bold text-2xl"
                      precision={getPrecisionFromAmount(graphqlAmountValueInCents(minAmount))}
                    />
                    {taxes.length > 0 && ' *'}
                  </span>
                  {taxes.length > 0 && (
                    <span className="text-xs">
                      *{' '}
                      {taxes.length > 1 ? (
                        <FormattedMessage id="ContributeTier.Taxes" defaultMessage="Taxes may apply" />
                      ) : (
                        <FormattedMessage
                          defaultMessage="{taxName} may apply"
                          id="N9TNT7"
                          values={{ taxName: taxes[0].type }}
                        />
                      )}
                    </span>
                  )}
                </div>
              </div>
            )}
            <Button variant="outline" onClick={triggerPrototypeToast}>
              {tier.button || <FormattedMessage defaultMessage="Contribute" id="Contribute" />}
            </Button>
          </div>
        );
      })}
    </div>
  );
};
