import React from 'react';
import { useQuery } from '@apollo/client';
import { get } from 'lodash';
import { defineMessage, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { CollectiveType } from '../../../../lib/constants/collectives';
import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { integer, isMulti } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { AccountVirtualCardsQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import { VirtualCardStatus } from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { sortSelectOptions } from '../../../../lib/utils';
import { VirtualCardStatusI18n } from '../../../../lib/virtual-cards/constants';

import VirtualCard from '../../../edit-collective/VirtualCard';
import HTMLContent from '../../../HTMLContent';
import { getI18nLink } from '../../../I18nFormatters';
import Loading from '../../../Loading';
import Pagination from '../../../Pagination';
import RequestVirtualCardBtn from '../../../RequestVirtualCardBtn';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../ui/Accordion';
import { Button } from '../../../ui/Button';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { dateFilter } from '../../filters/DateFilter';
import { Filterbar } from '../../filters/Filterbar';
import { orderByFilter } from '../../filters/OrderFilter';
import type { DashboardSectionProps } from '../../types';

import { accountVirtualCardsQuery } from './queries';

const VIRTUAL_CARDS_PER_PAGE = 6;

const schema = z.object({
  limit: integer.default(VIRTUAL_CARDS_PER_PAGE),
  offset: integer.default(0),
  date: dateFilter.schema,
  orderBy: orderByFilter.schema,
  status: isMulti(z.nativeEnum(VirtualCardStatus)).optional(),
});
type FilterValues = z.infer<typeof schema>;

const toVariables: FiltersToVariables<FilterValues, AccountVirtualCardsQueryVariables> = {
  date: dateFilter.toVariables,
  orderBy: orderByFilter.toVariables,
};

const filters: FilterComponentConfigs<FilterValues> = {
  date: { ...dateFilter.filter, labelMsg: defineMessage({ defaultMessage: 'Created at' }) },
  orderBy: orderByFilter.filter,
  status: {
    labelMsg: defineMessage({ defaultMessage: 'Status' }),
    Component: ({ intl, ...props }) => (
      <ComboSelectFilter
        isMulti
        options={Object.values(VirtualCardStatus)
          .map(value => ({ label: intl.formatMessage(VirtualCardStatusI18n[value]), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => intl.formatMessage(VirtualCardStatusI18n[value]),
  },
};

const VitualCards = ({ accountSlug }: DashboardSectionProps) => {
  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    filters,
  });
  const { loading, data } = useQuery(accountVirtualCardsQuery, {
    context: API_V2_CONTEXT,
    variables: {
      slug: accountSlug,
      ...queryFilter.variables,
    },
    returnPartialData: true,
  });

  const { account } = data || {};
  const allowRequestVirtualCard = get(account, 'host.settings.virtualcards.requestcard');

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="VirtualCards.Title" defaultMessage="Virtual Cards" />}
        description={
          <FormattedMessage
            id="VirtualCards.Description"
            defaultMessage="Use a virtual card to spend from your collective's budget. You can request multiple cards (review the host's policy to see how many). Your fiscal host will create the card for you and assign it a limit and a merchant. You will be notified by email once the card is assigned. <learnMoreLink>Learn more</learnMoreLink>"
            values={{
              learnMoreLink: getI18nLink({
                href: 'https://docs.opencollective.com/help/expenses-and-getting-paid/virtual-cards',
                openInNewTabNoFollow: true,
              }),
            }}
          />
        }
        actions={
          allowRequestVirtualCard &&
          account?.isApproved && (
            <RequestVirtualCardBtn collective={account} host={account.host}>
              {btnProps => (
                <Button className="" {...btnProps}>
                  <FormattedMessage id="VirtualCards.RequestCardButton" defaultMessage="Request card" />
                </Button>
              )}
            </RequestVirtualCardBtn>
          )
        }
      >
        {data?.account.host?.settings?.virtualcards?.policy && (
          <Accordion type="single" collapsible className="max-w-prose">
            <AccordionItem className="border-b-0" value="item-1">
              <AccordionTrigger>
                <FormattedMessage
                  id="VirtualCards.Policy.Reminder"
                  defaultMessage="{hostName} Virtual Card use Policy"
                  values={{
                    hostName: data.account.host.name,
                  }}
                />
              </AccordionTrigger>
              <AccordionContent>
                <HTMLContent content={data.account.host.settings.virtualcards.policy} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </DashboardHeader>

      <Filterbar {...queryFilter} />

      {!loading && !data?.account?.virtualCards.nodes.length ? (
        <EmptyResults
          entityType="VIRTUAL_CARDS"
          hasFilters={queryFilter.hasFilters}
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : loading ? (
        <Loading />
      ) : (
        <div className="flex flex-col gap-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.account?.virtualCards.nodes.map(virtualCard => (
              <VirtualCard
                host={data.account.host}
                canEditVirtualCard={virtualCard.data.status === 'active'}
                canPauseOrResumeVirtualCard
                canDeleteVirtualCard
                confirmOnPauseCard={data.account.type === CollectiveType.COLLECTIVE}
                key={virtualCard.id}
                virtualCard={virtualCard}
                onDeleteRefetchQuery="AccountVirtualCards"
              />
            ))}
          </div>

          <div className="flex justify-center">
            <Pagination
              onPageChange={page => queryFilter.setFilter('offset', (page - 1) * queryFilter.values.limit)}
              total={data?.account?.virtualCards.totalCount}
              limit={queryFilter.values.limit}
              offset={queryFilter.values.offset}
              ignoredQueryParams={['slug', 'section']}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VitualCards;
