import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styled, { css } from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { Flex, Box } from '@rebass/grid';
import { transparentize } from 'polished';
import { Check } from 'styled-icons/fa-solid/Check';

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
    `}

  ${props =>
    !props.disabled &&
    props.onClick &&
    css`
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
  flex-shrink: 1;
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
    return <StyledSpinner color={checked ? '#FFFFFF' : 'primary.700'} size={14} />;
  } else if (checked) {
    return <Check color="white" size={14} />;
  }

  return (
    <Span fontWeight={900} fontSize={14}>
      {idx + 1}
    </Span>
  );
};

/**
 * Shows numeroted steps circles that can be clicked.
 */
const StepsProgress = ({
  steps,
  disabledStepNames,
  children,
  focus,
  loadingStep,
  onStepSelect,
  allCompleted,
  stepWidth,
}) => {
  const focusIdx = focus ? steps.findIndex(step => step.name === focus.name) : -1;

  return (
    <Flex className="steps-progress">
      {steps.map((step, idx) => {
        const stepName = step.name;
        const checked = idx < focusIdx || allCompleted;
        const focused = idx === focusIdx;
        const disabled = disabledStepNames.includes(stepName);
        const loading = loadingStep && stepName === loadingStep.name;

        return (
          <Flex
            key={stepName}
            className={classNames(`step-${stepName}`, { disabled })}
            flexDirection="column"
            alignItems="center"
            css={{ flexGrow: 1, flexBasis: stepWidth }}
          >
            <Flex alignItems="center" mb={2} css={{ width: '100%' }}>
              <SeparatorLine active={checked || focused} transparent={idx === 0} />
              <Bubble
                disabled={disabled}
                onClick={disabled ? undefined : onStepSelect && (() => onStepSelect(step))}
                checked={checked}
                focus={focused}
              >
                {getBubbleContent(idx, checked, loading)}
              </Bubble>
              <SeparatorLine active={checked} transparent={idx === steps.length - 1} />
            </Flex>
            {children && children({ step, checked, focused })}
          </Flex>
        );
      })}
    </Flex>
  );
};

const stepType = PropTypes.shape({
  name: PropTypes.string.isRequired,
});

StepsProgress.propTypes = {
  /** The list of steps. Each step **must** be unique */
  steps: PropTypes.arrayOf(stepType).isRequired,
  /** A list of steps that will be disabled (unclickable). Steps must exist in `steps` */
  disabledStepNames: PropTypes.arrayOf(PropTypes.string),
  /** A renderer func. Gets passed an object like `{step, checked, focused}` */
  children: PropTypes.func,
  /** The curently focused step, or null if none focused yet */
  focus: stepType,
  /** Step will show a loading spinner */
  loadingStep: stepType,
  /** Called when a step is clicked */
  onStepSelect: PropTypes.func,
  /** If true, all steps will be marked as completed */
  allCompleted: PropTypes.bool,
  /** Base step width */
  stepWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

StepsProgress.defaultProps = {
  focused: null,
  loadingStep: null,
  disabledStepNames: [],
  stepWidth: '100%',
};

export default StepsProgress;
