import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { VirtualCardRequest } from '../../lib/graphql/types/v2/graphql';
import { VirtualCardRequestStatus } from '../../lib/graphql/types/v2/graphql';
import { getSpendingLimitShortString } from '../../lib/i18n/virtual-card-spending-limit';

import DateTime from '../DateTime';
import { Box, Flex } from '../Grid';
import { I18nBold } from '../I18nFormatters';
import LinkCollective from '../LinkCollective';
import StyledCard from '../StyledCard';
import StyledTag from '../StyledTag';
import { H5, P, Span } from '../Text';

type VirtualCardRequestCardProps = {
  virtualCardRequest: VirtualCardRequest;
  onClick: (virtualCardRequest: VirtualCardRequest) => void;
};

export default function VirtualCardRequestCard(props: VirtualCardRequestCardProps) {
  const intl = useIntl();
  const virtualCardRequest = props.virtualCardRequest;

  const onClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.defaultPrevented) {
        return;
      }
      props.onClick(virtualCardRequest);
    },
    [props.onClick, virtualCardRequest],
  );

  return (
    <StyledCard style={{ cursor: 'pointer' }} onClick={onClick} padding="16px">
      <Flex justifyContent="space-between" mb={2}>
        <H5>{virtualCardRequest.purpose}</H5>
        <StyledTag
          width="100px"
          textTransform="uppercase"
          fontWeight="bold"
          fontSize="12px"
          type={
            virtualCardRequest.status === VirtualCardRequestStatus.PENDING
              ? 'warning'
              : virtualCardRequest.status === VirtualCardRequestStatus.APPROVED
                ? 'success'
                : 'error'
          }
        >
          {virtualCardRequest?.status}
        </StyledTag>
      </Flex>
      <Flex justifyContent="space-between">
        <Box>
          <FormattedMessage
            defaultMessage="from {collective}"
            values={{
              collective: <LinkCollective collective={virtualCardRequest.account} />,
            }}
          />
          {' • '}
          <DateTime value={virtualCardRequest.createdAt} />
        </Box>
        <P mb={2}>
          {getSpendingLimitShortString(
            intl,
            virtualCardRequest.currency,
            virtualCardRequest.spendingLimitAmount,
            virtualCardRequest.spendingLimitInterval,
            {
              LimitAmount: I18nBold,
              LimitInterval: v => (
                <Span fontSize="14px" fontWeight="normal" color="black.600" fontStyle="italic">
                  {v}
                </Span>
              ),
            },
          )}
        </P>
      </Flex>
      <Flex>
        <P>{virtualCardRequest.notes}</P>
      </Flex>
    </StyledCard>
  );
}
