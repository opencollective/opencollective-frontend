import React, { useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { Add } from '@styled-icons/material/Add';
import { get, last, omitBy } from 'lodash';
import memoizeOne from 'memoize-one';
import { useRouter } from 'next/router';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import { gqlV1 } from '../../../lib/graphql/helpers';
import type { GraphQLV1PaymentMethod } from '@/lib/custom_typings/GraphQLV1';

import { getI18nLink } from '@/components/I18nFormatters';

import { ALL_SECTIONS, SECTION_LABELS } from '../../dashboard/constants';
import DashboardHeader from '../../dashboard/DashboardHeader';
import GiftCardDetails from '../../GiftCardDetails';
import Link from '../../Link';
import Loading from '../../Loading';
import Tabs from '../../Tabs';
import { Button } from '../../ui/Button';
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '../../ui/Pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/Select';

interface GiftCardBatch {
  id: string;
  name: string;
  count: number;
}

interface GiftCardsQueryData {
  offset: number;
  limit: number;
  total: number;
  paymentMethods: GraphQLV1PaymentMethod[];
}

interface QueryResult {
  Collective: {
    id: number;
    giftCardsBatches: GiftCardBatch[];
    createdGiftCards: GiftCardsQueryData;
  };
}

interface BatchOption {
  label: string;
  value: string;
}

interface FilterTab {
  id: string;
  label: React.ReactNode;
}

const messages = {
  notBatched: {
    id: 'giftCards.notBatched',
    defaultMessage: 'Not batched',
  },
  allBatches: {
    id: 'giftCards.batches.all',
    defaultMessage: 'All batches',
  },
};

const NOT_BATCHED_KEY = '__not-batched__';
const GIFT_CARDS_PER_PAGE = 15;

const getIsConfirmedFromFilter = (filter: string | undefined): boolean | undefined => {
  if (filter === undefined || filter === 'all') {
    return undefined;
  }
  return filter === 'redeemed';
};

const giftCardsQuery = gqlV1/* GraphQL */ `
  query EditCollectiveGiftCards($collectiveId: Int, $isConfirmed: Boolean, $limit: Int, $offset: Int, $batch: String) {
    Collective(id: $collectiveId) {
      id
      giftCardsBatches {
        id
        name
        count
      }
      createdGiftCards(isConfirmed: $isConfirmed, limit: $limit, offset: $offset, batch: $batch) {
        offset
        limit
        total
        paymentMethods {
          id
          uuid
          currency
          name
          service
          type
          batch
          data
          initialBalance
          monthlyLimitPerMember
          balance
          expiryDate
          isConfirmed
          createdAt
          description
          collective {
            id
            slug
            imageUrl
            type
            name
          }
        }
      }
    }
  }
`;

interface GiftCardsPaginationProps {
  currentOffset: number;
  total: number;
  limit: number;
  collectiveSlug: string;
  getQueryParams: (picked: string[], newParams: Record<string, any>) => Record<string, any>;
  router: ReturnType<typeof useRouter>;
}

const GiftCardsPagination: React.FC<GiftCardsPaginationProps> = ({
  currentOffset,
  total,
  limit,
  collectiveSlug,
  getQueryParams,
  router,
}) => {
  const currentPage = Math.floor(currentOffset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const maxVisiblePages = 5;

  const getPageNumbers = () => {
    const pages: number[] = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const goToPage = (page: number) => {
    const newOffset = (page - 1) * limit;
    router.push({
      pathname: `/dashboard/${collectiveSlug}/gift-cards`,
      query: getQueryParams(['filter', 'batch', 'offset'], { offset: newOffset }),
    });
  };

  const pages = getPageNumbers();
  return (
    <Pagination>
      <PaginationContent aria-atomic="true" data-cy="gift-cards-pagination">
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious onClick={() => goToPage(currentPage - 1)} />
          </PaginationItem>
        )}
        {pages[0] > 1 && (
          <React.Fragment>
            <PaginationItem>
              <PaginationButton onClick={() => goToPage(1)}>1</PaginationButton>
            </PaginationItem>
            {pages[0] > 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
          </React.Fragment>
        )}
        {pages.map(page => (
          <PaginationItem key={page}>
            <PaginationButton isActive={page === currentPage} onClick={() => goToPage(page)}>
              {page}
            </PaginationButton>
          </PaginationItem>
        ))}
        {pages[pages.length - 1] < totalPages && (
          <React.Fragment>
            {pages[pages.length - 1] < totalPages - 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationButton onClick={() => goToPage(totalPages)}>{totalPages}</PaginationButton>
            </PaginationItem>
          </React.Fragment>
        )}
        <PaginationItem>
          <PaginationNext
            onClick={() => currentPage < totalPages && goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

interface GiftCardsProps {
  collectiveId: number;
  collectiveSlug: string;
  limit?: number;
}

const filterTabs: FilterTab[] = [
  { id: 'all', label: <FormattedMessage id="giftCards.filterAll" defaultMessage="All" /> },
  { id: 'redeemed', label: <FormattedMessage id="giftCards.filterRedeemed" defaultMessage="Redeemed" /> },
  { id: 'pending', label: <FormattedMessage id="giftCards.filterPending" defaultMessage="Pending" /> },
] as const;

const GiftCards: React.FC<GiftCardsProps> = ({ collectiveId, collectiveSlug, limit }) => {
  const intl = useIntl();
  const router = useRouter();
  const { filter, batch, offset } = router.query;

  const getQueryParams = useCallback(
    (picked: string[], newParams: Record<string, any>) => {
      return omitBy({ ...router.query, ...newParams }, (value, key) => !value || !picked.includes(key));
    },
    [router.query],
  );

  const { data, loading } = useQuery<QueryResult>(giftCardsQuery, {
    variables: {
      collectiveId,
      isConfirmed: getIsConfirmedFromFilter(filter as string | undefined),
      batch: batch === NOT_BATCHED_KEY ? null : batch,
      offset: Number(offset) || 0,
      limit: limit || GIFT_CARDS_PER_PAGE,
    },
    fetchPolicy: 'network-only',
  });

  const getBatchesOptions = memoizeOne(
    (
      batches: GiftCardBatch[] | undefined,
      selectedBatch: string | undefined,
      intl: IntlShape,
    ): [BatchOption[], BatchOption | null] => {
      if (!batches || batches.length < 2) {
        return [[], null];
      } else {
        const options: BatchOption[] = [
          { label: intl.formatMessage(messages.allBatches), value: 'all' },
          ...batches.map(batch => ({
            label: `${batch.name || intl.formatMessage(messages.notBatched)} (${batch.count})`,
            value: batch.name || NOT_BATCHED_KEY,
          })),
        ];

        return [options, options.find(option => option.value === selectedBatch) || null];
      }
    },
  );

  const renderNoGiftCardMessage = (onlyConfirmed: boolean | undefined) => {
    if (onlyConfirmed === undefined) {
      return (
        <Link href={`/dashboard/${collectiveSlug}/gift-cards-create`}>
          <FormattedMessage id="giftCards.createFirst" defaultMessage="Create your first gift card!" />
        </Link>
      );
    } else if (onlyConfirmed) {
      return <FormattedMessage id="giftCards.emptyClaimed" defaultMessage="No gift cards claimed yet" />;
    } else {
      return <FormattedMessage id="giftCards.emptyUnclaimed" defaultMessage="No unclaimed gift cards" />;
    }
  };

  const queryResult = get(data, 'Collective.createdGiftCards', {}) as GiftCardsQueryData;
  const onlyConfirmed = get(data, 'variables.isConfirmed') as boolean | undefined;
  const batches = get(data, 'Collective.giftCardsBatches') as GiftCardBatch[];
  const { limit: resultLimit, total, paymentMethods = [] } = queryResult;
  const lastGiftCard = last(paymentMethods);
  const [batchesOptions] = getBatchesOptions(batches, get(data, 'variables.batch'), intl);

  const handleTabChange = useCallback(
    (value: string) => {
      router.push({
        pathname: `/dashboard/${collectiveSlug}/gift-cards`,
        query: getQueryParams(['filter', 'batch'], { filter: value }),
      });
    },
    [collectiveSlug, getQueryParams, router],
  );

  return (
    <div>
      <div className="flex justify-between gap-2">
        <DashboardHeader
          title={intl.formatMessage(SECTION_LABELS[ALL_SECTIONS.GIFT_CARDS])}
          description={intl.formatMessage(
            {
              defaultMessage:
                'Gift cards empower your employees or community members to support the open source projects they love. <LearnMoreLink>Learn more</LearnMoreLink>.',
              id: '35Jfcr',
            },
            {
              LearnMoreLink: getI18nLink({
                href: 'https://docs.opencollective.com/help/financial-contributors/organizations/gift-cards',
                openInNewTab: true,
              }),
            },
          )}
        />
        <Link href={`/dashboard/${collectiveSlug}/gift-cards-create`}>
          <Button className="flex items-center whitespace-nowrap">
            <Add size="1em" />
            <FormattedMessage id="giftCards.create" defaultMessage="Create gift cards" />
          </Button>
        </Link>
      </div>
      <div className="mt-8">
        <div className="mb-8">
          <Tabs
            tabs={filterTabs}
            selectedId={Array.isArray(filter) ? filter[0] : filter || 'all'}
            onChange={handleTabChange}
          />
        </div>
        {batchesOptions.length > 1 && (
          <div className="mb-12">
            <Select
              value={(batch as string) || 'all'}
              onValueChange={value =>
                router.push({
                  pathname: `/dashboard/${collectiveSlug}/gift-cards`,
                  query: getQueryParams(['filter', 'batch'], { batch: value === 'all' ? undefined : value }),
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={intl.formatMessage(messages.allBatches)} />
              </SelectTrigger>
              <SelectContent>
                {batchesOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      {loading ? (
        <Loading />
      ) : (
        <div data-cy="gift-cards-list">
          {paymentMethods.length === 0 ? (
            <div className="mt-16 flex justify-center">{renderNoGiftCardMessage(onlyConfirmed)}</div>
          ) : (
            <React.Fragment>
              {paymentMethods.map(v => (
                <div key={v.id}>
                  <GiftCardDetails giftCard={v} collectiveSlug={collectiveSlug} />
                  {v !== lastGiftCard && <hr className="my-6" />}
                </div>
              ))}
              {total > resultLimit && (
                <div className="mt-16 flex justify-center">
                  <GiftCardsPagination
                    currentOffset={Number(offset) || 0}
                    total={total}
                    limit={resultLimit}
                    collectiveSlug={collectiveSlug}
                    getQueryParams={getQueryParams}
                    router={router}
                  />
                </div>
              )}
            </React.Fragment>
          )}
        </div>
      )}
    </div>
  );
};

export default GiftCards;
