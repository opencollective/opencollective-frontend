import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import type { WorkspaceHomeQuery } from '../../../../lib/graphql/types/v2/graphql';
import { ActivityDescriptionI18n, ActivityTimelineMessageI18n } from '../../../../lib/i18n/activities';
import { getCollectivePageRoute } from '../../../../lib/url-helpers';

import { getActivityVariables } from '../../../admin-panel/sections/ActivityLog/ActivityDescription';
import { AvatarWithLink } from '../../../AvatarWithLink';
import DateTime from '../../../DateTime';
import { Box, Flex } from '../../../Grid';
import HTMLContent from '../../../HTMLContent';
import Link from '../../../Link';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import StyledLink from '../../../StyledLink';
import { P } from '../../../Text';

dayjs.extend(relativeTime);
const ItemHeaderWrapper = styled(P)`
  a {
    color: ${props => props.theme.colors.black[800]};
  }
  letter-spacing: 0;
  line-height: 20px;
`;

const ItemWrapper = styled(Box)`
  border-radius: 16px;
  overflow-x: hidden;
  background-color: ${props => props.theme.colors.black[50]};
  padding: 16px;
  margin-bottom: 24px;
`;

const ContentCard = styled(Box)`
  border-radius: 16px;
  background-color: white;
  padding: 16px;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

type ActivityListItemProps = {
  activity?: WorkspaceHomeQuery['activities']['nodes'][0];
  isLast?: boolean;
  openExpense?: (legacyId: number) => void;
};

const TimelineItem = ({ activity, openExpense }: ActivityListItemProps) => {
  const intl = useIntl();
  const secondaryAccount = activity?.individual?.id !== activity?.account?.id && activity.account;
  const html = activity?.data?.comment?.html || activity?.update?.summary;

  const isLoading = !activity;
  const showContentCard = activity?.update?.title || html || activity?.update?.summary;
  const isLastWeek = dayjs(activity?.createdAt).isAfter(dayjs().subtract(1, 'week'));
  return (
    <ItemWrapper>
      <Flex flex="1">
        <Box mr="12px">
          {isLoading ? (
            <LoadingPlaceholder height={32} width={32} borderRadius="50%" />
          ) : (
            <AvatarWithLink
              size={32}
              account={activity.individual || activity.fromAccount}
              secondaryAccount={secondaryAccount}
            />
          )}
        </Box>
        <Flex flexDirection="column" justifyContent="space-around">
          {isLoading ? (
            <LoadingPlaceholder height={16} width={300} />
          ) : (
            <ItemHeaderWrapper color="black.700">
              {ActivityTimelineMessageI18n[activity.type] || ActivityDescriptionI18n[activity.type]
                ? intl.formatMessage(
                    ActivityTimelineMessageI18n[activity.type] || ActivityDescriptionI18n[activity.type],
                    getActivityVariables(intl, activity, { onClickExpense: openExpense }),
                  )
                : activity.type}{' '}
              · {isLastWeek ? dayjs(activity.createdAt).fromNow() : <DateTime value={activity.createdAt} />}
            </ItemHeaderWrapper>
          )}
        </Flex>
      </Flex>
      {showContentCard && (
        <ContentCard>
          {activity?.update?.title && (
            <P fontSize="16px" fontWeight={500} lineHeight="24px">
              {activity?.update?.title}
            </P>
          )}
          {html && <HTMLContent fontSize="13px" lineHeight="20px" content={html} />}
          {activity?.update?.summary && (
            <Box>
              <StyledLink
                as={Link}
                fontSize="13px"
                lineHeight="16px"
                href={`${getCollectivePageRoute(activity.account)}/updates/${activity.update.slug}`}
              >
                <FormattedMessage id="ContributeCard.ReadMore" defaultMessage="Read more" />
              </StyledLink>
            </Box>
          )}
        </ContentCard>
      )}
    </ItemWrapper>
  );
};

export default TimelineItem;
