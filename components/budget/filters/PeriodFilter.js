import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import dayjs from 'dayjs';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { addMonths, addYears } from '../../../lib/date-utils';

import { Box, Flex } from '../../Grid';
import PopupMenu from '../../PopupMenu';
import StyledButton from '../../StyledButton';
import StyledInput from '../../StyledInput';
import StyledInputField from '../../StyledInputField';

const normalizeDate = (date, isEndOfDay = false) => {
  const resultDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  if (isEndOfDay) {
    resultDate.setHours(23, 59, 59, 999);
  }

  return resultDate;
};

const formatDate = (date, stripTime) => {
  if (!date) {
    return '';
  } else if (stripTime) {
    return dayjs(date).format('YYYY-MM-DD');
  } else {
    return dayjs(date).toISOString();
  }
};

/**
 * Parse `strValue` and returns an array like [dateFrom, dateTo]. Each value in the array
 * will be `undefined` if there's no filter for it.
 */
export const getDateRangeFromPeriod = strValue => {
  // Use a normalized date (without time) to better handle Apollo caching
  const now = normalizeDate(new Date());

  // Compatibility with old format ("6-month", "1-year")
  const legacyParsedValue = strValue?.match(/((\d+)-)?(month|year)/);
  if (legacyParsedValue) {
    const value = parseInt(legacyParsedValue[2]) || 1;
    const interval = legacyParsedValue[3];
    const dateAddFunc = interval === 'month' ? addMonths : addYears;
    return [dateAddFunc(now, -value), now];
  }

  // New format (dateFrom→dateTo)
  const parsedValue = strValue?.match(/([^→]+)(→(.+))?/);
  if (parsedValue) {
    const parseDate = dateStr => (!dateStr || dateStr === 'all' ? undefined : new Date(dateStr));
    return [parseDate(parsedValue[1]), parseDate(parsedValue[3])];
  }

  return [];
};

const encodePeriod = dateInterval => {
  const stringifyDate = date => (!date ? 'all' : formatDate(date));
  if (!dateInterval.from && !dateInterval.to) {
    return '';
  } else {
    return `${stringifyDate(dateInterval.from)}→${stringifyDate(dateInterval.to)}`;
  }
};

const getDefaultDateInterval = () => {
  return { from: '', to: '' };
};

const getDefaultState = value => {
  const defaultInterval = getDefaultDateInterval();
  const intervalFromValue = getDateRangeFromPeriod(value);
  return {
    from: intervalFromValue[0] || defaultInterval.from,
    to: intervalFromValue[1] || defaultInterval.to,
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
        values={{ dateFrom: from, dateTo: to }}
      />
    );
  } else if (from) {
    return <FormattedMessage id="Date.SinceShort" defaultMessage="Since {date, date, short}" values={{ date: from }} />;
  } else {
    return <FormattedMessage id="Date.BeforeShort" defaultMessage="Before {date, date, short}" values={{ date: to }} />;
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

const PeriodFilter = ({ onChange, value, inputId, ...props }) => {
  const [dateInterval, setDateInterval] = React.useState(() => getDefaultState(value));
  const setDate = (type, date) => {
    setDateInterval(value => ({
      ...value,
      [type]: !date ? null : normalizeDate(new Date(date), type === 'to'),
    }));
  };

  return (
    <PopupMenu
      placement="bottom-end"
      onClose={() => setDateInterval(getDefaultState(value))}
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
                defaultValue={formatDate(dateInterval.from, true)}
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
                defaultValue={formatDate(dateInterval.to, true)}
                onChange={e => setDate('to', e.target.value)}
              />
            )}
          </StyledInputField>
          <StyledButton
            buttonSize="tiny"
            mr={2}
            onClick={() => {
              setDateInterval(getDefaultDateInterval());
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
  value: PropTypes.string,
  inputId: PropTypes.string,
};

export default PeriodFilter;
