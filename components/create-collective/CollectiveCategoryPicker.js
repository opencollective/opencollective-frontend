import React, { Fragment } from 'react';
import themeGet from '@styled-system/theme-get';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import { H1 } from '../Text';

const ExamplesLink = styled(StyledLink)`
  color: ${themeGet('colors.blue.500')};
  font-size: 12px;

  &:hover {
    color: #dc5f7d;
  }
`;

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
  community: {
    id: 'createCollective.category.community',
    defaultMessage: 'For any community',
  },
  opensource: {
    id: 'OSC.description',
    defaultMessage: 'For open source projects',
  },
  climate: { id: 'createCollective.category.climate', defaultMessage: 'For climate initiatives' },
  covid: { id: 'createCollective.category.covid', defaultMessage: 'For COVID-19 groups' },
});

const CollectiveCategoryPicker = () => {
  const router = useRouter();
  const { formatMessage } = useIntl();
  const hostCollectiveSlug = router.query.hostCollectiveSlug ? router.query.hostCollectiveSlug : '';

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
          <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
        </H1>
      </Box>
      <Flex flexDirection="column" justifyContent="center" alignItems="center" mb={[5, 6]}>
        <Box alignItems="center">
          <Flex justifyContent="center" alignItems="center" flexDirection={['column', 'row']}>
            <Container alignItems="center" width={[null, 280, 312]} mb={[4, 0]}>
              <Flex flexDirection="column" justifyContent="center" alignItems="center">
                <Image
                  src="/static/images/create-collective/openSourceIllustration.png"
                  alt={formatMessage(messages.opensource)}
                />
                <NextLink href={`${hostCollectiveSlug}/${router.query.verb}/opensource`}>
                  <StyledButton fontSize="13px" buttonStyle="primary" minHeight="36px" mt={[2, 3]} mb={3} px={3}>
                    {formatMessage(messages.opensource)}
                  </StyledButton>
                </NextLink>
                <ExamplesLink href="/discover?show=opensource" openInNewTab>
                  <FormattedMessage id="createCollective.examples" defaultMessage="See examples" />
                </ExamplesLink>
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
                  src="/static/images/create-collective/climateIllustration.png"
                  alt={formatMessage(messages.covid)}
                />
                <NextLink href={`${hostCollectiveSlug}/${router.query.verb}/covid-19`}>
                  <StyledButton fontSize="13px" buttonStyle="primary" minHeight="36px" mt={[2, 3]} mb={3} px={3}>
                    {formatMessage(messages.covid)}
                  </StyledButton>
                </NextLink>
                <ExamplesLink href="/discover?show=covid-19" openInNewTab>
                  <FormattedMessage id="createCollective.examples" defaultMessage="See examples" />
                </ExamplesLink>
              </Flex>
            </Container>
            <Container
              borderLeft={['none', '1px solid #E6E8EB']}
              borderTop={['1px solid #E6E8EB', 'none']}
              alignItems="center"
              width={[null, 280, 312]}
            >
              <Flex flexDirection="column" justifyContent="center" alignItems="center">
                <Image
                  src="/static/images/create-collective/communityIllustration.png"
                  alt={formatMessage(messages.community)}
                />
                <NextLink href={`${hostCollectiveSlug}/${router.query.verb}/community`}>
                  <StyledButton
                    fontSize="13px"
                    buttonStyle="primary"
                    minHeight="36px"
                    mt={[2, 3]}
                    mb={3}
                    px={3}
                    data-cy="ccf-category-picker-button-community"
                  >
                    {formatMessage(messages.community)}
                  </StyledButton>
                </NextLink>
                <ExamplesLink href="/discover?show=community" openInNewTab>
                  <FormattedMessage id="createCollective.examples" defaultMessage="See examples" />
                </ExamplesLink>
              </Flex>
            </Container>
          </Flex>
        </Box>
      </Flex>
    </Fragment>
  );
};

export default CollectiveCategoryPicker;
