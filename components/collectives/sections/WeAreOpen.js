import React from 'react';
import { FormattedMessage } from 'react-intl';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import { SectionTitle } from '../../marketing/Text';
import NextIllustration from '../HomeNextIllustration';
import SectionSubtitle from '../SectionSubtitle';

const WeAreOpen = () => (
  <Flex display="flex" flexDirection={['column', 'row']} alignItems="center" justifyContent="center" mx={[3, 4]}>
    <Container
      display="flex"
      flexDirection={'column'}
      alignItems="center"
      width={[1, '392px', null, null, '657px']}
      mr={[null, 2, 5]}
    >
      <Box textAlign={['center', 'left']} width={['288px', 1]}>
        <SectionTitle mb={3} color="black.800">
          <FormattedMessage id="home.weAreOpenSection.title" defaultMessage="We are open in every way" />
        </SectionTitle>
      </Box>
      <Box display={['block', 'none']} my={3}>
        <NextIllustration
          width={224}
          height={144}
          src="/static/images/home/weareopen-illustration-md.png"
          alt="We are open in every way"
        />
      </Box>
      <Box my={2} width={['288px', 1]} textAlign={['center', 'left']}>
        <SectionSubtitle
          color={['black.600', 'black.700']}
          fontSize={['16px', '20px']}
          lineHeight={['24px', '28px']}
          letterSpacing={['-0.16px', '-0.6px']}
        >
          <FormattedMessage
            id="home.weAreOpenSection.subtitle"
            defaultMessage="We not only help you be transparent, we are too!"
          />
        </SectionSubtitle>
      </Box>
    </Container>
    <Box
      display={['none', 'block']}
      width={['224px', null, null, null, '336px']}
      height={['144px', null, null, null, '216px']}
      my={5}
      ml={[null, null, 5]}
    >
      <NextIllustration
        width={336}
        height={216}
        src="/static/images/home/weareopen-illustration-md.png"
        alt="We are open in every way"
      />
    </Box>
  </Flex>
);

export default WeAreOpen;
