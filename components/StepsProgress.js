import React from 'react';
import PropTypes from 'prop-types';
import { Check } from '@styled-icons/fa-solid/Check';
import themeGet from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import withViewport, { VIEWPORTS } from '../lib/withViewport';

import Container from './Container';
import { Box, Flex } from './Grid';
import StyledSpinner from './StyledSpinner';
import { P } from './Text';

const Circle = styled.svg`
  circle {
    fill: ${themeGet('colors.white.full')};
    stroke: #9d9fa3;
    stroke-width: 2px;

    ${props =>
      !props.disabled &&
      css`
        stroke: ${themeGet('colors.primary.600')};
      `}

    ${props =>
      !props.disabled &&
      css`
        cursor: pointer;
        &:hover {
          fill: ${themeGet('colors.black.100')};
        }
      `}

  ${props =>
      props.checked &&
      (props.disabled
        ? css`
            fill: ${themeGet('colors.black.500')};
          `
        : css`
        fill: ${themeGet('colors.primary.600')};
        &:hover {
          fill: ${themeGet('colors.primary.400')};
        })
  `)}
  }

  text {
    ${props =>
      !props.disabled &&
      css`
        fill: ${themeGet('colors.primary.600')};
      `}
  }
`;
const Bubble = styled(Flex)`
  justify-content: center;
  align-items: center;
  flex: 0 0 32px;
  height: 32px;
  width: 32px;
  border-radius: 16px;
  cursor: default;
  color: #9d9fa3;
  background: ${themeGet('colors.white.full')};
  transition: box-shadow 0.3s, background 0.3s;
  z-index: 2;

  ${props =>
    !props.disabled &&
    css`
      color: ${themeGet('colors.primary.600')};
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
        background: ${themeGet('colors.primary.600')};
        &:hover {
          background: ${themeGet('colors.primary.400')};
        })
  `)}

  ${props =>
    props.focus &&
    css`
      box-shadow: 0 0 0 4px ${props => props.theme.colors.primary[100]};
    `}
`;

/**
 * Border generated with https://gigacore.github.io/demos/svg-stroke-dasharray-generator/
 * to have a consistent result across browsers.
 */
const SeparatorLine = styled(props => (
  <Flex alignItems="center" {...props}>
    <svg width="100%" height="2" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <line strokeDasharray="5%" x1="0" y1="0" x2="100%" y2="0" />
    </svg>
  </Flex>
))`
  height: 100%;
  z-index: 1;
  flex-grow: 1;
  flex-shrink: 1;
  line {
    stroke-width: 1;
    stroke: #c4c7cc;
    transition: stroke 0.3s;
  }

  ${props =>
    props.active &&
    css`
      line {
        stroke: ${themeGet('colors.primary.400')};
      }
    `}

  ${props =>
    props.transparent &&
    css`
      visibility: hidden;
    `}
`;

const StepMobile = styled(Flex)`
  width: 100%;
  align-items: center;
`;

const StepsOuter = styled(Flex)`
  padding: 12px 16px;

  @media (max-width: 640px) {
    background: #f5f7fa;
  }
`;

const StepsMobileLeft = styled(Box)`
  flex-grow: 2;
  flex-direction: column;
`;

const StepsMobileRight = styled(Flex)`
  margin-left: auto;
  width: 56px;
  height: 56px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
`;

const PieProgressWrapper = styled.div`
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
`;

const PieProgress = styled(Box)`
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  ${props => css`
    clip: rect(0, ${props.pieSize}px, ${props.pieSize}px, ${props.pieSize / 2}px);
  `}
  ${props =>
    props.progress &&
    props.progress > 50 &&
    css`
      clip: rect(auto, auto, auto, auto);
    `}
`;

const PieShadow = styled(Box)`
  width: 100%;
  height: 100%;
  ${props => css`
    border: ${props.pieSize / 10}px solid ${props.bgColor};
  `}
  border-radius: 50%;
`;

const PieHalfCircle = styled(Box)`
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  ${props => css`
    border: ${props.pieSize / 10}px solid #3498db;
    clip: rect(0, ${props.pieSize / 2}px, ${props.pieSize}px, 0);
  `}
  border-radius: 50%;

  ${props =>
    props.progress &&
    css`
      border-color: ${themeGet('colors.primary.500')};
    `}
`;

const PieHalfCircleLeft = styled(PieHalfCircle)`
  ${props =>
    props.progress &&
    css`
      transform: rotate(${props.progress * 3.6}deg);
    `}
`;

const PieHalfCircleRight = styled(PieHalfCircle)`
  ${props =>
    props.progress && props.progress > 50
      ? css`
          transform: rotate(180deg);
        `
      : css`
          display: none;
        `}
`;

const getBubbleContent = (idx, checked, disabled, focused, loading) => {
  if (loading) {
    return <StyledSpinner color={checked ? '#FFFFFF' : 'primary.700'} size={14} />;
  } else if (checked) {
    return <Check color="white" size={14} />;
  }

  return (
    <Circle disabled={disabled} checked={checked} focus={focused}>
      <circle cx="50%" cy="50%" r="1em"></circle>
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle">
        {idx + 1}
      </text>
    </Circle>
  );
};

