import { useCallback } from 'react';
import { ArrowRightLeft, BookKey, HandCoins, Receipt } from 'lucide-react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import type { GetActions } from '@/lib/actions/types';
import { CollectiveType } from '@/lib/constants/collectives';
import type { Contributor } from '@/lib/graphql/types/v2/schema';

import { KYCRequestModal } from '@/components/kyc/request/KYCRequestModal';
import { useModal } from '@/components/ModalContext';

type UsePersonActionsOptions = {
  accountSlug: string;
  hasKYCFeature: boolean;
};

export function usePersonActions(opts: UsePersonActionsOptions) {
  const intl = useIntl();
  const { showModal } = useModal();
  const router = useRouter();

  return useCallback<GetActions<Contributor>>(
    contributor => {
      const actions: ReturnType<GetActions<Contributor>> = {
        primary: [],
        secondary: [],
      };

      // The contributor in this context is actually an Account from the community query
      const account = contributor as unknown as { slug?: string; type?: string };
      const contributorSlug = account.slug;
      const hostSlug = router.query.slug as string;

      if (!contributorSlug || !hostSlug) {
        return actions;
      }

      actions.primary.push({
        key: 'view-expenses',
        label: intl.formatMessage({
          defaultMessage: 'View All Expenses',
          id: 'ViewAllExpenses',
        }),
        Icon: Receipt,
        onClick: () => {
          router.push({
            pathname: `/dashboard/${hostSlug}/host-expenses`,
            query: { status: 'ALL', searchTerm: `@${contributorSlug}` },
          });
        },
      });

      actions.primary.push({
        key: 'view-contributions',
        label: intl.formatMessage({
          defaultMessage: 'View All Contributions',
          id: 'ViewAllContributions',
        }),
        Icon: HandCoins,
        onClick: () => {
          router.push({
            pathname: `/dashboard/${hostSlug}/incoming-contributions`,
            query: { searchTerm: `@${contributorSlug}` },
          });
        },
      });

      actions.secondary.push({
        key: 'view-transactions',
        label: intl.formatMessage({
          defaultMessage: 'View All Transactions',
          id: 'transactions.viewAll',
        }),
        Icon: ArrowRightLeft,
        onClick: () => {
          router.push({
            pathname: `/dashboard/${hostSlug}/host-transactions`,
            query: { searchTerm: `@${contributorSlug}` },
          });
        },
      });

      if (opts.hasKYCFeature && account.type === CollectiveType.INDIVIDUAL) {
        actions.secondary.push({
          key: 'request-kyc',
          label: intl.formatMessage({
            defaultMessage: 'Request KYC Verification',
            id: 'Kio9p/',
          }),
          Icon: BookKey,
          onClick: () =>
            showModal(KYCRequestModal, {
              requestedByAccount: { slug: opts.accountSlug },
              verifyAccount: { id: contributor.id },
            }),
        });
      }

      return actions;
    },
    [intl, showModal, router, opts.accountSlug, opts.hasKYCFeature],
  );
}
