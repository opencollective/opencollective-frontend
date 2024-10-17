import React from 'react';

import StyledDropzone, { DROPZONE_ACCEPT_CSV } from '../../../StyledDropzone';
import { useStepper } from '../../../ui/Stepper';

export const StepSelectCSV = ({ onFileSelected }) => {
  const { nextStep } = useStepper();

  return (
    <StyledDropzone
      accept={DROPZONE_ACCEPT_CSV}
      name="transactions-csv"
      isMulti={false}
      collectFilesOnly
      showInstructions
      minSize={1}
      maxSize={20 * 1024 * 1024}
      onSuccess={acceptedFiles => {
        onFileSelected(acceptedFiles[0]);
        nextStep();
      }}
    />
  );
};
