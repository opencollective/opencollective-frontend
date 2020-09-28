import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Box, Flex } from '../Grid';
import Link from '../Link';
import StyledButton from '../StyledButton';
import { H1, P, Span } from '../Text';

const SupportProjects = () => (
  <Flex flexDirection={['column', 'row']} alignItems="center" justifyContent="center" mx={3} mt="32px">
    <Flex flexDirection="column" alignItems={['center', 'flex-start']}>
      <Box width={['304px', '306px', '438px', null, '555px']}>
        <H1
          fontSize={['24px', '40px', null, null, '52px']}
          lineHeight={['32px', '48px', null, null, '56px']}
          letterSpacing={['-1.2px', '-0.04em']}
          color="black.900"
          mb={3}
          textAlign={['center', 'left']}
        >
          <FormattedMessage
            id="becomeASponsor.supportProjects"
            defaultMessage="Support projects & communities on Open Collective."
          />
        </H1>
      </Box>
      <Box mb="25px" width={['304px', '306px', null, null, '558px']} textAlign={['center', 'left']}>
        <P
          fontSize={['14px', '16px', null, null, '18px']}
          lineHeight={['23px', '24px', null, null, '26px']}
          letterSpacing={['-0.12px', 'normal']}
          color="black.800"
          fontWeight="500"
        >
          <Span display={[null, 'none']}>
            <FormattedMessage
              id="becomeASponsor.supportProjects.description.short"
              defaultMessage="Join these great founders and sponsors supporting Collectives."
            />
          </Span>
          <Span display={['none', 'block']}>
            <FormattedMessage
              id="becomeASponsor.supportProjects.description.full"
              defaultMessage="Join these great founders and sponsors and support amazing initiatives. Transparent contributions and all the tools you need to get rid of the paperwork. All in one place."
            />
          </Span>
        </P>
      </Box>
      <Link route="/discover">
        <StyledButton
          minWidth={['185px', '167px', null, null, '185px']}
          my={[2, null, 0]}
          buttonStyle="dark"
          whiteSpace="nowrap"
        >
          <FormattedMessage id="home.discoverCollectives" defaultMessage="Discover Collectives" />
        </StyledButton>
      </Link>
    </Flex>
  </Flex>
);

export default SupportProjects;
