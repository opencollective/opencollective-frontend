import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import dayjs from '../../../lib/dayjs';

import { Box, Flex } from '../../Grid';
import PopupMenu from '../../PopupMenu';
import StyledButton from '../../StyledButton';
import StyledButtonSet from '../../StyledButtonSet';
import StyledInput from '../../StyledInput';
import StyledInputField from '../../StyledInputField';
import { StyledSelectFilter } from '../../StyledSelectFilter';

/**
 * Normalize a date coming from the user input, adjusting the time to either the beginning of the day
 * or the end of the day.
 */
const normalizeDate = (date, isEndOfDay = false, timezoneType = 'local') => {
  if (!date) {
    return null;
  } else {
    const resultDate = isEndOfDay ? dayjs(date).endOf('day') : dayjs(date).startOf('day');
    if (!timezoneType === 'UTC') {
      resultDate.tz('UTC', true); // Change timezone to UTC, but don't change the time
    }

    return resultDate.toISOString();
  }
};

/**
 * Takes a date and returns it as a string in the format YYYY-MM-DD
 */
const stripTime = date => {
  if (!date) {
    return '';
  } else {
    return dayjs(date).format('YYYY-MM-DD');
  }
};

/**
 * Parse `strValue` in a "dateFrom→dateTo" format and returns an array like [dateFrom, dateTo].
 * Each value in the array will be `undefined` if there's no filter for it. We consider that all values passed
 * in this string are using UTC timezone.
 */
export const getDateRangeFromPeriod = strValue => {
  const parsedValue = strValue?.match(/([^→]+)(→(.+?(?=~UTC)))?(~UTC)?/);
  if (parsedValue) {
    const getDateIsoString = dateStr => (!dateStr || dateStr === 'all' ? undefined : dateStr);
    return [getDateIsoString(parsedValue[1]), getDateIsoString(parsedValue[3])];
  }

  return [];
};

/**
 * Opposite of `getDateRangeFromPeriod`: takes an object like {dateFrom, dateTo} and returns a string
 * like "dateFrom→dateTo".
 */
const encodePeriod = dateInterval => {
  const stringifyDate = date => (!date ? 'all' : date);
  if (!dateInterval.from && !dateInterval.to) {
    return '';
  } else if (dateInterval.timezoneType === 'local') {
    return `${stringifyDate(dateInterval.from)}→${stringifyDate(dateInterval.to)}`;
  } else if (dateInterval.timezoneType === 'UTC') {
    return `${stringifyDate(dateInterval.from)}→${stringifyDate(dateInterval.to)}~UTC`;
  }
};

const DEFAULT_INTERVAL = { from: '', to: '' };

const getDateRangeFromValue = value => {
  const intervalFromValue = Array.isArray(value) ? value : getDateRangeFromPeriod(value);
  const strInterval = typeof value === 'string' ? value : '';
  return {
    from: intervalFromValue[0] || DEFAULT_INTERVAL.from,
    to: intervalFromValue[1] || DEFAULT_INTERVAL.to,
    timezoneType: strInterval.endsWith('~UTC') ? 'UTC' : 'local',
  };
};

const DateRange = ({ from, to }) => {
  if (!from && !to) {
    return <FormattedMessage id="DateRange.All" defaultMessage="All" />;
  } else if (from && to) {
    return (
      <FormattedMessage
        id="Date.DateRange"
        defaultMessage="{dateFrom, date, short} to {dateTo, date, short}"
        values={{ dateFrom: new Date(from), dateTo: new Date(to) }}
      />
    );
  } else if (from) {
    return (
      <FormattedMessage
        id="Date.SinceShort"
        defaultMessage="Since {date, date, short}"
        values={{ date: new Date(from) }}
      />
    );
  } else {
    return (
      <FormattedMessage
        id="Date.BeforeShort"
        defaultMessage="Before {date, date, short}"
        values={{ date: new Date(to) }}
      />
    );
  }
};

const TriggerContainer = styled(StyledButton)`
  min-height: 38px;
  outline: 0;
  background: #f7f8fa;
  padding: 0 16px;
  width: 100%;
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: hsl(0, 0%, 20%);

  svg {
    transition: color 0.2s;
  }

  &:hover {
    border-color: #c4c7cc;
    svg {
      color: #999999;
    }
  }

  &:active,
  &:focus {
    background: white;
    color: hsl(0, 0%, 20%);
    box-shadow: 0 0 0 2px black;
  }
`;

const getNewInterval = (interval, changeField, newValue) => {
  const newInterval = { ...interval };

  if (interval.timezoneType === 'UTC') {
    newInterval[changeField] = normalizeDate(newValue, changeField === 'to'); // TODO user timezone
  } else if (interval.timezoneType === 'local') {
    newInterval[changeField] = normalizeDate(newValue, changeField === 'to');
  }

  // Reset interval in case fromDate is after toDate
  if (newInterval.from && newInterval.to && newInterval.from > newInterval.to) {
    const fieldToReset = changeField === 'from' ? 'to' : 'from';
    newInterval[fieldToReset] = '';
  }

  return newInterval;
};

const updateIntervalWithTimezone = (interval, timezoneType) => {
  const convertDate =
    timezoneType === 'UTC'
      ? date => (date ? dayjs(date).tz('UTC', true).toISOString() : null) // Convert to local time
      : date => (date ? dayjs(date.replace(/Z$/, '')).toISOString() : null); // Convert to local time

  return {
    from: convertDate(interval.from),
    to: convertDate(interval.to),
    timezoneType,
  };
};

