import React from 'react';
import PropTypes from 'prop-types';
import NukaCarousel from 'nuka-carousel';
import styled from 'styled-components';

import { H5, P } from './Text';

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
  top: 50px;
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

  ${({ active }) => `opacity: ${active ? 1 : 0.5};`};
`;

const Controls = ({ currentSlide, goToSlide, slideCount, slidesToScroll }) => (
  <List>
    {getIndexes(slideCount, slidesToScroll).map(index => (
      <ListItem key={index}>
        <Dot active={currentSlide === index} onClick={goToSlide.bind(null, index)}>
          &bull;
        </Dot>
      </ListItem>
    ))}
  </List>
);

Controls.propTypes = {
  currentSlide: PropTypes.number,
  goToSlide: PropTypes.func,
  slideCount: PropTypes.number,
  slidesToScroll: PropTypes.number,
};

const Carousel = ({ content }) => {
  return (
    <NukaCarousel
      autoplay
      dragging
      framePadding="32px"
      initialSlideHeight={550}
      renderBottomCenterControls={Controls}
      renderCenterLeftControls={() => {}}
      renderCenterRightControls={() => {}}
      slidesToShow={1}
      swiping
      wrapAround
    >
      {content.map(({ details, heading, image }) => (
        <div key={image + heading + details}>
          <img src={image} />
          <H5 color="black.800" textAlign="center" mb={3}>
            {heading}
          </H5>
          <P textAlign="center" color="black.600" fontSize="Caption">
            {details}
          </P>
        </div>
      ))}
    </NukaCarousel>
  );
};

Carousel.propTypes = {
  content: PropTypes.arrayOf(
    PropTypes.shape({
      image: PropTypes.string.isRequired,
      heading: PropTypes.string.isRequired,
      details: PropTypes.string.isRequired,
    }),
  ),
};

Carousel.defaultProps = {
  content: [],
};

export default Carousel;
