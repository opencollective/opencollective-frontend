import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import styled from 'styled-components';
import { margin } from 'styled-system';

import { formatAmountForLegend } from '../../../../lib/charts';

import { Flex } from '../../../Grid';
const Table = styled.table`
  ${margin}
  thead th {
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #4d4f51;
  }

  th,
  td {
    font-weight: 500;
    font-size: 16px;
    line-height: 24px;
    color: #141415;

    :not(:first-child) {
      border-left: 1px solid #eaeaec;
      text-align: center;
    }
  }
  tbody td:first-child {
    text-transform: capitalize;
  }
`;

export const makeBudgetTableRow = (key, values) => {
  values.key = key;
  return values;
};

export const BudgetTable = ({ headers, rows, truncate, ...props }) => {
  if (truncate) {
    rows = rows.slice(0, truncate);
  }

  return (
    <Table mt={4} cellSpacing={0} cellPadding="10px" {...props}>
      <thead>
        <tr>
          {headers.map(header => (
            <th key={header.key}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows?.map(row => (
          <tr key={row.key}>
            {row.map((cell, i) => (
              <td key={cell?.key || `${row.key}-${i}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

BudgetTable.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.node).isRequired,
  rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.node)),
  truncate: PropTypes.number,
};

export const COLORS = ['#A3F89C', '#FFBF5F', '#8FC7FF', '#F89CE4', '#F89C9C'];

export const TagMarker = styled.div`
  display: inline-block;
  margin-right: 8px;
  height: 24px;
  width: 6px;
  border-radius: 8px;
  vertical-align: bottom;
  background-color: ${props => props.color};
`;

export const StatsCardContent = styled(Flex)`
  div {
    margin: 12px 0;
    padding: 0px 36px;

    :not(:first-child) {
      border-left: 1px solid #d9d9d9;
    }
  }
`;

export const GRAPH_TYPES = {
  LIST: 'LIST',
  TIME: 'TIME',
  BAR: 'BAR',
  PIE: 'PIE',
};

export const GraphTypeButton = styled.button`
  border-radius: 100%;
  height: 32px;
  width: 32px;
  color: #4d4f51;
  border: 1px solid #f9fafb;
  background-color: #f9fafb;
  cursor: pointer;

  :hover {
    border-color: #c4c7cc;
  }

  ${props =>
    props.active
      ? `
    border-color: #1153d6;
    background-color: rgba(20, 110, 255, 0.1);
    `
      : ''}
`;

export const makeApexOptions = (currency, timeUnit, intl) => ({
  legend: {
    show: true,
    horizontalAlign: 'left',
    fontSize: '16px',
    fontFamily: 'inherit',
    fontWeight: 500,
    markers: {
      width: 6,
      height: 24,
      radius: 8,
      offsetY: 6,
    },
  },
  colors: COLORS,
  grid: {
    xaxis: { lines: { show: true } },
    yaxis: { lines: { show: false } },
  },
  stroke: {
    curve: 'straight',
    width: 1.5,
  },
  dataLabels: {
    enabled: false,
  },
  xaxis: {
    labels: {
      formatter: function (value) {
        // Show data aggregated yearly
        if (timeUnit === 'YEAR') {
          return dayjs(value).utc().year();
          // Show data aggregated monthly
        } else if (timeUnit === 'MONTH') {
          return dayjs(value).utc().format('MMM-YYYY');
          // Show data aggregated by week or day
        } else if (timeUnit === 'WEEK' || timeUnit === 'DAY') {
          return dayjs(value).utc().format('DD-MMM-YYYY');
        }
      },
    },
  },
  yaxis: {
    labels: {
      formatter: value => formatAmountForLegend(value, currency, intl.locale),
    },
  },
});
