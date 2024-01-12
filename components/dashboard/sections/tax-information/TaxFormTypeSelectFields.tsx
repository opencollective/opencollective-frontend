import React from 'react';
import { pick } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { ButtonSet } from '../../../ui/ButtonSet';

import { SubmitterType, TaxFormType } from './common';
import { HintText } from './HintText';

type TaxFormTypeSelectFieldsValues = {
  formType?: TaxFormType | null;
  isUSPersonOrEntity?: boolean | null;
  submitterType?: SubmitterType | null;
};

/**
 * A combination of fields that will allow the user to select the tax form type.
 */
export const TaxFormTypeSelectFields = ({
  values,
  onChange,
}: {
  values: TaxFormTypeSelectFieldsValues;
  onChange: (values: Partial<TaxFormTypeSelectFieldsValues>) => void;
}) => {
  const dispatchChanges = (newValues: Partial<TaxFormTypeSelectFieldsValues>) => {
    const newState = { ...pick(values, ['formType', 'isUSPersonOrEntity', 'submitterType']), ...newValues };

    // Guess form type
    if (newState.isUSPersonOrEntity === true) {
      newState.formType = TaxFormType.W9;
    } else if (newState.isUSPersonOrEntity === false && newState.submitterType === SubmitterType.Individual) {
      newState.formType = TaxFormType.W8_BEN;
    } else if (newState.isUSPersonOrEntity === false && newState.submitterType === SubmitterType.Business) {
      newState.formType = TaxFormType.W8_BEN_E;
    } else {
      newState.formType = null;
    }

    onChange(newState);
  };

  return (
    <div>
      <div>
        <label htmlFor="isUSPersonOrEntity" className="mb-2 text-sm font-bold leading-none">
          <FormattedMessage defaultMessage="Are you a US Person or Entity?" />
        </label>
        <HintText>
          <FormattedMessage defaultMessage="US citizen, resident, green card holder, or US-incorporated entity." />
        </HintText>
        <ButtonSet
          selected={values.isUSPersonOrEntity}
          onChange={value => dispatchChanges({ isUSPersonOrEntity: value })}
          options={[
            { label: <FormattedMessage defaultMessage="Yes" />, value: true },
            { label: <FormattedMessage defaultMessage="No" />, value: false },
          ]}
        />
      </div>
      {values.isUSPersonOrEntity !== null && (
        <div className="mt-4">
          <label htmlFor="submitterType" className="text-sm font-bold leading-none">
            <FormattedMessage defaultMessage="Are you submitting this form as…" />
          </label>
          <ButtonSet
            selected={values.submitterType}
            onChange={value => dispatchChanges({ submitterType: value })}
            options={[
              { label: <FormattedMessage defaultMessage="An individual person" />, value: SubmitterType.Individual },
              { label: <FormattedMessage defaultMessage="A business or entity" />, value: SubmitterType.Business },
            ]}
          />
        </div>
      )}
    </div>
  );
};
