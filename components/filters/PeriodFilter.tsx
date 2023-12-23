import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { has } from 'lodash';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';

import { parseDateInterval, stripTime } from '../../lib/date-utils';
import dayjs from '../../lib/dayjs';

import { DateRange } from '../DateRange';
import { Box, Flex } from '../Grid';
import PeriodFilterPresetsSelect from '../PeriodFilterPresetsSelect';
import PopupMenu from '../PopupMenu';
import StyledButton from '../StyledButton';
import StyledButtonSet from '../StyledButtonSet';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledTooltip from '../StyledTooltip';
import { Span } from '../Text';

import FilterButtonContainer from './FilterButtonContainer';

const DEFAULT_INTERVAL = { from: '', to: '', timezoneType: 'local' };

/**
 * Get a date range as stored internally from a `value` prop, that can be either an object
 * like { from, to } or a stringified value (see `encodeDateInterval`).
 */
export const getIntervalFromValue = value => {
  const isIntervalObject = value => typeof value === 'object' && has(value, 'from') && has(value, 'to');
  const intervalFromValue = isIntervalObject(value) ? { ...value } : parseDateInterval(value);
  if (intervalFromValue.timezoneType === 'UTC') {
    const toUTC = date => (date ? dayjs.utc(date) : null);
    intervalFromValue.from = toUTC(intervalFromValue.from);
    intervalFromValue.to = toUTC(intervalFromValue.to);
  }

  return {
    from: stripTime(intervalFromValue.from),
    to: stripTime(intervalFromValue.to),
    timezoneType: intervalFromValue.timezoneType || 'local',
  };
};

/**
 * Update `interval` with a new value for `from` or `to` and return the updated interval
 * as a new object.
 */
const getNewInterval = (interval, changeField, newValue) => {
  const newInterval = { ...interval };
  newInterval[changeField] = newValue;
  return newInterval;
};

/**
 * Date is locally stored as '2020-01-01'. We need to force the time to make sure it's not modified
 * by timezones when parsed.
 */
const parseDateForDateRange = (dateStr, isEndOfDay) => {
  if (!dateStr) {
    return null;
  } else if (!isEndOfDay) {
    return new Date(`${dateStr}T00:00:00`);
  } else {
    return new Date(`${dateStr}T23:59:59`);
  }
};

const UTC_LABEL = defineMessage({ defaultMessage: 'Coordinated Universal Time' });

const getTimeZoneTypeName = (intl, timezone) => {
  if (timezone === 'local') {
    try {
      return intl.timeZone || dayjs.tz.guess();
    } catch {
      return '';
    }
  } else if (timezone === 'UTC') {
    return intl.formatMessage(UTC_LABEL);
  } else {
    return '';
  }
};

type PeriodFilterFormProps = {
  onChange: (interval: { from: string; to: string; timezoneType: string }) => void;
  onValidate?: (isValid: boolean) => void;
  value?: Partial<{ from: string; to: string; timezoneType: string }>;
  minDate?: string;
  inputId: string;
  omitPresets?: boolean;
  disabled?: boolean;
};

