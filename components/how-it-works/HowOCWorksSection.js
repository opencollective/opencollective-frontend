import React from 'react';
import { FormattedMessage } from 'react-intl';

import NextIllustration from '../collectives/HomeNextIllustration';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import { MainTitle } from '../marketing/Text';
import StyledButton from '../StyledButton';
import { P } from '../Text';

const HowOCWorks = () => {
  return (
    <Flex flexDirection={['column', null, 'row-reverse']} justifyContent="center" alignItems="center" px="16px" mt={4}>
      <Box
        mt={[3, 0]}
        mb={[3, null, null, null, '24px']}
        width={['288px', '676px', '413px', null, '555px']}
        display={[null, null, 'none']}
      >
        <MainTitle textAlign={['center', null, 'left']} whiteSpace={[null, null, 'pre-line']}>
          <FormattedMessage id="OC.howItWorks" defaultMessage="How Doohi Collective works" />
        </MainTitle>
      </Box>
      <Box ml={[null, '6px', '40px', null, '84px']} width={['288px', '306px', '458px', null, '558px']}>
        <NextIllustration
          alt="How Doohi Collective works"
          src="/static/images/how-it-works/howItWorks-illustration.png"
          width={558}
          height={462}
        />
      </Box>
      <Container display="flex" flexDirection="column" alignItems={['center', null, 'flex-start']}>
        <Box
          mt={[3, 0]}
          mb={[3, null, null, null, '24px']}
          width={['288px', '344px', '413px', null, '555px']}
          display={['none', null, 'block']}
        >
          <MainTitle textAlign={['center', null, 'left']} whiteSpace={[null, null, 'pre-line']}>
            <FormattedMessage id="OC.howItWorks" defaultMessage="How Doohi Collective works" />
          </MainTitle>
        </Box>
        <Box width={['288px', '676px', '458px', null, '558px']}>
          <P
            fontSize={['15px', '18px']}
            lineHeight={['22px', '26px']}
            textAlign={['center', 'left']}
            fontWeight="500"
            color="black.800"
          >
            <FormattedMessage
              id="howItWorks.description"
              defaultMessage="Doohi Collective enables all kinds of groups to raise, manage, and spend money transparently. Our open source software platform engages contributors and supporters, automates admin, and helps you tell your story."
            />
          </P>
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
