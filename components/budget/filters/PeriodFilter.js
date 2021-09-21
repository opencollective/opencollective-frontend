import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import dayjs from '../../../lib/dayjs';

import { Box, Flex } from '../../Grid';
import PopupMenu from '../../PopupMenu';
import StyledButton from '../../StyledButton';
import StyledInput from '../../StyledInput';
import StyledInputField from '../../StyledInputField';

/**
 * Normalize a date coming from the user input, adjusting the time to either the beginning of the day
 * or the end of the day.
 */
const normalizeDate = (date, isEndOfDay = false) => {
  if (!date) {
    return null;
  } else {
    const resultDate = isEndOfDay ? dayjs(date).endOf('day') : dayjs(date).startOf('day');
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
  const parsedValue = strValue?.match(/([^→]+)(→(.+))?/);
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
  } else {
    return `${stringifyDate(dateInterval.from)}→${stringifyDate(dateInterval.to)}`;
  }
};

const DEFAULT_INTERVAL = { from: '', to: '' };

const getDateRangeFromValue = value => {
  const intervalFromValue = Array.isArray(value) ? value : getDateRangeFromPeriod(value);
  return {
    from: intervalFromValue[0] || DEFAULT_INTERVAL.from,
    to: intervalFromValue[1] || DEFAULT_INTERVAL.to,
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
  newInterval[changeField] = normalizeDate(newValue, changeField === 'to');

  // Reset interval in case fromDate is after toDate
  if (newInterval.from && newInterval.to && newInterval.from > newInterval.to) {
    const fieldToReset = changeField === 'from' ? 'to' : 'from';
    newInterval[fieldToReset] = '';
  }

  return newInterval;
};

const PeriodFilter = ({ onChange, value, inputId, minDate, ...props }) => {
  const [dateInterval, setDateInterval] = React.useState(getDateRangeFromValue(value));
  const formattedMin = stripTime(minDate);
  const setDate = (changeField, date) => setDateInterval(getNewInterval(dateInterval, changeField, date));

  return (
    <PopupMenu
      placement="bottom-end"
      onClose={() => setDateInterval(getDateRangeFromValue(value))}
      Button={({ onClick }) => (
        <TriggerContainer onClick={onClick} id={inputId} data-cy="period-filter" {...props}>
          <Flex justifyContent="space-between" alignItems="center">
            <span>
              <DateRange from={dateInterval.from} to={dateInterval.to} />
            </span>
            <ChevronDown size={25} color="#cccccc" />
          </Flex>
        </TriggerContainer>
      )}
    >
      {({ setOpen }) => (
        <Box mx="8px" my="16px" width="190px">
          <StyledInputField
            data-cy="download-csv-start-date"
            label="Start Date"
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
            data-cy="download-csv-end-date"
            label="End Date"
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
          <StyledButton
            buttonSize="tiny"
            mr={2}
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
