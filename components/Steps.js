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
    /** The current step name. The step must be present in `steps` */
    currentStepName: PropTypes.string.isRequired,
    /** Called to change step */
    onStepChange: PropTypes.func.isRequired,
    /** Called when the last step is submitted */
    onComplete: PropTypes.func.isRequired,
    /** A function that gets passed everything needed to show the current step */
    children: PropTypes.func.isRequired,
    /**
     * Called when the current step is normally not reachable.
     * Default to `goToStep(lastValidStep, {ignoreValidation: true})`
     */
    onInvalidStep: PropTypes.func.isRequired,
    /** A list of steps to be skipped */
    skip: PropTypes.arrayOf(PropTypes.string),
  };

  static defaultProps = {
    onInvalidStep: ({ lastValidStep, firstStep, goToStep }) => {
      return goToStep(lastValidStep || firstStep, { ignoreValidation: true });
    },
  };

  state = {
    /** A set of visited steps */
    visited: new Set([]),
    /** True if an async `validate` is currently running */
    isValidating: false,
  };

  componentDidMount() {
    const currentStep = this.getStepByName(this.props.currentStepName);
    const lastValidStep = this.getLastCompletedStep();
    const maxIdx = lastValidStep ? lastValidStep.index + 1 : 0;
    if (!currentStep || currentStep.index > maxIdx) {
      this.onInvalidStep(currentStep, lastValidStep);
    } else {
      this.props.steps.slice(0, currentStep.index + 1).map(this.markStepAsVisited);
      if (this.isSkippedStep(currentStep)) {
        this.goNext();
      }
    }
  }

  componentDidUpdate(oldProps) {
    const { currentStepName } = this.props;

    if (oldProps.currentStepName !== currentStepName) {
      const currentStep = this.getStepByName(currentStepName);
      const lastValidStep = this.getLastCompletedStep();
      const maxIdx = lastValidStep ? lastValidStep.index + 1 : 0;
      if (!currentStep || currentStep.index > maxIdx) {
        this.onInvalidStep(currentStep, lastValidStep);
      } else {
        this.props.steps.slice(0, currentStep.index + 1).map(this.markStepAsVisited);
      }
    }
  }

  isSkippedStep = step => {
    return step && this.props.skip?.includes(step.name);
  };

  onInvalidStep = (step, lastValidStep) => {
    const firstStep = this.getStepByIndex(0);
    return this.props.onInvalidStep({ step, lastValidStep, firstStep, goToStep: this.goToStep });
  };

  markStepAsVisited = step => {
    this.setState(state => ({ visited: state.visited.add(step.name) }));
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

    if (firstInvalidStepIdx === -1) {
      // No invalid step, last step is valid
      lastValidStepIdx = steps.length - 1;
    } else if (firstInvalidStepIdx === 0) {
      return null;
    }

    return this.buildStep(steps[lastValidStepIdx], lastValidStepIdx);
  }

  getLastVisitedStep(lastVisitedStep) {
    const lastVisitedStepIdx = findLastIndex(
      this.props.steps,
      s => this.state.visited.has(s.name),
      lastVisitedStep && !lastVisitedStep.isLastStep ? lastVisitedStep.index + 1 : this.props.steps.length - 1,
    );

    const returnedStepIdx = lastVisitedStepIdx === -1 ? 0 : lastVisitedStepIdx;
    return this.buildStep(this.props.steps[returnedStepIdx], returnedStepIdx);
  }

  getStepByIndex(stepIdx) {
    return stepIdx === -1 || stepIdx >= this.props.steps.length
      ? null
      : this.buildStep(this.props.steps[stepIdx], stepIdx);
  }

  getStepByName(stepName) {
    return this.getStepByIndex(this.props.steps.findIndex(s => s.name === stepName));
  }

  validateCurrentStep = async (action = null) => {
    const currentStep = this.getStepByName(this.props.currentStepName);
    if (!currentStep) {
      return false;
    } else if (currentStep.isCompleted === false && action !== 'prev') {
      return false;
    } else if (currentStep.validate) {
      this.setState({ isValidating: true });
      const result = await currentStep.validate(action);
      this.setState({ isValidating: false });
      if (!result) {
        return false;
      }
    }
    return true;
  };

  // --- Callbacks passed to child component ---

  /** Go to the next step. Will be blocked if current step is not validated. */
  goNext = async () => {
    const currentStep = this.getStepByName(this.props.currentStepName);
    if (currentStep.index === this.props.steps.length - 1) {
      if (await this.validateCurrentStep()) {
        return this.props.onComplete();
      }
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
    const currentStep = this.getStepByName(this.props.currentStepName);
    if (step.index < currentStep?.index) {
      opts.action = 'prev';
    }

    if (!opts.ignoreValidation && !(await this.validateCurrentStep(opts.action))) {
      return false;
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
    const prevStep = this.getStepByIndex(currentStep.index - 1);
    const nextStep = this.getStepByIndex(currentStep.index + 1);
    return this.props.children({
      currentStep,
      prevStep,
      nextStep,
      lastValidStep,
      isValidating: this.state.isValidating,
      lastVisitedStep: this.getLastVisitedStep(lastValidStep),
      steps: this.props.steps.map(this.buildStep),
      goNext: lastValidStep && lastValidStep.index >= currentStep.index ? this.goNext : undefined,
      goBack: currentStep.index > 0 ? this.goBack : undefined,
      goToStep: this.goToStep,
      isValidStep: lastValidStep ? lastValidStep.index + 1 >= currentStep.index : currentStep.index === 0,
    });
  }
}
