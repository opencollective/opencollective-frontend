import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Container from './Container';
import { H4, P } from './Text';
import NukaCarousel from 'nuka-carousel';

const getIndexes = (count, increment) => {
  const indexes = [];
  for (let i = 0; i < count; i += increment) {
    indexes.push(i);
  }
  return indexes;
};

const List = styled.ul`
  margin: 0;
  padding: 0;
  position: relative;
  top: 30px;
`;

const ListItem = styled.li`
  display: inline-block;
`;

const Dot = styled.button`
  background: transparent;
  border: 0;
  color: black;
  cursor: pointer;
  font-size: 24px;
  outline: 0;
  padding: 10px;

  ${({ active }) => `opacity: ${active ? 1 : 0.5};`}
`;

const Controls = ({
  currentSlide,
  goToSlide,
  slideCount,
  slidesToScroll,
}) => (
  <List>
    {getIndexes(slideCount, slidesToScroll).map(index => (
      <ListItem key={index}>
        <Dot
          active={currentSlide === index}
          onClick={goToSlide.bind(null, index)}
        >&bull;</Dot>
      </ListItem>
    ))}
  </List>
);

const Carousel = ({
  content,
}) => {
  return (
    <NukaCarousel
      autoplay
      dragging
      framePadding="32px"
      initialSlideHeight={320}
      renderBottomCenterControls={Controls}
      renderCenterLeftControls={() => {}}
      renderCenterRightControls={() => {}}
      slidesToShow={1}
      swiping
      wrapAround
    >
      {content.map(({ details, heading, image }) => (
        <Container key={image + heading + details}>
          <img src={image} />
          <H4 textAlign="center" mb={3} fontSize={20}>{heading}</H4>
          <P textAlign="center" color="#6E747A" fontSize={14}>{details}</P>
        </Container>
      ))}
    </NukaCarousel>
  );
};

Carousel.propTypes = {
  content: PropTypes.arrayOf(PropTypes.shape({
    image: PropTypes.string.isRequired,
    heading: PropTypes.string.isRequired,
    details: PropTypes.string.isRequired,
  })),
};

Carousel.defaultProps = {
  content: [],
};

export default Carousel;
