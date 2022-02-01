import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Box, Flex } from '../Grid';
import NextIllustration from '../home/HomeNextIllustration';
import { H1, P } from '../Text';

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
          alt="How Open Collective works"
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
        <Box mb={[3, '24px']} width={['288px', '383px', '413px', null, '555px']}>
          <H1
            letterSpacing={['-0.08em', '-0.04em']}
            fontSize={['32px', '40px', null, null, '52px']}
            lineHeight={['40px', '48px', null, null, '56px']}
            textAlign={['center', null, null, null, 'left']}
            color="black.900"
            whiteSpace={[null, null, 'pre-line']}
          >
            <FormattedMessage id="helpAndSupport.title" defaultMessage="Hi, How can we help?" />
          </H1>
        </Box>
        <Box width={['288px', '597px']}>
          <P
            fontSize={['16px', '24px']}
            lineHeight={['24px', '32px']}
            textAlign={['center', null, null, null, 'left']}
            fontWeight="500"
            color="black.800"
          >
            <FormattedMessage
              id="helpAndSupport.description"
              defaultMessage="Our support team is available from Monday to Friday. Please expect a response within 3 business days."
            />
          </P>
        </Box>
      </Flex>
    </Flex>
  );
};

export default HowCanWeHelp;
