import React from 'react';
import { FormattedMessage } from 'react-intl';

import NextIllustration from '../collectives/HomeNextIllustration';
import { Box, Flex } from '../Grid';
import { MainDescription, MainTitle } from '../marketing/Text';

const HowCanWeHelp = () => {
  return (
    <Flex
      flexDirection={['column', null, null, null, 'row']}
      justifyContent="center"
      alignItems="center"
      px="16px"
      mt="22px"
    >
      <Box>
        <NextIllustration
          alt="How Doohi Collective works"
          src="/static/images/help-and-support/top-illustration.png"
          width={286}
          height={200}
        />
      </Box>
      <Flex
        flexDirection="column"
        alignItems={['center', null, null, null, 'flex-start']}
        ml={[null, null, null, null, '34px']}
      >
        <Box mb={[3, '24px']} width={['288px', '576px', '685px']}>
          <MainTitle textAlign={['center', null, null, null, 'left']} whiteSpace={[null, null, 'pre-line']}>
            <FormattedMessage id="helpAndSupport.title" defaultMessage="Hi, How can we help?" />
          </MainTitle>
        </Box>
        <Box width={['288px', '597px']}>
          <MainDescription textAlign={['center', null, null, null, 'left']}>
            <FormattedMessage
              id="helpAndSupport.description"
              defaultMessage="Our support team is available from Monday to Friday. Please expect a response within 3 business days."
            />
          </MainDescription>
        </Box>
      </Flex>
    </Flex>
  );
};

export default HowCanWeHelp;
