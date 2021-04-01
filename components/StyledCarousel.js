import React from 'react';
import PropTypes from 'prop-types';
import { throttle } from 'lodash';
import { Swipeable } from 'react-swipeable';
import styled from 'styled-components';

import Container from './Container';
import { Box, Flex } from './Grid';
import StyledRoundButton from './StyledRoundButton';

const CarouselContainer = styled(Container)`
  display: flex;
  transition: ${props => (props.sliding ? 'none' : 'transform 1s ease')};
  transform: ${props => {
    if (props.numSlides === 1) {
      return 'translateX(0%)';
    }

    if (props.numSlides === 2) {
      if (!props.sliding && props.direction === 'next') {
        return 'translateX(calc(-100% - 20px))';
      }
      if (!props.sliding && props.direction === 'prev') {
        return 'translateX(0%)';
      }
      if (props.direction === 'prev') {
        return 'translateX(calc(-100% - 20px))';
      }
      if (!props.sliding) {
        return 'translateX(0%)';
      }

      return 'translateX(0%)';
    }

    if (!props.sliding) {
      return 'translateX(calc(-100% - 20px))';
    }
    if (props.direction === 'prev') {
      return 'translateX(calc(2 * (-100% - 20px)))';
    }
    return 'translateX(0%)';
  }};
`;

const CarouselSlot = styled(Container)`
  flex: 1 0 100%;
  flex-basis: 100%;
  order: ${props => props.order};
`;

const Indicator = styled(Box)`
  cursor: pointer;
  width: 8px;
  height: 8px;
  border: none;
  box-shadow: inset 0px 2px 2px rgba(20, 20, 20, 0.08);
  border-radius: 8px;
  background: ${props => (props.active ? '#DC5F7D' : '#E8E9EB')};
`;

class StyledCarousel extends React.Component {
  static propTypes = {
    children: PropTypes.any,
    activeIndex: PropTypes.number,
    showArrowController: PropTypes.bool,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    showArrowController: true,
  };

  constructor(props) {
    super(props);
    this.state = {
      activeIndex: props.activeIndex || 0,
      direction: '',
      sliding: false,
    };
  }

  getOrder(itemIndex) {
    const { activeIndex } = this.state;
    const { children } = this.props;
    const numItems = children.length || 1;
    if (numItems === 2) {
      return itemIndex;
    }

    return (numItems + 1 - activeIndex + itemIndex) % numItems;
  }

  nextSlide = () => {
    const { activeIndex } = this.state;
    const children = this.props.children;
    const numItems = children.length || 1;
    if (numItems === activeIndex + 1) {
      return;
    }

    this.performSliding('next', activeIndex === numItems - 1 ? 0 : activeIndex + 1);
  };

  prevSlide = () => {
    const { activeIndex } = this.state;
    const children = this.props.children;
    const numItems = children.length || 1;
    if (activeIndex === 0) {
      return;
    }

    this.performSliding('prev', activeIndex === 0 ? numItems - 1 : activeIndex - 1);
  };

  performSliding(direction, activeIndex) {
    this.setState({ direction, activeIndex, sliding: true });

    setTimeout(() => {
      this.setState({ sliding: false });

      if (this.props.onChange) {
        this.props.onChange(this.state.activeIndex);
      }
    }, 50);
  }

  handleSwipe = throttle(
    isNext => {
      if (isNext) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    },
    500,
    { trailing: false },
  );

  handleOnClickIndicator = index => {
    const activeIndex = this.state.activeIndex;
    if (index > activeIndex) {
      this.performSliding('next', index);
      return;
    }

    if (index < activeIndex) {
      this.performSliding('prev', index);
    }
  };

  render() {
    const { children, showArrowController, ...props } = this.props;
    const { sliding, direction, activeIndex } = this.state;

    return (
      <Container {...props}>
        <Box overflow="hidden" px={2}>
          <Swipeable onSwipedLeft={() => this.handleSwipe(true)} onSwipedRight={() => this.handleSwipe()}>
            <CarouselContainer sliding={sliding} direction={direction} numSlides={children.length}>
              {React.Children.map(children, (child, index) => {
                return (
                  <CarouselSlot order={this.getOrder(index)} mx={2}>
                    {child}
                  </CarouselSlot>
                );
              })}
            </CarouselContainer>
          </Swipeable>
        </Box>

        <Container width={1} display="flex" alignItems="center" justifyContent={'center'}>
          {showArrowController && (
            <StyledRoundButton size={40} mx={1} onClick={() => this.handleSwipe()}>
              ←
            </StyledRoundButton>
          )}
          <Flex mx={3} my={3} display={props.display}>
            {Array.from({ length: children.length }, (_, i) => (
              <Indicator key={i} active={i === activeIndex} mx={1} onClick={() => this.handleOnClickIndicator(i)} />
            ))}
          </Flex>
          {showArrowController && (
            <StyledRoundButton size={40} mx={1} onClick={() => this.handleSwipe(true)}>
              →
            </StyledRoundButton>
          )}
        </Container>
      </Container>
    );
  }
}

export default StyledCarousel;
