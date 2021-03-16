import React from 'react';
import PropTypes from 'prop-types';

import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledTextarea from '../StyledTextarea';

const TierCustomFields = ({ fields, data, onChange }) => {
  return fields.map((customField, idx) => {
    return (
      <StyledInputField
        // eslint-disable-next-line react/no-array-index-key
        key={`${idx}-${customField.name}`}
        mt={3}
        htmlFor={customField.name}
        label={customField.label}
        inputType={customField.type}
        required={customField.required}
        width="100%"
      >
        {fieldProps =>
          customField.type === 'textarea' ? (
            <StyledTextarea
              autoSize
              {...fieldProps}
              onChange={({ target }) => onChange({ ...data, [customField.name]: target.value })}
              maxHeight={500}
              minHeight={150}
            />
          ) : customField.type === 'separator' ? (
            <StyledHr borderColor="black.200" my={2} />
          ) : (
            <StyledInput
              {...fieldProps}
              width={1}
              value={data?.[customField.name] || ''}
              mt={customField.type === 'checkbox' ? '2px !important' : 0}
              css={customField.type === 'checkbox' ? { flex: '0 0 1em' } : undefined}
              placeholder={customField.placeholder}
              pattern={customField.pattern}
              onChange={e =>
                onChange({
                  ...data,
                  [customField.name]: customField.type === 'checkbox' ? e.target.checked : e.target.value,
                })
              }
            />
          )
        }
      </StyledInputField>
    );
  });
};

TierCustomFields.propTypes = {
  data: PropTypes.object,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      label: PropTypes.string,
      type: PropTypes.string,
      required: PropTypes.bool,
      placeholder: PropTypes.string,
      pattern: PropTypes.string,
    }),
  ),
};

export default TierCustomFields;
