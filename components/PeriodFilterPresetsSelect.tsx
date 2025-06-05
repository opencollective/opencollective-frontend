import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import { stripTime } from '../lib/date-utils';
import dayjs from '../lib/dayjs';

import { StyledSelectFilter } from './StyledSelectFilter';

const getPastDateInterval = timeUnit => {
  const from = dayjs().subtract(1, timeUnit).startOf(timeUnit);
  return { from, to: from.endOf(timeUnit) };
};

/**
 * Some presets for time filters
 */
export const PERIOD_FILTER_PRESETS = {
  allTime: {
    label: <FormattedMessage defaultMessage="All time" id="s+lPP3" />,
    getInterval: () => ({ from: null, to: null }),
  },
  today: {
    label: <FormattedMessage defaultMessage="Today" id="zWgbGg" />,
    getInterval: () => ({ from: dayjs().startOf('day'), to: dayjs().endOf('day') }),
  },
  thisMonth: {
    label: <FormattedMessage defaultMessage="This Month" id="3PZa76" />,
    getInterval: () => ({ from: dayjs().startOf('month'), to: dayjs().endOf('day') }),
  },
  thisYear: {
    label: <FormattedMessage defaultMessage="This Year" id="OGk6DC" />,
    getInterval: () => ({ from: dayjs().startOf('year'), to: dayjs().endOf('day') }),
  },
  pastWeek: {
    label: <FormattedMessage defaultMessage="Past Week" id="li7Ez6" />,
    getInterval: () => getPastDateInterval('week'),
  },
  pastMonth: {
    label: <FormattedMessage defaultMessage="Past Month" id="+n7iNv" />,
    getInterval: () => getPastDateInterval('month'),
  },
  pastYear: {
    label: <FormattedMessage defaultMessage="Past Year" id="B0DOrM" />,
    getInterval: () => getPastDateInterval('year'),
  },
};

const PERIOD_FILTER_SELECT_STYLES = {
  dropdownIndicator: { paddingTop: 0, paddingBottom: 0 },
  option: { fontSize: '12px' },
};

const getSelectedPeriodOptionFromInterval = ({ from, to }) => {
  const isSameDay = (dayjsDate, otherDate) => (!dayjsDate && !otherDate) || dayjsDate?.isSame(otherDate, 'day');
  const preset = Object.keys(PERIOD_FILTER_PRESETS).find(preset => {
    const presetDetails = PERIOD_FILTER_PRESETS[preset];
    const presetInterval = presetDetails.getInterval();
    return isSameDay(presetInterval.from, from) && isSameDay(presetInterval.to, to);
  });

  if (preset) {
    return { label: PERIOD_FILTER_PRESETS[preset].label, value: preset };
  } else {
    return { label: 'Custom', value: 'custom' };
  }
};

const periodSelectThemeBuilder = theme => ({ ...theme, spacing: { ...theme.spacing, controlHeight: 28 } });

const PeriodFilterPresetsSelect = ({
  onChange,
  interval,
  inputId,
  formatDateFn = stripTime,
  SelectComponent = StyledSelectFilter,
  styles = PERIOD_FILTER_SELECT_STYLES,
  ...selectProps
}) => {
  const intl = useIntl();
  const selectedOption = React.useMemo(() => getSelectedPeriodOptionFromInterval(interval), [interval]);
  const options = React.useMemo(() => {
    return Object.keys(PERIOD_FILTER_PRESETS).map(presetKey => ({
      value: presetKey,
      label: PERIOD_FILTER_PRESETS[presetKey].label,
    }));
  }, [intl]);

  return (
    <SelectComponent
      {...selectProps}
      inputId={inputId}
      value={selectedOption}
      options={options}
      selectTheme={periodSelectThemeBuilder}
      styles={styles}
      onChange={({ value }) => {
        if (value === 'custom') {
          return interval;
        } else {
          const newInterval = { ...PERIOD_FILTER_PRESETS[value].getInterval() };
          onChange({ ...interval, from: formatDateFn(newInterval.from), to: formatDateFn(newInterval.to) });
        }
      }}
    />
  );
};

PeriodFilterPresetsSelect.propTypes = {
  onChange: PropTypes.func.isRequired,
  inputId: PropTypes.string.isRequired,
  interval: PropTypes.shape({
    from: PropTypes.string,
    to: PropTypes.string,
  }).isRequired,
  formatDateFn: PropTypes.func,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  SelectComponent: PropTypes.elementType,
  styles: PropTypes.object,
};

export default PeriodFilterPresetsSelect;
