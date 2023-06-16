import React from 'react';
import { FormattedDate, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Agreement as GraphQLAgreement } from '../../lib/graphql/types/v2/graphql';

import AttachedFiles from '../attached-files/AttachedFiles';
import Avatar from '../Avatar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import StyledHr from '../StyledHr';
import { H4, P, Span } from '../Text';

type AgreementProps = {
  agreement: GraphQLAgreement;
};

const ColumTitle = styled.p`
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  text-transform: uppercase;
  color: #4d4f51;
`;

const Value = styled(P)`
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  line-height: 20px;
`;

export default function Agreement({ agreement }: AgreementProps) {
  return (
    <div>
      <H4 fontSize="20px" fontWeight="700">
        {agreement.title}
      </H4>
      <Box mt={30}>
        <Flex flexWrap="wrap" gridGap={24}>
          <Box>
            <ColumTitle>
              <FormattedMessage defaultMessage="Account" />
            </ColumTitle>
            <Value>
              <Flex alignItems="center" gridGap={2}>
                <Avatar collective={agreement.account} radius={24} />
                <LinkCollective collective={agreement.account}>
                  <Span letterSpacing="0" color="black.700" truncateOverflow>
                    {agreement.account.name}
                  </Span>
                </LinkCollective>
              </Flex>
            </Value>
          </Box>
          <Box>
            <ColumTitle>
              <FormattedMessage defaultMessage="Expiration date" />
            </ColumTitle>
            <Value py="2px">
              {agreement.expiresAt ? (
                <FormattedDate value={agreement.expiresAt} month="short" day="numeric" year="numeric" />
              ) : (
                <Span fontStyle="italic" color="black.500">
                  <FormattedMessage defaultMessage="Never" />
                </Span>
              )}
            </Value>
          </Box>
        </Flex>
      </Box>
      {agreement.attachment && (
        <Container mt="36px">
          <P fontSize="16px" fontWeight="700" mb="18px">
            <FormattedMessage defaultMessage="Agreement file" />
          </P>
          <AttachedFiles files={[agreement.attachment]} />
        </Container>
      )}
      <StyledHr mt="32px" mb="16px" borderColor="black.300" />
      {agreement.notes && (
        <div>
          <P fontSize="16px" fontWeight="700" mb="18px">
            <FormattedMessage defaultMessage="Notes" />
          </P>
          <P fontSize="13px" fontWeight="400" color="black.800" whiteSpace="pre-line">
            {agreement.notes}
          </P>
        </div>
      )}
    </div>
  );
}
