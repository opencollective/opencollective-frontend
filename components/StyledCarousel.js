import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Swipeable } from 'react-swipeable';
import { Box, Flex } from '@rebass/grid';
import { throttle } from 'lodash';

import Container from './Container';

const CarouselContainer = styled(Container)`
  display: flex;
  transition: ${props => (props.sliding ? 'none' : 'transform 1s ease')};
  transform: ${props => {
    if (props.numSlides === 1) return 'translateX(0%)';

    if (props.numSlides === 2) {
      if (!props.sliding && props.direction === 'next') return 'translateX(calc(-100% - 20px))';
      if (!props.sliding && props.direction === 'prev') return 'translateX(0%)';
      if (props.direction === 'prev') return 'translateX(calc(-100% - 20px))';
      if (!props.sliding) return 'translateX(0%)';

      return 'translateX(0%)';
    }

    if (!props.sliding) return 'translateX(calc(-100% - 20px))';
    if (props.direction === 'prev') return 'translateX(calc(2 * (-100% - 20px)))';
    return 'translateX(0%)';
  }};
`;

const CarouselSlot = styled(Container)`
  flex: 1 0 100%;
  flex-basis: 100%;
  order: ${props => props.order};
`;

const Indicatior = styled(Box)`
  cursor: pointer;
  width: 14px;
  height: 14px;
  border: 1px solid #8fc7ff;
  box-shadow: inset 0px 2px 2px rgba(20, 20, 20, 0.08);
  border-radius: 100px;
  background: ${props => props.active && '#0061E0'};
`;

class StyledCarousel extends React.Component {
  static propTypes = {
    children: PropTypes.any,
  };

  constructor(props) {
    super(props);
    this.state = {
      position: 0,
      direction: '',
      sliding: false,
    };
  }

  getOrder(itemIndex) {
    const { position } = this.state;
    const { children } = this.props;
    const numItems = children.length || 1;
    if (numItems === 2) return itemIndex;

    return (numItems + 1 - position + itemIndex) % numItems;
  }

  nextSlide = () => {
    const { position } = this.state;
    const children = this.props.children;
    const numItems = children.length || 1;
    if (numItems === position + 1) return;

    this.performSliding('next', position === numItems - 1 ? 0 : position + 1);
  };

  prevSlide = () => {
    const { position } = this.state;
    const children = this.props.children;
    const numItems = children.length || 1;
    if (position === 0) return;

    this.performSliding('prev', position === 0 ? numItems - 1 : position - 1);
  };

  performSliding(direction, position) {
    this.setState({ direction, position, sliding: true });

    setTimeout(() => {
      this.setState({ sliding: false });
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
    const position = this.state.position;
    if (index > position) {
      this.performSliding('next', index);
      return;
    }

    if (index < position) {
      this.performSliding('prev', index);
    }
  };

  render() {
    const { children, ...props } = this.props;
    const { sliding, direction, position } = this.state;

    return (
      <Fragment>
        <Box {...props} overflow="hidden" px={2}>
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

        <Flex my={3} display={props.display}>
          {Array.from({ length: children.length }, (_, i) => (
            <Indicatior key={i} active={i === position} mx={2} onClick={() => this.handleOnClickIndicator(i)} />
          ))}
        </Flex>
      </Fragment>
    );
  }
}

export default StyledCarousel;
