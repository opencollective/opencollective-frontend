import React from 'react';
import { useQuery } from '@apollo/client';
import { Rocket } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { gqlV1 } from '../lib/graphql/helpers';

import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import HappyBackground from '../components/gift-cards/HappyBackground';
import GiftCard from '../components/GiftCard';
import Link from '../components/Link';
import MessageBox from '../components/MessageBox';
import MessageBoxGraphqlError from '../components/MessageBoxGraphqlError';
import Page from '../components/Page';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

const redeemedPageQuery = gqlV1/* GraphQL */ `
  query RedeemedPage($collectiveSlug: String!, $code: String!) {
    Collective(slug: $collectiveSlug) {
      id
      name
      type
      slug
      imageUrl
      backgroundImageUrl
      description
      settings
    }
    PaymentMethod(code: $code) {
      id
      initialBalance
      monthlyLimitPerMember
      currency
      name
      expiryDate
      collective {
        id
        name
        slug
      }
      emitter {
        id
        name
        slug
        imageUrl
        settings
      }
    }
  }
`;

const RedeemedPage = () => {
  const intl = useIntl();
  const router = useRouter();
  const { collectiveSlug, code } = router.query;
  const { data, loading, error } = useQuery(redeemedPageQuery, {
    skip: !code || !collectiveSlug,
    variables: { code, collectiveSlug },
  });
  const paymentMethod = data?.PaymentMethod;

  return (
    <Page
      title={intl.formatMessage({ defaultMessage: 'Gift Card Redeemed!', id: 'redeemed.success' })}
      description={intl.formatMessage({
        defaultMessage: 'Use your gift card to support open source projects that you are contributing to.',
        id: 'xmmAM6',
      })}
    >
      <CollectiveThemeProvider collective={paymentMethod?.emitter}>
        <div className="flex flex-col items-center">
          <HappyBackground collective={paymentMethod?.emitter}>
            <div className="mt-16 p-2">
              {loading ? (
                <Skeleton className="mx-auto h-[104px] w-full max-w-[400px] rounded-xl" />
              ) : error ? (
                <MessageBoxGraphqlError withIcon error={error} />
              ) : !paymentMethod ? (
                <MessageBox withIcon type="error">
                  <FormattedMessage defaultMessage="Gift Card not found" id="kjkZL/" />
                </MessageBox>
              ) : (
                <div className="text-center [text-shadow:_0_2px_3px_rgb(15_15_15)]">
                  <h1 className="mb-2 text-4xl font-bold text-white">
                    <FormattedMessage id="redeemed.success" defaultMessage="Gift Card Redeemed!" /> 🎉
                  </h1>
                  <h5 className="text-xl text-white">
                    <div>
                      <FormattedMessage
                        id="redeemed.subtitle.line1"
                        defaultMessage="The card has been added to your account."
                      />
                    </div>
                    <div>
                      <FormattedMessage
                        id="redeemed.subtitle.line2"
                        defaultMessage="You can now contribute to the Collective(s) of your choice."
                      />
                    </div>
                  </h5>
                </div>
              )}
            </div>
          </HappyBackground>

          {!error && (
            <div className="mt-[-125px] flex w-full justify-center p-2">
              {loading ? (
                <Skeleton className="h-[168px] w-full max-w-[400px] rounded-xl md:h-[224px]" />
              ) : (
                <GiftCard
                  amount={paymentMethod.initialBalance || paymentMethod.monthlyLimitPerMember}
                  currency={paymentMethod.currency || 'USD'}
                  emitter={paymentMethod.emitter}
                  collective={paymentMethod.collective}
                  expiryDate={paymentMethod.expiryDate}
                />
              )}
            </div>
          )}

          <div className="my-16 p-2">
            <Link href="/search">
              <Button variant="outline">
                <Rocket size={16} />
                <FormattedMessage defaultMessage="Discover Collectives to Support" id="WM71Ho" />
              </Button>
            </Link>
          </div>
        </div>
      </CollectiveThemeProvider>
    </Page>
  );
};

// next.js export
// ts-unused-exports:disable-next-line
export default RedeemedPage;
