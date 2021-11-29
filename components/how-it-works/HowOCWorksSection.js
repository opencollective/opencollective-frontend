import React from 'react';
import { FormattedMessage } from 'react-intl';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import NextIllustration from '../home/HomeNextIllustration';
import Link from '../Link';
import StyledButton from '../StyledButton';
import { H1, P } from '../Text';

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
          <H1
            letterSpacing="-0.04em"
            fontSize={['32px', '40px', null, null, '52px']}
            lineHeight={['40px', '48px', null, null, '56px']}
            textAlign={['center', 'left']}
            color="black.900"
            whiteSpace={[null, null, 'pre-line']}
          >
            <FormattedMessage id="howItWorks.title" defaultMessage="How Open Collective works?" />
          </H1>
        </Box>
        <Box width={['288px', '344px', '458px', null, '558px']}>
          <P
            fontSize={['15px', '18px']}
            lineHeight={['22px', '26px']}
            textAlign={['center', 'left']}
            fontWeight="500"
            color="black.800"
          >
            <FormattedMessage
              id="howItWorks.description"
              defaultMessage="Open Collective enables all kinds of groups to raise, manage, and spend money transparently. Our open-source software platform engages contributors and supporters, automates admin, and helps you tell your story."
            />
          </P>
        </Box>
        <Link href="/create">
          <StyledButton minWidth={158} mt={['56px', '24px']} buttonStyle="dark" whiteSpace="nowrap">
            <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
          </StyledButton>
        </Link>
      </Container>
    </Flex>
  );
};

export default HowOCWorks;
