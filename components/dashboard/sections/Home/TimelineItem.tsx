import React from 'react';
import { Check } from '@styled-icons/boxicons-regular/Check';
import { CheckDouble } from '@styled-icons/boxicons-regular/CheckDouble';
import { CreditCard } from '@styled-icons/boxicons-regular/CreditCard';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { LogInCircle } from '@styled-icons/boxicons-regular/LogInCircle';
import { MessageAltDetail } from '@styled-icons/boxicons-regular/MessageAltDetail';
import { MessageAltDots } from '@styled-icons/boxicons-regular/MessageAltDots';
import { MessageAltError } from '@styled-icons/boxicons-regular/MessageAltError';
import { MessageAltX } from '@styled-icons/boxicons-regular/MessageAltX';
import { Note } from '@styled-icons/boxicons-regular/Note';
import { Send } from '@styled-icons/boxicons-regular/Send';
import { Time } from '@styled-icons/boxicons-regular/Time';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import type { ActivityType, WorkspaceHomeQuery } from '../../../../lib/graphql/types/v2/graphql';
import { ActivityDescriptionI18n, ActivityTimelineMessageI18n } from '../../../../lib/i18n/activities';
import { getCollectivePageRoute } from '../../../../lib/url-helpers';

import { getActivityVariables } from '../../../admin-panel/sections/ActivityLog/ActivityDescription';
import { AvatarWithLink } from '../../../AvatarWithLink';
import Container from '../../../Container';
import DateTime from '../../../DateTime';
import { Box, Flex } from '../../../Grid';
import HTMLContent from '../../../HTMLContent';
import Link from '../../../Link';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import StyledLink from '../../../StyledLink';
import { P } from '../../../Text';

const ItemHeaderWrapper = styled(P)`
  a {
    color: ${props => props.theme.colors.black[800]};
  }
`;

const IconWrapper = styled(Flex)`
  width: 40px;
  min-height: 40px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.blue[50]};
  color: ${props => props.theme.colors.blue[500]};
`;

const VerticalLine = styled(Container)`
  width: 1px;
  height: 100%;
  background-color: ${props => props.theme.colors.black[200]};
`;

const getIcon = (type: ActivityType) => {
  switch (type) {
    case 'EXPENSE_COMMENT_CREATED':
    case 'CONVERSATION_COMMENT_CREATED':
      return MessageAltDetail;
    case 'COLLECTIVE_EXPENSE_APPROVED':
      return Check;
    case 'COLLECTIVE_EXPENSE_PAID':
    case 'COLLECTIVE_EXPENSE_SCHEDULED_FOR_PAYMENT':
      return CheckDouble;
    case 'COLLECTIVE_EXPENSE_CREATED':
      return Note;
    case 'COLLECTIVE_EXPENSE_INVITE_DRAFTED':
      return Send;
    case 'COLLECTIVE_EXPENSE_MARKED_AS_INCOMPLETE':
    case 'COLLECTIVE_EXPENSE_MARKED_AS_UNPAID':
    case 'COLLECTIVE_EXPENSE_UNAPPROVED':
      return MessageAltError;
    case 'COLLECTIVE_EXPENSE_REJECTED':
    case 'COLLECTIVE_EXPENSE_MARKED_AS_SPAM':
      return MessageAltX;
    case 'COLLECTIVE_EXPENSE_PUT_ON_HOLD':
      return MessageAltDots;
    case 'USER_SIGNIN':
      return LogInCircle;
    case 'VIRTUAL_CARD_PURCHASE':
      return CreditCard;
    default:
      return InfoCircle;
  }
};

type ActivityListItemProps = {
  activity?: WorkspaceHomeQuery['activities']['nodes'][0];
  isLast?: boolean;
  openExpense?: (legacyId: number) => void;
};

const TimelineItem = ({ activity, isLast, openExpense }: ActivityListItemProps) => {
  const intl = useIntl();
  const secondaryAccount = activity?.individual?.id !== activity?.account?.id && activity.account;
  const Icon = activity ? getIcon(activity.type) : Time;
  const html = activity?.data?.comment?.html || activity.update?.summary;

  const isLoading = !activity;

  return (
    <Box>
      <Flex>
        <Flex flexDirection="column" alignItems="center" mr={3}>
          <IconWrapper alignItems="center" justifyContent="center">
            <Icon size="16px" />
          </IconWrapper>
          {!isLast && <VerticalLine />}
        </Flex>
        <Box mb="42px" overflowX="hidden">
          <Flex flex="1" mb="12px">
            <Box mr="12px">
              {isLoading ? (
                <LoadingPlaceholder height={40} width={40} borderRadius="50%" />
              ) : (
                <AvatarWithLink size={40} account={activity.individual} secondaryAccount={secondaryAccount} />
              )}
            </Box>
            <Flex flexDirection="column" justifyContent="space-around">
              {isLoading ? (
                <LoadingPlaceholder height={16} width={200} />
              ) : (
                <ItemHeaderWrapper color="black.800" fontWeight={500}>
                  {intl.formatMessage(
                    ActivityTimelineMessageI18n[activity.type] || ActivityDescriptionI18n[activity.type],
                    getActivityVariables(intl, activity, { onClickExpense: openExpense }),
                  )}
                </ItemHeaderWrapper>
              )}
              {isLoading ? (
                <LoadingPlaceholder height={12} width={100} />
              ) : (
                <P fontSize="12px" lineHeight="18px" fontWeight={400} color="black.700">
                  <DateTime value={activity.createdAt} />
                </P>
              )}
            </Flex>
          </Flex>

          {html && <HTMLContent mt={3} fontSize="13px" lineHeight="20px" content={html} />}
          {activity?.update?.summary && (
            <Box mt={2}>
              <StyledLink
                as={Link}
                fontSize="12px"
                href={`${getCollectivePageRoute(activity.account)}/updates/${activity.update.slug}`}
              >
                <FormattedMessage id="ContributeCard.ReadMore" defaultMessage="Read more" />
              </StyledLink>
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default TimelineItem;
