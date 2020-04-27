import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { borderRadius, borders } from 'styled-system';

import { Flex } from './Grid';

const computeBorderRadius = ({ index, itemCount }) => {
  if (index === 0) {
    return ['4px 4px 0 0', null, '4px 0 0 4px'];
  }

  if (index === itemCount - 1) {
    return ['0 0 4px 4px', null, '0 4px 4px 0'];
  }

  return '0';
};

const Button = styled.button`
  background: ${({ selected }) => (selected ? '#E6E6E6' : 'white')};
  padding: 8px 24px;
  ${borders} ${borderRadius}

  &:hover {
    background: #e6e6e6;
  }
`;

const ButtonGroup = ({ onChange = () => {}, values = [], value }) => (
  <Flex flexDirection={['column', 'row', 'row']}>
    {values.map((v, index) => (
      <Button
        borderRadius={computeBorderRadius({ index, itemCount: values.length })}
        border="1px solid #D5DAE0"
        key={v}
        isFirst={index === 0}
        isLast={index === values.length - 1}
        onClick={() => onChange(v)}
        selected={v === value}
        type="button"
      >
        {v}
      </Button>
    ))}
  </Flex>
);

ButtonGroup.propTypes = {
  onChange: PropTypes.func,
  values: PropTypes.array,
  value: PropTypes.object,
};

export default ButtonGroup;
