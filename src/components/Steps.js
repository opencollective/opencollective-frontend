import React from 'react';
import PropTypes from 'prop-types';
import { findLastIndex } from 'lodash';

/**
 * A stepper component to manage state and validations for multi-steps processes.
 */
export default class Steps extends React.Component {
  static propTypes = {
    /** The steps list */
    steps: PropTypes.arrayOf(
      PropTypes.shape({
        /** The step name, **must be unique**. */
        name: PropTypes.string.isRequired,
        /** A function triggered when leaving the step. Return false to abort. */
        validate: PropTypes.func,
        /** A boolean indicating if the step has been completed */
        isCompleted: PropTypes.bool,
      }),
    ).isRequired,
    /** The current step name. The step must be present in `steps`. */
    currentStepName: PropTypes.string.isRequired,
    /** Called to change step. */
    onStepChange: PropTypes.func.isRequired,
    /** Called the last step is submitted. */
    onComplete: PropTypes.func.isRequired,
    /** A function that gets passed everything needed to show the current step */
    children: PropTypes.func.isRequired,
    /**
     * Called when the current step is normally not reachable.
     * Default to `goToStep(lastValidStep, {ignoreValidation: true})`
     */
    onInvalidStep: PropTypes.func.isRequired,
  };

  static defaultProps = {
    onInvalidStep: ({ lastValidStep, goToStep }) => {
      return goToStep(lastValidStep, { ignoreValidation: true });
    },
  };

  state = {
    /** A set of visited steps */
    visited: new Set([]),
  };

  componentDidMount() {
    const currentStep = this.getStepByName(this.props.currentStepName);
    const lastValidStep = this.getLastCompletedStep();
    if (!currentStep || currentStep.index > lastValidStep.index + 1) {
      this.props.onInvalidStep({ step: currentStep, lastValidStep, goToStep: this.goToStep });
    } else {
      this.props.steps.slice(0, currentStep.index + 1).map(this.markStepAsVisited);
    }
  }

  componentDidUpdate(oldProps) {
    const { currentStepName, onInvalidStep } = this.props;

    if (oldProps.currentStepName !== currentStepName) {
      const currentStep = this.getStepByName(currentStepName);
      const lastValidStep = this.getLastCompletedStep();
      if (!currentStep || currentStep.index > lastValidStep.index + 1) {
        onInvalidStep({ step: currentStep, lastValidStep, goToStep: this.goToStep });
      } else {
        this.props.steps.slice(0, currentStep.index + 1).map(this.markStepAsVisited);
      }
    }
  }

  markStepAsVisited = step => {
    this.setState(state => ({ ...state, visited: state.visited.add(step.name) }));
  };

  /** Build a step to be passed to children */
  buildStep = (baseStep, index) => {
    return {
      ...baseStep,
      index: index,
      isLastStep: index === this.props.steps.length - 1,
      isVisited: this.state.visited.has(baseStep.name),
    };
  };

  getLastCompletedStep() {
    const { steps } = this.props;
    const firstInvalidStepIdx = steps.findIndex(step => !step.isCompleted);
    let lastValidStepIdx = firstInvalidStepIdx - 1;

    if (firstInvalidStepIdx === -1 || firstInvalidStepIdx === steps.length - 1) {
      lastValidStepIdx = steps.length - 1;
    } else if (firstInvalidStepIdx === 0) {
      lastValidStepIdx = 0;
    }

    return this.buildStep(steps[lastValidStepIdx], lastValidStepIdx);
  }

  getLastVisitedStep(maxStep) {
    const lastVisitedStepIdx = findLastIndex(
      this.props.steps,
      s => this.state.visited.has(s.name),
      maxStep ? maxStep.index : this.props.steps.length - 1,
    );

    const returnedStepIdx = lastVisitedStepIdx === -1 ? 0 : lastVisitedStepIdx;
    return this.buildStep(this.props.steps[returnedStepIdx], returnedStepIdx);
  }

  getStepByName(stepName) {
    const stepIdx = this.props.steps.findIndex(s => s.name === stepName);
    return stepIdx === -1 ? null : this.buildStep(this.props.steps[stepIdx], stepIdx);
  }

  // --- Callbacks passed to child component ---

  /** Go to the next step. Will be blocked if current step is not validated. */
  goNext = () => {
    const currentStep = this.getStepByName(this.props.currentStepName);
    if (currentStep.index === this.props.steps.length - 1) {
      this.props.onComplete();
    } else {
      const nextStep = this.props.steps[currentStep.index + 1];
      this.goToStep(this.buildStep(nextStep, currentStep.index + 1));
    }
    return true;
  };

  /** Go to previous step. Will be blocked if current step is not validated. */
  goBack = () => {
    const currentStep = this.getStepByName(this.props.currentStepName);
    if (!currentStep || currentStep.index === 0) {
      return false;
    }

    const prevStep = this.props.steps[currentStep.index - 1];
    this.goToStep(this.buildStep(prevStep, currentStep.index - 1));
    return true;
  };

  /**
   * Go to given step. Will be blocked if current step is not validated, unless
   * if `opts.ignoreValidation` is true.
   */
  goToStep = async (step, opts = {}) => {
    if (!opts.ignoreValidation) {
      const currentStep = this.getStepByName(this.props.currentStepName);
      if (!currentStep) {
        return false;
      } else if (currentStep.isCompleted === false) {
        return false;
      } else if (currentStep.validate && !(await currentStep.validate())) {
        return false;
      }
    }

    this.props.onStepChange(step);
    return true;
  };

  // --- Rendering ---

  render() {
    const currentStep = this.getStepByName(this.props.currentStepName);

    // Bad usage - `currentStepName` should always exist. We return null to
    // ensure this does not result in a crash, componentDidUpdate will take
    // care of the redirection.
    if (!currentStep) {
      return null;
    }

    const lastValidStep = this.getLastCompletedStep();
    return this.props.children({
      currentStep,
      lastValidStep,
      lastVisitedStep: this.getLastVisitedStep(lastValidStep),
      steps: this.props.steps.map(this.buildStep),
      goNext: lastValidStep.index >= currentStep.index ? this.goNext : undefined,
      goBack: currentStep.index > 0 ? this.goBack : undefined,
      goToStep: this.goToStep,
    });
  }
}