export const PeriodFilterForm = ({
  onChange,
  onValidate,
  value,
  minDate,
  inputId,
  omitPresets,
  disabled,
}: PeriodFilterFormProps) => {
  const [isValidDateInterval, setIsValidDateInterval] = React.useState(true);
  const intl = useIntl();
  const formattedMin = stripTime(minDate);

  const setDate = (changeField, date) => {
    const newInterval = getNewInterval(value, changeField, date);
    onChange(newInterval);

    // Add warning in case fromDate is after toDate
    if (!newInterval.from || !newInterval.to) {
      return;
    } else if (newInterval.from > newInterval.to) {
      setIsValidDateInterval(false);
      onValidate?.(false);
    } else if (newInterval.from < newInterval.to) {
      setIsValidDateInterval(true);
      onValidate?.(true);
    }
  };

  return (
    <React.Fragment>
      {!omitPresets && (
        <Box mb={3}>
          <PeriodFilterPresetsSelect inputId={`${inputId}-presets-select`} onChange={onChange} interval={value} />
        </Box>
      )}
      <StyledInputField
        name="timezoneType"
        mt="12px"
        labelFontSize="16px"
        labelFontWeight="700"
        label={
          <Flex alignItems="center">
            <Span mr={1}>
              <FormattedMessage defaultMessage="Timezone" />
            </Span>
            <StyledTooltip
              content={
                <FormattedMessage defaultMessage="By default, all dates are filtered and displayed using your local timezone. You can switch to UTC to indicate that the dates provided above use the Coordinated Universal Time format, which matches how email reports are generated" />
              }
            >
              <InfoCircle size={16} />
            </StyledTooltip>
          </Flex>
        }
      >
        {inputProps => (
          <StyledButtonSet
            {...inputProps}
            size="tiny"
            items={['local', 'UTC']}
            buttonProps={{ p: 1, fontSize: '13px', fontWeight: 400 }}
            selected={value.timezoneType}
            buttonPropsBuilder={({ item }) => ({ title: getTimeZoneTypeName(intl, item) })}
            onChange={timezoneType => {
              onChange(getIntervalFromValue({ ...value, timezoneType }));
            }}
            disabled={disabled}
          >
            {({ item }) => {
              switch (item) {
                case 'local':
                  return <FormattedMessage id="Timezone.Local" defaultMessage="Local" />;
                case 'UTC':
                  return <FormattedMessage id="Timezone.UTC" defaultMessage="UTC" />;
              }
            }}
          </StyledButtonSet>
        )}
      </StyledInputField>
      <StyledInputField
        label={<FormattedMessage defaultMessage="Start date" />}
        labelFontWeight="700"
        labelProps={{ fontWeight: 'bold', fontSize: '16px' }}
        name="dateFrom"
        mt="12px"
        labelFontSize="16px"
      >
        {inputProps => (
          <StyledInput
            {...inputProps}
            type="date"
            width="100%"
            closeOnSelect
            lineHeight={1}
            fontSize="13px"
            value={value.from}
            min={formattedMin}
            onChange={e => setDate('from', e.target.value)}
            disabled={disabled}
          />
        )}
      </StyledInputField>
      <StyledInputField
        label={<FormattedMessage defaultMessage="End date" />}
        labelFontWeight="700"
        labelProps={{ fontWeight: 'bold', fontSize: '16px' }}
        name="dateTo"
        mt="12px"
        labelFontSize="16px"
      >
        {inputProps => (
          <StyledInput
            {...inputProps}
            type="date"
            width="100%"
            closeOnSelect
            lineHeight={1}
            fontSize="13px"
            value={value.to}
            min={formattedMin}
            max={stripTime(new Date())}
            onChange={e => setDate('to', e.target.value)}
            disabled={disabled}
          />
        )}
      </StyledInputField>
      {!isValidDateInterval && (
        <Span display="block" color="red.500" pt={2} fontSize="10px" lineHeight="14px" aria-live="assertive">
          <FormattedMessage defaultMessage="Start Date should be before the End Date" />
        </Span>
      )}
    </React.Fragment>
  );
};

const PeriodFilter = ({ onChange, value, inputId, minDate = null, ...props }) => {
  const intervalFromValue = React.useMemo(() => getIntervalFromValue(value), [value]);
  const [tmpDateInterval, setTmpDateInterval] = React.useState(intervalFromValue);

  return (
    <PopupMenu
      placement="bottom-start"
      onClose={() => setTmpDateInterval(intervalFromValue)}
      Button={({ onClick }) => (
        <FilterButtonContainer onClick={onClick} id={inputId} data-cy="period-filter" {...props}>
          <Flex justifyContent="space-between" alignItems="center">
            <DateRange
              from={parseDateForDateRange(intervalFromValue.from, false)}
              to={parseDateForDateRange(intervalFromValue.to, true)}
              isUTC={intervalFromValue.timezoneType === 'UTC'}
            />
            <ChevronDown size={25} color="#cccccc" />
          </Flex>
        </FilterButtonContainer>
      )}
    >
      {({ setOpen }) => (
        <Box mx="8px" my="8px" width="190px">
          <PeriodFilterForm onChange={setTmpDateInterval} value={tmpDateInterval} minDate={minDate} inputId={inputId} />
          <Flex flexWrap="wrap" mt={3} gap="8px">
            <StyledButton
              buttonSize="medium"
              flex="1"
              onClick={() => {
                setTmpDateInterval(DEFAULT_INTERVAL);
                setOpen(false);
                onChange(null);
              }}
            >
              <FormattedMessage id="Reset" defaultMessage="Reset" />
            </StyledButton>
            <StyledButton
              buttonSize="medium"
              buttonStyle="primary"
              data-cy="btn-apply-period-filter"
              flex="1"
              onClick={() => {
                onChange(tmpDateInterval);
                setOpen(false);
              }}
            >
              <FormattedMessage id="Apply" defaultMessage="Apply" />
            </StyledButton>
          </Flex>
        </Box>
      )}
    </PopupMenu>
  );
};

PeriodFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  /** The value, either as a string with the `dateFrom→dateTo` format or an object like { from, to }*/
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      from: PropTypes.string,
      to: PropTypes.string,
      timezoneType: PropTypes.string,
    }),
  ]),
  inputId: PropTypes.string,
  minDate: PropTypes.string,
};

export default PeriodFilter;
