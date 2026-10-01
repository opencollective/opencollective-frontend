import React from 'react';
import { pick } from 'lodash-es';

import MessageBox from '../../../MessageBox';
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
  usPersonLocked = false,
}: {
  values: TaxFormTypeSelectFieldsValues;
  onChange: (values: Partial<TaxFormTypeSelectFieldsValues>) => void;
  /**
   * When the account already has a stored US person/entity status (from a previously
   * submitted tax form), the answer is locked so the stored form and the account data
   * cannot drift apart. Users must contact their fiscal host to change it.
   */
  usPersonLocked?: boolean;
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
        <label htmlFor="isUSPersonOrEntity" className="mb-2 text-sm leading-none font-bold">
          Are you a US Person or Entity?
        </label>
        <HintText>US citizen, resident, green card holder, or US-incorporated entity.</HintText>
        <ButtonSet
          selected={values.isUSPersonOrEntity}
          disabled={usPersonLocked}
          onChange={value => dispatchChanges({ isUSPersonOrEntity: value })}
          options={[
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ]}
        />
        {usPersonLocked && (
          <MessageBox type="info" className="mt-3">
            Your US person or entity status is already on file and cannot be changed here. If your situation has changed,
            please contact your fiscal host to resubmit a tax form.
          </MessageBox>
        )}
      </div>
      {values.isUSPersonOrEntity !== null && (
        <div className="mt-4">
          <label htmlFor="submitterType" className="text-sm leading-none font-bold">
            Are you submitting this form as…
          </label>
          <ButtonSet
            selected={values.submitterType}
            onChange={value => dispatchChanges({ submitterType: value })}
            options={[
              {
                label: 'An individual person',
                value: SubmitterType.Individual,
              },
              {
                label: 'A business or entity',
                value: SubmitterType.Business,
              },
            ]}
          />
        </div>
      )}
    </div>
  );
};
