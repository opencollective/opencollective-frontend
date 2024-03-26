import React from 'react';
import { pick } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { Button } from '../../../ui/Button';

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
        <div className="mt-2 flex items-center space-x-2">
          <Button
            type="button"
            variant={values.isUSPersonOrEntity === true ? 'default' : 'outline'}
            onClick={() => {
              dispatchChanges({ isUSPersonOrEntity: true });
            }}
          >
            <FormattedMessage defaultMessage="Yes" />
          </Button>
          <Button
            type="button"
            variant={values.isUSPersonOrEntity === false ? 'default' : 'outline'}
            onClick={() => {
              dispatchChanges({ isUSPersonOrEntity: false });
            }}
          >
            <FormattedMessage defaultMessage="No" />
          </Button>
        </div>
      </div>
      {values.isUSPersonOrEntity !== null && (
        <div className="mt-4">
          <label htmlFor="submitterType" className="text-sm font-bold leading-none">
            <FormattedMessage defaultMessage="Are you submitting this form as…" />
          </label>
          <div className="mt-2 flex items-center space-x-2">
            <Button
              type="button"
              variant={values.submitterType === SubmitterType.Individual ? 'default' : 'outline'}
              onClick={() => {
                dispatchChanges({ submitterType: SubmitterType.Individual });
              }}
            >
              <FormattedMessage defaultMessage="An individual person" />
            </Button>
            <Button
              type="button"
              variant={values.submitterType === SubmitterType.Business ? 'default' : 'outline'}
              onClick={() => {
                dispatchChanges({ submitterType: SubmitterType.Business });
              }}
            >
              <FormattedMessage defaultMessage="A business or entity" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
