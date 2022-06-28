import React from 'react';
import PropTypes from 'prop-types';
import { Info } from '@styled-icons/feather/Info';
import { themeGet } from '@styled-system/theme-get';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { getSectionsCategoryDetails } from '../../lib/collective-sections';

import { NAVBAR_CATEGORIES } from '../collective-navbar/constants';
import Container from '../Container';
import { Flex } from '../Grid';
import StyledHr from '../StyledHr';
import StyledTooltip from '../StyledTooltip';
import { P } from '../Text';

import { Dimensions } from './_constants';
import SectionTitle from './SectionTitle';

const ContainerWithMaxWidth = styled(Container).attrs({
  maxWidth: Dimensions.MAX_SECTION_WIDTH,
  p: Dimensions.PADDING_X,
  m: '0 auto',
})`
  display: flex;
  flex-direction: column;
  padding-top: 64px;
`;

const TypeIllustration = styled.img.attrs({ alt: '' })`
  position: absolute;
  width: 48px;
  height: 48px;
`;

const TypeIllustrationCircle = styled(Flex)`
  position: relative;
  width: 48px;
  height: 48px;

  &::before {
    content: '';
    background: ${themeGet('colors.primary.100')};
    border-radius: 50%;
    height: 30px;
    width: 30px;
    position: absolute;
    right: 0;
    left: 0;
    top: 0;
    bottom: 0;
    margin-left: auto;
    margin-right: auto;
    margin-top: auto;
    margin-bottom: auto;
  }
`;

const CategoryHeader = React.forwardRef(({ collective, category, ...props }, ref) => {
  const intl = useIntl();
  const data = getSectionsCategoryDetails(intl, collective, category);
  return (
    <ContainerWithMaxWidth ref={ref} {...props}>
      <Flex alignItems="center" justifyContent="center">
        <TypeIllustrationCircle alignItems="center" mr={2}>
          <TypeIllustration src={data.img} />
        </TypeIllustrationCircle>
        <Flex alignItems="center" mr={3}>
          <SectionTitle mr={2} my={3} data-cy={`category-${category}-title`}>
            {data.title}
          </SectionTitle>
          {data.info && (
            <StyledTooltip content={() => data.info}>
              <Info size={18} color="#76777A" />
            </StyledTooltip>
          )}
        </Flex>
        <StyledHr flex="1" borderStyle="solid" borderColor="black.300" mt={1} />
      </Flex>
      {data.subtitle && (
        <Flex mb={2} justifyContent="space-between" alignItems="center" flexWrap="wrap">
          <P color="black.700" my={2} mr={2} css={{ flex: '1 0 50%', maxWidth: 780 }}>
            {data.subtitle}
          </P>
        </Flex>
      )}
    </ContainerWithMaxWidth>
  );
});

CategoryHeader.displayName = 'CategoryHeader';

CategoryHeader.propTypes = {
  category: PropTypes.oneOf(Object.values(NAVBAR_CATEGORIES)),
  collective: PropTypes.object,
};

export default CategoryHeader;
