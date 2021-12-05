import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Box, Flex } from '../Grid';
import NextIllustration from '../home/HomeNextIllustration';
import { P } from '../Text';

const NeedHelp = ({ title, description, actions }) => {
  return (
    <Flex
      flexDirection="column"
      pt="16px"
      pb="56px"
      backgroundColor="#F9FAFB"
      justifyContent="center"
      alignItems="center"
      position="relative"
      px="16px"
    >
      <Box position={[null, 'absolute']} top="-19px">
        <NextIllustration
          width={70}
          height={75}
          src="/static/images/help-and-support/needHelp-illustration.png"
          alt={`Need help illustration`}
        />
      </Box>
      <Box width={['288px', '100%']} my={3}>
        <P fontSize="24px" lineHeight="32px" letterSpacing="-0.008em" color="black.900" textAlign="center">
          {title ? title : <FormattedMessage id="helpAndSupport.needHelp" defaultMessage="Need help?" />}
        </P>
      </Box>
      {description && (
        <Box width={['288px', '100%']}>
          <P fontSize="15px" lineHeight="22px" color="black.700" textAlign="center">
            {description}
          </P>
        </Box>
      )}
      <Box my="16px">{actions}</Box>
    </Flex>
  );
};

NeedHelp.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  actions: PropTypes.node,
};

export default NeedHelp;
