import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/feather/ChevronDown/ChevronDown';
import { ChevronUp } from '@styled-icons/feather/ChevronUp/ChevronUp';

import NextIllustration from '../collectives/HomeNextIllustration';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import { H4, P } from '../Text';

const CollapseSection = ({ title, subtitle, imageSrc, children }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  return (
    <Container>
      <Flex mt={32} gridGap="12px" alignItems="center" mb={3}>
        <NextIllustration src={imageSrc} width={48} height={48} />
        <Box flex="1">
          <Flex alignItems="center" justifyContent="stretch" gap={12} mb={3}>
            <H4 fontSize="18px" lineHeight="24px" color="black.900">
              {title}
            </H4>
            <StyledHr flex="1" />
            <StyledButton buttonSize="tiny" type="button" onClick={() => setIsOpen(!isOpen)}>
              <Flex alignItems="center" gridGap="8px">
                {isOpen ? (
                  <React.Fragment>
                    <ChevronUp size={16} /> Show Less
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <ChevronDown size={16} /> Expand
                  </React.Fragment>
                )}
              </Flex>
            </StyledButton>
          </Flex>
          <P fontSize="14px" lineHeight="20px" color="black.700">
            {subtitle}
          </P>
        </Box>
      </Flex>

      <Box display={isOpen ? 'block' : 'none'}>{children}</Box>
    </Container>
  );
};

CollapseSection.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node.isRequired,
  imageSrc: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default CollapseSection;
