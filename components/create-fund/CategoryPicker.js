import React, { Fragment } from 'react';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import StyledButton from '../StyledButton';
import { H1, P } from '../Text';

const Image = styled.img`
  @media screen and (min-width: 52em) {
    height: 256px;
    width: 256px;
  }
  @media screen and (max-width: 40em) {
    height: 192px;
    width: 192px;
  }
  @media screen and (min-width: 40em) and (max-width: 52em) {
    height: 208px;
    width: 208px;
  }
`;

const messages = defineMessages({
  europe: { id: 'createFund.category.europe', defaultMessage: 'For non-profit initiatives in Europe' },
  opensource: { id: 'createFund.category.opensource', defaultMessage: 'For open source initiatives' },
  fund: { id: 'createFund.category.fund', defaultMessage: 'For other initiatives' },
});

const CreateFundCategoryPicker = () => {
  const router = useRouter();
  const { formatMessage } = useIntl();

  return (
    <Fragment>
      <Box mb={4} mt={5}>
        <H1
          fontSize={['20px', '32px']}
          lineHeight={['24px', '36px']}
          fontWeight="bold"
          color="black.900"
          textAlign="center"
        >
          <FormattedMessage id="createFund.create" defaultMessage="Create a Fund" />
        </H1>
      </Box>
      <Flex flexDirection="column" justifyContent="center" alignItems="center" mb={[5, 6]}>
        <Box alignItems="center">
          <Flex justifyContent="center" alignItems="center" flexDirection={['column', 'row']}>
            <Container
              borderTop={['1px solid #E6E8EB', 'none']}
              alignItems="center"
              width={[null, 280, 312]}
              mb={[4, 0]}
            >
              <Flex flexDirection="column" justifyContent="center" alignItems="center">
                <Image
                  src="/static/images/create-collective/climateIllustration.png"
                  alt={formatMessage(messages.europe)}
                />
                <Link
                  href={{
                    pathname: `/fund/${router.query.verb}`,
                    query: { category: 'oce-foundation' },
                  }}
                >
                  <StyledButton fontSize="13px" buttonStyle="primary" minHeight="36px" mt={[2, 3]} mb={3} px={3}>
                    {formatMessage(messages.europe)}
                  </StyledButton>
                </Link>
                <P textAlign="center">
                  It will be hosted by
                  <br />
                  Open Collective Europe Foundation
                </P>
              </Flex>
            </Container>
            <Container
              borderLeft={['none', '1px solid #E6E8EB']}
              borderTop={['1px solid #E6E8EB', 'none']}
              alignItems="center"
              width={[null, 280, 312]}
              mb={[4, 0]}
            >
              <Flex flexDirection="column" justifyContent="center" alignItems="center">
                <Image
                  src="/static/images/create-collective/openSourceIllustration.png"
                  alt={formatMessage(messages.opensource)}
                />
                <Link
                  href={{
                    pathname: `/fund/${router.query.verb}`,
                    query: { category: 'opensource' },
                  }}
                >
                  <StyledButton fontSize="13px" buttonStyle="primary" minHeight="36px" mt={[2, 3]} mb={3} px={3}>
                    {formatMessage(messages.opensource)}
                  </StyledButton>
                </Link>
                <P textAlign="center">
                  It will be hosted by
                  <br />
                  Open Source Collective 501(c)(6).
                </P>
              </Flex>
            </Container>
          </Flex>
        </Box>
      </Flex>
    </Fragment>
  );
};

export default CreateFundCategoryPicker;