const PERIOD_FILTER_PRESETS = defineMessages({
  today: {
    id: 'Today',
    defaultMessage: 'Today',
  },
  thisWeek: {
    id: 'ThisWeek',
    defaultMessage: 'This week',
  },
  lastMonth: {
    id: 'LastMonth',
    defaultMessage: 'Last month',
  },
});

const PeriodFilterPresetsSelect = ({ onChange }) => {
  const intl = useIntl();
  const options = React.useMemo(() => {
    return Object.keys(PERIOD_FILTER_PRESETS).map(presetKey => ({
      value: presetKey,
      label: intl.formatMessage(PERIOD_FILTER_PRESETS[presetKey]),
    }));
  }, [intl]);

  return (
    <StyledSelectFilter
      options={options}
      onChange={({ value }) => {
        switch (value) {
          case 'today':
            return onChange({
              from: dayjs().startOf('day'),
              to: dayjs(),
            });
          case 'thisWeek':
            return onChange({
              from: dayjs().subtract(7, 'day').startOf('day'),
              to: dayjs(),
            });
          case 'lastMonth':
            return onChange({
              from: dayjs().subtract(1, 'month').startOf('day'),
              to: dayjs().subtract(1, 'month').endOf('month'),
            });
          default:
            throw new Error(`Period filter not implemented: ${value}`);
        }
      }}
    />
  );
};

PeriodFilterPresetsSelect.propTypes = {
  onChange: PropTypes.func.isRequired,
};

const getTimeZoneTypeName = (intl, timezone) => {
  if (timezone === 'local') {
    try {
      return intl.timeZone || dayjs.tz.guess();
    } catch {
      return '';
    }
  } else if (timezone === 'UTC') {
    return 'Coordinated Universal Time';
  } else {
    return '';
  }
};

const PeriodFilter = ({ onChange, value, inputId, minDate, ...props }) => {
  const intl = useIntl();
  const [dateInterval, setDateInterval] = React.useState(getDateRangeFromValue(value));
  const formattedMin = stripTime(minDate);

  const setDate = (changeField, date) => {
    setDateInterval(getNewInterval(dateInterval, changeField, date));
  };

  return (
    <PopupMenu
      placement="bottom-end"
      onClose={() => setDateInterval(getDateRangeFromValue(value))}
      Button={({ onClick }) => (
        <TriggerContainer onClick={onClick} id={inputId} data-cy="period-filter" {...props}>
          <Flex justifyContent="space-between" alignItems="center">
            <span>
              <DateRange from={dateInterval.from} to={dateInterval.to} />
              {dateInterval.timezoneType === 'local' ? null : ` (${dateInterval.timezoneType})`}
            </span>
            <ChevronDown size={25} color="#cccccc" />
          </Flex>
        </TriggerContainer>
      )}
    >
      {({ setOpen }) => (
        <Box mx="8px" my="16px" width="190px">
          <PeriodFilterPresetsSelect onChange={setDateInterval} />
          <StyledInputField
            label={<FormattedMessage defaultMessage="Start date" />}
            name="dateFrom"
            mt="12px"
            labelFontSize="13px"
          >
            {inputProps => (
              <StyledInput
                {...inputProps}
                type="date"
                width="100%"
                closeOnSelect
                lineHeight={1}
                fontSize="13px"
                value={stripTime(dateInterval.from)}
                min={formattedMin}
                onChange={e => setDate('from', e.target.value)}
              />
            )}
          </StyledInputField>
          <StyledInputField
            label={<FormattedMessage defaultMessage="End date" />}
            name="dateTo"
            mt="12px"
            labelFontSize="13px"
          >
            {inputProps => (
              <StyledInput
                {...inputProps}
                type="date"
                width="100%"
                closeOnSelect
                lineHeight={1}
                fontSize="13px"
                value={stripTime(dateInterval.to)}
                min={formattedMin}
                max={stripTime(new Date())}
                onChange={e => setDate('to', e.target.value)}
              />
            )}
          </StyledInputField>
          <StyledInputField
            data-cy="download-csv-end-date"
            label={<FormattedMessage defaultMessage="Timezone" />}
            name="dateTo"
            mt="12px"
            labelFontSize="13px"
          >
            {inputProps => (
              <StyledButtonSet
                {...inputProps}
                size="tiny"
                items={['local', 'UTC']}
                buttonProps={{ p: 1 }}
                selected={dateInterval.timezoneType}
                buttonPropsBuilder={({ item }) => ({ title: getTimeZoneTypeName(intl, item) })}
                onChange={timezone => {
                  setDateInterval(updateIntervalWithTimezone(dateInterval, timezone));
                }}
              >
                {({ item }) => {
                  switch (item) {
                    case 'local':
                      return <FormattedMessage defaultMessage="Local" />;
                    case 'UTC':
                      return <FormattedMessage defaultMessage="UTC" />;
                  }
                }}
              </StyledButtonSet>
            )}
          </StyledInputField>
          <Flex mt={2}>
            <StyledButton
              buttonSize="tiny"
              mr={2}
              mt="12px"
              onClick={() => {
                setDateInterval(DEFAULT_INTERVAL);
                setOpen(false);
                onChange('');
              }}
            >
              <FormattedMessage id="Reset" defaultMessage="Reset" />
            </StyledButton>
            <StyledButton
              buttonSize="tiny"
              buttonStyle="primary"
              mt="12px"
              data-cy="btn-apply-period-filter"
              onClick={() => {
                onChange(encodePeriod(dateInterval));
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
  /** The value, either as a string with the `dateFrom→dateTo` format or an array like [dateFromIsoStr, dateToIsoStr] */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  inputId: PropTypes.string,
  minDate: PropTypes.string,
};

export default PeriodFilter;
