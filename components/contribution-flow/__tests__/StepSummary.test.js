import React from 'react';
import { TaxType } from '@opencollective/taxes';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { withRequiredProviders } from '../../../test/providers';

import StepSummary from '../StepSummary';

jest.mock('../../InputTypeCountry', () => ({ value }) => <span data-testid="country-input">{value}</span>);

const VALID_FR_VAT_NUMBER = 'FR40303265045';
const VALID_BE_VAT_NUMBER = 'BE0477472701';

// A Belgian collective selling a product: VAT applies, and a valid VAT number from another EU country zeroes it
const collective = {
  name: 'Webpack',
  currency: 'EUR',
  location: { country: 'BE' },
  host: { location: { country: 'BE' } },
};
const tier = { type: 'PRODUCT', name: 'T-shirt', amount: { currency: 'EUR' } };
const VAT_TAXES = [{ type: TaxType.VAT, percentage: 21 }];

/** Holds `stepSummary` like the contribution flow does, so that dispatched changes are fed back as `data` */
const StepSummaryWithState = React.forwardRef(({ initialData = null, onChange, ...props }, ref) => {
  const [data, setData] = React.useState(initialData);
  const handleChange = React.useCallback(
    changes => {
      onChange(changes);
      setData(changes.stepSummary);
    },
    [onChange],
  );

  return <StepSummary ref={ref} data={data} onChange={handleChange} {...props} />;
});

StepSummaryWithState.displayName = 'StepSummaryWithState';

const renderStepSummary = (props = {}) => {
  const ref = React.createRef();
  const onChange = jest.fn();
  const result = render(
    withRequiredProviders(
      <StepSummaryWithState
        ref={ref}
        onChange={onChange}
        collective={collective}
        tier={tier}
        stepProfile={{}}
        stepDetails={{ amount: 1000, quantity: 1 }}
        stepPayment={null}
        taxes={VAT_TAXES}
        applyTaxes
        {...props}
      />,
    ),
  );

  const validate = async () => {
    let isValid;
    await act(async () => {
      isValid = await ref.current.validate();
    });
    return isValid;
  };

  const getLastStepSummary = () => onChange.mock.calls.at(-1)[0].stepSummary;

  return { ...result, onChange, validate, getLastStepSummary };
};

describe('StepSummary', () => {
  describe('on mount', () => {
    it('dispatches the country and VAT number from the contributor profile', () => {
      const { onChange } = renderStepSummary({
        stepProfile: { location: { country: 'FR' }, settings: { VAT: { number: VALID_FR_VAT_NUMBER } } },
      });

      expect(onChange).toHaveBeenCalledWith({
        stepSummary: expect.objectContaining({
          countryISO: 'FR',
          number: VALID_FR_VAT_NUMBER,
          taxType: TaxType.VAT,
          percentage: 0,
          amount: 0,
        }),
      });
    });

    it('keeps the tax info already entered over the profile ones', () => {
      const { onChange } = renderStepSummary({
        initialData: { countryISO: 'BE', number: null },
        stepProfile: { location: { country: 'FR' }, settings: { VAT: { number: VALID_FR_VAT_NUMBER } } },
      });

      expect(onChange).toHaveBeenCalledWith({
        stepSummary: expect.objectContaining({ countryISO: 'BE', number: VALID_FR_VAT_NUMBER, percentage: 21 }),
      });
    });

    it('marks the step as ready when there are no taxes', () => {
      const { onChange } = renderStepSummary({ taxes: [] });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({ stepSummary: { isReady: true } });
    });
  });

  describe('validate', () => {
    it('passes when there are no taxes', async () => {
      const { validate } = renderStepSummary({ taxes: [] });
      expect(await validate()).toBe(true);
    });

    it('passes when taxes are not applied', async () => {
      const { validate } = renderStepSummary({ applyTaxes: false });
      expect(await validate()).toBe(true);
    });

    it('passes for a zero amount, even without a country', async () => {
      const { validate } = renderStepSummary({ stepDetails: { amount: 0, quantity: 1 } });
      expect(await validate()).toBe(true);
    });

    it('fails without a country', async () => {
      const { validate } = renderStepSummary();
      expect(await validate()).toBe(false);
    });

    it('passes with a country and no VAT number', async () => {
      const { validate, getLastStepSummary } = renderStepSummary({ stepProfile: { location: { country: 'FR' } } });
      expect(await validate()).toBe(true);
      expect(getLastStepSummary()).toMatchObject({ countryISO: 'FR', percentage: 21, amount: 210, isReady: true });
    });

    it('rejects an invalid VAT number prefilled from the profile', async () => {
      const { validate, getLastStepSummary } = renderStepSummary({
        stepProfile: { location: { country: 'FR' }, settings: { VAT: { number: 'FR123' } } },
      });

      // The prefilled number zeroes the tax until it gets validated
      expect(getLastStepSummary()).toMatchObject({ number: 'FR123', amount: 0, isReady: true });

      expect(await validate()).toBe(false);
      expect(getLastStepSummary()).toMatchObject({ number: 'FR123', isReady: false });
      expect(screen.getByText('Invalid VAT number')).toBeInTheDocument();
    });

    it('accepts a valid VAT number prefilled from the profile, and normalizes it with the country prefix', async () => {
      const { validate, getLastStepSummary } = renderStepSummary({
        stepProfile: { location: { country: 'FR' }, settings: { VAT: { number: VALID_FR_VAT_NUMBER.slice(2) } } },
      });

      expect(await validate()).toBe(true);
      expect(getLastStepSummary()).toMatchObject({
        countryISO: 'FR',
        number: VALID_FR_VAT_NUMBER,
        percentage: 0,
        amount: 0,
        isReady: true,
      });
      expect(screen.queryByText('Invalid VAT number')).not.toBeInTheDocument();
    });

    it("rejects a VAT number that doesn't match the country", async () => {
      const { validate, getLastStepSummary } = renderStepSummary({
        stepProfile: { location: { country: 'FR' }, settings: { VAT: { number: VALID_BE_VAT_NUMBER } } },
      });

      expect(await validate()).toBe(false);
      expect(getLastStepSummary()).toMatchObject({ number: VALID_BE_VAT_NUMBER, isReady: false });
      expect(screen.getByText("The VAT number doesn't match the country")).toBeInTheDocument();
    });

    it('fails when the VAT number form is opened but left empty', async () => {
      const { validate } = renderStepSummary({ stepProfile: { location: { country: 'FR' } } });

      fireEvent.click(screen.getByText('Enter VAT number (if you have one)'));
      expect(await validate()).toBe(false);
      expect(screen.getByText('Invalid VAT number')).toBeInTheDocument();
    });
  });
});
