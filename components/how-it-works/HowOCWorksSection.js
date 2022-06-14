import React from 'react';
import { FormattedMessage } from 'react-intl';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import NextIllustration from '../home/HomeNextIllustration';
import Link from '../Link';
import { MainDescription, MainTitle } from '../marketing/Text';
import StyledButton from '../StyledButton';

const HowOCWorks = () => {
  return (
    <Flex flexDirection={['column', 'row-reverse']} justifyContent="center" alignItems="center" px="16px" mt={4}>
      <Box ml={[null, '6px', '40px', null, '84px']} width={['288px', '306px', '458px', null, '558px']}>
        <NextIllustration
          alt="How Open Collective works"
          src="/static/images/how-it-works/howItWorks-illustration.png"
          width={558}
          height={462}
        />
      </Box>
      <Container display="flex" flexDirection="column" alignItems={['center', 'flex-start']}>
        <Box mt={[3, 0]} mb={[3, null, null, null, '24px']} width={['288px', '344px', '413px', null, '555px']}>
          <MainTitle textAlign={['center', 'left']} whiteSpace={[null, null, 'pre-line']}>
            <FormattedMessage id="OC.howItWorks" defaultMessage="How Open Collective works" />
          </MainTitle>
        </Box>
        <Box width={['288px', '344px', '458px', null, '558px']}>
          <MainDescription textAlign={['center', 'left']}>
            <FormattedMessage
              id="howItWorks.description"
              defaultMessage="Open Collective enables all kinds of groups to raise, manage, and spend money transparently. Our open source software platform engages contributors and supporters, automates admin, and helps you tell your story."
            />
          </MainDescription>
        </Box>
        <Link href="/create">
          <StyledButton minWidth={158} mt={['56px', '24px']} buttonStyle="marketing" whiteSpace="nowrap">
            <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
          </StyledButton>
        </Link>
      </Container>
    </Flex>
  );
};

export default HowOCWorks;
