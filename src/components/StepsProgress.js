import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { themeGet } from 'styled-system';
import { Flex, Box } from '@rebass/grid';
import { transparentize } from 'polished';
import { Check } from 'styled-icons/fa-solid/Check.cjs';

import { Span } from './Text';
import StyledSpinner from './StyledSpinner';

const Bubble = styled(Flex)`
  justify-content: center;
  align-items: center;
  height: 32px;
  width: 32px;
  border-radius: 16px;
  cursor: default;
  color: #9d9fa3;
  border: 1px solid #9d9fa3;
  background: ${themeGet('colors.white.full')};
  transition: box-shadow 0.3s, background 0.3s;
  z-index: 2;

  ${props =>
    !props.disabled &&
    css`
      color: ${themeGet('colors.primary.500')};
      border: 2px solid ${themeGet('colors.primary.500')};
      cursor: pointer;

      &:hover {
        background: ${themeGet('colors.black.100')};
      }
    `}

  ${props =>
    props.checked &&
    (props.disabled
      ? css`
          background: ${themeGet('colors.black.500')};
        `
      : css`
        background: ${themeGet('colors.primary.500')};
        &:hover {
          background: ${themeGet('colors.primary.400')};
        })
  `)}

  ${props =>
    props.focus &&
    css`
      box-shadow: 0 0 0 4px ${transparentize(0.24, '#1F87FF')};
    `}
`;

const SeparatorLine = styled(Box)`
  height: 1px;
  background: #e8e9eb;
  z-index: 1;
  flex-grow: 1;
  transition: border-color 0.3s;

  ${props =>
    props.active &&
    css`
      background: ${themeGet('colors.primary.400')};
    `}

  ${props =>
    props.transparent &&
    css`
      visibility: hidden;
    `}
`;

const getBubbleContent = (idx, checked, loading) => {
  if (loading) {
    return <StyledSpinner color={checked && 'white'} size={14} />;
  } else if (checked) {
    return <Check color="white" size={14} />;
  }

  return (
    <Span fontWeight={900} fontSize={14}>
      {idx + 1}
    </Span>
  );
};

const StepsProgress = ({ steps, disabledSteps, children, focus, loadingStep, onStepSelect }) => {
  const focusIdx = focus ? steps.indexOf(focus) : -1;
  return (
    <Flex>
      {steps.map((step, idx) => {
        const checked = idx < focusIdx;
        const focused = idx === focusIdx;
        const disabled = disabledSteps.includes(step);
        const loading = step === loadingStep;

        return (
          <Flex key={step} flexDirection="column" alignItems="center" css={{ flexGrow: 1 }}>
            <Flex alignItems="center" mb={3} css={{ width: '100%' }}>
              <SeparatorLine active={checked || focused} transparent={idx === 0} />
              <Bubble
                disabled={disabled}
                onClick={() => !disabled && onStepSelect(step)}
                checked={checked}
                focus={focused}
              >
                {getBubbleContent(idx, checked, loading)}
              </Bubble>
              <SeparatorLine active={checked} transparent={idx === steps.length - 1} />
            </Flex>
            {children && <Box>{children({ step, checked, focused })}</Box>}
          </Flex>
        );
      })}
    </Flex>
  );
};

StepsProgress.propTypes = {
  /** The list of steps. Each step **must** be unique */
  steps: PropTypes.arrayOf(PropTypes.string).isRequired,
  /** A list of steps that will be disabled (unclickable). Steps must exist in `steps` */
  disabledSteps: PropTypes.arrayOf(PropTypes.string),
  /** A renderer func. Gets passed an object like `{step, checked, focused}` */
  children: PropTypes.func,
  /** The curently focused step, or null if none focused yet */
  focus: PropTypes.string,
  /** Step will show a loading spinner */
  loadingStep: PropTypes.string,
  /** Called when a step is clicked */
  onStepSelect: PropTypes.func,
};

StepsProgress.defaultProps = {
  focused: null,
  loadingStep: null,
  disabledSteps: [],
};

export default StepsProgress;
