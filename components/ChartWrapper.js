import PropTypes from 'prop-types';
import styled from 'styled-components';

export const ChartWrapper = styled.div`
  position: relative;

  .apexcharts-legend-series {
    background: white;
    padding: 8px;
    border-radius: 10px;
    & > span {
      vertical-align: middle;
    }
  }
  .apexcharts-toolbar {
    z-index: 0;
  }

  .apexcharts-legend-marker {
    margin-right: 8px;
  }
`;

ChartWrapper.propTypes = {
  children: PropTypes.node,
};
