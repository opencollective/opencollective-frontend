import React from 'react';
import { Clock } from 'lucide-react';
import { FormattedDate, FormattedMessage } from 'react-intl';

import type { GraphQLV1Collective } from '../lib/custom_typings/GraphQLV1Collective';
import type { Currency as GraphQLCurrency } from '../lib/graphql/types/v2/graphql';

import CollectiveCard from './gift-cards/CollectiveCard';
import Currency from './Currency';
import { WebsiteName } from './I18nFormatters';
import Link from './Link';

const GiftCard = ({
  amount,
  currency,
  collective,
  emitter,
  expiryDate,
}: {
  amount: number;
  currency: GraphQLCurrency;
  collective: GraphQLV1Collective;
  emitter: GraphQLV1Collective;
  expiryDate?: string;
}) => {
  return (
    <div className="relative mx-auto min-h-[200px] w-full max-w-[320px] overflow-hidden rounded-[20px] bg-transparent bg-[url('/static/images/oc-gift-card-front.svg')] bg-cover bg-no-repeat shadow-[0px_8px_16px_rgba(20,20,20,0.12)] sm:min-h-[270px] sm:max-w-[450px]">
      <div className="p-4 shadow-[-2px_5px_10px_0px_inset_#ffffff47] sm:p-5">
        <p className="text-lg text-white sm:text-2xl">
          <FormattedMessage
            id="giftcard.user.name"
            defaultMessage="Hello again, {name}!"
            values={{ name: collective.name || `@${collective.slug}` }}
          />
        </p>
        <p className="mt-2 text-xs text-white sm:text-sm">
          <FormattedMessage
            id="giftcard.user.text"
            defaultMessage="Contribute on {WebsiteName} with this Gift Card, courtesy of {emitter}."
            values={{
              emitter: (
                <Link href={`/${emitter.slug}`} className="underline">
                  {emitter.name}
                </Link>
              ),
              WebsiteName,
            }}
          />
        </p>
        {emitter.imageUrl ? (
          <div className="mt-4">
            <CollectiveCard
              m="0px"
              collective={emitter}
              mb={3}
              size={[48, 64]}
              avatarSize={[24, 32]}
              fontSize="14px"
              boxShadow="0 0 8px rgba(0, 0, 0, 0.24) inset"
              borderColor="blue.200"
              p={2}
            />
          </div>
        ) : null}
      </div>
      {expiryDate && (
        <div className="absolute bottom-[6px] left-[8px] md:bottom-[10px] md:left-[14px]">
          <p className="text-black-700 mt-2 text-[12px]">
            <Clock className="inline" size={16} />
            <span className="ml-1 align-middle">
              <FormattedMessage
                id="ContributePayment.expiresOn"
                defaultMessage="Expires on {expiryDate}"
                values={{
                  expiryDate: (
                    <strong>
                      <FormattedDate value={expiryDate} />
                    </strong>
                  ),
                }}
              />
            </span>
          </p>
        </div>
      )}
      <div className="absolute bottom-[8px] right-[8px] md:bottom-[12px] md:right-[12px]">
        <div className="AmountCurrency flex items-start">
          <span className="text-[2.5rem] font-bold leading-[2.5rem] text-[#313233]">
            <Currency value={amount} currency={currency} precision="auto" />
          </span>
          <div className="ml-1">
            <span className="currency text-[1rem] text-[#9D9FA3]">{currency}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftCard;
