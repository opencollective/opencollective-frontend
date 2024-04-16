import React from 'react';
import { useFormikContext } from 'formik';

import { ERROR_CLASS_NAME } from './StyledInputFormikField';

/**
 * A component that will focus the first formik error field each time the form is submitted.
 * Only works with inputs wrapped with `StyledInputFormikField`.
 */
export const FocusFirstFormikError = ({ children }: { children: React.ReactNode }) => {
  const formik = useFormikContext();
  React.useEffect(() => {
    if (formik.isValid) {
      return;
    }

    const errorField = document.querySelector(`.${ERROR_CLASS_NAME}`) as HTMLElement;
    if (!errorField) {
      return;
    }

    // Try to focus any input
    const focusable = errorField.querySelector('input');
    if (focusable) {
      focusable.focus();
    } else {
      // If nothing is found, scroll to the top of the field
      errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.submitCount]);

  return children;
};
