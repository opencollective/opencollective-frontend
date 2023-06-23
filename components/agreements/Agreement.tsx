import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Agreement as GraphQLAgreement } from '../../lib/graphql/types/v2/graphql';

import AttachedFiles from '../attached-files/AttachedFiles';
import Avatar from '../Avatar';
import Container from '../Container';
import DateTime from '../DateTime';
import { Box, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import StyledHr from '../StyledHr';
import StyledLink from '../StyledLink';
import { H4, P, Span } from '../Text';

type AgreementProps = {
  agreement: GraphQLAgreement;
  openFileViewer?: (url: string) => void;
};

const ColumTitle = styled.p`
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  text-transform: uppercase;
  color: #4d4f51;
  margin: 0;
  margin-bottom: 6px;
`;

const Value = styled(P)`
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  line-height: 20px;
  color: ${props => props.theme.colors.black[700]};
`;

export default function Agreement({ agreement, openFileViewer = undefined }: AgreementProps) {
  return (
    <div>
      <H4 fontSize="20px" fontWeight="700">
        {agreement.title}
      </H4>
      {agreement.attachment && (
        <Container mt="30px">
          <P fontSize="16px" fontWeight="700" mb="18px">
            <FormattedMessage defaultMessage="Agreement file" />
          </P>
          <AttachedFiles files={[agreement.attachment]} size={128} openFileViewer={openFileViewer} />
        </Container>
      )}
      <Box mt={30}>
        <ColumTitle>
          <FormattedMessage id="Agreement.createdBy" defaultMessage="Created by" />
        </ColumTitle>
        <Value>
          <Flex alignItems="center" gridGap={2}>
            <Avatar collective={agreement.createdBy} radius={24} />
            <StyledLink
              as={LinkCollective}
              collective={agreement.createdBy}
              color="black.700"
              truncateOverflow
              textDecoration="underline"
            />
          </Flex>
        </Value>
      </Box>
      <Box mt={30}>
        <ColumTitle>
          <FormattedMessage defaultMessage="Account" />
        </ColumTitle>
        <Value>
          <Flex alignItems="center" gridGap={2}>
            <Avatar collective={agreement.account} radius={24} />
            <StyledLink
              as={LinkCollective}
              collective={agreement.account}
              color="black.700"
              truncateOverflow
              textDecoration="underline"
            />
          </Flex>
        </Value>
      </Box>
      <Flex flexWrap="wrap" gridGap={24} mt={30}>
        <Box>
          <ColumTitle>
            <FormattedMessage defaultMessage="Created on" />
          </ColumTitle>
          <Value py="2px">
            <DateTime value={agreement.createdAt} />
          </Value>
        </Box>
        <Box>
          <ColumTitle>
            <FormattedMessage defaultMessage="Expires on" />
          </ColumTitle>
          <Value py="2px">
            {agreement.expiresAt ? (
              <DateTime value={agreement.expiresAt} />
            ) : (
              <Span fontStyle="italic" color="black.500">
                <FormattedMessage defaultMessage="Never" />
              </Span>
            )}
          </Value>
        </Box>
      </Flex>

      <StyledHr mt="32px" mb="16px" borderColor="black.300" />
      {agreement.notes && (
        <div>
          <P fontSize="16px" fontWeight="700" mb="18px">
            <FormattedMessage id="expense.notes" defaultMessage="Notes" />
          </P>
          <P fontSize="13px" fontWeight="400" color="black.800" whiteSpace="pre-line">
            {agreement.notes}
          </P>
        </div>
      )}
    </div>
  );
}