/**
 * Shows numerated steps circles that can be clicked.
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
  viewport,
}) => {
  const focusIdx = focus ? steps.findIndex(step => step.name === focus.name) : -1;
  const mobileStepIdx = allCompleted ? steps.length - 1 : focusIdx > -1 ? focusIdx : 0;
  const mobileNextStepName = mobileStepIdx < steps.length - 1 ? steps[mobileStepIdx + 1].name : null;
  const mobileNextStepIdx = mobileNextStepName ? steps.findIndex(step => step.name === mobileNextStepName) : -1;
  const mobileNextStep = mobileNextStepIdx !== -1 && steps[mobileNextStepIdx];
  const progress = allCompleted ? 100 : (100 / steps.length) * (mobileStepIdx + 1);
  const bgColor = '#D9DBDD';
  const pieSize = '56';

  return (
    <StepsOuter data-cy="steps-progress">
      {(viewport === VIEWPORTS.XSMALL || viewport === VIEWPORTS.UNKNOWN) && (
        <Container display={['block', null, 'none']} width="100%" data-cy="progress-destkop">
          <StepMobile>
            <StepsMobileLeft>
              <P color="black.900" fontWeight="500" fontSize="18px" lineHeight="26px" mb={1}>
                {steps[mobileStepIdx].label || steps[mobileStepIdx].name}
              </P>

              {mobileNextStep && (
                <P color="black.700" fontSize="12px" lineHeight="18px">
                  <FormattedMessage
                    id="StepsProgress.mobile.next"
                    defaultMessage="Next: {stepName}"
                    values={{
                      stepName: mobileNextStep.label || mobileNextStep.name,
                    }}
                  />
                </P>
              )}
            </StepsMobileLeft>
            <StepsMobileRight>
              <PieProgressWrapper>
                <PieProgress progress={progress} pieSize={pieSize}>
                  <PieHalfCircleLeft progress={progress} pieSize={pieSize} />
                  <PieHalfCircleRight progress={progress} pieSize={pieSize} />
                </PieProgress>
                <PieShadow pieSize={pieSize} bgColor={bgColor} />
              </PieProgressWrapper>
              <P color="black.700" fontSize="12px">
                <FormattedMessage
                  id="StepsProgress.mobile.status"
                  defaultMessage="{from} of {to}"
                  values={{ from: mobileStepIdx + 1, to: steps.length }}
                />
              </P>
            </StepsMobileRight>
          </StepMobile>
        </Container>
      )}

      {(viewport !== VIEWPORTS.XSMALL || viewport === VIEWPORTS.UNKNOWN) && (
        <Container display={['none', null, 'flex']} data-cy="progress-destkop">
          {steps.map((step, idx) => {
            const stepName = step.name;
            const checked = idx < focusIdx || allCompleted;
            const focused = idx === focusIdx;
            const disabled = disabledStepNames.includes(stepName);
            const loading = loadingStep && stepName === loadingStep.name;

            return (
              <Flex
                key={stepName}
                data-cy={`progress-step-${stepName}`}
                flexDirection="column"
                alignItems="center"
                css={{ flexGrow: 1, flexBasis: stepWidth }}
                data-disabled={disabled}
              >
                <Flex alignItems="center" mb={2} css={{ width: '100%' }}>
                  <SeparatorLine active={checked || focused} transparent={idx === 0} />
                  <Bubble
                    disabled={disabled}
                    onClick={disabled ? undefined : onStepSelect && (() => onStepSelect(step))}
                    checked={checked}
                    focus={focused}
                  >
                    {getBubbleContent(idx, checked, disabled, focused, loading)}
                  </Bubble>
                  <SeparatorLine active={checked} transparent={idx === steps.length - 1} />
                </Flex>
                {children && children({ step, checked, focused })}
              </Flex>
            );
          })}
        </Container>
      )}
    </StepsOuter>
  );
};

const stepType = PropTypes.shape({
  /** A unique identifier for the step */
  name: PropTypes.string.isRequired,
  /** A pretty label to display to the user */
  label: PropTypes.string,
});

StepsProgress.propTypes = {
  /** The list of steps. Each step **must** be unique */
  steps: PropTypes.arrayOf(stepType).isRequired,
  /** A list of steps that will be disabled (unclickable). Steps must exist in `steps` */
  disabledStepNames: PropTypes.arrayOf(PropTypes.string),
  /** A renderer func. Gets passed an object like `{step, checked, focused}` */
  children: PropTypes.func,
  /** The currently focused step, or null if none focused yet */
  focus: stepType,
  /** Step will show a loading spinner */
  loadingStep: stepType,
  /** Called when a step is clicked */
  onStepSelect: PropTypes.func,
  /** If true, all steps will be marked as completed */
  allCompleted: PropTypes.bool,
  /** Base step width */
  stepWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** @ignore from withViewport */
  viewport: PropTypes.oneOf(Object.values(VIEWPORTS)),
};

StepsProgress.defaultProps = {
  focused: null,
  loadingStep: null,
  disabledStepNames: [],
  stepWidth: '100%',
};

export default withViewport(StepsProgress);
