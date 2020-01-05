import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { display } from 'styled-system';
import { Swipeable } from 'react-swipeable';
import { Flex, Box } from '@rebass/grid';

import Container from './Container';

const Controller = styled.div`
  cursor: pointer;
  width: 12px;
  height: 12px;
  border: 1px solid #8fc7ff;
  box-shadow: inset 0px 2px 2px rgba(20, 20, 20, 0.08);
  border-radius: 100px;
  background: ${props => props.active && '#0061E0'};
  ${display}
`;

const StyledCarousel = ({ options, children, ...props }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleSwipeLeft = () => {
    if (activeIndex !== options.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };
  const handleSwipeRight = () => {
    if (activeIndex !== 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  return (
    <Container {...props}>
      <Swipeable onSwipedLeft={handleSwipeLeft} onSwipedRight={handleSwipeRight}>
        {children(options[activeIndex], activeIndex)}
        <Flex justifyContent="center" my={3}>
          {options.map((option, index) => (
            <Box key={option.id} mx={2}>
              <Controller active={activeIndex === index} onClick={() => setActiveIndex(index)} />
            </Box>
          ))}
        </Flex>
      </Swipeable>
    </Container>
  );
};

StyledCarousel.propTypes = {
  options: PropTypes.array,
  children: PropTypes.any,
};

export default StyledCarousel;
