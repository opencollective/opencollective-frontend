import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

export const ChartStyles = styled.div`
  position: relative;

  .apexcharts-legend-series {
    background: white;
    padding: 8px;
    border-radius: 10px;
    & > span {
      vertical-align: middle;
    }
  }

  .apexcharts-legend-marker {
    margin-right: 8px;
  }
`;

/* Wraps a chart from ApexCharts to plug our custom styles to it */
export const ChartWrapper = ({ children }) => {
  return <ChartStyles>{children}</ChartStyles>;
};

ChartWrapper.propTypes = {
  children: PropTypes.node,
};
