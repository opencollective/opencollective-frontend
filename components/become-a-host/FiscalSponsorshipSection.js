import React from 'react';
import { FormattedMessage } from 'react-intl';

import NextIllustration from '../collectives/HomeNextIllustration';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import { MainDescription, MainTitle } from '../marketing/Text';
import StyledButton from '../StyledButton';

const FiscalSponsorship = () => {
  return (
    <Flex flexDirection={['column', null, 'row-reverse']} justifyContent="center" alignItems="center" px="16px" mt={4}>
      <Box
        mt={[3, 0]}
        mb={[3, null, null, null, '24px']}
        width={['288px', '601px', '438px', null, '555px']}
        display={[null, null, 'none']}
      >
        <MainTitle textAlign={['center', null, 'left']} whiteSpace={[null, null, 'pre-line']}>
          <FormattedMessage id="becomeAHost.title" defaultMessage="Fiscal sponsorship has never been easier" />
        </MainTitle>
      </Box>
      <Box ml={[null, '6px', '40px', null, '84px']} width={['288px', '324px', '478px', null, '558px']} my={3}>
        <NextIllustration
          alt="Fiscal sponsorship illustration"
          src="/static/images/become-a-host/fiscalSponsorship-illustration.png"
          width={558}
          height={414}
        />
      </Box>
      <Container display="flex" flexDirection="column" alignItems={['center', null, 'flex-start']}>
        <Box
          mt={[3, 0]}
          mb={['24px', null, null, null, '24px']}
          width={['288px', '306px', '438px', null, '555px']}
          display={['none', null, 'block']}
        >
          <MainTitle textAlign={['center', null, 'left']} whiteSpace={[null, null, 'pre-line']}>
            <FormattedMessage id="becomeAHost.title" defaultMessage="Fiscal sponsorship has never been easier" />
          </MainTitle>
        </Box>
        <Box width={['288px', '676px', '458px', null, '558px']} mb={['24px', null, null, null, '24px']}>
          <MainDescription textAlign={['center', null, 'left']}>
            <FormattedMessage
              id="becomeAHost.description"
              defaultMessage="Doohi Collective is purpose-built to streamline your processes, reduce overhead, increase transparency, and enable your organization to hold and manage funds for more projects in less time. <learnMoreLink>Learn more</learnMoreLink>."
              values={{
                learnMoreLink: getI18nLink({
                  href: 'https://docs.opencollective.com/help/fiscal-hosts/become-a-fiscal-host',
                  openInNewTab: true,
                }),
              }}
            />
          </MainDescription>
        </Box>
        <Link href="/organizations/new">
          <StyledButton minWidth={[283, 165, null, null, 183]} buttonStyle="marketing" whiteSpace="nowrap">
            <FormattedMessage defaultMessage="Join as a Fiscal Host" />
          </StyledButton>
        </Link>
      </Container>
    </Flex>
  );
};

export default FiscalSponsorship;
