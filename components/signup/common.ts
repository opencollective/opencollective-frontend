import React from 'react';

export enum SignupSteps {
  EMAIL_INPUT = 'EMAIL_INPUT',
  SET_PASSWORD = 'SET_PASSWORD',
  VERIFY_OTP = 'VERIFY_OTP',
  COMPLETE_PROFILE = 'COMPLETE_PROFILE',
}

export const SignupFormContext = React.createContext<{
  step: SignupSteps;
  nextStep: (step?: SignupSteps, completeAction?: () => void) => void;
}>({
  step: SignupSteps.EMAIL_INPUT,
  nextStep: () => {},
});
