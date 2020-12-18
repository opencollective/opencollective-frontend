import React from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-date-picker/dist/entry.nostyle';
import DateTimePicker from 'react-datetime-picker/dist/entry.nostyle';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import dayjs from '../lib/dayjs';

const DateTimePickerWrapper = styled.div`
  width: 100%;
  height: 34px;
  padding: 6px 12px;
  background-color: #fff;
  background-image: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);

  .react-datetime-picker__wrapper {
    border: none;
  }

  .react-date-picker__wrapper {
    border: none;
  }
`;

function DateTime(props) {
  const { date, timezone, timeFormat } = props;
  const value = dayjs(new Date(date)).tz(timezone);
  const intl = useIntl();

  return (
    <DateTimePickerWrapper>
      {timeFormat ? (
        <DateTimePicker
          style={{ border: 'none' }}
          locale={intl.locale}
          clearIcon={null}
          calendarIcon={null}
          value={value.isValid() ? value.toDate() : ''}
          {...props}
        />
      ) : (
        <DatePicker
          locale={intl.locale}
          clearIcon={null}
          calendarIcon={null}
          value={value.isValid() ? value.toDate() : ''}
          {...props}
        />
      )}
    </DateTimePickerWrapper>
  );
}

DateTime.propTypes = {
  date: PropTypes.string.isRequired,
  timezone: PropTypes.string.isRequired,
  timeFormat: PropTypes.bool.isRequired,
};

export default DateTime;
