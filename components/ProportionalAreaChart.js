import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { color } from 'styled-system';

const ChartContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  border-radius: 6px;
  overflow: hidden; /** To force children to obey the border-radius of the parent */
`;

const Label = styled.div`
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 6px;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
`;

const Area = styled.div`
  padding: 12px 8px;
  flex-shrink: 0;
  flex-grow: 1;
  flex-basis: ${props => Math.round(props.percentage * 100)}%;
  ${color}
`;

const ProportionalAreaChart = ({ areas }) => {
  return (
    <ChartContainer>
      {areas.map(area => (
        <Area key={area.key} percentage={area.percentage} backgroundColor={area.color}>
          <Label>{area.label}</Label>
        </Area>
      ))}
    </ChartContainer>
  );
};

ProportionalAreaChart.propTypes = {
  areas: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
      percentage: PropTypes.number.isRequired,
      color: PropTypes.string,
    }),
  ).isRequired,
};

export default React.memo(ProportionalAreaChart);
