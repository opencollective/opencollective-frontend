import React from 'react';
import PropTypes from 'prop-types';
import { Switch } from '@headlessui/react';
import { cx } from 'class-variance-authority';
import { FormattedMessage } from 'react-intl';

export default function InputSwitch({ checked, onChange, ...props }) {
  return (
    <Switch
      checked={checked}
      onChange={onChange}
      className={cx(
        checked ? 'bg-primary-500' : 'bg-gray-200',
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      )}
      {...props}
    >
      <span className="sr-only">
        <FormattedMessage id="ScreenReaderOnly.ToggleSetting" defaultMessage="Toggle Setting" />
      </span>
      <span
        aria-hidden="true"
        className={cx(
          checked ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
        )}
      />
    </Switch>
  );
}

InputSwitch.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  defaultChecked: PropTypes.bool,
};
