import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';

import { Flex } from './Grid';

const Bullet = styled.div`
  width: 8px;
  height: 8px;
  background-color: ${props => props.theme.colors.black[200]};
  margin-bottom: 8px;
  border-radius: 100%;
  transition: transform 0.1s, background-color 0.3s;
  cursor: pointer;

  &:hover {
    transform: scale(1.5);
  }

  &:not(:last-child) {
    margin-right: 8px;
  }

  ${props =>
    props.isSelected &&
    css`
      transform: scale(1.5);
      background-color: ${props => props.theme.colors.primary[500]};
    `}
`;

/**
 * A multi-bullets slider to switch between multiple items (ie. usually a slideshow)
 */
const BulletSlider = ({ nbItems, selectedIndex, onChange }) => {
  return (
    <Flex flexWrap="wrap" justifyContent="center">
      {[...Array(nbItems).keys()].map(index => (
        <Bullet
          key={index}
          role="button"
          isSelected={index === selectedIndex}
          onClick={() => onChange(index)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onChange(index);
            }
          }}
        />
      ))}
    </Flex>
  );
};

BulletSlider.propTypes = {
  /** Called with the item index */
  onChange: PropTypes.func.isRequired,
  selectedIndex: PropTypes.number,
  nbItems: PropTypes.number,
};

export default BulletSlider;
