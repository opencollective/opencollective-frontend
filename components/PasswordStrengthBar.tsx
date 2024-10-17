import React from 'react';
import dynamic from 'next/dynamic';
import { useIntl } from 'react-intl';
import type { PasswordStrengthBarProps } from 'react-password-strength-bar';

const ReactPasswordStrengthBar = dynamic(() => import('react-password-strength-bar'));

/**
 * A wrapper around react-password-strength-bar to plug our custom styles and logic.
 * Loads the library dynamically to avoid bloating the bundle size.
 */
export const PasswordStrengthBar = (
  props: Omit<PasswordStrengthBarProps, 'style' | 'shortScoreWord' | 'scoreWords'>,
) => {
  const intl = useIntl();
  return (
    <ReactPasswordStrengthBar
      {...props}
      style={{ display: props.password ? 'block' : 'none' }}
      shortScoreWord={intl.formatMessage({ id: 'FormError.minLength', defaultMessage: 'The value is too short' })}
      scoreWords={[
        intl.formatMessage({ id: 'Password.weak', defaultMessage: 'Weak' }),
        intl.formatMessage({ id: 'Password.weak', defaultMessage: 'Weak' }),
        intl.formatMessage({ id: 'Password.fair', defaultMessage: 'Fair' }),
        intl.formatMessage({ id: 'Password.good', defaultMessage: 'Good' }),
        intl.formatMessage({ id: 'Password.strong', defaultMessage: 'Strong' }),
      ]}
    />
  );
};
