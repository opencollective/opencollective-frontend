import React from 'react';
import { round } from 'lodash';
import styled from 'styled-components';
import type { BorderRadiusProps, ColorProps } from 'styled-system';
import { borderRadius, color } from 'styled-system';

import { Box, Flex } from './Grid';
import { P } from './Text';

const ChartContainer = styled.div<BorderRadiusProps>`
  display: flex;
  flex-wrap: wrap;
  overflow: hidden; /** To force children to obey the border-radius of the parent */
  ${borderRadius}
`;

const LegendContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
  width: 100%;
`;

const Label = styled.div`
  display: inline-block;
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 6px;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
`;

const Area = styled.div<{ percentage: string } & ColorProps>`
  padding: 12px 8px;
  shrink: 0;
  grow: 1;
  flex-basis: ${props => props.percentage};
  ${color}
`;

const Square = styled.div<ColorProps>`
  width: 8px;
  height: 8px;
  border-radius: 1.2px;
  margin-right: 8px;
  ${color}
`;

interface LegendProps {
  color?: string;
  label?: React.ReactNode;
}

const Legend = ({ color, label }: LegendProps) => {
  return (
    <Flex alignItems="center" mr={2}>
      <Square backgroundColor={color} />
      <P fontSize="12px" lineHeight="16px" color="black.600" whiteSpace="nowrap">
        {label}
      </P>
    </Flex>
  );
};

const getPreparedAreaPercentage = (areas, area) => {
  if (area.percentage) {
    return `${round(area.percentage * 100, 2)}%`;
  } else {
    return `${round(100 / areas.length, 2)}%`;
  }
};

interface ProportionalAreaChartProps {
  borderRadius?: string;
  /** The series to represent */
  areas: {
    key: string;
    label?: React.ReactNode;
    /** How much space should be taken by this area. Defaults to proportional (100 / numberOfAreas)% */
    percentage?: number;
    color?: string;
    legend?: React.ReactNode;
  }[];
}

const ProportionalAreaChart = ({ areas, borderRadius = '6px' }: ProportionalAreaChartProps) => {
  const hasLegend = areas.some(area => area.legend);
  return (
    <React.Fragment>
      {/** Main Graph */}
      <ChartContainer borderRadius={borderRadius}>
        {areas.map(area => (
          <Area key={area.key} percentage={getPreparedAreaPercentage(areas, area)} backgroundColor={area.color}>
            {area.label && <Label>{area.label}</Label>}
          </Area>
        ))}
      </ChartContainer>
      {/** Legends */}
      {hasLegend && (
        <LegendContainer>
          {areas.map(area => (
            <Box key={area.key} flexBasis={getPreparedAreaPercentage(areas, area)}>
              <Legend label={area.legend} color={area.color} />
            </Box>
          ))}
        </LegendContainer>
      )}
    </React.Fragment>
  );
};

export default React.memo(ProportionalAreaChart);
