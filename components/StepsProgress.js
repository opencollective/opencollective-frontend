import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styled, { css } from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { Flex, Box } from '@rebass/grid';
import { transparentize } from 'polished';
import { Check } from '@styled-icons/fa-solid/Check';
import withViewport, { VIEWPORTS } from '../lib/withViewport';
import { FormattedMessage } from 'react-intl';

import { P, Span } from './Text';
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

const StepMobile = styled(Flex)`
  width: 100%;
  align-items: center;
`;

const StepsOuter = styled(Flex)`
  padding: 16px;

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
  width: 48px;
  height: 48px;
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
  const mobileNextStepText = mobileStepIdx < steps.length - 1 ? steps[mobileStepIdx + 1].name : null;
  const mobileNextStepLabelKey = mobileStepIdx < steps.length - 1 ? steps[mobileStepIdx + 1].labelKey : null;
  const progress = allCompleted ? 100 : (100 / steps.length) * (mobileStepIdx + 1);
  const bgColor = '#D9DBDD';
  const pieSize = '48';

  return (
    <StepsOuter className="steps-progress">
      {viewport === VIEWPORTS.MOBILE ? (
        <StepMobile>
          <StepsMobileLeft>
            <P color="black.900" fontWeight="600" fontSize="Paragraph">
              {steps[mobileStepIdx].labelKey ? (
                <FormattedMessage id={steps[mobileStepIdx].labelKey} />
              ) : (
                steps[mobileStepIdx].name
              )}
            </P>

            {(mobileNextStepText || mobileNextStepLabelKey) && (
              <P color="black.500">
                <FormattedMessage
                  id="StepsProgress.mobile.next"
                  defaultMessage="Next: {stepName}"
                  values={{
                    stepName: mobileNextStepLabelKey ? (
                      <FormattedMessage id={mobileNextStepLabelKey} />
                    ) : (
                      mobileNextStepText
                    ),
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
            <P color="black.500" fontSize="Tiny">
              <FormattedMessage
                id="StepsProgress.mobile.status"
                defaultMessage="{from} of {to}"
                values={{ from: <Span fontWeight="900">{mobileStepIdx + 1}</Span>, to: steps.length }}
              />
            </P>
          </StepsMobileRight>
        </StepMobile>
      ) : (
        steps.map((step, idx) => {
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
        })
      )}
    </StepsOuter>
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
