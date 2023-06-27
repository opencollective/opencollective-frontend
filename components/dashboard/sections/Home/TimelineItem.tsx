import React from 'react';
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
import { P, Span } from '../../../Text';

const ItemHeaderWrapper = styled(P)`
  a {
    color: ${props => props.theme.colors.black[800]};
  }
`;

const ItemWrapper = styled(Box)`
  border-radius: 16px;
  overflow-x: hidden;
  background-color: ${props => props.theme.colors.black[50]};
  padding: 16px;
  margin-bottom: 24px;
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

  return (
    <ItemWrapper>
      <Flex flex="1">
        <Box mr="12px">
          {isLoading ? (
            <LoadingPlaceholder height={40} width={40} borderRadius="50%" />
          ) : (
            <AvatarWithLink size={40} account={activity.individual} secondaryAccount={secondaryAccount} />
          )}
        </Box>
        <Flex flexDirection="column" justifyContent="space-around">
          {isLoading ? (
            <LoadingPlaceholder height={16} width={300} />
          ) : (
            <ItemHeaderWrapper color="black.800">
              {intl.formatMessage(
                ActivityTimelineMessageI18n[activity.type] || ActivityDescriptionI18n[activity.type],
                getActivityVariables(intl, activity, { onClickExpense: openExpense }),
              )}
              &nbsp;
              <Span ml={1} fontSize="12px" lineHeight="18px" fontWeight={400} color="black.700">
                <DateTime value={activity.createdAt} />
              </Span>
            </ItemHeaderWrapper>
          )}
        </Flex>
      </Flex>
      {activity?.update?.title && (
        <P mt={3} fontSize="16px" fontWeight={500} lineHeight="24px">
          {activity?.update?.title}
        </P>
      )}
      {html && <HTMLContent mt={3} fontSize="13px" lineHeight="20px" content={html} />}
      {activity?.update?.summary && (
        <Box mt={2}>
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
    </ItemWrapper>
  );
};

export default TimelineItem;
