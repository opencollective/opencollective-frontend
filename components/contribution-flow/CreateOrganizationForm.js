import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';
import { isURL } from 'validator';

import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';

const msg = defineMessages({
  organizationName: {
    id: 'Organization.Name',
    defaultMessage: 'Organization name',
  },
  website: {
    id: 'Fields.website',
    defaultMessage: 'Website',
  },
  twitterHandle: {
    id: 'contributeAs.org.twitter',
    defaultMessage: 'Twitter (optional)',
  },
});

export const validateNewOrg = values => {
  if (!values.name) {
    return false;
  } else if (values.website && !isURL(values.website)) {
    return false;
  }

  return true;
};

const CreateOrganizationForm = ({ values, onChange }) => {
  const { formatMessage } = useIntl();
  const dispatchChange = field => e => onChange({ ...values, [field]: e.target.value });
  return (
    <div>
      <StyledInputField
        autoFocus
        name="name"
        htmlFor="name"
        label={formatMessage(msg.organizationName)}
        mt={3}
        required
      >
        {inputProps => (
          <StyledInput
            {...inputProps}
            width="100%"
            placeholder="e.g. AirBnb, TripleByte"
            value={values.name}
            minLength={2}
            onChange={dispatchChange('name')}
          />
        )}
      </StyledInputField>
      <StyledInputField
        name="website"
        htmlFor="website"
        inputType="url"
        mt={3}
        label={formatMessage(msg.website)}
        required={false}
      >
        {inputProps => (
          <StyledInput
            {...inputProps}
            placeholder="e.g. opencollective.com"
            width="100%"
            value={values.website}
            onChange={dispatchChange('website')}
          />
        )}
      </StyledInputField>
      <StyledInputField name="twitterHandle" htmlFor="twitterHandle" mt={3} label="Twitter" required={false}>
        {inputProps => (
          <StyledInput
            {...inputProps}
            placeholder="e.g. @opencollect"
            width="100%"
            value={values.twitterHandle}
            onChange={dispatchChange('twitterHandle')}
          />
        )}
      </StyledInputField>
    </div>
  );
};

CreateOrganizationForm.propTypes = {
  values: PropTypes.object,
  onChange: PropTypes.func,
};

export default CreateOrganizationForm;
