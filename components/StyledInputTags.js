import React from 'react';
import PropTypes from 'prop-types';
import StyledSelectCreatable from './StyledSelectCreatable';
import { useIntl, defineMessages } from 'react-intl';

const messages = defineMessages({
  placeholder: {
    id: 'StyledInputTags.Placeholder',
    defaultMessage: 'Add new tags by pressing Enter',
  },
});

const getOptions = tags => {
  if (!tags || !tags.length) {
    return undefined;
  } else {
    return tags.map(tag => ({ label: tag, value: tag }));
  }
};

const StyledInputTags = ({ suggestedTags, value, defaultValue, ...props }) => {
  const { formatMessage } = useIntl();
  const options = getOptions(suggestedTags);
  return (
    <StyledSelectCreatable
      isMulti
      data-cy="styled-input-tags"
      options={options}
      value={getOptions(value)}
      hideDropdownIndicator={!options}
      hideMenu={!options}
      placeholder={formatMessage(messages.placeholder)}
      defaultValue={getOptions(defaultValue)}
      {...props}
    />
  );
};

StyledInputTags.propTypes = {
  /** Id of the input */
  inputId: PropTypes.string,
  suggestedTags: PropTypes.arrayOf(PropTypes.string),
  defaultValue: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.arrayOf(PropTypes.string),
};

export default React.memo(StyledInputTags);
