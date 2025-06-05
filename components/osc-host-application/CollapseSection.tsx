import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/feather/ChevronDown/ChevronDown';
import { ChevronUp } from '@styled-icons/feather/ChevronUp/ChevronUp';
import AnimateHeight from 'react-animate-height';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Image from '../Image';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import { H4, P } from '../Text';

const Content = styled.div`
  opacity: ${props => (props.isExpanded ? '1' : '0')};
  transition: opacity 0.5s;
`;

const CollapseSection = ({ title, isExpanded, toggleExpanded, subtitle, imageSrc, children }) => {
  const [height, setHeight] = useState(isExpanded ? 'auto' : 0);

  useEffect(() => {
    setHeight(isExpanded ? 'auto' : 0);
  }, [isExpanded]);

  return (
    <Container>
      <Flex mt={32} gridGap="12px" alignItems="flex-start" mb={3}>
        <Image src={imageSrc} width={48} height={48} />
        <Box flex="1">
          <Flex alignItems="center" justifyContent="stretch" gap={12} mb={3}>
            <H4 fontSize="18px" lineHeight="24px" color="black.900">
              {title}
            </H4>
            <StyledHr flex="1" />
            <StyledButton buttonSize="tiny" type="button" onClick={toggleExpanded}>
              <Flex alignItems="center" gridGap="8px">
                {isExpanded ? (
                  <React.Fragment>
                    <ChevronUp size={16} /> <FormattedMessage id="ShowLess" defaultMessage="Show Less" />
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <ChevronDown size={16} /> <FormattedMessage id="Expand" defaultMessage="Expand" />
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
      <AnimateHeight
        id="example-panel"
        duration={500}
        height={height} // see props documentation below
      >
        <Content isExpanded={isExpanded}>{children}</Content>
      </AnimateHeight>
    </Container>
  );
};

CollapseSection.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node.isRequired,
  imageSrc: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  toggleExpanded: PropTypes.func.isRequired,
};

export default CollapseSection;
